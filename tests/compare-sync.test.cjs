'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
function setup(api) {
    let saved = '["guest-trip"]';
    let writes = 0;
    const ctx = vm.createContext({ React: { createContext: () => ({}) },
        localStorage: { getItem: () => saved, setItem: (key, value) => { writes++; saved = value; } },
        window: { sbClient: { rpc: api || (() => {}) } }
    });
    for (const file of ['compare.state.js', 'compare.service.js'])
        vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/features/compare', file), 'utf8'), ctx);
    return { make: (owner, api) => { ctx.owner = owner; ctx.api = api; return vm.runInContext('new ComparisonController(owner, api)', ctx); },
        saved: () => JSON.parse(saved), writes: () => writes, ctx };
}
const plain = x => JSON.parse(JSON.stringify(x));
test('guests remain local and signed-in selections never overwrite guest data', async () => {
    const env = setup();
    const guest = env.make(null);
    await guest.run('add', 'second');
    assert.deepEqual(env.saved(), ['guest-trip','second']);
    const account = env.make('user-a', { update: async () => ['account-trip'] });
    assert.deepEqual(plain(account.state.ids), []);
    await account.run('get');
    assert.deepEqual(plain(account.state.ids), ['account-trip']);
    assert.deepEqual(env.saved(), ['guest-trip','second']);
    assert.equal(env.writes(), 1);
});
test('pending operations are serialized and only acknowledged results are shown', async () => {
    const env = setup(); let finish; let calls = 0;
    const c = env.make('user-a', { update: () => { calls++; return new Promise(resolve => { finish = resolve; }); } });
    const pending = c.run('add','one');
    assert.equal(c.state.busy, true);
    assert.deepEqual(plain(c.state.ids), []);
    assert.equal(await c.run('add','two'), false);
    assert.equal(calls, 1);
    finish(['one']); await pending;
    assert.deepEqual(plain(c.state.ids), ['one']);
    assert.equal(c.state.busy, false);
});
test('failed operations keep the confirmed selection and retry the same idempotent action', async () => {
    let fail = false; const calls = [];
    const env = setup();
    const c = env.make('user-a', { update: async (...args) => { calls.push(args); if (fail) throw Error('offline'); return args[1] === 'get' ? ['one'] : ['one','two']; } });
    await c.run('get'); fail = true;
    assert.equal(await c.run('add','two'), false);
    assert.deepEqual(plain(c.state.ids), ['one']);
    assert.match(c.state.syncError, /could not be confirmed/);
    fail = false; assert.equal(await c.retry(), true);
    assert.deepEqual(calls[1], calls[2]);
    assert.deepEqual(plain(c.state.ids), ['one','two']);
    assert.equal(c.state.syncError, null);
});
test('late account responses are ignored after sign out or account switch', async () => {
    let finish; const env = setup();
    const old = env.make('old-user', { update: () => new Promise(resolve => { finish = resolve; }) });
    const pending = old.run('get'); old.active = false;
    const next = env.make('new-user', { update: async () => ['new-trip'] });
    await next.run('get'); finish(['private-old-selection']); await pending;
    assert.deepEqual(plain(old.state.ids), []);
    assert.deepEqual(plain(next.state.ids), ['new-trip']);
    assert.equal(env.writes(), 0);
});
test('RPC sends expected account identity and propagates failures', async () => {
    const calls = []; const env = setup(async (name, args) => { calls.push([name,args]); return { data: ['one'], error: null }; });
    const result = await vm.runInContext("comparisonApi.update('user-a','add','one')", env.ctx);
    assert.deepEqual(plain(result), ['one']);
    assert.deepEqual(plain(calls), [['update_trip_comparison',{p_owner:'user-a',p_action:'add',p_trip_id:'one'}]]);
    env.ctx.window.sbClient.rpc = async () => ({ error: new Error('rejected') });
    await assert.rejects(vm.runInContext("comparisonApi.update('user-a','clear')", env.ctx), /rejected/);
});

test('guest storage retry keeps the current selection instead of rereading stale storage', async () => {
    const env = setup(); const c = env.make(null);
    env.ctx.localStorage.setItem = () => { throw Error('storage blocked'); };
    await c.run('add', 'new-trip');
    assert.deepEqual(plain(c.state.ids), ['guest-trip','new-trip']);
    assert.match(c.state.syncError, /storage is unavailable/);
    let persisted;
    env.ctx.localStorage.setItem = (key, value) => { persisted = JSON.parse(value); };
    await c.retry();
    assert.deepEqual(persisted, ['guest-trip','new-trip']);
    assert.equal(c.state.syncError, null);
});
