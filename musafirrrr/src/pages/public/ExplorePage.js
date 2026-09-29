"use strict";
/* ============================================================
   PAGE — EXPLORE  (#/explore)
   Includes the filter logic and filter panel.
   ============================================================ */

/** Pure filtering + sorting of trips. */
function filterTrips(trips, f) {
    let out = trips.filter(t => t.status === 'PUBLISHED' || t.status === 'SOLD_OUT');
    if (f.q) {
        const q = f.q.toLowerCase();
        out = out.filter(t => (t.destination + ' ' + t.region + ' ' + t.title + ' ' + t.category).toLowerCase().includes(q));
    }
    if (f.cat)
        out = out.filter(t => t.category === f.cat);
    if (f.group)
        out = out.filter(t => t.groupType === f.group);
    if (f.min)
        out = out.filter(t => t.price >= +f.min);
    if (f.max)
        out = out.filter(t => t.price <= +f.max);
    if (f.from)
        out = out.filter(t => t.startDate >= f.from);
    if (f.to)
        out = out.filter(t => t.endDate <= f.to);
    if (f.duration === '1-3')
        out = out.filter(t => t.days <= 3);
    if (f.duration === '4-7')
        out = out.filter(t => t.days >= 4 && t.days <= 7);
    if (f.duration === '8+')
        out = out.filter(t => t.days >= 8);
    if (f.available)
        out = out.filter(t => t.availableSpots > 0);
    const sort = f.sort || 'recommended';
    const cmp = {
        price_asc: (a, b) => a.price - b.price, price_desc: (a, b) => b.price - a.price,
        soonest: (a, b) => d(a.startDate) - d(b.startDate), newest: (a, b) => d(b.createdAt) - d(a.createdAt),
        recommended: (a, b) => (b.rating * 10 + (b.availableSpots > 0 ? 1 : -5)) - (a.rating * 10 + (a.availableSpots > 0 ? 1 : -5))
    }[sort];
    return [...out].sort(cmp);
}

/** Filter sidebar / sheet. */
function FilterPanel({ f, set, onClear, count }) {
    return (React.createElement("div", { className: "space-y-7" },
        React.createElement("div", null,
            React.createElement("h3", { className: "text-[13px] font-bold tracking-[.1em] text-muted mb-3" }, "DESTINATION"),
            React.createElement(Input, { value: f.q || '', onChange: e => set({ q: e.target.value }), placeholder: "Manali, Goa, Kerala\u2026" })),
        React.createElement("div", null,
            React.createElement("h3", { className: "text-[13px] font-bold tracking-[.1em] text-muted mb-3" }, "DATES"),
            React.createElement("div", { className: "grid grid-cols-2 gap-2.5" },
                React.createElement(Field, { label: "From" },
                    React.createElement(Input, { type: "date", value: f.from || '', onChange: e => set({ from: e.target.value }) })),
                React.createElement(Field, { label: "To" },
                    React.createElement(Input, { type: "date", value: f.to || '', onChange: e => set({ to: e.target.value }) })))),
        React.createElement("div", null,
            React.createElement("h3", { className: "text-[13px] font-bold tracking-[.1em] text-muted mb-3" }, "BUDGET PER PERSON"),
            React.createElement("div", { className: "grid grid-cols-2 gap-2.5" },
                React.createElement(Field, { label: "Min" },
                    React.createElement(Input, { type: "number", min: "0", step: "500", value: f.min || '', onChange: e => set({ min: e.target.value }), placeholder: "\u20B90" })),
                React.createElement(Field, { label: "Max" },
                    React.createElement(Input, { type: "number", min: "0", step: "500", value: f.max || '', onChange: e => set({ max: e.target.value }), placeholder: "Any" })))),
        React.createElement("div", null,
            React.createElement("h3", { className: "text-[13px] font-bold tracking-[.1em] text-muted mb-3" }, "TRIP TYPE"),
            React.createElement("div", { className: "flex flex-wrap gap-2" }, CATEGORIES.map(c => React.createElement(Chip, { key: c, active: f.cat === c, onClick: () => set({ cat: f.cat === c ? '' : c }) }, c)))),
        React.createElement("div", null,
            React.createElement("h3", { className: "text-[13px] font-bold tracking-[.1em] text-muted mb-3" }, "GROUP TYPE"),
            React.createElement("div", { className: "flex flex-wrap gap-2" }, GROUPS.map(c => React.createElement(Chip, { key: c, active: f.group === c, onClick: () => set({ group: f.group === c ? '' : c }) }, c)))),
        React.createElement("div", null,
            React.createElement("h3", { className: "text-[13px] font-bold tracking-[.1em] text-muted mb-3" }, "DURATION"),
            React.createElement("div", { className: "flex flex-wrap gap-2" }, DURATIONS.map(([v, l]) => React.createElement(Chip, { key: l, active: (f.duration || '') === v, onClick: () => set({ duration: v }) }, l)))),
        React.createElement("label", { className: "flex items-center gap-3 text-[14.5px] font-medium cursor-pointer" },
            React.createElement("input", { type: "checkbox", checked: !!f.available, onChange: e => set({ available: e.target.checked }), className: "w-5 h-5 rounded-md border-line text-ink focus:ring-slatey" }),
            "Hide sold-out trips"),
        React.createElement("div", { className: "flex items-center justify-between pt-1" },
            React.createElement("span", { className: "text-[13.5px] text-muted" },
                count,
                " ",
                count === 1 ? 'trip' : 'trips'),
            React.createElement("button", { onClick: onClear, className: "text-[13.5px] font-semibold underline underline-offset-4 hover:text-earth" }, "Clear all"))));
}

