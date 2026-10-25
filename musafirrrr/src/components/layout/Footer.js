"use strict";
/* ============================================================
   LAYOUT — FOOTER
   ============================================================ */

/** Site footer. */
function Footer() {
    const cols = [
        ['Explore', [['All trips', '/explore'], ['Destinations', '/explore'], ['Categories', '/explore?cat=Trek'], ['Saved trips', '/saved']]],
        ['For communities', [['List a trip', '/for-communities'], ['Organizer login', '/login?role=ORGANIZER'], ['How it works', '/how-it-works'], ['Create a trip', '/organizer/create']]],
        ['Company', [['About', '/how-it-works'], ['Contact', '/how-it-works'], ['Terms', '/how-it-works'], ['Privacy', '/how-it-works']]]
    ];
    return (React.createElement("footer", { className: "bg-ink text-white mt-24" },
        React.createElement("div", { className: "max-w-shell mx-auto px-5 lg:px-8 py-14 md:py-16" },
            React.createElement("div", { className: "grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]" },
                React.createElement("div", null,
                    React.createElement(Logo, { tone: "light" }),
                    React.createElement("p", { className: "mt-3 text-[15px] text-white/70 max-w-xs leading-relaxed" }, "Your next adventure starts here. All group trips from India's travel communities, in one place."),
                    React.createElement("div", { className: "mt-5 flex gap-3" },
                        React.createElement("a", { href: "https://instagram.com/musafirrrr", target: "_blank", rel: "noopener noreferrer", "aria-label": "Instagram", className: "w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors" },
                            React.createElement(Icon, { name: "ig", size: 18 })),
                        React.createElement("a", { href: waLink('919999999999', 'Hi Musafirrrr! I have a question.'), target: "_blank", rel: "noopener noreferrer", "aria-label": "WhatsApp", className: "w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white/10 transition-colors" },
                            React.createElement(Icon, { name: "wa", size: 18 })))),
                cols.map(([t, links]) => (React.createElement("div", { key: t },
                    React.createElement("h4", { className: "text-[13px] font-bold tracking-[.1em] text-beige" }, t),
                    React.createElement("ul", { className: "mt-4 space-y-2.5 text-[14.5px] text-white/75" }, links.map(([l, to]) => React.createElement("li", { key: l },
                        React.createElement(Link, { to: to, className: "hover:text-white transition-colors" }, l)))))))),
            React.createElement("div", { className: "mt-12 pt-6 border-t border-white/12 flex flex-col sm:flex-row gap-3 justify-between text-[13px] text-white/55" },
                React.createElement("span", null,
                    "\u00A9 ",
                    new Date().getFullYear(),
                    " Musafirrrr. Made for travellers and the people who take them places."),
                React.createElement("span", null, "Demo build \u2014 trips and organizers shown here are sample data.")))));
}
