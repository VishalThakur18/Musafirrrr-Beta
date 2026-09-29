"use strict";
/* ============================================================
   PAGE — FOR COMMUNITIES  (#/for-communities)
   ============================================================ */

/** For communities (#/for-communities). */
function ForCommunitiesPage() {
    return (React.createElement("main", null,
        React.createElement("section", { className: "relative" },
            React.createElement("div", { className: "absolute inset-0" },
                React.createElement("img", { src: sceneURL('valley', 7777), alt: "", className: "w-full h-full object-cover" }),
                React.createElement("div", { className: "absolute inset-0 bg-ink/70" })),
            React.createElement("div", { className: "relative max-w-shell mx-auto px-5 lg:px-8 py-20 md:py-28 text-white" },
                React.createElement("div", { className: "max-w-2xl" },
                    React.createElement("p", { className: "text-beige text-[13px] font-bold tracking-[.14em]" }, "FOR TRAVEL COMMUNITIES AND AGENCIES"),
                    React.createElement("h1", { className: "mt-4 text-[42px] sm:text-[62px] font-extrabold tracking-[-0.035em] leading-[1.02]" }, "Your trips, in front of people already looking."),
                    React.createElement("p", { className: "mt-5 text-white/85 text-[18px] leading-relaxed" }, "Stop losing enquiries in Instagram DMs. List your upcoming trips, collect enquiries with phone numbers, and close them on WhatsApp."),
                    React.createElement("div", { className: "mt-8 flex flex-col sm:flex-row gap-3" },
                        React.createElement(Btn, { variant: "beige", size: "lg", onClick: () => go('/signup?role=ORGANIZER') }, "Create your community profile"),
                        React.createElement(Btn, {
    variant: "outline",
    size: "lg",
    className: "bg-white text-ink border-white min-w-[210px] hover:bg-white/90 hover:text-ink",
    onClick: () => go('/login?role=ORGANIZER')
}, "Organizer login"))))),
        React.createElement("div", { className: "max-w-shell mx-auto px-5 lg:px-8 py-16 md:py-24" },
            React.createElement("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4" }, [['inbox', 'Every enquiry in one inbox', 'Name, phone, email, group size and message — sorted by status.'],
                ['img', 'Trip pages that sell', 'Itinerary, inclusions, photos and spots left, laid out the same way on every trip.'],
                ['chart', 'See what is working', 'Active trips, spots left and lead counts on one dashboard.'],
                ['wa', 'WhatsApp-first', 'One tap opens a chat with the traveller, message already written.']
            ].map(([ic, t, b]) => (React.createElement("div", { key: t, className: "rounded-2xl border border-line p-6" },
                React.createElement("span", { className: "inline-flex w-11 h-11 rounded-full bg-shell text-earth items-center justify-center" },
                    React.createElement(Icon, { name: ic, size: 20 })),
                React.createElement("h3", { className: "mt-4 font-bold text-[16.5px] tracking-tight" }, t),
                React.createElement("p", { className: "mt-1.5 text-[14.5px] text-slatey leading-relaxed" }, b))))),
            React.createElement("div", { className: "mt-16 grid lg:grid-cols-2 gap-10 items-center" },
                React.createElement("div", null,
                    React.createElement("h2", { className: "text-[32px] font-extrabold tracking-[-0.03em] leading-tight" }, "Free while we're in beta"),
                    React.createElement("p", { className: "mt-4 text-[16.5px] text-slatey leading-relaxed max-w-[60ch]" }, "No listing fee, no commission, no lock-in. Travellers contact you directly and pay you directly. We are building the audience; you keep the relationship."),
                    React.createElement("ul", { className: "mt-6 space-y-3" }, ['Unlimited trip listings', 'A public profile page at musafirrrr.com/o/your-name', 'Enquiry management with status tracking', 'Verification review once you have run three trips'].map(x => (React.createElement("li", { key: x, className: "flex gap-2.5 text-[15.5px]" },
                        React.createElement(Icon, { name: "check", size: 18, className: "text-ok mt-0.5 shrink-0" }),
                        x)))),
                    React.createElement(Btn, { size: "lg", className: "mt-8", onClick: () => go('/signup?role=ORGANIZER') }, "Get started free")),
                React.createElement("div", { className: "rounded-3xl border border-line overflow-hidden shadow-card" },
                    React.createElement("img", { src: sceneURL('snow', 3131), alt: "", className: "w-full h-64 object-cover" }),
                    React.createElement("div", { className: "p-6" },
                        React.createElement("p", { className: "text-[17px] leading-relaxed text-slatey" }, "\u201CWe were running four trips a month and answering the same questions in fifty DMs. Now people read the itinerary first and message us when they're ready to book.\u201D"),
                        React.createElement("div", { className: "mt-4 flex items-center gap-3" },
                            React.createElement(Avatar, { kind: "snow", seed: 23, size: 40 }),
                            React.createElement("div", null,
                                React.createElement("div", { className: "font-bold text-[14.5px]" }, "Himalayan Trails"),
                                React.createElement("div", { className: "text-[12.5px] text-muted" }, "Manali \u00B7 on Musafirrrr since the beta")))))))));
}
