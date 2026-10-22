const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '../src/', file), 'utf8');
const calls = [], effects = [], refs = [], listeners = new Map();
let effectIndex = 0, refIndex = 0, sequence = 0, response = {};
const document = { visibilityState: 'visible', addEventListener: (k, fn) => listeners.set(k, fn), removeEventListener: k => listeners.delete(k) };
const context = vm.createContext({ document, crypto: { randomUUID: () => `event-${++sequence}` },
    window: { sbClient: { rpc: async (name, params) => { calls.push({ name, params }); if (response instanceof Error) throw response; return response; } } },
    useRef(value) { const index = refIndex++; return refs[index] || (refs[index] = { current: value }); },
    useEffect(fn, deps) { const index = effectIndex++; const prior = effects[index];
        if (!prior || deps.some((dep, i) => dep !== prior.deps[i])) { prior?.cleanup?.(); effects[index] = { deps, cleanup: fn() }; }
    }
});
vm.runInContext(read('features/organizerDashboard/services/analytics.service.js') + '\nglobalThis.api = tripAnalytics;', context);
const render = trip => { effectIndex = refIndex = 0; context.trip = trip; vm.runInContext('useTripPageView(trip, trip?.slug || "missing")', context); };
(async () => {
    const trip = { id: 'trip-1', slug: 'first', fromDb: true };
    assert.equal(await context.api.track(null, 'page_view'), false);
    assert.equal(await context.api.track({ id: 'demo' }, 'page_view'), false);
    assert.equal(await context.api.track(trip, 'confirmed_conversation'), false);
    assert.equal(calls.length, 0);
    render(trip); render({ ...trip }); assert.equal(calls.length, 1);
    document.visibilityState = 'hidden'; render({ ...trip, id: 'trip-2', slug: 'second' }); assert.equal(calls.length, 1);
    document.visibilityState = 'visible'; listeners.get('visibilitychange')(); listeners.get('visibilitychange')(); assert.equal(calls.length, 2);
    render(trip); assert.equal(calls.length, 3); // A return visit counts.
    assert.notEqual(calls[0].params.p_event_id, calls[2].params.p_event_id);
    for (const kind of ['whatsapp_click', 'instagram_click', 'enquiry_open']) assert.equal(await context.api.track(trip, kind), true);
    assert.ok(calls.every(call => call.name === 'record_trip_event'));
    response = { error: { message: 'offline' } }; assert.equal(await context.api.track(trip, 'page_view'), false);
    response = new Error('network'); assert.equal(await context.api.track(trip, 'page_view'), false);
    await assert.rejects(context.api.report('owner', 5), /Invalid/);
    for (const days of [7, 30, 90]) {
        response = { data: { days, trips: [] } };
        assert.equal((await context.api.report('owner', days)).days, days);
        assert.equal(calls.at(-1).params.p_organizer_id, 'owner');
    }
    response = { error: new Error('denied') }; await assert.rejects(context.api.report('owner', 30), /denied/);
    response = { data: null }; await assert.rejects(context.api.report('owner', 30), /unavailable/);
    let uiState = { loading: false, error: null, reload() {}, data: { days: 30, as_of: '2026-10-21T12:00:00Z', trips: [
        { id: 'a', title: 'Mountain trip', destination: 'Spiti', views: 20, enquiries: 2, whatsapp_clicks: 4, instagram_clicks: 1, enquiry_opens: 3 },
        { id: 'b', title: 'Beach trip', destination: 'Goa', views: 0, enquiries: 1, whatsapp_clicks: 0, instagram_clicks: 0, enquiry_opens: 1 }
    ] } };
    Object.assign(context, { React: { createElement: (type, props, ...children) => ({ type, props, children }), Fragment: 'fragment' },
        useState: value => [value, () => {}], useAsync: () => uiState, Stat: 'Stat', Link: 'Link', Btn: 'Btn' });
    vm.runInContext(read('features/organizerDashboard/components/OrganizerTripPerformance.js'), context);
    const tree = () => JSON.stringify(vm.runInContext('OrganizerTripPerformance({ organizerId: "owner" })', context));
    let output = tree();
    assert.match(output, /15.0%/); // Aggregate rate: 3 enquiries / 20 views.
    assert.match(output, /10.0%/); // Per-trip rate remains distinct.
    assert.match(output, /\u2014/); // Zero views never imply a zero conversion rate.
    assert.match(output, /Mountain trip \(20\)/);
    uiState = { ...uiState, loading: true }; output = tree(); assert.doesNotMatch(output, /Mountain trip/);
    uiState = { ...uiState, loading: false, error: new Error('offline') }; output = tree();
    assert.match(output, /Analytics is unavailable/); assert.doesNotMatch(output, /Mountain trip/);
    uiState = { loading: false, data: { days: 7, trips: [] } }; assert.doesNotMatch(tree(), /Submitted enquiries/);
    console.log('PASS: visible visits, rerender deduplication, return visits, real-trip-only telemetry, separate clicks, failure isolation and report periods');
})().catch(error => { console.error(error); process.exitCode = 1; });
