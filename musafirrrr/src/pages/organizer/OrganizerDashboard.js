"use strict";
/* ============================================================
   PAGE — ORGANIZER DASHBOARD  (#/organizer/dashboard)
   ============================================================ */

function OrganizerDashboard() {
    const { user: me } = useAuth();
    const org = me ? me.organizer : null;
    const orgId = org ? org.id : null;

    const { loading, error, data, reload } = useAsync(
        () => orgId
            ? Promise.all([organizerApi.trips(orgId), organizerApi.enquiries(orgId)])
            : Promise.resolve([[], []]),
        [orgId]
    );

    if (!org) {
        return React.createElement(EmptyState, { icon: "user", title: "Your community profile is missing", body: "We couldn't find your organizer profile. Please contact support." });
    }
    if (loading && !data) {
        return React.createElement("p", { className: "text-slatey py-10" }, "Loading your dashboard...");
    }
    if (error && !data) {
        return React.createElement("div", { className: "py-10" },
            React.createElement("p", { role: "alert", className: "text-bad mb-4" }, "We couldn't load your dashboard."),
            React.createElement(Btn, { onClick: reload }, "Try again"));
    }

    const trips = data ? data[0] : [];
    const leads = data ? data[1] : [];
    const tripsById = Object.fromEntries(trips.map(t => [t.id, t]));
    const active = trips.filter(t => t.status === 'PUBLISHED');
    const upcoming = active.filter(t => daysUntil(t.startDate) > 0);
    const spots = active.reduce((a, t) => a + (t.availableSpots || 0), 0);
    const recent = [...leads].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    const departures = trips.filter(t => ['PUBLISHED', 'SOLD_OUT'].includes(t.status) && daysUntil(t.startDate) >= 0).sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).slice(0, 3);
    const drafts = trips.filter(t => t.status === 'DRAFT');
    const newCount = leads.filter(l => l.status === 'NEW').length;

    const changeStatus = async (id, st) => {
        try {
            await organizerApi.setEnquiryStatus(id, st);
            toast('Marked as ' + st.toLowerCase());
            window.dispatchEvent(new Event('leads-changed'));
            reload();
        } catch (x) {
            toast(x.message || 'Could not update the enquiry.');
        }
    };

    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "org-overview-hero" },
            React.createElement("div", null,
                React.createElement("h1", { className: "text-[28px] sm:text-[34px] font-extrabold tracking-[-0.03em] leading-tight" },
                    "Hello, ", org.name),
                React.createElement("p", { className: "text-[15px] text-slatey mt-1" },
                    newCount, " new ", newCount === 1 ? 'enquiry' : 'enquiries', " waiting for a reply.",
                    !org.verified && ' Manage your trips and community from here.')),
            React.createElement(Btn, { icon: "plus", onClick: () => go('/organizer/create') }, "Create trip")),
        React.createElement("div", { className: "org-stat-grid" },
            React.createElement(Stat, { label: "Published trips", value: active.length, sub: `${trips.filter(t => t.status === 'DRAFT').length} drafts`, icon: "grid" }),
            React.createElement(Stat, { label: "Upcoming", value: upcoming.length, sub: upcoming.length ? `Next: ${fmtDate([...upcoming].sort((a, b) => d(a.startDate) - d(b.startDate))[0].startDate)}` : 'Nothing scheduled', icon: "cal" }),
            React.createElement(Stat, { label: "Total leads", value: leads.length, sub: `${leads.filter(l => l.status === 'CONFIRMED').length} confirmed`, icon: "inbox" }),
            React.createElement(Stat, { label: "Spots open", value: spots, sub: "Across published trips", icon: "users" })),
        React.createElement(OrganizerOverviewActions, { newCount, drafts, departures, leads, org }),
        React.createElement("section", { className: "org-panel" },
            React.createElement("div", { className: "org-panel__heading" },
                React.createElement("h2", { className: "text-xl font-extrabold tracking-tight" }, "Recent enquiries"),
                React.createElement(Link, { to: "/organizer/leads", className: "text-[14px] font-semibold hover:text-earth" }, "See all")),
            recent.length === 0
                ? React.createElement(EmptyState, { icon: "inbox", title: "No enquiries yet", body: "Publish a trip and enquiries will land here with contact details attached.", action: React.createElement(Btn, { onClick: () => go('/organizer/create') }, "Create your first trip") })
                : React.createElement("div", { className: "rounded-2xl border border-line overflow-hidden" },
                    React.createElement("div", { className: "org-lead-heading" },
                        React.createElement("span", null, "TRAVELLER"),
                        React.createElement("span", null, "TRIP"),
                        React.createElement("span", null, "RECEIVED"),
                        React.createElement("span", null, "STATUS"),
                        React.createElement("span", null, "CONTACT")),
                    recent.map(e => React.createElement(LeadRow, { key: e.id, e: e, compact: true, trip: tripsById[e.tripId] || null, orgName: org.name, onStatus: changeStatus })))),
        React.createElement("section", { className: "org-panel" },
            React.createElement("div", { className: "org-panel__heading" },
                React.createElement("h2", { className: "text-xl font-extrabold tracking-tight" }, "Your trips"),
                React.createElement(Link, { to: "/organizer/trips", className: "text-[14px] font-semibold hover:text-earth" }, "Manage all")),
            trips.length === 0
                ? React.createElement(EmptyState, { icon: "compass", title: "No trips listed yet", body: "Your first trip takes about five minutes to put up.", action: React.createElement(Btn, { onClick: () => go('/organizer/create') }, "Create trip") })
                : React.createElement("div", { className: "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" }, trips.slice(0, 3).map(t => React.createElement("div", { key: t.id, className: "org-trip-preview" }, React.createElement(TripCard, { trip: { ...t, organizer: org } }), React.createElement(Link, { to: "/organizer/edit/" + t.id, className: "org-trip-preview__edit" }, React.createElement(Icon, { name: "edit", size: 15 }), "Manage trip")))))));
}

