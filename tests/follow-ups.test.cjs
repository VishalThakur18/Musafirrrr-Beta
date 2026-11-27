const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/features/organizerDashboard/pages/OrganizerDashboard.js'), 'utf8');
const context = vm.createContext({ Date });
vm.runInContext(source, context);
test('follow-up dates distinguish overdue, today and future across month boundaries', () => {
    assert.equal(context.organizerFollowUpLabel('2026-09-30', '2026-10-01'), 'Overdue');
    assert.equal(context.organizerFollowUpLabel('2026-10-01', '2026-10-01'), 'Due today');
    assert.equal(context.organizerFollowUpLabel('2027-01-01', '2026-10-01'), 'Upcoming');
});
test('contact editor preserves local wall time when reopening a saved timestamp', () => {
    const date = new Date(2026, 9, 26, 14, 35);
    assert.equal(context.organizerLocalInput(date.toISOString()), '2026-10-26T14:35');
});

test('reminder carousel navigates every reminder and disables boundary arrows', () => {
    let slide = 0;
    const notes = Array.from({ length: 7 }, (_, i) => ({ enquiry_id: String(i), follow_up_date: `2026-11-0${i + 1}`, notes: 'Note' }));
    const leads = notes.map(note => ({ id: note.enquiry_id, name: 'Traveller ' + note.enquiry_id, status: 'NEW' }));
    const ui = vm.createContext({ Date,
        React: { createElement: (type, props, ...children) => ({ type, props: props || {}, children: children.flat(Infinity) }) },
        useState: () => [slide, value => { slide = typeof value === 'function' ? value(slide) : value; }],
        useEffect: () => {}, useAsync: () => ({ data: notes }), useOrganizerLiveRefresh: () => {},
        Link: 'link', Icon: 'icon', Btn: 'button', fmtLong: value => value
    });
    vm.runInContext(source, ui);
    const flatten = node => !node || typeof node !== 'object' ? [] : [node, ...node.children.flatMap(flatten)];
    const render = () => flatten(ui.OrganizerFollowUps({ organizerId: 'org', leads }));
    for (let i = 0; i < 7; i++) {
        const nodes = render();
        const cards = nodes.filter(node => node.props.className === 'od-reminder');
        assert.equal(cards.length, 1);
        assert.equal(cards[0].props.to, '/organizer/leads?lead=' + i);
        assert.equal(nodes.find(node => node.props['aria-label'] === 'Previous follow-up').props.disabled, i === 0);
        const next = nodes.find(node => node.props['aria-label'] === 'Next follow-up');
        assert.equal(next.props.disabled, i === 6);
        if (i < 6) next.props.onClick();
    }
    render().find(node => node.props['aria-label'] === 'Previous follow-up').props.onClick();
    assert.equal(slide, 5);
    notes.splice(1);
    assert.equal(render().find(node => node.props.className === 'od-reminder').props.to, '/organizer/leads?lead=0');
});

test('note deletion scopes the row and rejects failed or conflicting deletes', async () => {
    const calls = [];
    let result = { data: [{ enquiry_id: 'lead' }], error: null };
    const query = {
        delete() { calls.push(['delete']); return this; },
        eq(key, value) { calls.push([key, value]); return this; },
        select() { return Promise.resolve(result); }
    };
    const service = vm.createContext({ window: { sbClient: { from(table) { calls.push(['table', table]); return query; } } } });
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/backend/services/organizer.service.js'), 'utf8') + '\nthis.api = organizerApi;', service);
    await service.api.deleteEnquiryNotes('org', 'lead', 'timestamp');
    assert.deepEqual(calls, [['table', 'organizer_enquiry_notes'], ['delete'], ['organizer_id', 'org'], ['enquiry_id', 'lead'], ['updated_at', 'timestamp']]);
    result = { data: [], error: null };
    await assert.rejects(service.api.deleteEnquiryNotes('org', 'lead', 'timestamp'), /changed or could not be deleted/);
    result = { data: null, error: new Error('Permission denied') };
    await assert.rejects(service.api.deleteEnquiryNotes('org', 'lead', 'timestamp'), /Permission denied/);
});