/** Explore page (#/explore). */
function ExplorePage({ params }) {
    const s = useStore();
    const [f, setF] = useState({ q: params.q || '', cat: params.cat || '', group: params.group || '', min: '', max: params.max || '', from: params.from || '', to: '', duration: '', available: false, sort: 'recommended' });
    const [sheet, setSheet] = useState(false);
    const [loading, setLoading] = useState(true);
    useEffect(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 350); return () => clearTimeout(t); }, [f.q, f.cat, f.group, f.min, f.max, f.from, f.to, f.duration, f.available]);
    useEffect(() => { setF(x => ({ ...x, q: params.q || '', cat: params.cat || '', group: params.group || '', max: params.max || '', from: params.from || '' })); }, [params.q, params.cat, params.group, params.max, params.from]);
    const set = p => setF(x => ({ ...x, ...p }));
    const clear = () => { setF({ q: '', cat: '', group: '', min: '', max: '', from: '', to: '', duration: '', available: false, sort: f.sort }); go('/explore'); };
    const results = useMemo(() => filterTrips(s.trips, f), [s.trips, f]);
    const orgCount = new Set(results.map(t => t.organizerId)).size;
    const activeCount = ['q', 'cat', 'group', 'min', 'max', 'from', 'to', 'duration'].filter(k => f[k]).length + (f.available ? 1 : 0);
    return (React.createElement("main", { className: "max-w-shell mx-auto px-5 lg:px-8 py-8 md:py-12" },
        React.createElement("div", { className: "lg:hidden mb-6" },
            React.createElement(SearchBar, { variant: "compact", initial: { q: f.q }, onSearch: ({ q, from, budget }) => set({ q, from, max: budget }) })),
        React.createElement("div", { className: "hidden lg:block mb-10" },
            React.createElement(SearchBar, { variant: "compact", initial: { q: f.q, from: f.from, budget: f.max }, onSearch: ({ q, from, budget }) => set({ q, from, max: budget }) })),
        React.createElement("div", { className: "flex items-end justify-between gap-4 flex-wrap mb-6" },
            React.createElement("div", null,
                React.createElement("h1", { className: "text-[28px] sm:text-[36px] font-extrabold tracking-[-0.03em] leading-tight" }, f.q ? `Trips to ${f.q}` : f.cat ? `${f.cat} trips` : f.group ? `${f.group} trips` : 'All upcoming trips'),
                React.createElement("p", { className: "mt-1.5 text-[15px] text-slatey" },
                    results.length,
                    " ",
                    results.length === 1 ? 'trip' : 'trips',
                    " from ",
                    orgCount,
                    " ",
                    orgCount === 1 ? 'organizer' : 'organizers')),
            React.createElement("div", { className: "flex items-center gap-2.5" },
                React.createElement("button", { onClick: () => setSheet(true), className: "lg:hidden inline-flex items-center gap-2 h-11 px-4 rounded-full border border-line bg-white text-[14px] font-semibold" },
                    React.createElement(Icon, { name: "filter", size: 16 }),
                    " Filters ",
                    activeCount > 0 && React.createElement("span", { className: "w-5 h-5 rounded-full bg-ink text-white text-[11px] flex items-center justify-center" }, activeCount)),
                React.createElement(Select, { value: f.sort, onChange: e => set({ sort: e.target.value }), className: "h-11 w-[190px]" }, SORTS.map(([v, l]) => React.createElement("option", { key: v, value: v }, l))))),
        React.createElement("div", { className: "grid lg:grid-cols-[280px_1fr] gap-10" },
            React.createElement("aside", { className: "hidden lg:block" },
                React.createElement("div", { className: "sticky", style: { top: 'calc(96px + env(safe-area-inset-top,0px))' } },
                    React.createElement(FilterPanel, { f: f, set: set, onClear: clear, count: results.length }))),
            React.createElement("div", null,
                React.createElement(TripGrid, { trips: results, loading: loading, empty: React.createElement(EmptyState, { title: "Nothing matches yet", body: "No trips fit those filters. Widen the dates, raise the budget, or clear the filters to see everything.", action: React.createElement(Btn, { onClick: clear }, "Clear filters") }) }))),
        sheet && (React.createElement("div", { className: "lg:hidden fixed inset-0 z-[95]" },
            React.createElement("div", { className: "absolute inset-0 bg-ink/45 fade-in", onClick: () => setSheet(false) }),
            React.createElement("div", { className: "absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[88vh] overflow-y-auto sheet-up", style: { paddingBottom: 'env(safe-area-inset-bottom,0px)' } },
                React.createElement("div", { className: "sticky top-0 bg-white px-5 pt-5 pb-3 flex items-center justify-between border-b border-line" },
                    React.createElement("h2", { className: "text-xl font-bold tracking-tight" }, "Filters"),
                    React.createElement("button", { onClick: () => setSheet(false), className: "w-9 h-9 rounded-full border border-line flex items-center justify-center" },
                        React.createElement(Icon, { name: "x", size: 16 }))),
                React.createElement("div", { className: "p-5" },
                    React.createElement(FilterPanel, { f: f, set: set, onClear: clear, count: results.length })),
                React.createElement("div", { className: "sticky bottom-0 bg-white border-t border-line p-4" },
                    React.createElement(Btn, { className: "w-full", size: "lg", onClick: () => setSheet(false) },
                        "Show ",
                        results.length,
                        " trips")))))));
}
