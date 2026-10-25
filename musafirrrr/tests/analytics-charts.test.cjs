const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/features/organizerDashboard/components/OrganizerAnalyticsCharts.js'), 'utf8'), context);
const trip = { id: 'a', title: 'A', views: 10, enquiries: 2, whatsapp_clicks: 3, instagram_clicks: 1, enquiry_opens: 4 };
const input = { trips: [trip, { ...trip, id: 'b', title: 'B', views: '20', enquiries: 1 }] };
const model = context.organizerAnalyticsModel(input, 'views');
assert.equal(model.invalid, false);
assert.equal(model.totals.views, 30);
assert.equal(model.totals.enquiries, 3);
assert.equal(model.totals.whatsapp_clicks + model.totals.instagram_clicks, 8);
assert.equal(model.rows[0].id, 'b');
assert.equal(input.trips[0].id, 'a', 'Source data is not mutated');
assert.equal(context.organizerAnalyticsModel(input, 'enquiries').rows[0].id, 'a');
for (const views of [null, undefined, '', -1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(context.organizerAnalyticsModel({ trips: [{ ...trip, views }] }, 'views').invalid, true);
}
assert.equal(context.organizerAnalyticsModel({ trips: [{ ...trip, views: Number.MAX_SAFE_INTEGER }, trip] }, 'views').invalid, true);
assert.equal(context.organizerAnalyticsModel({ trips: [] }, 'views').totals.views, 0);
// Render both populated and empty charts with lightweight element stubs.
context.React = { createElement: (tag, props, ...children) => ({ tag, props, children }) };
context.Link = 'a';
const zero = context.organizerAnalyticsModel({ trips: [{ ...trip, views: 0, whatsapp_clicks: 0, instagram_clicks: 0 }] }, 'views');
const emptyTree = JSON.stringify(context.OrganizerAnalyticsCharts({ ...zero, metric: 'views', days: 30 }));
assert.ok(emptyTree.includes('No contact clicks recorded'));
assert.ok(!emptyTree.includes('NaN'));
const many = context.organizerAnalyticsModel({ trips: Array.from({ length: 1000 }, (_, i) => ({ ...trip, id: String(i), views: i })) }, 'views');
const tree = context.OrganizerAnalyticsCharts({ ...many, metric: 'views', days: 30 });
let bars = 0;
function visit(node) { if (!node || typeof node !== 'object') return; if (Array.isArray(node)) return node.forEach(visit); if (node.tag === 'li') bars++; visit(node.children); }
visit(tree);
assert.equal(bars, 10, 'Chart DOM stays bounded for large inventories');
assert.equal(many.rows.length, 1000, 'Full data retained for the table');
console.log('PASS: exact totals, numeric strings, sort, no mutation, invalid/overflow rejection, zero states and bounded chart rendering.');