/** One lead/enquiry row.
 *  The dashboard passes trip / orgName / onStatus. When they are missing it falls back
 *  to the old mock lookups, so OrganizerLeads keeps working until we convert it. */
function LeadRow({ e, compact, trip, orgName, onStatus }) {
    const t = trip !== undefined ? trip : tripService.byId(e.tripId);
    const oName = orgName !== undefined ? orgName : ((organizerService.byId(e.organizerId) || {}).name || '');
    const [open, setOpen] = useState(false);
    const pick = (st) => {
        if (onStatus) onStatus(e.id, st);
        else { enquiryService.setStatus(e.id, st); toast('Marked as ' + st.toLowerCase()); }
    };
    return (React.createElement("div", { className: "org-lead border-t border-line first:border-t-0" },
        React.createElement("div", { className: "org-lead-grid" },
            React.createElement("div", { className: "min-w-0" },
                React.createElement("div", { className: "font-bold text-[15px] tracking-tight" }, e.name),
                React.createElement("div", { className: "text-[12.5px] text-muted" },
                    e.phone, " \u00B7 ", e.travellerCount, " ", e.travellerCount === 1 ? 'traveller' : 'travellers')),
            React.createElement("div", { className: "min-w-0 text-[14px] text-slatey truncate" }, t ? React.createElement(Link, { to: '/trip/' + t.slug, className: "hover:underline underline-offset-4" }, t.title) : 'Trip removed'),
            React.createElement("div", { className: "text-[13px] text-muted" }, fmtLong(e.createdAt)),
            React.createElement("div", null,
                React.createElement(StatusTag, { status: e.status })),
            React.createElement("div", { className: "flex gap-2 justify-start md:justify-end" },
                React.createElement("a", { href: waLink(e.phone, `Hi ${e.name.split(' ')[0]}, this is ${oName} — about your enquiry for ${t ? t.title : 'our trip'} on Musafirrrr.`), target: "_blank", rel: "noopener noreferrer", "aria-label": "WhatsApp traveller", className: "w-9 h-9 rounded-full bg-[#1F7A4C] text-white flex items-center justify-center hover:opacity-90" },
                    React.createElement(Icon, { name: "wa", size: 17 })),
                React.createElement("button", { onClick: () => setOpen(o => !o), "aria-expanded": open, "aria-label": (open ? "Hide" : "Show") + " enquiry details for " + e.name, className: "w-9 h-9 rounded-full border border-line flex items-center justify-center hover:bg-sand" },
                    React.createElement(Icon, { name: open ? 'chevD' : 'chev', size: 16 })))),
        open && (React.createElement("div", { className: "px-4 md:px-5 pb-5 fade-in" },
            React.createElement("div", { className: "rounded-xl bg-sand border border-line p-4" },
                React.createElement("p", { className: "text-[14.5px] text-slatey leading-relaxed" }, e.message || 'No message left.'),
                React.createElement("div", { className: "mt-3 text-[13px] text-muted" }, e.email),
                React.createElement("div", { className: "mt-4 flex flex-wrap gap-2" }, ['NEW', 'CONTACTED', 'CONFIRMED', 'CANCELLED'].map(st => (React.createElement(Chip, { key: st, active: e.status === st, onClick: () => pick(st) }, st.charAt(0) + st.slice(1).toLowerCase())))))))));
}

