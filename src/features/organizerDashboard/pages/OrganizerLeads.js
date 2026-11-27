
"use strict";
/* ============================================================
   PAGE — ORGANIZER LEADS  (#/organizer/leads)
   ============================================================ */

/** All leads. */
function OrganizerLeads({ initialStatus, initialLead } = {}) {
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
    const [notesById, setNotesById] = useState({});
    const [notesLoading, setNotesLoading] = useState(false);
    const [notesError, setNotesError] = useState('');
    const [savingNoteId, setSavingNoteId] = useState(null);
    const [notesRetry, setNotesRetry] = useState(0);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const noteMutation = useRef(false);

    useEffect(() => {
        setDrafts({});
        setNotesById({});
        setNotesError('');
    }, [orgId]);

    const { loading, error, data, reload } = useAsync(
        () => orgId
            ? Promise.all([organizerApi.enquiries(orgId), organizerApi.trips(orgId)])
            : Promise.resolve([[], []]),
        [orgId], { keepPreviousData: true }
    );
    useOrganizerLiveRefresh(orgId, reload, loading);

    useEffect(() => {
        let cancelled = false;
        if (!orgId) return () => { cancelled = true; };

        setNotesLoading(true);
        setNotesError('');
        organizerApi.getEnquiryNotes(orgId)
            .then(rows => {
                if (cancelled) return;
                const saved = {};
                (rows || []).forEach(row => {
                    saved[row.enquiry_id] = {
                        updatedAt: row.updated_at,
                        notes: row.notes || '',
                        due: row.follow_up_date || '',
                        contacted: row.last_contacted_at
                            ? organizerLocalInput(row.last_contacted_at)
                            : ''
                    };
                });
                setNotesById(saved);
                setDrafts(saved);
            })
            .catch(err => {
                if (cancelled) return;
                console.error('Could not load enquiry notes:', err);
                setNotesError(err.message || 'Could not load saved notes.');
            })
            .finally(() => {
                if (!cancelled) setNotesLoading(false);
            });

        return () => { cancelled = true; };
    }, [orgId, notesRetry]);

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
        const due = (notesById[e.id] || {}).due || '';
        const matchesFollowUp = followUp === 'ALL' || (followUp === 'NONE' ? !due : due && (followUp === 'OVERDUE' ? due < localDay : followUp === 'TODAY' ? due === localDay : due > localDay));
        return (!initialLead || e.id === initialLead) && (filter === 'ALL' || e.status === filter) && (tripFilter === 'ALL' || e.tripId === tripFilter) && matchesFollowUp && (!query || [e.name, e.email, e.phone, tripsById[e.tripId]?.title, notesById[e.id]?.notes].some(value => String(value || '').toLowerCase().includes(query)));
    }).sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name) : (new Date(a.createdAtTimestamp || a.createdAt) - new Date(b.createdAtTimestamp || b.createdAt)) * (sort === 'oldest' ? 1 : -1));
    const clearFilters = () => { setSearch(''); setFilter('ALL'); setTripFilter('ALL'); setFollowUp('ALL'); setSort('newest'); };

    const changeStatus = async (id, st) => {
        if (saving) return;
        setSaving(true);
        try {
            await organizerApi.setEnquiryStatus(id, st);
            toast('Marked as ' + st.toLowerCase());
            window.dispatchEvent(new Event('leads-changed'));
            reload();
        } catch (x) {
            console.error(x);
            toast(x.message || 'Could not update the enquiry.', 'bad');
        } finally {
            setSaving(false);
        }
    };

    const updateDraft = (id, patch) => {
        setDrafts(previous => ({
            ...previous,
            [id]: { ...(previous[id] || notesById[id] || {}), ...patch }
        }));
    };

    const saveNotes = async (enquiryId, complete = false) => {
        if (!orgId || noteMutation.current) return;
        noteMutation.current = true;
        const draft = drafts[enquiryId] || notesById[enquiryId] || {};
        setSavingNoteId(enquiryId);
        try {
            const latest = (await organizerApi.getEnquiryNotes(orgId)).find(row => row.enquiry_id === enquiryId);
            if ((latest?.updated_at || null) !== (notesById[enquiryId]?.updatedAt || null)) {
                throw new Error('This lead’s notes changed in another session. Copy your draft, then reload before saving.');
            }
            const saved = await organizerApi.saveEnquiryNotes(orgId, enquiryId, {
                notes: draft.notes || '',
                follow_up_date: complete ? null : draft.due || null,
                last_contacted_at: complete ? new Date().toISOString() : draft.contacted
                    ? new Date(draft.contacted).toISOString()
                    : null
            });
            const normalized = {
                updatedAt: saved.updated_at,
                notes: saved.notes || '',
                due: saved.follow_up_date || '',
                contacted: saved.last_contacted_at
                    ? organizerLocalInput(saved.last_contacted_at)
                    : ''
            };
            setNotesById(previous => ({ ...previous, [enquiryId]: normalized }));
            setDrafts(previous => ({ ...previous, [enquiryId]: normalized }));
            toast('Notes and follow-up saved.');
            window.dispatchEvent(new Event('leads-changed'));
        } catch (err) {
            console.error('Could not save enquiry notes:', err);
            toast(err.message || 'Could not save notes. Please try again.', 'bad');
        } finally {
            noteMutation.current = false;
            setSavingNoteId(null);
        }
    };

    const deleteNote = async () => {
        if (!deleteTarget || noteMutation.current) return;
        const id = deleteTarget.id;
        noteMutation.current = true;
        setSavingNoteId(id);
        try {
            await organizerApi.deleteEnquiryNotes(orgId, id, notesById[id]?.updatedAt);
            const remove = previous => {
                const next = { ...previous };
                delete next[id];
                return next;
            };
            setNotesById(remove);
            setDrafts(remove);
            window.dispatchEvent(new Event('leads-changed'));
            toast('Note and follow-up deleted.');
        } catch (err) {
            toast(err.message || 'Could not delete the note. Please try again.', 'bad');
        } finally {
            noteMutation.current = false;
            setSavingNoteId(null);
        }
    };

    return React.createElement('div', { className: 'od-leads' },
        React.createElement(Confirm, {
            open: !!deleteTarget, title: 'Delete this note?',
            body: `Are you sure you want to delete the saved note for ${deleteTarget?.name || 'this traveller'}? Its follow-up reminder and last-contacted record will also be removed. This cannot be undone. The lead itself will be kept.`,
            confirmLabel: 'Yes, delete note', cancelLabel: 'Cancel', tone: 'danger',
            onConfirm: deleteNote, onClose: () => setDeleteTarget(null)
        }),
        React.createElement(SectionHead, { title: "Leads and enquiries", sub: "Every traveller who asked about one of your trips." }),
        initialLead && React.createElement(Link, { to: '/organizer/leads' }, 'Back to all leads'),
        React.createElement('details', { className: 'od-crm-notice od-preview-help' },
            React.createElement('summary', null, 'About notes & follow-up'),
            React.createElement('p', null, 'Notes and follow-up dates are saved privately for your organizer account. Record contact yourself; opening a phone or messaging link does not confirm contact.')),
        notesLoading && React.createElement('p', { role: 'status', className: 'text-slatey mb-3' }, 'Loading saved notes…'),
        notesError && React.createElement('p', { role: 'alert', className: 'text-bad mb-3' }, 'Saved notes could not be loaded: ', notesError),
        notesError && React.createElement(Btn, { onClick: () => setNotesRetry(value => value + 1), size: 'sm' }, 'Retry loading notes'),
        React.createElement("div", { className: "od-lead-filters od-lead-filters-simple" },
            React.createElement(Field, { label: "Find an enquiry" }, React.createElement(Input, { type: "search", value: search, onChange: e => setSearch(e.target.value), placeholder: "Search traveller, trip, email or phone" })),
            React.createElement('details', { className: 'od-extra-filters' },
                React.createElement('summary', null, 'More filters' + ((tripFilter !== 'ALL' || sort !== 'newest' || followUp !== 'ALL') ? ' · Active' : '')),
                React.createElement('div', { className: 'od-extra-filter-fields' },
                    React.createElement(Field, { label: 'Trip' }, React.createElement(Select, { value: tripFilter, onChange: e => setTripFilter(e.target.value) }, React.createElement('option', { value: 'ALL' }, 'All trips'), (data ? data[1] : []).map(t => React.createElement('option', { key: t.id, value: t.id }, t.title)))),
                    React.createElement(Field, { label: 'Sort by' }, React.createElement(Select, { value: sort, onChange: e => setSort(e.target.value) }, [['newest','Newest first'],['oldest','Oldest first'],['name','Traveller name']].map(([value,label]) => React.createElement('option', { key: value, value }, label)))),
                    React.createElement(Field, { label: 'Follow-up' }, React.createElement(Select, { value: followUp, onChange: e => setFollowUp(e.target.value) }, [['ALL','All dates'],['OVERDUE','Overdue'],['TODAY','Due today'],['UPCOMING','Upcoming'],['NONE','No date set']].map(([value,label]) => React.createElement('option', { key: value, value }, label))))))),
        React.createElement('div', { className: 'od-lead-results' },
            React.createElement('p', { role: 'status', 'aria-live': 'polite' }, list.length, ' of ', all.length, ' enquiries'),
            React.createElement(Btn, { variant: 'ghost', size: 'sm', onClick: clearFilters }, 'Clear filters')),
        React.createElement("div", { className: "flex gap-2 flex-wrap mb-6" }, ['ALL', 'NEW', 'CONTACTED', 'CONFIRMED', 'CANCELLED'].map(st => (React.createElement(Chip, { key: st, active: filter === st, onClick: () => setFilter(st) },
            st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase(),
            React.createElement("span", { className: "ml-1 text-[12px] opacity-70" }, st === 'ALL' ? all.length : all.filter(e => e.status === st).length))))),
        list.length === 0
            ? React.createElement(EmptyState, { icon: "inbox", title: all.length === 0 ? "No enquiries yet" : "No matching enquiries", body: all.length === 0 ? "When a traveller enquires about one of your trips, it will appear here with their contact details." : "Try another search, trip, status or follow-up date filter." })
            : React.createElement("div", { className: "rounded-2xl border border-line overflow-hidden" },
                React.createElement("div", { className: "org-lead-heading" },
                    React.createElement("span", null, "TRAVELLER"),
                    React.createElement("span", null, "TRIP"),
                    React.createElement("span", null, "RECEIVED"),
                    React.createElement("span", null, "STATUS"),
                    React.createElement("span", null, "CONTACT")),
                list.map(e => React.createElement('div', { key: e.id, className: 'od-lead-record' },
                    React.createElement(LeadRow, { e, trip: tripsById[e.tripId] || null, orgName: org.name, onStatus: changeStatus }),
                    React.createElement('div', { className: 'od-saved-note' },
                        React.createElement('div', { className: 'od-saved-note__heading' },
                            React.createElement('strong', null, 'Organizer notes · Private')),
                        React.createElement('p', null, notesById[e.id]?.notes || 'No saved notes yet.'),
                        notesById[e.id]?.due && React.createElement('p', null, organizerFollowUpLabel(notesById[e.id].due, localDay), ' · ', fmtLong(notesById[e.id].due)),
                        notesById[e.id] && React.createElement('div', { className: 'od-saved-note__actions' },
                            notesById[e.id]?.contacted && React.createElement('small', null, 'Last contacted: ', new Date(notesById[e.id].contacted).toLocaleString()),
                            React.createElement(Btn, { size: 'sm', variant: 'danger', className: 'od-saved-note__delete', disabled: !!savingNoteId || notesLoading || !!notesError, onClick: () => setDeleteTarget(e) }, savingNoteId === e.id ? 'Please wait…' : 'Delete note'))),
                    React.createElement(LeadCrmPreview, {
                        enquiry: e,
                        trip: tripsById[e.tripId],
                        draft: drafts[e.id] || notesById[e.id] || {},
                        saving: !!savingNoteId || notesLoading || !!notesError,
                        initiallyOpen: !!initialLead,
                        onComplete: notesById[e.id]?.due ? () => saveNotes(e.id, true) : null,
                        onChange: patch => updateDraft(e.id, patch),
                        onSave: () => saveNotes(e.id),
                        onClear: () => updateDraft(e.id, { notes: '', due: '', contacted: '' })
                    })))),
        React.createElement(OrganizerTripSheet, { key: orgId, trips: data ? data[1] : [], enquiries: all }));
}

