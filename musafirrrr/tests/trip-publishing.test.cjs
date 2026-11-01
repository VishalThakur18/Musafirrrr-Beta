const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const context = vm.createContext({ window: {}, console, Date, Set, Map });
for (const file of ['src/utils/helpers.js', 'src/backend/services/organizer.service.js']) vm.runInContext(read(file), context);
const api = vm.runInContext('organizerApi', context);
const source = {
 id: 'source', title: 'Mountain trip', destination: 'Manali', region: 'HP', startingLocation: 'Delhi',
 category: 'Trek', groupType: 'Mixed Group', description: 'A full mountain trip with a local guide.',
 startDate: '2027-01-01', endDate: '2027-01-03', days: 3, nights: 2, price: 5000, currency: 'INR',
 advanceAmount: 1000, totalSpots: 10, availableSpots: 3, status: 'PUBLISHED',
 images: ['https://example.test/photo.jpg'], itinerary: [{ title: 'Arrival', detail: 'Meet the group' }],
 included: ['Guide'], excluded: ['Flights'], cancellationPolicy: 'Seven days', importantInfo: 'Bring ID'
};
let saved = [], invalidations = 0;
api.tripForEdit = async () => source;
api.saveTrip = async (id, payload) => { saved.push({ id, payload }); return id || 'new-id'; };
context.dataService = { invalidate() { invalidations++; } };
(async () => {
 const copy = await api.duplicateTrip('source', 'org');
 assert.equal(saved.length, 0, 'opening a duplicate must not persist a draft');
 assert.equal(copy.id, null); assert.equal(copy.availableSpots, 10);
 assert.equal(source.id, 'source');
 await api.saveDeparture('source', 'org', { start: '2027-06-10', end: '2027-06-12', total: 12, sold: 2 });
 assert.equal(saved[0].id, null);
 assert.equal(saved[0].payload.status, 'published');
 assert.equal(saved[0].payload.start_date, '2027-06-10');
 assert.equal(saved[0].payload.spots_left, 10);
 assert.equal(saved[0].payload.duration_days, 3);
 assert.deepEqual(Array.from(saved[0].payload.images), source.images);
 assert.equal(saved[0].payload.cancellation_policy, source.cancellationPolicy);
 assert.equal(source.startDate, '2027-01-01');
 await assert.rejects(api.saveDeparture('source', 'org', { start: '2027-02-30', end: '2027-03-03', total: 10, sold: 0 }));
 await assert.rejects(api.saveDeparture('source', 'org', { start: '2027-06-10', end: '2027-06-09', total: 10, sold: 0 }));
 source.status = 'DRAFT';
 await assert.rejects(api.saveDeparture('source', 'org', { start: '2027-06-10', end: '2027-06-12', total: 10, sold: 0 }));
 source.status = 'PUBLISHED';
 assert.equal(context.validDate('2028-02-29'), true);
 assert.equal(context.validDate('2027-02-29'), false);
 assert.equal(context.dateRangePatch({ start: '2027-01-01', end: '2027-01-03' }, { start: '2027-01-04' }).end, '');
 assert.equal(context.dateRangePatch({ from: '2027-01-01', to: '2027-01-03' }, { from: '2027-01-03' }, 'from', 'to').to, '2027-01-03');
 let contactPatch;
 context.window.sbClient = { from() { return {
  update(value) { contactPatch = value; return this; },
  eq() { return this; }, select: async () => ({ data: [{ id: 'org' }] })
 }; } };
 await api.updateContact('org', { whatsapp: '919876543210', instagram: '' });
 assert.equal(contactPatch.instagram_handle, null, 'optional Instagram must not block publishing');

 let states = [], refs = [], cursor = 0, refCursor = 0;
 Object.assign(context, {
  React: { createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity) }), Fragment: 'fragment' },
  useState(initial) { const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial; return [states[i], value => { states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
  useRef(initial) { const i = refCursor++; return refs[i] || (refs[i] = { current: initial }); },
  useEffect() {}, toast() {}, go() {},
  WIZARD: ['Basics','Dates','Pricing','Photos','Itinerary','Included','Not included','Contact','Preview'],
  INC_DEF: [], EXC_DEF: [], CATEGORIES: [], GROUPS: [], DURATIONS: [],
  Btn:'button', Field:'field', Input:'input', Select:'select', TextArea:'textarea', Icon:'icon', TripCard:'trip',
  INR: x => String(x), dateRange: () => '', d: value => new Date(value + 'T00:00:00Z')
 });
 const contacts = [];
 api.updateContact = async (_, value) => { contacts.push(value); };
 context.window.refreshAuth = async () => {};
 vm.runInContext(read('src/features/organizerDashboard/pages/TripWizard.js'), context);
 const org = { id: 'org', whatsapp_number: '919876543210', instagram_handle: '' };
 const render = existing => { cursor = 0; refCursor = 0; return context.TripWizardForm({ me: { id: 'owner' }, org, existing }); };
 function find(node, predicate) { if (!node || typeof node !== 'object') return null; if (predicate(node)) return node; for (const child of node.children || []) { const match = find(child, predicate); if (match) return match; } return null; }
 const button = (tree, text) => find(tree, n => n.type === 'button' && n.children.includes(text));
 saved = [];
 let tree = render(null);
 assert.equal(button(tree, 'Save draft').props.disabled, true, 'untouched form is not a draft');
 find(tree, n => n.type === 'input' && n.props.placeholder === 'Manali Backpacking Escape').props.onChange({ target: { value: 'Unfinished adventure' } });
 tree = render(null);
 await button(tree, 'Save draft').props.onClick();
 assert.equal(saved.length, 1);
 assert.equal(saved[0].payload.status, 'draft');
 assert.equal(saved[0].payload.start_date, null);
 assert.equal(contacts.length, 0, 'unfinished draft does not require publishing contact details');
 states = []; refs = []; saved = [];
 tree = render(copy);
 assert.equal(button(tree, 'Save draft').props.disabled, true);
 button(tree, 'Preview').props.onClick();
 tree = render(copy);
 await button(tree, 'Publish trip').props.onClick();
 assert.equal(saved.length, 1);
 assert.equal(saved[0].id, null, 'publishing a copy creates one new row');
 assert.equal(saved[0].payload.status, 'published');
 states = []; refs = []; saved = [];
 const existingDraft = { ...source, id: 'draft-id', status: 'DRAFT' };
 tree = render(existingDraft);
 button(tree, 'Preview').props.onClick();
 await button(render(existingDraft), 'Publish trip').props.onClick();
 assert.equal(saved[0].id, 'draft-id', 'publishing a saved draft updates its original ID');
 assert.equal(saved[0].payload.status, 'published');
 states = []; refs = [];
 tree = render(copy); button(tree, 'Dates').props.onClick(); tree = render(copy);
 const start = find(tree, n => n.type === 'input' && n.props.value === copy.startDate);
 const end = find(tree, n => n.type === 'input' && n.props.value === copy.endDate);
 assert.equal(end.props.min, copy.startDate);
 start.props.onChange({ target: { value: '2027-01-05' } });
 tree = render(copy);
 assert.ok(find(tree, n => n.type === 'input' && n.props.type === 'date' && n.props.value === '' && n.props.min === '2027-01-05'));
 vm.runInContext(read('src/pages/public/ExplorePage.js'), context);
 context.Chip = 'chip';
 const filters = { from: '2027-05-04', to: '2027-05-06' };
 const panel = context.FilterPanel({ f: filters, set() {}, onClear() {}, count: 0 });
 assert.equal(find(panel, n => n.type === 'input' && n.props.value === filters.to).props.min, filters.from);
 vm.runInContext(read('src/features/organizerDashboard/pages/OrganizerDepartures.js'), context);
 states = []; refs = []; cursor = 0; refCursor = 0;
 let editor = context.DepartureEditor({ initial: { tripId: 'source', start: '2027-06-10', end: '2027-06-12', total: 10 }, trips: [source], onApply() {} });
 assert.equal(find(editor, n => n.type === 'input' && n.props.value === '2027-06-12').props.min, '2027-06-10');
 find(editor, n => n.type === 'input' && n.props.value === '2027-06-10').props.onChange({ target: { value: '2027-06-15' } });
 cursor = 0; refCursor = 0;
 editor = context.DepartureEditor({ initial: {}, trips: [source], onApply() {} });
 assert.ok(find(editor, n => n.type === 'input' && n.props.type === 'date' && n.props.value === '' && n.props.min === '2027-06-15'));
 console.log('PASS: published departures, unsaved copies, incomplete drafts, draft-to-published IDs, date bounds and invalid date rejection');
})().catch(error => { console.error(error); process.exitCode = 1; });
