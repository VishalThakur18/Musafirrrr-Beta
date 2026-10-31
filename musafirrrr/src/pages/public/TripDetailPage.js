"use strict";
/* ============================================================
   PAGE — TRIP DETAILS  (#/trip/:slug)
   ============================================================ */

/** Height of the gallery frame: 260px on phones, growing to 440px on desktop. */
const GALLERY_H = 'clamp(260px, 40vw, 440px)';

/** A photo that always stays inside its frame. Photos close to the frame's shape fill it;
 *  tall, square or very wide ones are shown whole over a blurred copy of themselves. */
function FitPhoto({ im, alt }) {
    const src = imgSrc(im);
    const ref = useRef(null);
    const [fit, setFit] = useState('cover');
    const measure = el => {
        const w = el.naturalWidth, h = el.naturalHeight;
        if (!w || !h)
            return;
        const r = w / h;
        setFit(r >= 1.3 && r <= 2.1 ? 'cover' : 'contain');
    };
    useEffect(() => {
        setFit('cover');
        const el = ref.current;
        if (el && el.complete && el.naturalWidth)
            measure(el);   // already loaded from cache
    }, [src]);
    const fill = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' };
    return (React.createElement("div", { style: { position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#EFEAE2' } },
        fit === 'contain' && React.createElement("img", { src: src, alt: "", "aria-hidden": "true", style: { ...fill, objectFit: 'cover', filter: 'blur(24px)', opacity: 0.7, transform: 'scale(1.15)' } }),
        React.createElement("img", { ref: ref, src: src, alt: alt, onLoad: e => measure(e.target), style: { ...fill, objectFit: fit } })));
}

/** Trip photo gallery with lightbox. */
/* ---------- trip detail ---------- */
function Gallery({ images, title }) {
    const [i, setI] = useState(0);
    const [lightbox, setLightbox] = useState(false);
    const [photo, setPhoto] = useState(0);
    const track = useRef(null);
    const animation = useRef(null);
    const target = useRef(0);
    const cancelSlide = () => {
        cancelAnimationFrame(animation.current);
        animation.current = null;
        if (track.current) track.current.style.scrollSnapType = '';
    };
    useEffect(() => () => cancelAnimationFrame(animation.current), []);
    const list = images && images.length ? images : [null];
    const move = index => {
        const node = track.current;
        if (!node) return;
        cancelSlide();
        target.current = Math.max(0, Math.min(list.length - 1, index));
        const start = node.scrollLeft;
        const end = target.current * node.clientWidth;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            node.scrollLeft = end;
            return;
        }
        node.style.scrollSnapType = 'none';
        const started = performance.now();
        const step = now => {
            const progress = Math.min(1, (now - started) / 720);
            const eased = progress < .5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;
            node.scrollLeft = start + (end - start) * eased;
            if (progress < 1) animation.current = requestAnimationFrame(step);
            else { cancelSlide(); setI(target.current); }
        };
        animation.current = requestAnimationFrame(step);
    };
    return React.createElement(React.Fragment, null,
        React.createElement("section", { className: "trip-gallery", "aria-label": "Trip photos", "aria-roledescription": "carousel" },
            React.createElement("div", { ref: track, className: "trip-gallery__track", tabIndex: 0, onPointerDown: cancelSlide, onWheel: cancelSlide,
                onScroll: e => { const node = e.currentTarget; setI(Math.round(node.scrollLeft / node.clientWidth)); },
                onKeyDown: e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); move(Math.max(0, Math.min(list.length - 1, (animation.current ? target.current : i) + (e.key === 'ArrowRight' ? 1 : -1)))); } }
            }, list.map((im, k) => React.createElement("button", { key: k, type: "button", className: "trip-gallery__slide", onClick: () => { cancelSlide(); setPhoto(k); setLightbox(true); }, "aria-label": `Open photo ${k + 1} of ${list.length}`, tabIndex: i === k ? 0 : -1 },
                React.createElement("img", { ...responsivePhoto(imgSrc(im), 1600, '(max-width: 1023px) calc(100vw - 40px), 900px'), onError: e => originalPhotoOnError(e, imgSrc(im)), alt: `${title} - photo ${k + 1}`, loading: Math.abs(i - k) <= 1 ? "eager" : "lazy", decoding: "async", fetchPriority: i === k ? "high" : "auto" })))),
            list.length > 1 && React.createElement("div", { className: "trip-gallery__controls trip-gallery__controls--overlay" },
                React.createElement("button", { type: "button", onClick: () => move((animation.current ? target.current : i) - 1), disabled: i === 0, "aria-label": "Previous photo" }, React.createElement(Icon, { name: "chev", size: 22, className: "rotate-180" })),
                React.createElement("span", { "aria-live": "polite" }, `${i + 1} / ${list.length}`),
                React.createElement("button", { type: "button", onClick: () => move((animation.current ? target.current : i) + 1), disabled: i === list.length - 1, "aria-label": "Next photo" }, React.createElement(Icon, { name: "chev", size: 22 }))),
            React.createElement("p", { className: "trip-gallery__hint" }, list.length > 1 ? "Swipe to explore / Tap a photo to enlarge" : "Tap photo to enlarge")),
        React.createElement(Modal, { open: lightbox, onClose: () => setLightbox(false), size: "lg", label: "Trip photos", photoViewer: true },
            React.createElement("div", { className: "trip-gallery__lightbox", onKeyDown: e => {
                if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    setPhoto(current => Math.max(0, Math.min(list.length - 1, current + (e.key === 'ArrowRight' ? 1 : -1))));
                }
            } },
                React.createElement("div", { className: "trip-gallery__stage" },
                    list.map((im, k) => React.createElement(GalleryPhoto, { key: imgSrc(im) + k, src: imgSrc(im), active: photo === k, load: Math.abs(photo - k) <= 1, alt: `${title} - photo ${k + 1}` }))),
                list.length > 1 && React.createElement("div", { className: "trip-gallery__controls" },
                    React.createElement("button", { type: "button", disabled: photo === 0, onClick: () => setPhoto(current => Math.max(0, current - 1)), "aria-label": "Previous photo" }, React.createElement(Icon, { name: "chev", size: 22, className: "rotate-180" })),
                    React.createElement("span", { "aria-live": "polite" }, `${photo + 1} / ${list.length}`),
                    React.createElement("button", { type: "button", disabled: photo === list.length - 1, onClick: () => setPhoto(current => Math.min(list.length - 1, current + 1)), "aria-label": "Next photo" }, React.createElement(Icon, { name: "chev", size: 22 }))))));
}