/** Read-only summaries and shortcuts derived from the dashboard's existing data. */
function OrganizerOverviewActions({ newCount, drafts, departures, leads, org }) {
    const h = React.createElement;
    return h('div', { className: 'org-overview-grid' },
        h('section', { className: 'org-panel' },
            h('div', { className: 'org-panel__heading' }, h('h2', null, 'Your next steps'), h('span', { className: 'org-eyebrow' }, 'STAY ON TRACK')),
            h(Link, { to: '/organizer/leads', className: 'org-action-row' },
                h('span', { className: 'org-action-icon' }, h(Icon, { name: 'inbox', size: 20 })),
                h('span', null, h('strong', null, newCount ? `${newCount} enquiries need a reply` : 'You are all caught up'), h('small', null, newCount ? 'Open your inbox and connect with travellers.' : 'Review conversations and keep lead statuses up to date.')), h(Icon, { name: 'arrow', size: 17 })),
            h(Link, { to: drafts.length ? '/organizer/edit/' + drafts[0].id : '/organizer/create', className: 'org-action-row' },
                h('span', { className: 'org-action-icon' }, h(Icon, { name: 'edit', size: 20 })),
                h('span', null, h('strong', null, drafts.length ? `${drafts.length} drafts ready to work on` : 'Plan your next departure'), h('small', null, drafts.length ? 'Pick up where you left off on a draft.' : 'Bring a new adventure to your community.')), h(Icon, { name: 'arrow', size: 17 })),
            h(Link, { to: org.verified ? '/organizer/profile' : '/organizer/settings', className: 'org-action-row' },
                h('span', { className: 'org-action-icon' }, h(Icon, { name: org.verified ? 'user' : 'shield', size: 20 })),
                h('span', null, h('strong', null, org.verified ? 'Keep your community profile fresh' : 'Review community verification'), h('small', null, org.verified ? 'Update your story, photos and contact details.' : 'See requirements and your verification status.')), h(Icon, { name: 'arrow', size: 17 }))),
        h('section', { className: 'org-panel' },
            h('div', { className: 'org-panel__heading' }, h('h2', null, 'Next departures'), h(Link, { to: '/organizer/trips' }, 'All trips')),
            departures.length ? departures.map(t => h(Link, { key: t.id, to: '/organizer/edit/' + t.id, className: 'org-departure' },
                h('div', { className: 'org-departure__date' }, h(Icon, { name: 'cal', size: 17 }), h('strong', null, fmtDate(t.startDate))),
                h('div', null, h('strong', null, t.title), h('small', null, t.destination + ' \u00b7 ' + (daysUntil(t.startDate) === 0 ? 'Leaves today' : `In ${daysUntil(t.startDate)} days`)), h('small', null, `${t.availableSpots || 0} of ${t.totalSpots || 0} spots open`)),
                h(Icon, { name: 'chev', size: 16 }))) : h('div', { className: 'org-inline-empty' }, h(Icon, { name: 'cal', size: 26 }), h('p', null, 'Your next adventure starts here.'), h(Link, { to: '/organizer/create' }, 'Create an upcoming trip')),
            h('div', { className: 'org-pipeline' }, h('p', null, 'Enquiry overview'),
                h('div', null, [['NEW','New'],['CONTACTED','Contacted'],['CONFIRMED','Confirmed'],['CANCELLED','Cancelled']].map(([status,label]) => h('div', { key: status }, h('strong', null, leads.filter(e => e.status === status).length), h('span', null, label)))))));
}
