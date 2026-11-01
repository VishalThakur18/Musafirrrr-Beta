const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const trip = '11111111-1111-1111-1111-111111111111';
const otherTrip = '22222222-2222-2222-2222-222222222222';
const rows = new Map([['a', [trip]], ['b', [otherTrip]]]);
let fail = false, hold = null, requests = 0;
const context = {
    authState: { user: null, ready: true },
    store: { state: { wishlist: [], trips: [{ id: trip }, { id: otherTrip }] }, set(fn) { fn(this.state); } },
    tripService: { byId() {} }, toast() {},
    window: { sbClient: { from() {
        requests++;
        let op, owner, id;
        const query = {
            select() { op = 'read'; return this; },
            delete() { op = 'delete'; return this; },
            eq(key, value) { if (key === 'user_id') owner = value; else id = value; return this; },
            upsert(row) { op = 'insert'; owner = row.user_id; id = row.trip_id; return this; },
            then(resolve, reject) {
                const run = () => {
                    if (fail) return { error: new Error('offline') };
                    const saved = rows.get(owner) || [];
                    if (op === 'read') return { data: saved.map(trip_id => ({ trip_id })) };
                    rows.set(owner, op === 'delete' ? saved.filter(x => x !== id) : [...new Set([...saved, id])]);
                    return { error: null };
                };
                if (hold) { const defer = hold; hold = null; defer(() => resolve(run())); }
                else Promise.resolve(run()).then(resolve, reject);
            }
        };
        return query;
    } } }
};
vm.createContext(context);
vm.runInContext(source('src/backend/services/wishlist.service.js'), context);
const service = context.window.wishlistService;
const login = (id, role = 'TRAVELLER') => { context.authState.user = id ? { id, role } : null; service.syncIdentity(); };
const ids = () => Array.from(service.ids());

(async () => {
    let persisted;
    const storeContext = vm.createContext({
        LS_KEY: 'test', ORGANIZERS: [], ENQUIRIES: [], console,
        localStorage: { getItem: () => JSON.stringify({ wishlist: [trip] }), setItem: (_, value) => { persisted = JSON.parse(value); } }
    });
    vm.runInContext(source('src/backend/store.js'), storeContext);
    assert.equal(vm.runInContext('store.state.wishlist.length', storeContext), 0, 'legacy device saves are not assigned to an account');
    vm.runInContext('store.set(s => { s.wishlist = ["private-save"]; })', storeContext);
    assert.equal('wishlist' in persisted, false, 'account saves never persist in shared local storage');
    await service.load();
    await service.toggle(trip);
    assert.equal(requests, 0, 'guests cannot query or save');
    login('org', 'ORGANIZER');
    await service.load(); await service.toggle(trip);
    assert.equal(requests, 0, 'organizers cannot query or save');
    login('a'); await service.load();
    assert.deepEqual(ids(), [trip], 'prior saves restored');
    await service.toggle(otherTrip);
    assert.deepEqual(ids(), [otherTrip, trip]);
    login(null);
    assert.deepEqual(Array.from(context.store.state.wishlist), [], 'logout clears memory');
    login('a'); await service.load();
    assert.ok(ids().includes(otherTrip), 'save survives logout and sign-in');
    await service.toggle(otherTrip);
    assert.deepEqual(ids(), [trip]);
    login('b');
    assert.deepEqual(ids(), [], 'account change clears old list before loading');
    await service.load();
    assert.deepEqual(ids(), [otherTrip]);
    login(null); login('a');
    let finish;
    hold = callback => { finish = callback; };
    const stale = service.load();
    await Promise.resolve();
    login('b'); await service.load();
    finish(); await stale;
    assert.deepEqual(ids(), [otherTrip], 'late load cannot overwrite another account');
    login(null); login('a'); fail = true;
    await assert.rejects(service.load());
    assert.ok(context.store.state.wishlistError);
    assert.equal(context.store.state.wishlistLoading, false);
    fail = false; await service.load();
    assert.deepEqual(ids(), [trip], 'failed load can be retried');
    fail = true; await service.toggle(trip);
    assert.deepEqual(ids(), [trip], 'failed delete preserves saved trip');
    fail = false;
    const before = requests;
    await Promise.all([service.toggle(otherTrip), service.toggle(otherTrip)]);
    assert.equal(requests, before + 1, 'duplicate clicks issue one mutation');
    hold = callback => { finish = callback; };
    const mutation = service.toggle(trip);
    await Promise.resolve(); await Promise.resolve();
    login('b'); await service.load();
    finish(); await mutation;
    assert.deepEqual(ids(), [otherTrip], 'late mutation cannot change next account');

    Object.assign(context, {
        useStore: () => context.store.state,
        useAuth: () => context.authState,
        useEffect() {}, useState: x => [x, () => {}], useRef: () => ({ current: null }), useRoute: () => '/',
        React: { createElement: (type, props, ...children) => ({ type, props: props || {}, children }), Fragment: 'fragment' },
        cls: (...x) => x.filter(Boolean).join(' '),
        wishlistService: service, Icon: 'Icon', Link: 'Link', Btn: 'Btn', Logo: 'Logo',
        EmptyState: 'EmptyState', Avatar: 'Avatar', OrgLogo: 'OrgLogo', waLink: () => '#'
    });
    for (const file of ['src/components/shared/TripCard.js', 'src/components/layout/Navbar.js', 'src/components/layout/Footer.js', 'src/components/layout/MobileTabs.js', 'src/middleware/auth.guard.js']) vm.runInContext(source(file), context);
    const links = tree => !tree || typeof tree !== 'object' ? [] : [
        ...(tree.props?.to ? [tree.props.to] : []),
        ...(Array.isArray(tree) ? tree : tree.children || []).flatMap(links)
    ];
    for (const role of [null, 'ORGANIZER', 'TRAVELLER']) {
        login(role ? 'ui' : null, role);
        const allowed = role === 'TRAVELLER';
        assert.equal(!!context.WishlistButton({ tripId: trip }), allowed);
        assert.equal(links(context.Navbar()).includes('/saved'), allowed);
        assert.equal(links(context.Footer()).includes('/saved'), allowed);
        assert.equal(links(context.MobileTabs()).includes('/saved'), allowed);
        assert.equal(context.Guard({ role: 'TRAVELLER', children: 'private-saves' }) === 'private-saves', allowed);
    }
    console.log('PASS: traveller-only UI/guard, restore/save/remove, account isolation, late requests, retries and duplicate clicks');
})().catch(error => { console.error(error); process.exitCode = 1; });
