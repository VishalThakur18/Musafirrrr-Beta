"use strict";
// Comparison owns only stable public-trip IDs; no trip data is persisted.
const COMPARE_KEY = 'musafirrrr.compare.v1';
function compareIds(value) {
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter(id => typeof id === 'string' && id.trim() && id.length <= 200))].slice(0, 3);
}
function readCompareIds() {
    try { return compareIds(JSON.parse(localStorage.getItem(COMPARE_KEY))); } catch (_) { return []; }
}
function compareSelection(ids, action) {
    if (action.type === 'clear') return [];
    if (action.type === 'remove') return ids.filter(id => id !== action.id);
    if (action.type === 'toggle') return ids.includes(action.id) ? ids.filter(id => id !== action.id) : compareIds([...ids, action.id]);
    return ids;
}
const CompareContext = React.createContext(null);
function CompareProvider({ children }) {
    const { user, ready } = useAuth();
    const owner = user?.id || null;
    const controller = useMemo(() => new ComparisonController(owner), [owner, ready]);
    const state = React.useSyncExternalStore(controller.subscribe, controller.snapshot, controller.snapshot);
    const s = useStore();
    useEffect(() => {
        controller.active = true;
        if (ready && owner) void controller.run('get');
        const refresh = () => {
            if (ready && document.visibilityState === 'visible' && !controller.state.syncError) void controller.run('get');
        };
        const storage = e => { if (!owner && e.key === COMPARE_KEY) refresh(); };
        window.addEventListener('focus', refresh);
        window.addEventListener('online', refresh);
        window.addEventListener('storage', storage);
        return () => {
            controller.active = false;
            window.removeEventListener('focus', refresh);
            window.removeEventListener('online', refresh);
            window.removeEventListener('storage', storage);
        };
    }, [controller, ready, owner]);
    const ids = ready ? state.ids : [];
    const busy = !ready || state.busy;
    const publicTrips = s.trips.filter(t => t.status === 'PUBLISHED' || t.status === 'SOLD_OUT');
    const trips = ids.map(id => publicTrips.find(t => t.id === id)).filter(Boolean);
    const toggle = id => {
        if (busy || !state.initialized || !publicTrips.some(t => t.id === id)) return;
        if (!ids.includes(id) && ids.length >= 3) { toast('You can compare up to 3 trips. Remove one to add another.', 'warn'); return; }
        return controller.run(ids.includes(id) ? 'remove' : 'add', id);
    };
    const remove = id => controller.run('remove', id);
    const removeUnavailable = async () => {
        if (owner) return controller.run('get'); // Server prunes all unavailable IDs atomically.
        for (const id of ids.filter(id => !trips.some(t => t.id === id))) await remove(id);
    };
    return React.createElement(CompareContext.Provider, { value: {
        ids, trips, toggle, remove, removeUnavailable, canCompare: id => publicTrips.some(t => t.id === id), clear: () => controller.run('clear'),
        busy, disabled: busy || !state.initialized, syncError: state.syncError,
        retry: () => controller.retry(), account: !!owner,
        loading: s.tripsLoading || !ready || (state.busy && !state.initialized), error: s.tripsError
    } }, children);
}
function useCompare() { return React.useContext(CompareContext); }
function CompareButton({ trip, detail = false }) {
    const c = useCompare();
    const route = useRoute();
    if (!c || route.startsWith('/organizer') || !['PUBLISHED', 'SOLD_OUT'].includes(trip.status)) return null;
    const selected = c.ids.includes(trip.id);
    return React.createElement('button', { type: 'button', disabled: c.disabled || (!selected && !c.canCompare(trip.id)), className: detail ? 'trip-compare-control trip-compare-control--detail' : 'trip-compare-control', 'aria-pressed': selected,
        'aria-label': (selected ? 'Remove from comparison: ' : 'Compare: ') + trip.title,
        onClick: e => { e.preventDefault(); e.stopPropagation(); c.toggle(trip.id); } }, selected ? '✓ Comparing' : '+ Compare');
}