/** Keep decoded photos mounted so navigation crossfades without layout shifts. */
function GalleryPhoto({ src, active, load, alt }) {
    const [ready, setReady] = useState(false);
    const [failed, setFailed] = useState(false);
    const [requested, setRequested] = useState(load);
    useEffect(() => { if (load) setRequested(true); }, [load]);
    return React.createElement("div", { className: cls('trip-gallery__frame', active && 'is-active'), "aria-hidden": !active },
        requested && React.createElement("img", { src, alt, decoding: "async", fetchPriority: active ? 'high' : 'low', className: ready ? 'is-ready' : '',
            onLoad: () => setReady(true),
            onError: () => setFailed(true) }),
        !ready && React.createElement("span", { className: "trip-gallery__loading", role: active ? "status" : undefined }, failed ? "This photo could not load." : "Loading photo..."));
}

/** Enquiry form shown on the trip page. */
function EnquiryModal({ trip, org, open, onClose }) {
    const { user: me } = useAuth();
    useTripEnquiryOpen(trip, open);
    const [form, setForm] = useState({ name: '', email: '', phone: '', travellerCount: 1, message: '' });
    const [err, setErr] = useState({});
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);
    useEffect(() => {
        if (open) {
            setDone(false);
            setErr({});
            setForm({ name: (me && me.name) || '', email: (me && me.email) || '',
                phone: me && me.phone ? String(me.phone).replace(/\D/g, '').slice(-10) : '', travellerCount: 1,
                message: `Hi, I'd like to know more about ${trip.title}.` });
        }
    }, [open, trip.id]);
    const set = p => setForm(x => ({ ...x, ...p }));
    const validate = () => {
        const e = {};
        if (!form.name.trim())
            e.name = 'Tell the organizer who is enquiring.';
        if (!/^\S+@\S+\.\S+$/.test(form.email))
            e.email = 'Enter a valid email address.';
        if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, '').slice(-10)))
            e.phone = 'Enter a 10-digit Indian mobile number.';
        if (!(form.travellerCount >= 1))
            e.travellerCount = 'At least one traveller.';
        setErr(e);
        return Object.keys(e).length === 0;
    };
    const submit = async (e) => {
        e.preventDefault();
        if (busy || !validate())
            return;
        setBusy(true);
        try {
            const payload = {
                tripId: trip.id, name: form.name.trim(), email: form.email.trim(),
                phone: form.phone.replace(/\D/g, '').slice(-10),
                travellerCount: Math.round(+form.travellerCount), message: form.message.trim()
            };
            if (trip.fromDb)
                await tripApi.createEnquiry(payload);
            else
                await enquiryService.create({ ...payload, organizerId: trip.organizerId, travellerId: me ? me.id : uid('guest') });
            setDone(true);
            toast('Enquiry sent to ' + org.name);
        }
        catch (x) {
            console.error(x);
            toast(x.message || 'Could not send the enquiry. Try again.', 'bad');
        }
        finally {
            setBusy(false);
        }
    };
    const isTraveller = !!me && me.role === 'TRAVELLER';
    return (React.createElement(Modal, { open: open, onClose: onClose, label: "Send an enquiry", responsive: true }, done ? (React.createElement("div", { className: "enquiry-success p-7 sm:p-9 text-center" },
        React.createElement("div", { className: "mx-auto w-16 h-16 rounded-full bg-[#E8F1EC] text-ok flex items-center justify-center" },
            React.createElement(Icon, { name: "check", size: 28 })),
        React.createElement("h2", { className: "mt-5 text-2xl font-extrabold tracking-tight" }, "You're on your way"),
        React.createElement("p", { className: "mt-2 text-[15px] text-slatey leading-relaxed" },
            "Your enquiry for ",
            React.createElement("strong", null, trip.title),
            " has gone to ",
            org.name,
            ". They usually reply within a day \u2014 message them now to move faster."),
        React.createElement("div", { className: "mt-6 flex flex-col gap-3" },
            React.createElement(WhatsAppButton, { trip: trip, org: org, size: "lg" }),
            React.createElement(InstagramButton, { trip: trip, org: org, size: "lg" }),
            React.createElement(Btn, { variant: "ghost", onClick: () => { onClose(); go(isTraveller ? '/traveller/my-trips' : '/explore'); } }, isTraveller ? 'See my enquiries' : 'Keep exploring trips')))) : (React.createElement("form", { onSubmit: submit, className: "enquiry-form" },
        React.createElement("h2", { className: "enquiry-header text-[22px] font-extrabold tracking-tight" }, "Enquire about this trip"),
        React.createElement("div", { className: "enquiry-body" },
        React.createElement("div", { className: "mt-4 rounded-2xl bg-sand border border-line p-4 flex gap-3.5" },
            React.createElement("img", { ...responsivePhoto(tripCoverSrc(trip), 128, '64px'), onError: e => originalPhotoOnError(e, tripCoverSrc(trip)), decoding: 'async', alt: "", className: "w-16 h-16 rounded-xl object-cover" }),
            React.createElement("div", { className: "min-w-0" },
                React.createElement("div", { className: "font-bold text-[15px] truncate" }, trip.title),
                React.createElement("div", { className: "text-[13px] text-muted mt-0.5" },
                    dateRange(trip.startDate, trip.endDate),
                    " \u00B7 ",
                    dur(trip)),
                React.createElement("div", { className: "text-[14px] font-bold mt-1" },
                    INR(trip.price),
                    " ",
                    React.createElement("span", { className: "font-medium text-muted text-[12.5px]" }, "per person")))),
        React.createElement("div", { className: "mt-5 grid gap-4 sm:grid-cols-2" },
            React.createElement(Field, { label: "Full name", error: err.name, className: "sm:col-span-2" },
                React.createElement(Input, { value: form.name, onChange: e => set({ name: e.target.value }), placeholder: "Your name" })),
            React.createElement(Field, { label: "Phone", error: err.phone, hint: "The organizer will call or WhatsApp you." },
                React.createElement(Input, { value: form.phone, onChange: e => set({ phone: e.target.value }), placeholder: "98765 43210", inputMode: "tel" })),
            React.createElement(Field, { label: "Email", error: err.email },
                React.createElement(Input, { type: "email", value: form.email, onChange: e => set({ email: e.target.value }), placeholder: "you@email.com" })),
            React.createElement(Field, { label: "Travellers", error: err.travellerCount },
                React.createElement(Input, { type: "number", min: "1", max: "20", value: form.travellerCount, onChange: e => set({ travellerCount: e.target.value }) })),
            React.createElement(Field, { label: "Message", className: "sm:col-span-2" },
                React.createElement(TextArea, { rows: 3, value: form.message, onChange: e => set({ message: e.target.value }) }))),
        ),
        React.createElement("div", { className: "enquiry-footer" },
        React.createElement(Btn, { type: "submit", size: "lg", className: "w-full", loading: busy }, busy ? 'Sending' : 'Send enquiry'),
        React.createElement("p", { className: "mt-3 text-[12.5px] text-muted text-center" },
            "Your details go only to ",
            org.name,
            ". No payment happens on Musafirrrr."))))));
}

