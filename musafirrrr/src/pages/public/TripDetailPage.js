"use strict";
/* ============================================================
   PAGE — TRIP DETAILS  (#/trip/:slug)
   ============================================================ */

/** Trip photo gallery with lightbox. */
/* ---------- trip detail ---------- */
function Gallery({ images, title }) {
    const [i, setI] = useState(0);
    const [lightbox, setLightbox] = useState(false);
    const list = images && images.length ? images : [null];
    return (React.createElement(React.Fragment, null,
        React.createElement("div", { className: "grid gap-2 md:grid-cols-[2fr_1fr] md:h-[440px]" },
            React.createElement("button", { onClick: () => setLightbox(true), className: "relative block h-[260px] md:h-full rounded-2xl overflow-hidden group" },
                React.createElement("img", { src: imgSrc(list[i]), alt: title, className: "w-full h-full object-cover transition-transform duration-[400ms] group-hover:scale-[1.02]" }),
                React.createElement("span", { className: "absolute bottom-3 right-3 rounded-full bg-white/92 px-3 py-1.5 text-[12.5px] font-semibold" },
                    "View all ",
                    list.length,
                    " photos")),
            React.createElement("div", { className: "hidden md:grid grid-rows-3 gap-2" }, list.slice(1, 4).map((im, k) => (React.createElement("button", { key: k, onClick: () => setI(k + 1), className: "relative rounded-2xl overflow-hidden group" },
                React.createElement("img", { src: imgSrc(im), alt: "", className: "w-full h-full object-cover transition-transform duration-[400ms] group-hover:scale-[1.04]" })))))),
        React.createElement("div", { className: "md:hidden mt-2 u-scroll" },
            React.createElement("div", { className: "flex gap-2" }, list.map((im, k) => (React.createElement("button", { key: k, onClick: () => setI(k), className: cls('w-16 h-16 rounded-xl overflow-hidden shrink-0 border-2', i === k ? 'border-ink' : 'border-transparent') },
                React.createElement("img", { src: imgSrc(im), alt: "", className: "w-full h-full object-cover" })))))),
        React.createElement(Modal, { open: lightbox, onClose: () => setLightbox(false), size: "lg", label: "Trip photos" },
            React.createElement("div", { className: "p-3 sm:p-4" },
                React.createElement("img", { src: imgSrc(list[i]), alt: title, className: "w-full rounded-2xl" }),
                React.createElement("div", { className: "mt-3 flex gap-2 justify-center flex-wrap" }, list.map((im, k) => (React.createElement("button", { key: k, onClick: () => setI(k), className: cls('w-14 h-14 rounded-lg overflow-hidden border-2', i === k ? 'border-ink' : 'border-line') },
                    React.createElement("img", { src: imgSrc(im), alt: "", className: "w-full h-full object-cover" })))))))));
}

