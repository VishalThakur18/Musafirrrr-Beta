"use strict";
/* ============================================================
   PAGE — ORGANIZER TRIPS  (#/organizer/trips)
   ============================================================ */

/** Organizer's trip list. */
function OrganizerTrips() {
    const s = useStore();
    const me = authService.current();
    const org = organizerService.byId(me.organizerId);
    const [tab, setTab] = useState('ALL');
    const [del, setDel] = useState(null);
    const all = tripService.byOrganizer(org.id);
    const list = tab === 'ALL' ? all : all.filter(t => t.status === tab);
    const leadCount = id => enquiryService.forOrganizer(org.id).filter(e => e.tripId === id).length;
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "flex items-end justify-between gap-4 flex-wrap mb-6" },
            React.createElement(SectionHead, { title: "My trips", sub: "Publish, edit, duplicate or retire the trips on your page." }),
            React.createElement(Btn, { icon: "plus", onClick: () => go('/organizer/create'), className: "mb-6" }, "Create trip")),
        React.createElement("div", { className: "flex gap-2 flex-wrap mb-6" }, ['ALL', 'PUBLISHED', 'DRAFT', 'SOLD_OUT', 'COMPLETED'].map(st => (React.createElement(Chip, { key: st, active: tab === st, onClick: () => setTab(st) },
            st === 'ALL' ? 'All' : st === 'SOLD_OUT' ? 'Sold out' : st.charAt(0) + st.slice(1).toLowerCase(),
            React.createElement("span", { className: "ml-1 text-[12px] opacity-70" }, st === 'ALL' ? all.length : all.filter(t => t.status === st).length))))),
        list.length === 0
            ? React.createElement(EmptyState, { icon: "compass", title: "No trips here", body: "Create a trip and it will show up in this list the moment you save it.", action: React.createElement(Btn, { onClick: () => go('/organizer/create') }, "Create trip") })
            : React.createElement("div", { className: "space-y-3" }, list.map(t => (React.createElement("div", { key: t.id, className: "rounded-2xl border border-line p-4 flex flex-col sm:flex-row gap-4" },
                React.createElement("img", { src: imgSrc(t.coverImage), alt: "", className: "w-full sm:w-32 h-32 sm:h-24 rounded-xl object-cover" }),
                React.createElement("div", { className: "flex-1 min-w-0" },
                    React.createElement("div", { className: "flex items-start gap-3 justify-between" },
                        React.createElement("div", { className: "min-w-0" },
                            React.createElement(Link, { to: '/trip/' + t.slug, className: "font-bold text-[16px] tracking-tight hover:underline underline-offset-4" }, t.title),
                            React.createElement("div", { className: "text-[13px] text-muted mt-1" },
                                t.destination,
                                " \u00B7 ",
                                dateRange(t.startDate, t.endDate),
                                " \u00B7 ",
                                dur(t),
                                " \u00B7 ",
                                INR(t.price))),
                        React.createElement(StatusTag, { status: t.status })),
                    React.createElement("div", { className: "mt-3 flex items-center gap-4 text-[13px] text-slatey" },
                        React.createElement("span", { className: "inline-flex items-center gap-1.5" },
                            React.createElement(Icon, { name: "users", size: 14 }),
                            t.availableSpots,
                            "/",
                            t.totalSpots,
                            " open"),
                        React.createElement("span", { className: "inline-flex items-center gap-1.5" },
                            React.createElement(Icon, { name: "inbox", size: 14 }),
                            leadCount(t.id),
                            " leads")),
                    React.createElement("div", { className: "mt-3.5 flex flex-wrap gap-2" },
                        React.createElement(Btn, { size: "sm", variant: "outline", icon: "edit", onClick: () => go('/organizer/edit/' + t.id) }, "Edit"),
                        t.status === 'DRAFT' && React.createElement(Btn, { size: "sm", onClick: () => { tripService.update(t.id, { status: 'PUBLISHED' }); toast('Published'); } }, "Publish"),
                        t.status === 'PUBLISHED' && React.createElement(Btn, { size: "sm", variant: "outline", onClick: () => { tripService.update(t.id, { status: 'DRAFT' }); toast('Unpublished — back to draft'); } }, "Unpublish"),
                        t.status === 'SOLD_OUT' && React.createElement(Btn, { size: "sm", variant: "outline", onClick: () => { tripService.update(t.id, { status: 'PUBLISHED', availableSpots: Math.max(1, t.availableSpots) }); toast('Reopened'); } }, "Reopen"),
                        React.createElement(Btn, { size: "sm", variant: "outline", icon: "copy", onClick: () => { const c = tripService.duplicate(t.id); toast('Duplicated as a draft'); go('/organizer/edit/' + c.id); } }, "Duplicate"),
                        React.createElement(Btn, { size: "sm", variant: "ghost", className: "text-bad hover:bg-[#F7E9E7]", icon: "trash", onClick: () => setDel(t) }, "Delete")),
                    React.createElement("div", { className: "mt-3 flex items-center gap-3" },
                        React.createElement("label", { className: "text-[13px] font-semibold text-slatey" }, "Spots left"),
                        React.createElement("input", { type: "number", min: "0", max: t.totalSpots, value: t.availableSpots, onChange: e => {
                                const v = Math.max(0, Math.min(t.totalSpots, +e.target.value || 0));
                                tripService.update(t.id, { availableSpots: v, status: v === 0 && t.status === 'PUBLISHED' ? 'SOLD_OUT' : (v > 0 && t.status === 'SOLD_OUT' ? 'PUBLISHED' : t.status) });
                            }, className: "w-20 h-9 px-2.5 rounded-lg border border-line text-[14px]" }),
                        React.createElement("span", { className: "text-[12.5px] text-muted" },
                            "of ",
                            t.totalSpots))))))),
        React.createElement(Confirm, { open: !!del, title: "Delete this trip?", body: del ? `"${del.title}" and its public page will be removed. Leads already received stay in your inbox.` : '', onClose: () => setDel(null), onConfirm: () => { tripService.remove(del.id); toast('Trip deleted'); } })));
}
