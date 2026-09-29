"use strict";
/* ============================================================
   SHARED — SEARCH BAR
   ============================================================ */

/** Search form used on the hero and explore page. */
function SearchBar({ variant = 'hero', initial = {}, onSearch }) {
    const [q, setQ] = useState(initial.q || '');
    const [from, setFrom] = useState(initial.from || '');
    const [budget, setBudget] = useState(initial.budget || '');
    const [open, setOpen] = useState(false);
    const wrap = useRef(null);
    useEffect(() => {
        const h = e => { if (wrap.current && !wrap.current.contains(e.target))
            setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    const matches = q ? DESTS.filter(d => d.toLowerCase().includes(q.toLowerCase())).slice(0, 5) : [];
    const submit = e => {
        e && e.preventDefault();
        const p = new URLSearchParams();
        if (q)
            p.set('q', q);
        if (from)
            p.set('from', from);
        if (budget)
            p.set('max', budget);
        onSearch ? onSearch({ q, from, budget }) : go('/explore' + (p.toString() ? '?' + p.toString() : ''));
    };
    const hero = variant === 'hero';
    return (React.createElement("form", { onSubmit: submit, ref: wrap, className: cls('bg-white w-full', hero ? 'rounded-3xl md:rounded-full shadow-pop p-2 md:p-2 border border-white/60' : 'rounded-2xl border border-line p-1.5 shadow-card') },
        React.createElement("div", { className: cls('flex flex-col md:flex-row md:items-center', hero ? 'md:divide-x md:divide-line' : 'md:divide-x md:divide-line') },
            React.createElement("div", { className: "relative flex-[1.4] px-3 py-2.5 md:py-2" },
                React.createElement("label", { htmlFor: "q", className: "block text-[11px] font-bold tracking-[.12em] text-muted" }, "WHERE"),
                React.createElement("input", { id: "q", value: q, autoComplete: "off", onChange: e => { setQ(e.target.value); setOpen(true); }, onFocus: () => setOpen(true), placeholder: "Where do you want to go?", className: "w-full bg-transparent border-0 p-0 mt-0.5 text-[15px] font-medium placeholder:text-muted/70 focus:ring-0 outline-none" }),
                open && matches.length > 0 && (React.createElement("ul", { className: "absolute z-40 left-2 right-2 top-full mt-2 bg-white rounded-2xl border border-line shadow-lift overflow-hidden fade-in" }, matches.map(m => (React.createElement("li", { key: m },
                    React.createElement("button", { type: "button", onMouseDown: () => { setQ(m); setOpen(false); }, className: "w-full text-left px-4 py-2.5 text-[14.5px] hover:bg-sand flex items-center gap-2" },
                        React.createElement(Icon, { name: "map", size: 15, className: "text-beige" }),
                        m))))))),
            React.createElement("div", { className: "flex-1 px-3 py-2.5 md:py-2 border-t md:border-t-0 border-line" },
                React.createElement("label", { htmlFor: "from", className: "block text-[11px] font-bold tracking-[.12em] text-muted" }, "WHEN"),
                React.createElement("input", { id: "from", type: "date", value: from, onChange: e => setFrom(e.target.value), className: "w-full bg-transparent border-0 p-0 mt-0.5 text-[15px] font-medium focus:ring-0 outline-none" })),
            React.createElement("div", { className: "flex-1 px-3 py-2.5 md:py-2 border-t md:border-t-0 border-line" },
                React.createElement("label", { htmlFor: "bg", className: "block text-[11px] font-bold tracking-[.12em] text-muted" }, "BUDGET"),
                React.createElement("select", { id: "bg", value: budget, onChange: e => setBudget(e.target.value), className: "w-full bg-transparent border-0 p-0 mt-0.5 text-[15px] font-medium focus:ring-0 outline-none appearance-none" },
                    React.createElement("option", { value: "" }, "Any budget"),
                    React.createElement("option", { value: "8000" }, "Under \u20B98,000"),
                    React.createElement("option", { value: "15000" }, "Under \u20B915,000"),
                    React.createElement("option", { value: "25000" }, "Under \u20B925,000"),
                    React.createElement("option", { value: "100000" }, "Under \u20B91,00,000"))),
            React.createElement("div", { className: "p-2 md:pl-3 md:pr-1" },
                React.createElement(Btn, { type: "submit", size: hero ? 'lg' : 'md', className: "w-full md:w-auto", icon: "search" }, hero ? 'Explore trips' : 'Search')))));
}
