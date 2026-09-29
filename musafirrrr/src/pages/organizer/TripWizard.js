"use strict";
/* ============================================================
   PAGE — CREATE / EDIT TRIP WIZARD
   (#/organizer/create and #/organizer/edit/:id)
   ============================================================ */

/** Photo picker used in the trip wizard. */
/* ---------- image uploader ---------- */
function ImageUploader({ images, onChange }) {
    const [drag, setDrag] = useState(false);
    const fileRef = useRef(null);
    const add = list => onChange([...images, ...list].slice(0, 8));
    const readFiles = files => {
        const arr = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 8 - images.length);
        if (!arr.length)
            return;
        let done = [];
        arr.forEach(f => {
            const r = new FileReader();
            r.onload = () => {
                done = [...done, { k: 'file', url: r.result, name: f.name }];
                if (done.length === arr.length) {
                    add(done);
                    toast(arr.length + ' photo' + (arr.length > 1 ? 's' : '') + ' added');
                }
            };
            r.readAsDataURL(f);
        });
    };
    const move = (i, dir) => {
        const n = [...images];
        const j = i + dir;
        if (j < 0 || j >= n.length)
            return;
        [n[i], n[j]] = [n[j], n[i]];
        onChange(n);
    };
    const setCover = i => { const n = [...images]; const [x] = n.splice(i, 1); onChange([x, ...n]); toast('Cover photo set'); };
    return (React.createElement("div", null,
        React.createElement("div", { onDragOver: e => { e.preventDefault(); setDrag(true); }, onDragLeave: () => setDrag(false), onDrop: e => { e.preventDefault(); setDrag(false); readFiles(e.dataTransfer.files); }, className: cls('rounded-2xl border-2 border-dashed p-8 text-center transition-colors', drag ? 'border-ink bg-sand' : 'border-line') },
            React.createElement("span", { className: "inline-flex w-12 h-12 rounded-full bg-shell text-earth items-center justify-center" },
                React.createElement(Icon, { name: "img", size: 22 })),
            React.createElement("p", { className: "mt-3 font-semibold text-[15px]" }, "Drag photos here"),
            React.createElement("p", { className: "text-[13.5px] text-muted mt-1" }, "JPG or PNG, up to 8 photos. The first one becomes the cover."),
            React.createElement(Btn, { type: "button", variant: "outline", size: "sm", className: "mt-4", onClick: () => fileRef.current.click() }, "Choose files"),
            React.createElement("input", { ref: fileRef, type: "file", accept: "image/*", multiple: true, className: "hidden", onChange: e => { readFiles(e.target.files); e.target.value = ''; } })),
        React.createElement("div", { className: "mt-5" },
            React.createElement("p", { className: "text-[13px] font-bold tracking-[.1em] text-muted mb-3" }, "OR PICK A STOCK SCENE"),
            React.createElement("div", { className: "flex gap-2.5 u-scroll pb-1" }, SCENE_KINDS.map((k, i) => (React.createElement("button", { key: k, type: "button", onClick: () => { add([{ k: 'scene', kind: k, seed: 100 + i * 7 + Math.floor(Math.random() * 50) }]); toast('Photo added'); }, className: "w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-line hover:border-ink transition-colors", title: k },
                React.createElement("img", { src: sceneURL(k, 100 + i * 7), alt: k, className: "w-full h-full object-cover" })))))),
        images.length > 0 && (React.createElement("div", { className: "mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3" }, images.map((im, i) => (React.createElement("div", { key: i, className: "relative rounded-xl overflow-hidden border border-line group" },
            React.createElement("img", { src: imgSrc(im), alt: "", className: "w-full h-28 object-cover" }),
            i === 0 && React.createElement("span", { className: "absolute top-2 left-2" },
                React.createElement(Tag_, { tone: "ink" }, "Cover")),
            React.createElement("div", { className: "absolute inset-x-0 bottom-0 p-1.5 flex gap-1 bg-gradient-to-t from-ink/80 to-transparent" },
                React.createElement("button", { type: "button", onClick: () => move(i, -1), disabled: i === 0, "aria-label": "Move left", className: "w-7 h-7 rounded-full bg-white/90 flex items-center justify-center disabled:opacity-35" },
                    React.createElement(Icon, { name: "chevL", size: 13 })),
                React.createElement("button", { type: "button", onClick: () => move(i, 1), disabled: i === images.length - 1, "aria-label": "Move right", className: "w-7 h-7 rounded-full bg-white/90 flex items-center justify-center disabled:opacity-35" },
                    React.createElement(Icon, { name: "chev", size: 13 })),
                i !== 0 && React.createElement("button", { type: "button", onClick: () => setCover(i), className: "h-7 px-2.5 rounded-full bg-white/90 text-[11.5px] font-semibold" }, "Cover"),
                React.createElement("button", { type: "button", onClick: () => onChange(images.filter((_, k) => k !== i)), "aria-label": "Remove photo", className: "ml-auto w-7 h-7 rounded-full bg-white/90 text-bad flex items-center justify-center" },
                    React.createElement(Icon, { name: "trash", size: 13 }))))))))));
}

