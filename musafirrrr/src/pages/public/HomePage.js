"use strict";
/* ============================================================
   PAGE — HOME  (#/)
   ============================================================ */

/** Home page hero. */
function Hero() {
    return (React.createElement("section", { className: "relative" },
        React.createElement("div", { className: "absolute inset-0 overflow-hidden" },
            React.createElement("img", { src: sceneURL('mountains', 9001), alt: "", "aria-hidden": "true", className: "w-full h-full object-cover" }),
            React.createElement("div", { className: "absolute inset-0 bg-gradient-to-b from-ink/55 via-ink/35 to-ink/65" })),
        React.createElement("div", { className: "relative max-w-shell mx-auto px-5 lg:px-8 pt-16 pb-10 md:pt-24 md:pb-16" },
            React.createElement("div", { className: "max-w-3xl" },
                React.createElement("p", { className: "text-beige text-[14px] font-semibold tracking-[.14em]" },
                    tripService.published().length,
                    " TRIPS LIVE FROM ",
                    ORGANIZERS.length,
                    " TRAVEL COMMUNITIES"),
                React.createElement("h1", { className: "mt-4 text-white font-extrabold tracking-[-0.035em] leading-[.95] text-[46px] sm:text-[68px] lg:text-[84px]" },
                    "All group trips.",
                    React.createElement("br", null),
                    "One place."),
                React.createElement("p", { className: "mt-5 text-white/85 text-[17px] sm:text-[19px] leading-relaxed max-w-xl" }, "Discover your next adventure from trusted travel communities and organizers across India \u2014 then talk to them directly.")),
            React.createElement("div", { className: "mt-8 md:mt-10 max-w-5xl" },
                React.createElement(SearchBar, null)),
            React.createElement("div", { className: "mt-6 u-scroll -mx-5 px-5 lg:mx-0 lg:px-0" },
                React.createElement("div", { className: "flex gap-2.5" }, ['All trips', ...CATEGORIES].map(c => (React.createElement("button", { key: c, onClick: () => go(c === 'All trips' ? '/explore' : '/explore?cat=' + encodeURIComponent(c)), className: "whitespace-nowrap rounded-full px-4 h-9 text-[13.5px] font-semibold bg-white/12 text-white border border-white/25 hover:bg-white/22 backdrop-blur transition-colors" }, c))))))));
}

/** Destination picture tile. */
function DestinationTile({ name, kind, seed }) {
    return (React.createElement("button", { onClick: () => go('/explore?q=' + encodeURIComponent(name)), className: "group relative w-[168px] sm:w-[200px] shrink-0 rounded-2xl overflow-hidden aspect-[3/4] text-left" },
        React.createElement("img", { src: sceneURL(kind, seed), alt: name, loading: "lazy", className: "absolute inset-0 w-full h-full object-cover transition-transform duration-[400ms] group-hover:scale-[1.06]" }),
        React.createElement("span", { className: "absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/10 to-transparent" }),
        React.createElement("span", { className: "absolute left-4 right-4 bottom-4" },
            React.createElement("span", { className: "block text-white font-bold text-[17px] tracking-tight" }, name),
            React.createElement("span", { className: "block text-white/75 text-[12.5px] mt-0.5" },
                tripService.published().filter(t => t.destination === name || t.region === name).length,
                " trips"))));
}

