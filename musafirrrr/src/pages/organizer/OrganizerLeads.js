"use strict";
/* ============================================================
   PAGE — ORGANIZER LEADS  (#/organizer/leads)
   ============================================================ */

/** All leads. */
function OrganizerLeads() {
    const { user: me } = useAuth();
    const org = me ? me.organizer : null;
    const orgId = org ? org.id : null;
    const [filter, setFilter] = useState('ALL');
    const [saving, setSaving] = useState(false);

    // All hooks stay above the early returns below.
    const { loading, error, data, reload } = useAsync(
        () => orgId
            ? Promise.all([organizerApi.enquiries(orgId), organizerApi.trips(orgId)])
            : Promise.resolve([[], []]),
        [orgId]
    );

    if (!org)
        return React.createElement(EmptyState, { icon: "user", title: "Your community profile is missing", body: "We couldn't find your organizer profile. Please contact support." });
    if (loading && !data)
        return React.createElement("p", { className: "text-slatey py-10" }, "Loading your leads...");
    if (error && !data)
        return React.createElement("div", { className: "py-10" },
            React.createElement("p", { role: "alert", className: "text-bad mb-4" }, "We couldn't load your leads."),
            React.createElement(Btn, { onClick: reload }, "Try again"));

    const all = data ? data[0] : [];
    const tripsById = Object.fromEntries((data ? data[1] : []).map(t => [t.id, t]));
    const list = filter === 'ALL' ? all : all.filter(e => e.status === filter);

    const changeStatus = async (id, st) => {
        if (saving)
            return;
        setSaving(true);
        try {
            await organizerApi.setEnquiryStatus(id, st);
            toast('Marked as ' + st.toLowerCase());
            window.dispatchEvent(new Event('leads-changed'));   // refreshes the sidebar badge
            reload();
        }
        catch (x) {
            console.error(x);
            toast(x.message || 'Could not update the enquiry.', 'bad');
        }
        finally {
            setSaving(false);
        }
    };

    return (React.createElement(React.Fragment, null,
        React.createElement(SectionHead, { title: "Leads and enquiries", sub: "Every traveller who asked about one of your trips." }),
        React.createElement("div", { className: "flex gap-2 flex-wrap mb-6" }, ['ALL', 'NEW', 'CONTACTED', 'CONFIRMED', 'CANCELLED'].map(st => (React.createElement(Chip, { key: st, active: filter === st, onClick: () => setFilter(st) },
            st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase(),
            React.createElement("span", { className: "ml-1 text-[12px] opacity-70" }, st === 'ALL' ? all.length : all.filter(e => e.status === st).length))))),
        list.length === 0
            ? React.createElement(EmptyState, { icon: "inbox", title: all.length === 0 ? "No enquiries yet" : "Nothing in this bucket", body: all.length === 0 ? "When a traveller enquires about one of your trips, it will appear here with their contact details." : "Enquiries you mark with this status will appear here." })
            : React.createElement("div", { className: "rounded-2xl border border-line overflow-hidden" },
                React.createElement("div", { className: "hidden md:grid grid-cols-[1.2fr_1.4fr_.8fr_.8fr_auto] gap-4 px-5 py-3 bg-sand text-[12px] font-bold tracking-[.08em] text-muted" },
                    React.createElement("span", null, "TRAVELLER"),
                    React.createElement("span", null, "TRIP"),
                    React.createElement("span", null, "RECEIVED"),
                    React.createElement("span", null, "STATUS"),
                    React.createElement("span", null, "CONTACT")),
                list.map(e => React.createElement(LeadRow, { key: e.id, e: e, trip: tripsById[e.tripId] || null, orgName: org.name, onStatus: changeStatus })))));
}