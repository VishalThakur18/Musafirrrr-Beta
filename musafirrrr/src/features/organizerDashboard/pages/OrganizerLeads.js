"use strict";
/* ============================================================
   PAGE — ORGANIZER LEADS  (#/organizer/leads)
   ============================================================ */

/** All leads. */
function OrganizerLeads({ initialStatus } = {}) {
    const { user: me } = useAuth();
    const org = me ? me.organizer : null;
    const orgId = org ? org.id : null;
    const [filter, setFilter] = useState(['NEW', 'CONTACTED', 'CONFIRMED', 'CANCELLED'].includes(initialStatus) ? initialStatus : 'ALL');
    const [search, setSearch] = useState('');
    const [saving, setSaving] = useState(false);
    const [tripFilter, setTripFilter] = useState('ALL');
    const [sort, setSort] = useState('newest');
    const [followUp, setFollowUp] = useState('ALL');
    const [drafts, setDrafts] = useState({});
    useEffect(() => { setDrafts({}); }, [orgId]);

    // All hooks stay above the early returns below.
    const { loading, error, data, reload } = useAsync(
        () => orgId
            ? Promise.all([organizerApi.enquiries(orgId), organizerApi.trips(orgId)])
            : Promise.resolve([[], []]),
        [orgId], { keepPreviousData: true }
    );
    useOrganizerLiveRefresh(orgId, reload, loading);

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
    const query = search.trim().toLowerCase();
    const now = new Date();
    const localDay = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const list = all.filter(e => {
        const due = drafts[e.id]?.due;
        const matchesFollowUp = followUp === 'ALL' || (followUp === 'NONE' ? !due : due && (followUp === 'OVERDUE' ? due < localDay : followUp === 'TODAY' ? due === localDay : due > localDay));
        return (filter === 'ALL' || e.status === filter) && (tripFilter === 'ALL' || e.tripId === tripFilter) && matchesFollowUp && (!query || [e.name, e.email, e.phone, tripsById[e.tripId]?.title].some(value => String(value || '').toLowerCase().includes(query)));
    }).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : (new Date(a.createdAtTimestamp || a.createdAt) - new Date(b.createdAtTimestamp || b.createdAt)) * (sort === 'oldest' ? 1 : -1));
    const clearFilters = () => { setSearch(''); setFilter('ALL'); setTripFilter('ALL'); setFollowUp('ALL'); setSort('newest'); };

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

    return (React.createElement('div', { className: 'od-leads' },
        React.createElement(SectionHead, { title: "Leads and enquiries", sub: "Every traveller who asked about one of your trips." }),
        React.createElement('details', { className: 'od-crm-notice od-preview-help' }, React.createElement('summary', null, 'About notes & follow-up previews'), React.createElement('p', null, 'Preview entries stay only while this page is open. They are not saved and are cleared when you leave or refresh. Existing enquiry status changes still save normally.')),
        React.createElement("div", { className: "od-lead-filters od-lead-filters-simple" },
            React.createElement(Field, { label: "Find an enquiry" }, React.createElement(Input, { type: "search", value: search, onChange: e => setSearch(e.target.value), placeholder: "Search traveller, trip, email or phone" })),
            React.createElement('details', { className: 'od-extra-filters' },
                React.createElement('summary', null, 'More filters' + ((tripFilter !== 'ALL' || sort !== 'newest' || followUp !== 'ALL') ? ' · Active' : '')),
                React.createElement('div', { className: 'od-extra-filter-fields' },
            React.createElement(Field, { label: 'Trip' }, React.createElement(Select, { value: tripFilter, onChange: e => setTripFilter(e.target.value) }, React.createElement('option', { value: 'ALL' }, 'All trips'), (data ? data[1] : []).map(t => React.createElement('option', { key: t.id, value: t.id }, t.title)))),
            React.createElement(Field, { label: 'Sort by' }, React.createElement(Select, { value: sort, onChange: e => setSort(e.target.value) }, [['newest','Newest first'],['oldest','Oldest first'],['name','Traveller name']].map(([value,label]) => React.createElement('option', { key: value, value }, label)))),
            React.createElement(Field, { label: 'Follow-up (preview)' }, React.createElement(Select, { value: followUp, onChange: e => setFollowUp(e.target.value) }, [['ALL','All preview dates'],['OVERDUE','Overdue'],['TODAY','Due today'],['UPCOMING','Upcoming'],['NONE','No date set']].map(([value,label]) => React.createElement('option', { key: value, value }, label))))))),
        React.createElement('div', { className: 'od-lead-results' }, React.createElement('p', { role: 'status', 'aria-live': 'polite' }, list.length, ' of ', all.length, ' enquiries'), React.createElement(Btn, { variant: 'ghost', size: 'sm', onClick: clearFilters }, 'Clear filters')),
        React.createElement("div", { className: "flex gap-2 flex-wrap mb-6" }, ['ALL', 'NEW', 'CONTACTED', 'CONFIRMED', 'CANCELLED'].map(st => (React.createElement(Chip, { key: st, active: filter === st, onClick: () => setFilter(st) },
            st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase(),
            React.createElement("span", { className: "ml-1 text-[12px] opacity-70" }, st === 'ALL' ? all.length : all.filter(e => e.status === st).length))))),
        list.length === 0
            ? React.createElement(EmptyState, { icon: "inbox", title: all.length === 0 ? "No enquiries yet" : "No matching enquiries", body: all.length === 0 ? "When a traveller enquires about one of your trips, it will appear here with their contact details." : "Try another search, trip, status or preview date filter." })
            : React.createElement("div", { className: "rounded-2xl border border-line overflow-hidden" },
                React.createElement("div", { className: "org-lead-heading" },
                    React.createElement("span", null, "TRAVELLER"),
                    React.createElement("span", null, "TRIP"),
                    React.createElement("span", null, "RECEIVED"),
                    React.createElement("span", null, "STATUS"),
                    React.createElement("span", null, "CONTACT")),
                list.map(e => React.createElement('div', { key: e.id, className: 'od-lead-record' },
                    React.createElement(LeadRow, { e, trip: tripsById[e.tripId] || null, orgName: org.name, onStatus: changeStatus }),
                    React.createElement(LeadCrmPreview, { enquiry: e, trip: tripsById[e.tripId], draft: drafts[e.id] || {}, onChange: patch => setDrafts(previous => ({ ...previous, [e.id]: { ...previous[e.id], ...patch } })) })))),
        React.createElement(OrganizerTripSheet, { key: orgId, trips: data ? data[1] : [], enquiries: all })));
}

