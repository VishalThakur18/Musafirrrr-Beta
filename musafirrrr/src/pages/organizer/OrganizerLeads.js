"use strict";
/* ============================================================
   PAGE — ORGANIZER LEADS  (#/organizer/leads)
   ============================================================ */

/** All leads. */
function OrganizerLeads() {
    const s = useStore();
    const me = authService.current();
    const org = organizerService.byId(me.organizerId);
    const [filter, setFilter] = useState('ALL');
    const all = enquiryService.forOrganizer(org.id);
    const list = filter === 'ALL' ? all : all.filter(e => e.status === filter);
    return (React.createElement(React.Fragment, null,
        React.createElement(SectionHead, { title: "Leads and enquiries", sub: "Every traveller who asked about one of your trips." }),
        React.createElement("div", { className: "flex gap-2 flex-wrap mb-6" }, ['ALL', 'NEW', 'CONTACTED', 'CONFIRMED', 'CANCELLED'].map(st => (React.createElement(Chip, { key: st, active: filter === st, onClick: () => setFilter(st) },
            st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase(),
            React.createElement("span", { className: "ml-1 text-[12px] opacity-70" }, st === 'ALL' ? all.length : all.filter(e => e.status === st).length))))),
        list.length === 0
            ? React.createElement(EmptyState, { icon: "inbox", title: "Nothing in this bucket", body: "Enquiries you mark with this status will appear here." })
            : React.createElement("div", { className: "rounded-2xl border border-line overflow-hidden" },
                React.createElement("div", { className: "hidden md:grid grid-cols-[1.2fr_1.4fr_.8fr_.8fr_auto] gap-4 px-5 py-3 bg-sand text-[12px] font-bold tracking-[.08em] text-muted" },
                    React.createElement("span", null, "TRAVELLER"),
                    React.createElement("span", null, "TRIP"),
                    React.createElement("span", null, "RECEIVED"),
                    React.createElement("span", null, "STATUS"),
                    React.createElement("span", null, "CONTACT")),
                list.map(e => React.createElement(LeadRow, { key: e.id, e: e })))));
}