/** Organizer-private notes and follow-up editor. */
function LeadCrmPreview({ enquiry, trip, draft, saving, initiallyOpen, onComplete, onChange, onSave, onClear }) {
    const h = React.createElement;
    const phone = String(enquiry.phone || '').replace(/\D/g, '');
    return h('details', { className: 'od-crm-preview', open: initiallyOpen || undefined },
        h('summary', null,
            h('span', null, 'Notes & follow-up'),
            h('span', { className: 'od-preview-label' }, 'Organizer private')),
        h('fieldset', { className: 'od-crm-body', disabled: saving },
            h('div', { className: 'od-crm-context' },
                h('span', null, 'Departure: ', trip?.startDate ? fmtLong(trip.startDate) : 'Not available'),
                /^\d{10,15}$/.test(phone) && h('a', { href: 'tel:+' + (phone.length === 10 ? '91' + phone : phone), className: 'od-call-link' }, 'Call traveller')),
            h('div', { className: 'od-crm-fields' },
                h(Field, { label: 'Organizer notes', hint: 'Private to your organizer account.' },
                    h(TextArea, { value: draft.notes || '', rows: 4, maxLength: 2000, placeholder: 'Preferences, questions, or what to discuss next…', onChange: e => onChange({ notes: e.target.value }) })),
                h('div', { className: 'od-crm-dates' },
                    h(Field, { label: 'Next follow-up' },
                        h(Input, { type: 'date', value: draft.due || '', onChange: e => onChange({ due: e.target.value }) })),
                    h(Field, { label: 'Last contacted', hint: 'Record contact yourself; opening a link does not confirm contact.' },
                        h(Input, { type: 'datetime-local', value: draft.contacted || '', onChange: e => onChange({ contacted: e.target.value }) }))),
            h('div', { className: 'od-crm-footer' },
                h('p', null, 'Complete follow-up records contact now and clears the reminder. Save a new date to reschedule.'),
                onComplete && h(Btn, { size: 'sm', onClick: onComplete, disabled: saving }, 'Complete follow-up'),
                h(Btn, { size: 'sm', onClick: onSave, disabled: saving }, saving ? 'Saving…' : 'Save notes'),
                h(Btn, { size: 'sm', variant: 'ghost', onClick: onClear, disabled: saving }, 'Clear fields')))));
}