/** Local-only UI exploration; never writes CRM fields to existing services. */
function LeadCrmPreview({ enquiry, trip, draft, onChange }) {
    const h = React.createElement;
    const phone = String(enquiry.phone || '').replace(/\D/g, '');
    return h('details', { className: 'od-crm-preview' },
        h('summary', null, h('span', null, 'Notes & follow-up'), h('span', { className: 'od-preview-label' }, 'Unsaved preview')),
        h('div', { className: 'od-crm-body' },
            h('div', { className: 'od-crm-context' },
                h('span', null, 'Departure: ', trip?.startDate ? fmtLong(trip.startDate) : 'Not available'),
                /^\d{10,15}$/.test(phone) && h('a', { href: 'tel:+' + (phone.length === 10 ? '91' + phone : phone), className: 'od-call-link' }, 'Call traveller')),
            h('div', { className: 'od-crm-fields' },
                h(Field, { label: 'Organizer notes (preview)', hint: 'Not saved to your account.' }, h(TextArea, { value: draft.notes || '', rows: 4, maxLength: 2000, placeholder: 'Preferences, questions, or what to discuss next…', onChange: e => onChange({ notes: e.target.value }) })),
                h('div', { className: 'od-crm-dates' },
                    h(Field, { label: 'Next follow-up (preview)' }, h(Input, { type: 'date', value: draft.due || '', onChange: e => onChange({ due: e.target.value }) })),
                    h(Field, { label: 'Last contacted (preview)', hint: 'Record contact yourself; opening a link does not confirm contact.' }, h(Input, { type: 'datetime-local', value: draft.contacted || '', onChange: e => onChange({ contacted: e.target.value }) })))),
            h('div', { className: 'od-crm-footer' }, h('p', null, 'Interested and Not Interested statuses will be available after backend integration. Existing Confirmed records remain organizer-reported.'), h(Btn, { size: 'sm', variant: 'ghost', onClick: () => onChange({ notes: '', due: '', contacted: '' }) }, 'Clear preview'))));
}