/** Trip details page (#/trip/:slug). */
function TripDetailPage({ slug }) {
    const s = useStore();
    const { user: viewer } = useAuth();
    const { loading, error, data: dbTrip, reload } = useAsync(() => tripApi.bySlug(slug), [slug, s.trips]);
    const { data: moreData } = useAsync(
        () => dbTrip ? tripApi.moreFrom(dbTrip.organizerId, dbTrip.id) : Promise.resolve([]),
        [dbTrip ? dbTrip.id : null]
    );
    const [enq, setEnq] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);

    // Page title for real trips (App.js only knows the mock trips)
    useEffect(() => {
        if (!dbTrip)
            return;
        const o = dbTrip.organizer;
        setMeta(`${dbTrip.title} — ${dbTrip.destination} · ${INR(dbTrip.price)} | Musafirrrr`, `${dbTrip.days}D/${dbTrip.nights}N group trip to ${dbTrip.destination} with ${o ? o.name : 'a verified organizer'}, ${dateRange(dbTrip.startDate, dbTrip.endDate)}. ${INR(dbTrip.price)} per person. ${(dbTrip.description || '').slice(0, 110)}`);
    }, [dbTrip ? dbTrip.id : null]);

    // Real trip first; the mock store is only a fallback until Explore and Home are converted
    const trip = dbTrip || tripService.bySlug(slug);
    useTripPageView(trip, slug);
    if (!trip) {
        if (loading)
            return React.createElement("main", { className: "max-w-shell mx-auto px-5 py-24" },
                React.createElement("p", { className: "text-slatey" }, "Loading trip..."));
        if (error)
            return React.createElement("main", { className: "max-w-shell mx-auto px-5 py-24" },
                React.createElement(EmptyState, { title: "We couldn't load this trip", body: "Check your connection and try again.", action: React.createElement(Btn, { onClick: reload }, "Try again") }));
        return React.createElement("main", { className: "max-w-shell mx-auto px-5 py-24" },
            React.createElement(EmptyState, { title: "That trip is no longer listed", body: "It may have been removed or completed. Here is everything else on offer.", action: React.createElement(Btn, { onClick: () => go('/explore') }, "Explore trips") }));
    }

    const org = trip.organizer || organizerService.byId(trip.organizerId);
    const others = trip.fromDb
        ? (moreData || [])
        : tripService.byOrganizer(trip.organizerId).filter(t => t.id !== trip.id && t.status === 'PUBLISHED').slice(0, 3);
    const canEnquire = trip.status === 'PUBLISHED' && trip.availableSpots > 0;
    const sold = trip.status === 'SOLD_OUT' || (trip.status === 'PUBLISHED' && trip.availableSpots === 0);
    const ctaLabel = canEnquire ? 'Register / enquire' : trip.status === 'COMPLETED' ? 'Trip completed' : trip.status === 'DRAFT' ? 'Not published yet' : 'Sold out';
    const hasTabs = !!viewer && viewer.role === 'TRAVELLER';
    const gate = viewer ? null : () => setLoginOpen(true);
    const openEnquiry = () => (gate ? gate() : setEnq(true));
    return (React.createElement("main", { className: cls('lg:pb-0', hasTabs ? 'pb-44' : 'pb-28') },
        React.createElement("div", { className: "max-w-shell mx-auto px-5 lg:px-8 pt-5 md:pt-8" },
            React.createElement("nav", { className: "text-[13px] text-muted mb-4 flex items-center gap-1.5" },
                React.createElement(Link, { to: "/explore", className: "hover:text-ink" }, "Explore"),
                React.createElement(Icon, { name: "chev", size: 12 }),
                React.createElement(Link, { to: '/explore?q=' + encodeURIComponent(trip.destination), className: "hover:text-ink" }, trip.destination),
                React.createElement(Icon, { name: "chev", size: 12 }),
                React.createElement("span", { className: "text-slatey truncate" }, trip.title)),
            React.createElement(Gallery, { key: trip.slug, images: tripImages(trip), title: trip.title }),
            React.createElement("div", { className: "grid lg:grid-cols-[1fr_380px] gap-10 xl:gap-14 mt-8" },
                React.createElement("div", { className: "min-w-0" },
                    React.createElement("div", { className: "flex items-start justify-between gap-4 trip-detail-heading" },
                        React.createElement("div", null,
                            React.createElement("div", { className: "flex items-center gap-2 flex-wrap" },
                                React.createElement(Tag_, { tone: "beige" }, trip.category),
                                React.createElement(Tag_, { tone: "out" }, trip.groupType),
                                sold && React.createElement(Tag_, { tone: "bad" }, "Sold out"),
                                trip.status === 'DRAFT' && React.createElement(Tag_, { tone: "warn" }, "Draft")),
                            React.createElement("h1", { className: "mt-3 text-[30px] sm:text-[42px] font-extrabold tracking-[-0.035em] leading-[1.05]" }, trip.title),
                            React.createElement("div", { className: "mt-3 flex items-center gap-4 flex-wrap text-[14.5px] text-slatey" },
                            React.createElement("span", { className: "inline-flex items-center gap-1.5" },
                                React.createElement(Icon, { name: "map", size: 16, className: "text-beige" }),
                                trip.destination,
                                trip.region ? ', ' + trip.region : ''))),
                            React.createElement("div", { className: "trip-detail-actions" },
                                React.createElement(WishlistButton, { tripId: trip.id, floating: false, showLabel: true, className: "trip-detail-save shrink-0" }),
                                React.createElement(CompareButton, { trip, detail: true }))),
                    React.createElement("div", { className: "mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3" }, [['cal', 'Dates', dateRange(trip.startDate, trip.endDate)],
                        ['clock', 'Duration', dur(trip)],
                        ['users', 'Group', `${trip.totalSpots} max`],
                        ['compass', 'Starts from', trip.startingFrom || '\u2014']].map(([ic, l, v]) => (React.createElement("div", { key: l, className: "rounded-2xl border border-line p-4" },
                        React.createElement("span", { className: "inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted" },
                            React.createElement(Icon, { name: ic, size: 14 }),
                            l),
                        React.createElement("div", { className: "mt-1.5 font-bold text-[15px] tracking-tight" }, v))))),
                    React.createElement("section", { className: "mt-10" },
                        React.createElement("h2", { className: "text-2xl font-extrabold tracking-tight" }, "About this trip"),
                        React.createElement("p", { className: "mt-3 text-[16.5px] text-slatey leading-[1.75] max-w-[68ch]" }, trip.description)),
                    trip.itinerary.length > 0 && React.createElement("section", { className: "mt-10" },
                        React.createElement("h2", { className: "text-2xl font-extrabold tracking-tight" }, "Day by day"),
                        React.createElement("ol", { className: "mt-5 space-y-0" }, trip.itinerary.map((day, i) => (React.createElement("li", { key: i, className: "relative pl-10 pb-7 last:pb-0" },
                            React.createElement("span", { className: "absolute left-0 top-0.5 w-7 h-7 rounded-full bg-ink text-white text-[12.5px] font-bold flex items-center justify-center" }, day.day),
                            i < trip.itinerary.length - 1 && React.createElement("span", { className: "absolute left-[13px] top-9 bottom-0 w-px bg-line" }),
                            React.createElement("h3", { className: "font-bold text-[16.5px] tracking-tight" }, day.title),
                            React.createElement("p", { className: "mt-1 text-[15px] text-slatey leading-relaxed max-w-[62ch]" }, day.detail)))))),
                    React.createElement("section", { className: "mt-10 grid sm:grid-cols-2 gap-6" },
                        React.createElement("div", { className: "rounded-2xl border border-line p-5" },
                            React.createElement("h3", { className: "font-bold text-[16px] tracking-tight" }, "What's included"),
                            React.createElement("ul", { className: "mt-3 space-y-2.5" }, trip.included.map((x, i) => React.createElement("li", { key: i, className: "flex gap-2.5 text-[14.5px] text-slatey leading-snug" },
                                React.createElement(Icon, { name: "check", size: 16, className: "text-ok mt-0.5 shrink-0" }),
                                x)))),
                        React.createElement("div", { className: "rounded-2xl border border-line p-5 bg-sand" },
                            React.createElement("h3", { className: "font-bold text-[16px] tracking-tight" }, "Not included"),
                            React.createElement("ul", { className: "mt-3 space-y-2.5" }, trip.excluded.map((x, i) => React.createElement("li", { key: i, className: "flex gap-2.5 text-[14.5px] text-slatey leading-snug" },
                                React.createElement(Icon, { name: "x", size: 15, className: "text-muted mt-0.5 shrink-0" }),
                                x))))),
                    React.createElement("section", { className: "mt-10 grid sm:grid-cols-2 gap-6" },
                        React.createElement("div", null,
                            React.createElement("h3", { className: "font-bold text-[16px] tracking-tight" }, "Meeting point"),
                            React.createElement("p", { className: "mt-2 text-[15px] text-slatey leading-relaxed" }, trip.meetingPoint)),
                        React.createElement("div", null,
                            React.createElement("h3", { className: "font-bold text-[16px] tracking-tight" }, "Group"),
                            React.createElement("p", { className: "mt-2 text-[15px] text-slatey leading-relaxed" },
                                trip.groupType,
                                " \u00B7 maximum ",
                                trip.totalSpots,
                                " travellers \u00B7 ",
                                trip.availableSpots,
                                " ",
                                trip.availableSpots === 1 ? 'spot' : 'spots',
                                " still open.")),
                        React.createElement("div", null,
                            React.createElement("h3", { className: "font-bold text-[16px] tracking-tight" }, "Cancellation policy"),
                            React.createElement("p", { className: "mt-2 text-[15px] text-slatey leading-relaxed" }, trip.cancellationPolicy || "Free cancellation up to 20 days before departure. 50% refund up to 10 days before. No refund after that \u2014 the organizer's own terms apply.")),
                        React.createElement("div", null,
                            React.createElement("h3", { className: "font-bold text-[16px] tracking-tight" }, "Good to know"),
                            React.createElement("p", { className: "mt-2 text-[15px] text-slatey leading-relaxed" }, trip.importantInfo || "Carry a government photo ID. The itinerary can shift with weather or road conditions. Payment is made directly to the organizer \u2014 Musafirrrr does not take money for trips."))),
                    org && (React.createElement("section", { className: "mt-10 rounded-2xl border border-line p-6" },
                        React.createElement("div", { className: "flex items-start gap-4" },
                            React.createElement(OrgLogo, { org: org, size: 56 }),
                            React.createElement("div", { className: "min-w-0 flex-1" },
                                React.createElement("div", { className: "flex items-center gap-2 flex-wrap" },
                                React.createElement(Link, { to: '/o/' + org.slug, className: "font-bold text-[17px] tracking-tight hover:underline underline-offset-4" }, org.name),
                                org.verified && React.createElement(Verified, null),
                                React.createElement(OrgRating, { org })),
                                React.createElement("div", { className: "text-[13px] text-muted mt-0.5" },
                                    [org.city, org.since ? 'organizing since ' + org.since : null, org.travellers ? org.travellers.toLocaleString('en-IN') + ' travellers' : null].filter(Boolean).join(' \u00B7 ')),
                                React.createElement("p", { className: "mt-3 text-[15px] text-slatey leading-relaxed max-w-[62ch]" }, org.bio),
                                React.createElement("div", { className: "mt-4 flex flex-wrap gap-2.5" },
                                    React.createElement(Btn, { size: "sm", variant: "outline", onClick: () => go('/o/' + org.slug) }, "See all their trips"),
                                    React.createElement(WhatsAppButton, { trip: trip, org: org, size: "sm", label: "WhatsApp" }),
                                    React.createElement(InstagramButton, { trip: trip, org: org, size: "sm", label: "Instagram" })))))),
                    others.length > 0 && org && (React.createElement("section", { className: "mt-12" },
                        React.createElement(SectionHead, { title: `More from ${org.name}` }),
                        React.createElement("div", { className: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3" }, others.map(t => React.createElement(TripCard, { key: t.id, trip: { ...t, organizer: org } })))))),
                React.createElement("aside", { className: "hidden lg:block" },
                    React.createElement("div", { className: "sticky", style: { top: 'calc(96px + env(safe-area-inset-top,0px))' } },
                        React.createElement("div", { className: "rounded-2xl border border-line shadow-card p-6 bg-white" },
                            React.createElement("div", { className: "flex items-end justify-between" },
                                React.createElement("div", null,
                                    React.createElement("div", { className: "text-[32px] font-extrabold tracking-tight leading-none" }, INR(trip.price)),
                                    React.createElement("div", { className: "text-[13px] text-muted mt-1.5" },
                                        "per person \u00B7 ",
                                        dur(trip))),
                                React.createElement(Tag_, { tone: "beige" }, trip.currency)),
                            React.createElement("div", { className: "mt-5 rounded-xl bg-sand border border-line p-4 text-[14px] space-y-2.5" },
                                React.createElement("div", { className: "flex justify-between" },
                                    React.createElement("span", { className: "text-muted" }, "Dates"),
                                    React.createElement("strong", null, dateRange(trip.startDate, trip.endDate))),
                                React.createElement("div", { className: "flex justify-between" },
                                    React.createElement("span", { className: "text-muted" }, "Starts from"),
                                    React.createElement("strong", null, trip.startingFrom || '\u2014')),
                                trip.advance > 0 && React.createElement("div", { className: "flex justify-between" },
                                    React.createElement("span", { className: "text-muted" }, "Advance"),
                                    React.createElement("strong", null, INR(trip.advance)))),
                            React.createElement("div", { className: "mt-4" },
                                React.createElement(SpotsMeter, { trip: trip })),
                            React.createElement("div", { className: "mt-5 space-y-2.5" },
                                React.createElement(Btn, { size: "lg", className: "w-full", disabled: !canEnquire, onClick: openEnquiry }, ctaLabel),
                                React.createElement(WhatsAppButton, { trip: trip, org: org, className: "w-full" }),
                                React.createElement(InstagramButton, { trip: trip, org: org, className: "w-full" })),
                            React.createElement("p", { className: "mt-4 text-[12.5px] text-muted leading-relaxed text-center" }, "You pay the organizer directly. Musafirrrr charges travellers nothing.")))))),
        React.createElement("div", { className: "lg:hidden fixed left-0 right-0 z-[85] bg-white border-t border-line px-4 pt-3", style: hasTabs
                ? { bottom: 'calc(57px + env(safe-area-inset-bottom,0px))', paddingBottom: '12px' }
                : { bottom: 0, paddingBottom: 'calc(12px + env(safe-area-inset-bottom,0px))' } },
            React.createElement("div", { className: "flex items-center gap-3" },
                React.createElement("div", { className: "shrink-0" },
                    React.createElement("div", { className: "text-[19px] font-extrabold tracking-tight leading-none" }, INR(trip.price)),
                    React.createElement("div", { className: "text-[11.5px] text-muted mt-0.5" }, "per person")),
                React.createElement(Btn, { className: "flex-1", disabled: !canEnquire, onClick: openEnquiry }, ctaLabel),
                org && org.whatsapp && (React.createElement("a", { href: waLink(org.whatsapp, tripWaMessage(trip, org)), target: "_blank", rel: "noopener noreferrer", onClick: () => { void tripAnalytics.track(trip, 'whatsapp_click'); }, "aria-label": "Chat on WhatsApp", className: "w-11 h-11 rounded-full bg-[#1F7A4C] text-white flex items-center justify-center shrink-0" },
                    React.createElement(Icon, { name: "wa", size: 20 }))))),
                React.createElement(LoginPrompt, { open: loginOpen, onClose: () => setLoginOpen(false), action: 'send an enquiry' }),
        org && React.createElement(EnquiryModal, { trip: trip, org: org, open: enq, onClose: () => setEnq(false) })));
}
