const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
let states = [], cursor = 0, serial = 0;
const context = vm.createContext({
    React: { createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity) }) },
    useState(initial) { const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial;
        return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
    crypto: { randomUUID: () => String(++serial) }, Btn: 'button', Link: 'a', Stat: 'stat', EmptyState: 'empty',
    tripCoverSrc: () => '', dateRange: (start, end) => start + end, daysUntil: () => 4
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/features/organizerDashboard/pages/OrganizerDepartures.js'), 'utf8'), context);
context.trips = [{ id: 'test-trip', title: 'Test trip', destination: 'Test', totalSpots: 10, availableSpots: 5, status: 'PUBLISHED', startDate: '2027-01-01', endDate: '2027-01-03' }];
const render = () => { cursor = 0; return vm.runInContext('DepartureWorkspace({ trips })', context); };
function find(node, predicate) { if (!node || typeof node !== 'object') return null;
    if (predicate(node)) return node; for (const child of node.children || []) { const found = find(child, predicate); if (found) return found; } return null; }
const click = label => { const node = find(render(), node => node.type === 'button' && node.children.includes(label)); assert.ok(node, label); node.props.onClick(); };
click('Mark full'); assert.equal(states[0][0].status, 'Full');
click('Reopen departure'); assert.equal(states[0][0].status, 'Upcoming');
assert.equal(states[0][0].sold, null); assert.equal(states[0][0].originalRemaining, 5);
click('Pause enquiries'); click('Mark full'); click('Reopen departure');
assert.equal(states[0][0].paused, true); click('Resume enquiries'); assert.equal(states[0][0].paused, false);
states[0][0] = { ...states[0][0], sold: 10 };
click('Reopen departure'); assert.ok(states[3], 'Zero-capacity reopen opens editor'); assert.equal(states[3].status, 'Upcoming');
assert.equal(states[0][0].sold, 10, 'Reopen never invents capacity or sales');
const editor = find(render(), node => typeof node.type === 'function' && node.type.name === 'DepartureEditor');
editor.props.onApply({ ...states[3], total: 12 });
assert.equal(states[0][0].total, 12); assert.equal(states[0][0].sold, 10);
context.item = states[0][0]; assert.equal(vm.runInContext('departureStatus(item)', context), 'Filling Fast');
click('Mark full'); click('Reopen departure');
context.item = states[0][0]; assert.equal(vm.runInContext('departureStatus(item)', context), 'Filling Fast');
console.log('PASS: reversible full controls, pause preservation, zero-seat recovery, accurate counts and filling-fast status');
