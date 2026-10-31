'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function context(storage) {
    const ctx = vm.createContext({ React: { createContext: () => ({}) }, localStorage: storage });
    vm.runInContext(fs.readFileSync(path.join(root, 'src/features/compare/compare.state.js'), 'utf8'), ctx);
    return expression => JSON.parse(vm.runInContext('JSON.stringify(' + expression + ')', ctx));
}
test('restoration rejects malformed, non-array, duplicate and oversized selections', () => {
    for (const value of ['{bad', '{}', 'null']) assert.deepEqual(context({ getItem: () => value })('readCompareIds()'), []);
    assert.deepEqual(context({ getItem: () => { throw Error('blocked'); } })('readCompareIds()'), []);
    assert.deepEqual(context({ getItem: () => '["a","a",null,"",{},"b","c","d"]' })('readCompareIds()'), ['a','b','c']);
});
test('selection toggles, limits to three, removes and clears', () => {
    const run = context({ getItem: () => null });
    assert.deepEqual(run('compareSelection(["a"], {type:"toggle",id:"b"})'), ['a','b']);
    assert.deepEqual(run('compareSelection(["a","b","c"], {type:"toggle",id:"d"})'), ['a','b','c']);
    assert.deepEqual(run('compareSelection(["a","b"], {type:"toggle",id:"a"})'), ['b']);
    assert.deepEqual(run('compareSelection(["a","b"], {type:"remove",id:"b"})'), ['a']);
    assert.deepEqual(run('compareSelection(["a"], {type:"clear"})'), []);
});
test('feature scripts parse and load before their consumers', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    for (const file of ['src/features/compare/compare.service.js','src/features/compare/compare.state.js','src/features/compare/CompareUI.js','src/components/shared/TripCard.js','src/App.js']) {
        new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file });
        assert.ok(html.includes(file));
    }
    assert.ok(html.indexOf('compare.state.js') < html.indexOf('shared/TripCard.js'));
    assert.ok(html.indexOf('CompareUI.js') < html.indexOf('src/App.js'));
});

test('provider resolves only publicly listed trips and never fetches details', () => {
    const ctx = vm.createContext({
        React: { createContext: () => ({ Provider: 'provider' }), createElement: (type, props) => props,
            useSyncExternalStore: () => ({ ids: ['public','draft','deleted'], initialized: true, busy: false }) },
        useAuth: () => ({ user: null, ready: true }), useMemo: fn => fn(), useEffect: () => {},
        ComparisonController: class { constructor() { this.subscribe = () => {}; this.snapshot = () => {}; } },
        useStore: () => ({ trips: [{ id: 'public', status: 'PUBLISHED' }, { id: 'draft', status: 'DRAFT', title: 'Private' }], tripsLoading: false, tripsError: null })
    });
    vm.runInContext(fs.readFileSync(path.join(root, 'src/features/compare/compare.state.js'), 'utf8'), ctx);
    const resolved = JSON.parse(vm.runInContext('JSON.stringify(CompareProvider({}).value.trips)', ctx));
    assert.deepEqual(resolved, [{ id: 'public', status: 'PUBLISHED' }]);
});