/** Editable list of strings. */
function ListEditor({ items, onChange, placeholder }) {
    return (React.createElement("div", { className: "space-y-2.5" },
        items.map((x, i) => (React.createElement("div", { key: i, className: "flex gap-2" },
            React.createElement(Input, { value: x, onChange: e => { const n = [...items]; n[i] = e.target.value; onChange(n); }, placeholder: placeholder }),
            React.createElement("button", { type: "button", onClick: () => onChange(items.filter((_, k) => k !== i)), "aria-label": "Remove", className: "w-11 h-11 rounded-xl border border-line flex items-center justify-center text-muted hover:text-bad hover:border-bad shrink-0" },
                React.createElement(Icon, { name: "x", size: 16 }))))),
        React.createElement(Btn, { type: "button", variant: "outline", size: "sm", icon: "plus", onClick: () => onChange([...items, '']) }, "Add line")));
}

/** Create / edit trip wizard. */
function TripWizard({ tripId }) {
    const s = useStore();
    const me = authService.current();
    const org = organizerService.byId(me.organizerId);
    const existing = tripId ? tripService.byId(tripId) : null;
    const [step, setStep] = useState(0);
    const [err, setErr] = useState({});
    const [busy, setBusy] = useState(false);
    const [f, setF] = useState(() => existing ? { ...existing,
        whatsapp: org.whatsapp, instagram: org.instagram
    } : {
        title: '', destination: '', region: '', startingFrom: '', category: 'Backpacking', groupType: 'Mixed Group', description: '',
        startDate: '', endDate: '', days: 0, nights: 0, price: '', currency: 'INR', advance: 2000, totalSpots: 15, availableSpots: 15,
        images: [], itinerary: [{ day: 1, title: '', detail: '' }], included: [...INC_DEF], excluded: [...EXC_DEF],
        meetingPoint: '', whatsapp: org.whatsapp, instagram: org.instagram, rating: 4.7, reviews: 0, status: 'DRAFT'
    });
    const set = p => setF(x => ({ ...x, ...p }));
    useEffect(() => {
        if (f.startDate && f.endDate && f.endDate >= f.startDate) {
            const days = Math.round((d(f.endDate) - d(f.startDate)) / 86400000) + 1;
            if (days !== f.days)
                set({ days, nights: Math.max(0, days - 1) });
        }
    }, [f.startDate, f.endDate]);
    if (existing && existing.organizerId !== org.id)
        return React.createElement(EmptyState, { icon: "shield", title: "Not your trip", body: "You can only edit trips listed by your own community.", action: React.createElement(Btn, { onClick: () => go('/organizer/trips') }, "Back to my trips") });
    const validateStep = i => {
        const e = {};
        if (i === 0) {
            if (!f.title.trim())
                e.title = 'Give the trip a name travellers will recognise.';
            if (!f.destination.trim())
                e.destination = 'Where does this trip go?';
            if (!f.startingFrom.trim())
                e.startingFrom = 'Where does the group meet?';
            if (f.description.trim().length < 20)
                e.description = 'Two or three sentences at least.';
        }
        if (i === 1) {
            if (!f.startDate)
                e.startDate = 'Pick a start date.';
            if (!f.endDate)
                e.endDate = 'Pick an end date.';
            if (f.startDate && f.endDate && f.endDate < f.startDate)
                e.endDate = 'The end date is before the start date.';
        }
        if (i === 2) {
            if (!(+f.price > 0))
                e.price = 'Enter the price per person.';
            if (!(+f.totalSpots > 0))
                e.totalSpots = 'How many people can join?';
        }
        if (i === 3) {
            if (!f.images.length)
                e.images = 'Add at least one photo.';
        }
        if (i === 4) {
            if (!f.itinerary.some(x => x.title.trim()))
                e.itinerary = 'Describe at least one day.';
        }
        if (i === 7) {
            if (!String(f.whatsapp || '').trim())
                e.whatsapp = 'Travellers need a WhatsApp number to reach you.';
        }
        setErr(e);
        return Object.keys(e).length === 0;
    };
    const next = () => { if (validateStep(step))
        setStep(s_ => Math.min(WIZARD.length - 1, s_ + 1)); };
    const prev = () => setStep(s_ => Math.max(0, s_ - 1));
    const build = status => ({
        title: f.title.trim(), destination: f.destination.trim(), region: f.region.trim() || f.destination.trim(),
        startingFrom: f.startingFrom.trim(), category: f.category, groupType: f.groupType, description: f.description.trim(),
        startDate: f.startDate, endDate: f.endDate, days: f.days, nights: f.nights, price: +f.price, currency: f.currency, advance: +f.advance || 0,
        totalSpots: +f.totalSpots, availableSpots: Math.min(+f.availableSpots, +f.totalSpots),
        images: f.images, coverImage: f.images[0], itinerary: f.itinerary.filter(x => x.title.trim()).map((x, i) => ({ ...x, day: i + 1 })),
        included: f.included.filter(Boolean), excluded: f.excluded.filter(Boolean), meetingPoint: f.meetingPoint.trim() || 'Shared with the group before departure',
        status, rating: f.rating, reviews: f.reviews
    });
    const save = async (status) => {
        for (let i = 0; i < 8; i++) {
            if (!validateStep(i)) {
                setStep(i);
                toast('Something is missing on this step', 'bad');
                return;
            }
        }
        setBusy(true);
        await wait(600);
        organizerService.update(org.id, { whatsapp: f.whatsapp, instagram: f.instagram });
        if (existing) {
            tripService.update(existing.id, build(status));
            toast(status === 'PUBLISHED' ? 'Trip published' : 'Draft saved');
        }
        else {
            tripService.create(org.id, build(status));
            toast(status === 'PUBLISHED' ? 'Trip published' : 'Draft saved');
        }
        setBusy(false);
        go('/organizer/trips');
    };
    const preview = { ...f, id: 'preview', slug: 'preview', price: +f.price || 0, coverImage: f.images[0], organizerId: org.id,
        availableSpots: +f.availableSpots || 0, totalSpots: +f.totalSpots || 0, days: f.days, nights: f.nights };
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "flex items-start justify-between gap-4 flex-wrap mb-6" },
            React.createElement("div", null,
                React.createElement("h1", { className: "text-[28px] sm:text-[34px] font-extrabold tracking-[-0.03em] leading-tight" }, existing ? 'Edit trip' : 'Create a trip'),
                React.createElement("p", { className: "text-[15px] text-slatey mt-1" },
                    "Step ",
                    step + 1,
                    " of ",
                    WIZARD.length,
                    " \u00B7 ",
                    WIZARD[step])),
            React.createElement(Btn, { variant: "ghost", onClick: () => go('/organizer/trips') }, "Cancel")),
        React.createElement("div", { className: "u-scroll -mx-5 px-5 md:mx-0 md:px-0 mb-7" },
            React.createElement("div", { className: "flex gap-1.5 min-w-max" }, WIZARD.map((w, i) => (React.createElement("button", { key: w, onClick: () => { if (i <= step || validateStep(step))
                    setStep(i); }, className: cls('h-9 px-3.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors', i === step ? 'bg-ink text-white' : i < step ? 'bg-shell text-earth' : 'border border-line text-muted') },
                i < step && React.createElement(Icon, { name: "check", size: 13, className: "inline mr-1 -mt-0.5" }),
                w)))),
            React.createElement("div", { className: "h-1 rounded-full bg-shell mt-3 overflow-hidden" },
                React.createElement("div", { className: "h-full bg-ink rounded-full transition-all duration-200", style: { width: ((step + 1) / WIZARD.length * 100) + '%' } }))),
        React.createElement("div", { className: "rounded-2xl border border-line p-5 sm:p-7 max-w-3xl" },
            step === 0 && React.createElement("div", { className: "space-y-5" },
                React.createElement(Field, { label: "Trip title", error: err.title, hint: "Travellers see this first. Keep it under 45 characters." },
                    React.createElement(Input, { value: f.title, onChange: e => set({ title: e.target.value }), placeholder: "Manali Backpacking Escape" })),
                React.createElement("div", { className: "grid sm:grid-cols-2 gap-5" },
                    React.createElement(Field, { label: "Destination", error: err.destination },
                        React.createElement(Input, { value: f.destination, onChange: e => set({ destination: e.target.value }), placeholder: "Manali" })),
                    React.createElement(Field, { label: "State or country" },
                        React.createElement(Input, { value: f.region, onChange: e => set({ region: e.target.value }), placeholder: "Himachal Pradesh" })),
                    React.createElement(Field, { label: "Group meets at", error: err.startingFrom },
                        React.createElement(Input, { value: f.startingFrom, onChange: e => set({ startingFrom: e.target.value }), placeholder: "Delhi" })),
                    React.createElement(Field, { label: "Category" },
                        React.createElement(Select, { value: f.category, onChange: e => set({ category: e.target.value }) }, CATEGORIES.map(c => React.createElement("option", { key: c }, c)))),
                    React.createElement(Field, { label: "Group type", className: "sm:col-span-2" },
                        React.createElement(Select, { value: f.groupType, onChange: e => set({ groupType: e.target.value }) }, GROUPS.map(g => React.createElement("option", { key: g }, g))))),
                React.createElement(Field, { label: "Description", error: err.description, hint: "What makes this trip yours? Two or three sentences." },
                    React.createElement(TextArea, { rows: 4, value: f.description, onChange: e => set({ description: e.target.value }), placeholder: "Four days of caf\u00E9s in Old Manali, a day in Solang\u2026" }))),
            step === 1 && React.createElement("div", { className: "space-y-5" },
                React.createElement("div", { className: "grid sm:grid-cols-2 gap-5" },
                    React.createElement(Field, { label: "Start date", error: err.startDate },
                        React.createElement(Input, { type: "date", value: f.startDate, onChange: e => set({ startDate: e.target.value }) })),
                    React.createElement(Field, { label: "End date", error: err.endDate },
                        React.createElement(Input, { type: "date", value: f.endDate, onChange: e => set({ endDate: e.target.value }) }))),
                React.createElement("div", { className: "rounded-xl bg-sand border border-line p-4 flex items-center gap-3" },
                    React.createElement(Icon, { name: "clock", size: 18, className: "text-earth" }),
                    React.createElement("span", { className: "text-[15px] font-semibold" }, f.days ? `${f.days}D / ${f.nights}N` : 'Duration fills in once both dates are set')),
                React.createElement(Field, { label: "Meeting point", hint: "Exact spot and time, so nobody gets lost." },
                    React.createElement(Input, { value: f.meetingPoint, onChange: e => set({ meetingPoint: e.target.value }), placeholder: "Majnu Ka Tila, Delhi \u2014 6:00 PM" }))),
            step === 2 && React.createElement("div", { className: "space-y-5" },
                React.createElement("div", { className: "grid sm:grid-cols-2 gap-5" },
                    React.createElement(Field, { label: "Price per person", error: err.price },
                        React.createElement(Input, { type: "number", min: "0", step: "100", value: f.price, onChange: e => set({ price: e.target.value }), placeholder: "8500" })),
                    React.createElement(Field, { label: "Currency" },
                        React.createElement(Select, { value: f.currency, onChange: e => set({ currency: e.target.value }) },
                            React.createElement("option", null, "INR"),
                            React.createElement("option", null, "USD"),
                            React.createElement("option", null, "EUR"))),
                    React.createElement(Field, { label: "Advance to hold a spot" },
                        React.createElement(Input, { type: "number", min: "0", step: "500", value: f.advance, onChange: e => set({ advance: e.target.value }) })),
                    React.createElement(Field, { label: "Total spots", error: err.totalSpots },
                        React.createElement(Input, { type: "number", min: "1", value: f.totalSpots, onChange: e => set({ totalSpots: e.target.value, availableSpots: e.target.value }) })),
                    React.createElement(Field, { label: "Spots still open", className: "sm:col-span-2", hint: "You can change this any time from My trips." },
                        React.createElement(Input, { type: "number", min: "0", max: f.totalSpots, value: f.availableSpots, onChange: e => set({ availableSpots: e.target.value }) }))),
                +f.price > 0 && React.createElement("div", { className: "rounded-xl bg-sand border border-line p-4 text-[14.5px]" },
                    "Full group at ",
                    INR(f.price),
                    " \u00D7 ",
                    f.totalSpots,
                    " = ",
                    React.createElement("strong", null, INR(+f.price * +f.totalSpots)))),
            step === 3 && React.createElement("div", null,
                err.images && React.createElement("p", { className: "text-[13.5px] text-bad mb-3 flex items-center gap-1.5" },
                    React.createElement(Icon, { name: "info", size: 15 }),
                    err.images),
                React.createElement(ImageUploader, { images: f.images, onChange: v => set({ images: v }) })),
            step === 4 && React.createElement("div", { className: "space-y-4" },
                err.itinerary && React.createElement("p", { className: "text-[13.5px] text-bad flex items-center gap-1.5" },
                    React.createElement(Icon, { name: "info", size: 15 }),
                    err.itinerary),
                f.itinerary.map((day, i) => (React.createElement("div", { key: i, className: "rounded-xl border border-line p-4" },
                    React.createElement("div", { className: "flex items-center justify-between mb-3" },
                        React.createElement("span", { className: "font-bold text-[14.5px]" },
                            "Day ",
                            i + 1),
                        f.itinerary.length > 1 && React.createElement("button", { type: "button", onClick: () => set({ itinerary: f.itinerary.filter((_, k) => k !== i) }), className: "text-[13px] text-muted hover:text-bad" }, "Remove")),
                    React.createElement(Input, { value: day.title, placeholder: "Old Manali and Jogini Falls", onChange: e => { const n = [...f.itinerary]; n[i] = { ...n[i], title: e.target.value }; set({ itinerary: n }); } }),
                    React.createElement(TextArea, { rows: 2, className: "mt-2.5", value: day.detail, placeholder: "What happens on this day", onChange: e => { const n = [...f.itinerary]; n[i] = { ...n[i], detail: e.target.value }; set({ itinerary: n }); } })))),
                React.createElement(Btn, { type: "button", variant: "outline", icon: "plus", onClick: () => set({ itinerary: [...f.itinerary, { day: f.itinerary.length + 1, title: '', detail: '' }] }) }, "Add a day")),
            step === 5 && React.createElement("div", null,
                React.createElement("p", { className: "text-[14.5px] text-slatey mb-4" }, "Edit the defaults so travellers know exactly what their money covers."),
                React.createElement(ListEditor, { items: f.included, onChange: v => set({ included: v }), placeholder: "Accommodation on twin sharing" })),
            step === 6 && React.createElement("div", null,
                React.createElement("p", { className: "text-[14.5px] text-slatey mb-4" }, "Being clear here is what stops arguments later."),
                React.createElement(ListEditor, { items: f.excluded, onChange: v => set({ excluded: v }), placeholder: "Flights to the starting point" })),
            step === 7 && React.createElement("div", { className: "space-y-5" },
                React.createElement(Field, { label: "WhatsApp number", error: err.whatsapp, hint: "With country code, e.g. 919876543210." },
                    React.createElement(Input, { value: f.whatsapp, onChange: e => set({ whatsapp: e.target.value }), inputMode: "tel" })),
                React.createElement(Field, { label: "Instagram username", hint: "Leave blank and the Instagram button is hidden." },
                    React.createElement(Input, { value: f.instagram, onChange: e => set({ instagram: e.target.value }), placeholder: "wanderlust.co" })),
                React.createElement("div", { className: "rounded-xl bg-sand border border-line p-4" },
                    React.createElement("p", { className: "text-[13px] font-bold tracking-[.1em] text-muted" }, "MESSAGE TRAVELLERS WILL SEND YOU"),
                    React.createElement("p", { className: "mt-2 text-[14.5px] text-slatey leading-relaxed" }, tripWaMessage({ title: f.title || 'your trip', destination: f.destination || '…', startDate: f.startDate || today(), endDate: f.endDate || today() }, org)))),
            step === 8 && React.createElement("div", null,
                React.createElement("p", { className: "text-[14.5px] text-slatey mb-5" }, "This is how your trip card appears in search, and the details travellers will read."),
                React.createElement("div", { className: "max-w-[320px]" },
                    React.createElement(TripCard, { trip: preview })),
                React.createElement("div", { className: "mt-7 rounded-2xl border border-line p-5 space-y-3.5 text-[14.5px]" }, [['Title', f.title], ['Destination', `${f.destination}${f.region ? ', ' + f.region : ''}`], ['Dates', f.startDate && f.endDate ? `${dateRange(f.startDate, f.endDate)} · ${f.days}D/${f.nights}N` : '—'],
                    ['Price', `${INR(f.price)} per person · ${INR(f.advance)} advance`], ['Group', `${f.groupType} · ${f.totalSpots} max · ${f.availableSpots} open`],
                    ['Meeting point', f.meetingPoint || '—'], ['Itinerary', `${f.itinerary.filter(x => x.title).length} days described`],
                    ['Included', `${f.included.filter(Boolean).length} lines`], ['Not included', `${f.excluded.filter(Boolean).length} lines`],
                    ['Contact', `WhatsApp ${f.whatsapp || '—'}${f.instagram ? ' · @' + f.instagram : ''}`]].map(([l, v]) => (React.createElement("div", { key: l, className: "flex gap-4 justify-between border-b border-line last:border-0 pb-3 last:pb-0" },
                    React.createElement("span", { className: "text-muted shrink-0" }, l),
                    React.createElement("span", { className: "font-semibold text-right" }, v || '—'))))))),
        React.createElement("div", { className: "max-w-3xl mt-6 flex flex-col sm:flex-row gap-3 sm:items-center" },
            step > 0 && React.createElement(Btn, { variant: "outline", onClick: prev, icon: "chevL" }, "Back"),
            step < WIZARD.length - 1 && React.createElement(Btn, { onClick: next, className: "sm:ml-auto" }, "Continue"),
            step === WIZARD.length - 1 && React.createElement(React.Fragment, null,
                React.createElement(Btn, { variant: "outline", loading: busy, onClick: () => save('DRAFT') }, "Save draft"),
                React.createElement(Btn, { className: "sm:ml-auto", size: "lg", loading: busy, onClick: () => save('PUBLISHED') }, "Publish trip")))));
}
