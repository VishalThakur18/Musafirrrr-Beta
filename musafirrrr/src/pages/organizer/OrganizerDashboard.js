"use strict";
/* ============================================================
   PAGE — ORGANIZER DASHBOARD  (#/organizer/dashboard)
   ============================================================ */

/** Organizer dashboard. */
function OrganizerDashboard() {
    const s = useStore();
    const me = authService.useAuth();
    const org = organizerService.byId(me.organizerId);
    const trips = tripService.byOrganizer(org.id);
    const active = trips.filter(t => t.status === 'PUBLISHED');
    const upcoming = active.filter(t => daysUntil(t.startDate) > 0);
    const leads = enquiryService.forOrganizer(org.id);
    const spots = active.reduce((a, t) => a + t.availableSpots, 0);
    const recent = leads.slice(0, 5);
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "flex items-end justify-between gap-4 flex-wrap mb-8" },
            React.createElement("div", null,
                React.createElement("h1", { className: "text-[28px] sm:text-[34px] font-extrabold tracking-[-0.03em] leading-tight" },
                    "Hello, ",
                    org.name),
                React.createElement("p", { className: "text-[15px] text-slatey mt-1" },
                    leads.filter(l => l.status === 'NEW').length,
                    " new ",
                    leads.filter(l => l.status === 'NEW').length === 1 ? 'enquiry' : 'enquiries',
                    " waiting for a reply.",
                    !org.verified && ' Run three trips to be reviewed for the verified mark.')),
            React.createElement(Btn, { icon: "plus", onClick: () => go('/organizer/create') }, "Create trip")),
        React.createElement("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4" },
            React.createElement(Stat, { label: "Published trips", value: active.length, sub: `${trips.filter(t => t.status === 'DRAFT').length} drafts`, icon: "grid" }),
            React.createElement(Stat, { label: "Upcoming", value: upcoming.length, sub: upcoming.length ? `Next: ${fmtDate(upcoming.sort((a, b) => d(a.startDate) - d(b.startDate))[0].startDate)}` : 'Nothing scheduled', icon: "cal" }),
            React.createElement(Stat, { label: "Total leads", value: leads.length, sub: `${leads.filter(l => l.status === 'CONFIRMED').length} confirmed`, icon: "inbox" }),
            React.createElement(Stat, { label: "Spots open", value: spots, sub: "Across published trips", icon: "users" })),
        React.createElement("section", { className: "mt-10" },
            React.createElement("div", { className: "flex items-end justify-between mb-4" },
                React.createElement("h2", { className: "text-xl font-extrabold tracking-tight" }, "Recent enquiries"),
                React.createElement(Link, { to: "/organizer/leads", className: "text-[14px] font-semibold hover:text-earth" }, "See all")),
            recent.length === 0
                ? React.createElement(EmptyState, { icon: "inbox", title: "No enquiries yet", body: "Publish a trip and enquiries will land here with contact details attached.", action: React.createElement(Btn, { onClick: () => go('/organizer/create') }, "Create your first trip") })
                : React.createElement("div", { className: "rounded-2xl border border-line overflow-hidden" },
                    React.createElement("div", { className: "hidden md:grid grid-cols-[1.2fr_1.4fr_.8fr_.8fr_auto] gap-4 px-5 py-3 bg-sand text-[12px] font-bold tracking-[.08em] text-muted" },
                        React.createElement("span", null, "TRAVELLER"),
                        React.createElement("span", null, "TRIP"),
                        React.createElement("span", null, "RECEIVED"),
                        React.createElement("span", null, "STATUS"),
                        React.createElement("span", null, "CONTACT")),
                    recent.map(e => React.createElement(LeadRow, { key: e.id, e: e, compact: true })))),
        React.createElement("section", { className: "mt-10" },
            React.createElement("div", { className: "flex items-end justify-between mb-4" },
                React.createElement("h2", { className: "text-xl font-extrabold tracking-tight" }, "Your trips"),
                React.createElement(Link, { to: "/organizer/trips", className: "text-[14px] font-semibold hover:text-earth" }, "Manage all")),
            trips.length === 0
                ? React.createElement(EmptyState, { icon: "compass", title: "No trips listed yet", body: "Your first trip takes about five minutes to put up.", action: React.createElement(Btn, { onClick: () => go('/organizer/create') }, "Create trip") })
                : React.createElement("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" }, trips.slice(0, 3).map(t => React.createElement(TripCard, { key: t.id, trip: t }))))));
}

/** One lead/enquiry row. */
function LeadRow({ e, compact }) {
    const t = tripService.byId(e.tripId);
    const org = organizerService.byId(e.organizerId);
    const [open, setOpen] = useState(false);
    return (React.createElement("div", { className: "border-t border-line first:border-t-0" },
        React.createElement("div", { className: "grid md:grid-cols-[1.2fr_1.4fr_.8fr_.8fr_auto] gap-2 md:gap-4 px-4 md:px-5 py-4 items-center" },
            React.createElement("div", { className: "min-w-0" },
                React.createElement("div", { className: "font-bold text-[15px] tracking-tight" }, e.name),
                React.createElement("div", { className: "text-[12.5px] text-muted" },
                    e.phone,
                    " \u00B7 ",
                    e.travellerCount,
                    " ",
                    e.travellerCount === 1 ? 'traveller' : 'travellers')),
            React.createElement("div", { className: "min-w-0 text-[14px] text-slatey truncate" }, t ? React.createElement(Link, { to: '/trip/' + t.slug, className: "hover:underline underline-offset-4" }, t.title) : 'Trip removed'),
            React.createElement("div", { className: "text-[13px] text-muted" }, fmtLong(e.createdAt)),
            React.createElement("div", null,
                React.createElement(StatusTag, { status: e.status })),
            React.createElement("div", { className: "flex gap-2 justify-start md:justify-end" },
                React.createElement("a", { href: waLink(e.phone, `Hi ${e.name.split(' ')[0]}, this is ${org ? org.name : ''} — about your enquiry for ${t ? t.title : 'our trip'} on Musafirrrr.`), target: "_blank", rel: "noopener noreferrer", "aria-label": "WhatsApp traveller", className: "w-9 h-9 rounded-full bg-[#1F7A4C] text-white flex items-center justify-center hover:opacity-90" },
                    React.createElement(Icon, { name: "wa", size: 17 })),
                React.createElement("button", { onClick: () => setOpen(o => !o), "aria-expanded": open, className: "w-9 h-9 rounded-full border border-line flex items-center justify-center hover:bg-sand" },
                    React.createElement(Icon, { name: open ? 'chevD' : 'chev', size: 16 })))),
        open && (React.createElement("div", { className: "px-4 md:px-5 pb-5 fade-in" },
            React.createElement("div", { className: "rounded-xl bg-sand border border-line p-4" },
                React.createElement("p", { className: "text-[14.5px] text-slatey leading-relaxed" }, e.message || 'No message left.'),
                React.createElement("div", { className: "mt-3 text-[13px] text-muted" }, e.email),
                React.createElement("div", { className: "mt-4 flex flex-wrap gap-2" }, ['NEW', 'CONTACTED', 'CONFIRMED', 'CANCELLED'].map(st => (React.createElement(Chip, { key: st, active: e.status === st, onClick: () => { enquiryService.setStatus(e.id, st); toast('Marked as ' + st.toLowerCase()); } }, st.charAt(0) + st.slice(1).toLowerCase())))))))));
}
