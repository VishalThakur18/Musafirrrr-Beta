const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
let states = [], refs = [], cursor = 0, refCursor = 0, mounted = false, effects = [], requests = [], resolveSave, fail = false;
const trips = ['a','b'].map(id => ({ id, title: 'Trip ' + id, status: 'PUBLISHED', startDate: '2027-01-01', endDate: '2027-01-03', totalSpots: 10, availableSpots: 5 }));
const context = vm.createContext({
 React: { createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity) }) },
 useState(initial) { const i = cursor++; if (!(i in states)) states[i] = typeof initial === 'function' ? initial() : initial; return [states[i], v => { states[i] = typeof v === 'function' ? v(states[i]) : v; }]; },
 useRef(initial) { const i = refCursor++; return refs[i] || (refs[i] = { current: initial }); },
 useEffect(fn) { if (!mounted) effects.push(fn); },
 Btn: 'button', Link: 'a', Stat: 'stat', EmptyState: 'empty', Confirm: 'confirm',
 tripCoverSrc: () => '', dateRange: () => 'Jan 1-3', daysUntil: () => 3, toast() {},
 organizerApi: {
  getTripEnquiryPause: async () => false, getDepartureChecklist: async () => [],
  setTripStatus(id, status) { requests.push({ id, status }); return new Promise((resolve,reject) => { resolveSave = () => fail ? reject(new Error('Offline')) : resolve(); }); },
  setTripEnquiryPause(id, paused) { requests.push({ id, paused }); return new Promise((resolve,reject) => { resolveSave = () => fail ? reject(new Error('Offline')) : resolve(paused); }); }
 }
});
vm.runInContext(fs.readFileSync(require('node:path').join(__dirname, '../src/features/organizerDashboard/pages/OrganizerDepartures.js'), 'utf8'), context);
const render = () => { cursor = 0; refCursor = 0; const tree = context.DepartureWorkspace({ trips, organizerId: 'org' }); mounted = true; return tree; };
const nodes = tree => !tree || typeof tree !== 'object' ? [] : [tree, ...(tree.children || []).flatMap(nodes)];
const button = (tree, label) => nodes(tree).find(n => n.type === 'button' && n.children.includes(label));
const dialog = tree => nodes(tree).find(n => n.type === 'confirm' && n.props.open);
(async () => {
 render(); effects.forEach(fn => fn()); await new Promise(setImmediate);
 let tree = render();
 button(tree, 'Pause enquiries').props.onClick();
 assert.equal(requests.length, 0, 'opening confirmation must not mutate');
 assert.equal(dialog(render()).props.open, true);
 dialog(render()).props.onClose();
 assert.equal(requests.length, 0, 'cancel must not mutate');
 button(render(), 'Pause enquiries').props.onClick();
 dialog(render()).props.onConfirm(); dialog(render()).props.onClose();
 tree = render();
 assert.equal(nodes(tree).filter(n => n.type === 'article').length, 2, 'cards stay mounted while saving');
 const pauseButtons = nodes(tree).filter(n => n.type === 'button' && n.children.includes('Pause enquiries'));
 assert.equal(pauseButtons[0].props.disabled, true);
 assert.equal(pauseButtons[1].props.disabled, false, 'other rows do not change disabled appearance');
 assert.equal(button(tree, 'Add departure').props.disabled, false);
 resolveSave(); await new Promise(setImmediate);
 tree = render();
 assert.ok(button(tree, 'Resume enquiries'));
 assert.equal(nodes(tree).some(n => n.props.className === 'od-departure-notice'), false, 'no banner shifts cards');
 button(tree, 'Resume enquiries').props.onClick();
 assert.equal(dialog(render()).props.title, 'Resume enquiries?');
 fail = true; dialog(render()).props.onConfirm(); dialog(render()).props.onClose();
 resolveSave(); await new Promise(setImmediate);
 assert.ok(button(render(), 'Resume enquiries'), 'failed resume preserves paused state');
 fail = false; button(render(), 'Resume enquiries').props.onClick();
 dialog(render()).props.onConfirm(); dialog(render()).props.onClose();
 resolveSave(); await new Promise(setImmediate);
 assert.equal(nodes(render()).filter(n => n.type === 'button' && n.children.includes('Pause enquiries')).length, 2);
 const before = requests.length;
 button(render(), 'Mark full').props.onClick();
 assert.equal(requests.length, before);
 dialog(render()).props.onClose();
 assert.equal(requests.length, before, 'cancel full does not mutate');
 button(render(), 'Mark full').props.onClick();
 const confirmation = dialog(render());
 confirmation.props.onConfirm(); confirmation.props.onConfirm(); confirmation.props.onClose();
 assert.equal(requests.length, before + 1, 'repeated confirm only saves once');
 tree = render();
 assert.equal(nodes(tree).filter(n => n.type === 'article').length, 2);
 const fullButtons = nodes(tree).filter(n => n.type === 'button' && n.children.includes('Mark full'));
 assert.equal(fullButtons[0].props.disabled, true);
 assert.equal(fullButtons[1].props.disabled, false);
 resolveSave(); await new Promise(setImmediate);
 assert.ok(button(render(), 'Reopen departure'));
 assert.equal(nodes(render()).some(n => n.props.className === 'od-departure-notice'), false);
 button(render(), 'Reopen departure').props.onClick();
 assert.equal(dialog(render()).props.title, 'Reopen departure?');
 fail = true; dialog(render()).props.onConfirm(); dialog(render()).props.onClose();
 resolveSave(); await new Promise(setImmediate);
 assert.ok(button(render(), 'Reopen departure'), 'failed reopen preserves full status');
 fail = false; button(render(), 'Reopen departure').props.onClick();
 dialog(render()).props.onConfirm(); dialog(render()).props.onClose();
 resolveSave(); await new Promise(setImmediate);
 assert.equal(nodes(render()).filter(n => n.type === 'button' && n.children.includes('Mark full')).length, 2);
 console.log('PASS: pause/resume and full/reopen confirmation, cancellation, stable cards, row-only pending state, duplicate prevention and failure recovery');
})().catch(error => { console.error(error); process.exitCode = 1; });