/** Enquiry form shown on the trip page. */
function EnquiryModal({ trip, org, open, onClose }) {
    const me = authService.current();
    const [form, setForm] = useState({ name: '', email: '', phone: '', travellerCount: 1, message: '' });
    const [err, setErr] = useState({});
    const [busy, setBusy] = useState(false);
    const [done, setDone] = useState(false);
    useEffect(() => {
        if (open) {
            setDone(false);
            setErr({});
            setForm({ name: me ? me.name : '', email: me ? me.email : '', phone: me ? me.phone : '', travellerCount: 1,
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
        if (!validate())
            return;
        setBusy(true);
        try {
            await enquiryService.create({ tripId: trip.id, organizerId: trip.organizerId, travellerId: me ? me.id : uid('guest'),
                name: form.name, email: form.email, phone: form.phone, travellerCount: +form.travellerCount, message: form.message });
            setDone(true);
            toast('Enquiry sent to ' + org.name);
        }
        catch (x) {
            toast('Could not send the enquiry. Try again.', 'bad');
        }
        finally {
            setBusy(false);
        }
    };
    return (React.createElement(Modal, { open: open, onClose: onClose, label: "Send an enquiry" }, done ? (React.createElement("div", { className: "p-7 sm:p-9 text-center" },
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
            React.createElement(InstagramButton, { org: org, size: "lg" }),
            React.createElement(Btn, { variant: "ghost", onClick: () => { onClose(); go(authService.current() ? '/traveller/my-trips' : '/explore'); } }, authService.current() ? 'See my enquiries' : 'Keep exploring trips')))) : (React.createElement("form", { onSubmit: submit, className: "p-6 sm:p-8" },
        React.createElement("h2", { className: "text-[22px] font-extrabold tracking-tight pr-8" }, "Enquire about this trip"),
        React.createElement("div", { className: "mt-4 rounded-2xl bg-sand border border-line p-4 flex gap-3.5" },
            React.createElement("img", { src: imgSrc(trip.coverImage), alt: "", className: "w-16 h-16 rounded-xl object-cover" }),
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
        React.createElement(Btn, { type: "submit", size: "lg", className: "w-full mt-6", loading: busy }, busy ? 'Sending' : 'Send enquiry'),
        React.createElement("p", { className: "mt-3 text-[12.5px] text-muted text-center" },
            "Your details go only to ",
            org.name,
            ". No payment happens on Musafirrrr.")))));
}

/** Trip details page (#/trip/:slug). */
function TripDetailPage({ slug }) {
    const s = useStore();
    const trip = tripService.bySlug(slug);
    const [enq, setEnq] = useState(false);
    useEffect(() => { if (trip)
        tripService.markViewed(trip.id); }, [slug]);
    if (!trip)
        return React.createElement("main", { className: "max-w-shell mx-auto px-5 py-24" },
            React.createElement(EmptyState, { title: "That trip is no longer listed", body: "It may have been removed or completed. Here is everything else on offer.", action: React.createElement(Btn, { onClick: () => go('/explore') }, "Explore trips") }));
    const org = organizerService.byId(trip.organizerId);
    const others = tripService.byOrganizer(trip.organizerId).filter(t => t.id !== trip.id && t.status === 'PUBLISHED').slice(0, 3);
    const sold = trip.availableSpots === 0;
    const viewer = authService.current();
    const hasTabs = !!viewer && viewer.role === 'TRAVELLER';
    return (React.createElement("main", { className: cls('lg:pb-0', hasTabs ? 'pb-44' : 'pb-28') },
        React.createElement("div", { className: "max-w-shell mx-auto px-5 lg:px-8 pt-5 md:pt-8" },
            React.createElement("nav", { className: "text-[13px] text-muted mb-4 flex items-center gap-1.5" },
                React.createElement(Link, { to: "/explore", className: "hover:text-ink" }, "Explore"),
                React.createElement(Icon, { name: "chev", size: 12 }),
                React.createElement(Link, { to: '/explore?q=' + encodeURIComponent(trip.destination), className: "hover:text-ink" }, trip.destination),
                React.createElement(Icon, { name: "chev", size: 12 }),
                React.createElement("span", { className: "text-slatey truncate" }, trip.title)),
            React.createElement(Gallery, { images: trip.images, title: trip.title }),
            React.createElement("div", { className: "grid lg:grid-cols-[1fr_380px] gap-10 xl:gap-14 mt-8" },
                React.createElement("div", { className: "min-w-0" },
                    React.createElement("div", { className: "flex items-start justify-between gap-4" },
                        React.createElement("div", null,
                            React.createElement("div", { className: "flex items-center gap-2 flex-wrap" },
                                React.createElement(Tag_, { tone: "beige" }, trip.category),
                                React.createElement(Tag_, { tone: "out" }, trip.groupType),
                                sold && React.createElement(Tag_, { tone: "bad" }, "Sold out")),
                            React.createElement("h1", { className: "mt-3 text-[30px] sm:text-[42px] font-extrabold tracking-[-0.035em] leading-[1.05]" }, trip.title),
                            React.createElement("div", { className: "mt-3 flex items-center gap-4 flex-wrap text-[14.5px] text-slatey" },
                                React.createElement("span", { className: "inline-flex items-center gap-1.5" },
                                    React.createElement(Icon, { name: "map", size: 16, className: "text-beige" }),
                                    trip.destination,
                                    ", ",
                                    trip.region),
                                React.createElement("span", { className: "inline-flex items-center gap-1.5" },
                                    React.createElement(Icon, { name: "star", size: 15, fill: "currentColor", className: "text-earth" }),
                                    React.createElement("strong", { className: "text-ink" }, trip.rating),
                                    " (",
                                    trip.reviews,
                                    " reviews)"))),
                        React.createElement(WishlistButton, { tripId: trip.id, floating: false, className: "shrink-0 w-11 h-11" })),
                    React.createElement("div", { className: "mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3" }, [['cal', 'Dates', dateRange(trip.startDate, trip.endDate)],
                        ['clock', 'Duration', dur(trip)],
                        ['users', 'Group', `${trip.totalSpots} max`],
                        ['compass', 'Starts from', trip.startingFrom]].map(([ic, l, v]) => (React.createElement("div", { key: l, className: "rounded-2xl border border-line p-4" },
                        React.createElement("span", { className: "inline-flex items-center gap-1.5 text-[12px] font-semibold text-muted" },
                            React.createElement(Icon, { name: ic, size: 14 }),
                            l),
                        React.createElement("div", { className: "mt-1.5 font-bold text-[15px] tracking-tight" }, v))))),
                    React.createElement("section", { className: "mt-10" },
                        React.createElement("h2", { className: "text-2xl font-extrabold tracking-tight" }, "About this trip"),
                        React.createElement("p", { className: "mt-3 text-[16.5px] text-slatey leading-[1.75] max-w-[68ch]" }, trip.description)),
                    React.createElement("section", { className: "mt-10" },
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
                            React.createElement("p", { className: "mt-2 text-[15px] text-slatey leading-relaxed" }, "Free cancellation up to 20 days before departure. 50% refund up to 10 days before. No refund after that \u2014 the organizer's own terms apply.")),
                        React.createElement("div", null,
                            React.createElement("h3", { className: "font-bold text-[16px] tracking-tight" }, "Good to know"),
                            React.createElement("p", { className: "mt-2 text-[15px] text-slatey leading-relaxed" }, "Carry a government photo ID. The itinerary can shift with weather or road conditions. Payment is made directly to the organizer \u2014 Musafirrrr does not take money for trips."))),
                    org && (React.createElement("section", { className: "mt-10 rounded-2xl border border-line p-6" },
                        React.createElement("div", { className: "flex items-start gap-4" },
                            React.createElement(Avatar, { kind: org.logoKind, seed: org.logoSeed, size: 56, name: org.name }),
                            React.createElement("div", { className: "min-w-0 flex-1" },
                                React.createElement("div", { className: "flex items-center gap-2 flex-wrap" },
                                    React.createElement(Link, { to: '/o/' + org.slug, className: "font-bold text-[17px] tracking-tight hover:underline underline-offset-4" }, org.name),
                                    org.verified && React.createElement(Verified, null)),
                                React.createElement("div", { className: "text-[13px] text-muted mt-0.5" },
                                    org.city,
                                    " \u00B7 organizing since ",
                                    org.since,
                                    " \u00B7 ",
                                    org.travellers.toLocaleString('en-IN'),
                                    " travellers"),
                                React.createElement("p", { className: "mt-3 text-[15px] text-slatey leading-relaxed max-w-[62ch]" }, org.bio),
                                React.createElement("div", { className: "mt-4 flex flex-wrap gap-2.5" },
                                    React.createElement(Btn, { size: "sm", variant: "outline", onClick: () => go('/o/' + org.slug) }, "See all their trips"),
                                    React.createElement(WhatsAppButton, { trip: trip, org: org, size: "sm", label: "WhatsApp" }),
                                    React.createElement(InstagramButton, { org: org, size: "sm", label: "Instagram" })))))),
                    others.length > 0 && (React.createElement("section", { className: "mt-12" },
                        React.createElement(SectionHead, { title: `More from ${org.name}` }),
                        React.createElement("div", { className: "grid gap-5 sm:grid-cols-2 lg:grid-cols-3" }, others.map(t => React.createElement(TripCard, { key: t.id, trip: t })))))),
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
                                    React.createElement("strong", null, trip.startingFrom)),
                                React.createElement("div", { className: "flex justify-between" },
                                    React.createElement("span", { className: "text-muted" }, "Advance"),
                                    React.createElement("strong", null, INR(trip.advance)))),
                            React.createElement("div", { className: "mt-4" },
                                React.createElement(SpotsMeter, { trip: trip })),
                            React.createElement("div", { className: "mt-5 space-y-2.5" },
                                React.createElement(Btn, { size: "lg", className: "w-full", disabled: sold, onClick: () => setEnq(true) }, sold ? 'Sold out' : 'Register / enquire'),
                                React.createElement(WhatsAppButton, { trip: trip, org: org, className: "w-full" }),
                                React.createElement(InstagramButton, { org: org, className: "w-full" })),
                            React.createElement("p", { className: "mt-4 text-[12.5px] text-muted leading-relaxed text-center" }, "You pay the organizer directly. Musafirrrr charges travellers nothing.")))))),
        React.createElement("div", { className: "lg:hidden fixed left-0 right-0 z-[85] bg-white border-t border-line px-4 pt-3", style: hasTabs
                ? { bottom: 'calc(57px + env(safe-area-inset-bottom,0px))', paddingBottom: '12px' }
                : { bottom: 0, paddingBottom: 'calc(12px + env(safe-area-inset-bottom,0px))' } },
            React.createElement("div", { className: "flex items-center gap-3" },
                React.createElement("div", { className: "shrink-0" },
                    React.createElement("div", { className: "text-[19px] font-extrabold tracking-tight leading-none" }, INR(trip.price)),
                    React.createElement("div", { className: "text-[11.5px] text-muted mt-0.5" }, "per person")),
                React.createElement(Btn, { className: "flex-1", disabled: sold, onClick: () => setEnq(true) }, sold ? 'Sold out' : 'Register / enquire'),
                org && org.whatsapp && (React.createElement("a", { href: waLink(org.whatsapp, tripWaMessage(trip, org)), target: "_blank", rel: "noopener noreferrer", "aria-label": "Chat on WhatsApp", className: "w-11 h-11 rounded-full bg-[#1F7A4C] text-white flex items-center justify-center shrink-0" },
                    React.createElement(Icon, { name: "wa", size: 20 }))))),
        org && React.createElement(EnquiryModal, { trip: trip, org: org, open: enq, onClose: () => setEnq(false) })));
}