/** Home page (#/). */
function HomePage() {
    const s = useStore();
    const [loading, setLoading] = useState(true);
    useEffect(() => { const t = setTimeout(() => setLoading(false), 450); return () => clearTimeout(t); }, []);
    const pub = tripService.published();
    const trending = [...pub].sort((a, b) => b.rating - a.rating || a.price - b.price).slice(0, 8);
    const soon = [...pub].filter(t => daysUntil(t.startDate) > 0).sort((a, b) => d(a.startDate) - d(b.startDate)).slice(0, 4);
    const dests = [['Manali', 'mountains', 1], ['Goa', 'beach', 2], ['Meghalaya', 'forest', 3], ['Kerala', 'backwater', 4], ['Rishikesh', 'valley', 5], ['Ladakh', 'mountains', 6], ['Kashmir', 'snow', 7], ['Spiti', 'mountains', 8], ['Jaisalmer', 'desert', 9]];
    return (React.createElement(React.Fragment, null,
        React.createElement(Hero, null),
        React.createElement("main", { className: "max-w-shell mx-auto px-5 lg:px-8" },
            React.createElement("section", { className: "pt-14 md:pt-20" },
                React.createElement(SectionHead, { title: "Trending this month", sub: "The trips travellers are saving and enquiring about right now.", action: React.createElement(Link, { to: "/explore", className: "hidden sm:inline-flex items-center gap-1.5 text-[14.5px] font-semibold hover:gap-2.5 transition-all" },
                        "See all trips ",
                        React.createElement(Icon, { name: "chev", size: 16 })) }),
                React.createElement(TripGrid, { trips: trending, loading: loading, cols: "4" }),
                React.createElement("div", { className: "sm:hidden mt-6" },
                    React.createElement(Btn, { variant: "outline", className: "w-full", onClick: () => go('/explore') }, "See all trips"))),
            React.createElement("section", { className: "pt-16 md:pt-24" },
                React.createElement(SectionHead, { title: "Popular destinations", sub: "Nine places Indian travel communities run the most trips to." }),
                React.createElement(ScrollRow, { label: "Popular destinations" }, dests.map(([n, k, i]) => React.createElement(DestinationTile, { key: n, name: n, kind: k, seed: 900 + i })))),
            React.createElement("section", { className: "pt-16 md:pt-24" },
                React.createElement(SectionHead, { title: "Leaving soon", sub: "Trips starting in the next few weeks. Spots move fast on these." }),
                React.createElement(TripGrid, { trips: soon, loading: loading, cols: "4" })),
            React.createElement("section", { className: "pt-16 md:pt-24" },
                React.createElement(SectionHead, { title: "Trips for every kind of traveller" }),
                React.createElement("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4" }, [['Weekend escapes', 'Weekend', 'Three days, no leave needed.', 'valley', 21],
                    ['Backpacking', 'Backpacking', 'Long routes, small budgets.', 'mountains', 22],
                    ['Trekking', 'Trek', 'Guided climbs for first-timers too.', 'snow', 23],
                    ['Beach trips', 'Beach', 'Coastline, islands, backwaters.', 'beach', 24],
                    ['All-girls trips', 'All Girls', 'Women-only groups, women guides.', 'forest', 25],
                    ['Adventure', 'Adventure', 'Rafting, caving, camping.', 'valley', 26],
                    ['International', 'International', 'Group trips beyond India.', 'island', 27],
                    ['Solo friendly', 'Solo Friendly', 'Come alone, leave with people.', 'desert', 28]
                ].map(([title, val, sub, kind, seed]) => {
                    const isGroup = GROUPS.includes(val);
                    return (React.createElement("button", { key: title, onClick: () => go('/explore?' + (isGroup ? 'group=' : 'cat=') + encodeURIComponent(val)), className: "group text-left rounded-2xl border border-line bg-lightbeige overflow-hidden hover:shadow-lift hover:border-ink/25 transition-all duration-200" },
                        React.createElement("div", { className: "h-28 overflow-hidden" },
                            React.createElement("img", { src: sceneURL(kind, seed), alt: "", className: "w-full h-full object-cover transition-transform duration-[400ms] group-hover:scale-105" })),
                        React.createElement("div", { className: "p-4" },
                            React.createElement("div", { className: "font-bold text-[15.5px] tracking-tight" }, title),
                            React.createElement("div", { className: "text-[13px] text-muted mt-1" }, sub))));
                }))),
            React.createElement("section", { className: "pt-16 md:pt-24" },
                React.createElement("div", { className: "rounded-3xl bg-sand border border-line p-7 sm:p-12" },
                    React.createElement(SectionHead, { title: "How Musafirrrr works", sub: "Three steps, no middlemen, no booking fee." }),
                    React.createElement("ol", { className: "grid gap-8 md:grid-cols-3 md:gap-12" }, [['Discover', 'Browse upcoming trips from travel communities across the country, all in one feed.'],
                        ['Choose', 'Compare destinations, dates, group type and price. Save the ones you like — no account needed.'],
                        ['Connect', 'Send an enquiry and talk to the organizer directly on WhatsApp. You book with them.']
                    ].map(([t, b], i) => (React.createElement("li", { key: t, className: "relative" },
                        React.createElement("span", { className: "text-[13px] font-bold text-beige" },
                            "Step ",
                            i + 1),
                        React.createElement("h3", { className: "mt-2 text-[21px] font-bold tracking-tight" }, t),
                        React.createElement("p", { className: "mt-2 text-[15px] text-slatey leading-relaxed" }, b))))))),
            React.createElement("section", { className: "pt-16 md:pt-24" },
                React.createElement("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4" }, [['shield', 'Verified communities', 'We check registration and past trips before adding the verified mark.'],
                    ['wallet', 'Transparent pricing', 'Per-person price, inclusions and exclusions listed on every trip.'],
                    ['wa', 'Direct organizer contact', 'Talk to the person running the trip before you pay anything.'],
                    ['inbox', 'Enquiries, not spam', 'Your details go to one organizer — the one whose trip you picked.']
                ].map(([ic, t, b]) => (React.createElement("div", { key: t, className: "rounded-2xl border border-line p-5" },
                    React.createElement("span", { className: "inline-flex w-10 h-10 rounded-full bg-shell text-earth items-center justify-center" },
                        React.createElement(Icon, { name: ic, size: 19 })),
                    React.createElement("h3", { className: "mt-3.5 font-bold text-[15.5px] tracking-tight" }, t),
                    React.createElement("p", { className: "mt-1.5 text-[13.5px] text-slatey leading-relaxed" }, b)))))),
            React.createElement("section", { className: "pt-16 md:pt-24" },
                React.createElement("div", { className: "relative rounded-3xl overflow-hidden" },
                    React.createElement("img", { src: sceneURL('desert', 4242), alt: "", className: "absolute inset-0 w-full h-full object-cover" }),
                    React.createElement("div", { className: "absolute inset-0 bg-ink/72" }),
                    React.createElement("div", { className: "relative p-8 sm:p-14 text-white max-w-2xl" },
                        React.createElement("p", { className: "text-beige text-[13px] font-bold tracking-[.14em]" }, "FOR TRAVEL COMMUNITIES"),
                        React.createElement("h2", { className: "mt-3 text-[32px] sm:text-[44px] font-extrabold tracking-[-0.03em] leading-[1.02]" }, "Turn your trips into bookings."),
                        React.createElement("p", { className: "mt-4 text-white/80 text-[16.5px] leading-relaxed" }, "List your upcoming trips, get enquiries with phone numbers attached, and close them on WhatsApp. No commission on your bookings."),
                        React.createElement("div", { className: "mt-7 flex flex-col sm:flex-row gap-3" },
                            React.createElement(Btn, { variant: "beige", size: "lg", onClick: () => go('/signup?role=ORGANIZER') }, "List your trip"),
                            React.createElement(
    Btn,
    {
        variant: "outline",
        size: "lg",
        className: "bg-white text-ink border-white min-w-[210px] hover:bg-white/90 hover:text-ink",
        onClick: () => go('/for-communities')
    },
    "See how it works"
))))))));
}
