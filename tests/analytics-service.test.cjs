const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const calls = [], events = [];
let clock = 0, recorderFailures = 0, reportError = false, release = null;
const context = vm.createContext({
    Date: { now: () => clock }, Map, Set, console: { warn() {} },
    crypto: { randomUUID: () => 'event-id' }, setTimeout: callback => callback(),
    authState: { user: { id: 'user-a' } },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    window: { dispatchEvent: event => events.push(event), sbClient: { rpc: async (name, params) => {
        calls.push({ name, params });
        if (name === 'record_trip_event') return recorderFailures-- > 0 ? { status: 503, error: { code: 'network' } } : { status: 204, error: null };
        if (release) await new Promise(resolve => { release.resolve = resolve; });
        return reportError ? { error: new Error('Unavailable') } : { data: { days: params.p_days, trips: [], as_of: '2026-10-25T00:00:00Z' }, error: null };
    } } }
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/features/organizerDashboard/services/analytics.service.js'), 'utf8') + '\nglobalThis.api = tripAnalytics;', context);
const count = () => calls.filter(c => c.name === 'organizer_trip_performance').length;
(async () => {
    release = {};
    const first = context.api.report('org', 30), second = context.api.report('org', 30);
    assert.equal(count(), 1, 'Concurrent calls share one request');
    release.resolve(); release = null;
    assert.deepEqual(await first, await second);
    await context.api.report('org', 30); assert.equal(count(), 1, 'Recent successful reports reused');
    await context.api.report('org', 30, { force: true }); assert.equal(count(), 2, 'Manual/live refresh bypasses cache');
    clock = 11000; await context.api.report('org', 30); assert.equal(count(), 3, 'Cache expires');
    await context.api.report('org', 7); assert.equal(count(), 4, 'Period isolated');
    context.authState.user.id = 'user-b'; await context.api.report('org', 30); assert.equal(count(), 5, 'User isolated');
    recorderFailures = 1;
    assert.equal(await context.api.track({ id: 'trip', organizerId: 'org', fromDb: true }, 'instagram_click'), true);
    const attempts = calls.filter(c => c.name === 'record_trip_event');
    assert.equal(attempts.length, 2);
    assert.equal(attempts[0].params.p_event_id, attempts[1].params.p_event_id, 'Retries cannot double count');
    assert.equal(attempts[0].params.p_trip_id, 'trip');
    assert.equal(events[0].detail.organizerId, 'org');
    await context.api.report('org', 30); assert.equal(count(), 6, 'Recorded click invalidates cache');
    assert.equal(await context.api.track({ id: 'mock' }, 'whatsapp_click'), false);
    assert.equal(await context.api.track({ id: 'trip', fromDb: true }, 'unsupported'), false);
    reportError = true; await assert.rejects(context.api.report('other', 30));
    reportError = false; await context.api.report('other', 30);
    assert.equal(count(), 8, 'Failed requests do not poison cache');
    await assert.rejects(context.api.report('org', 1));
    console.log('PASS: deduplicated report requests, cache expiry/isolation, forced refresh, event invalidation, idempotent retry and error recovery.');
})().catch(error => { console.error(error); process.exitCode = 1; });
