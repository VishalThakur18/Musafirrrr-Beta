const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
let options;
const context = {
    document: { activeElement: {} },
    getComputedStyle: el => ({ position: el.position || 'static' }),
    useScrollReveal(root, config) { options = config; }
};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/components/ui/SiteMotion.js'), 'utf8'), context);
const element = overrides => ({
    closest: () => null, contains: () => false,
    parentElement: { closest: () => null }, ...overrides
});
assert.equal(context.siteMotionTarget(element()), true);
for (const position of ['sticky', 'fixed']) assert.equal(context.siteMotionTarget(element({ position })), false);
assert.equal(context.siteMotionTarget(element({ closest: () => ({}) })), false, 'specialized scopes and galleries are excluded');
assert.equal(context.siteMotionTarget(element({ parentElement: { closest: () => ({}) } })), false, 'nested reveals are excluded');
assert.equal(context.siteMotionTarget(element({ contains: () => true })), false, 'focused forms remain visible');
for (const route of ['/', '/organizer/dashboard', '/organizer/edit/a']) {
    context.useSiteMotion({}, route);
    assert.equal(options.enabled, false, 'specialized route retains its observer');
}
for (const route of ['/traveller/dashboard', '/traveller/my-trips', '/traveller/profile', '/saved', '/explore', '/trip/a', '/o/a', '/login', '/signup']) {
    context.useSiteMotion({}, route);
    assert.equal(options.enabled, true);
    assert.equal(options.visitKey, route);
}
const grid = { matches: selector => selector === '.grid' };
assert.equal(context.siteMotionGroup({ matches: () => true, parentElement: { parentElement: grid } }), grid, 'wrapped saved cards stagger together');
const card = section => ({
    hasAttribute: () => false, matches: () => true,
    closest: () => ({ querySelector: () => ({ textContent: section }) }),
    querySelector: () => ({ getAttribute: () => '#/trip/a' })
});
assert.notEqual(context.siteMotionKey(card('Saved trips')), context.siteMotionKey(card('Picked for you')), 'same trip in different sections reveals independently');
console.log('PASS: public/traveller route coverage, scope isolation, sticky/focus guards, saved-card staggering and section keys');
