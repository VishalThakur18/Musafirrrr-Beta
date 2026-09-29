"use strict";
/* ============================================================
   PAGE — PUBLIC ORGANIZER PROFILE  (#/o/:slug)
   ============================================================ */

/** Public organizer profile (#/o/:slug). */
/* ---------- organizer public profile ---------- */
function OrganizerPage({ slug }) {
    const s = useStore();
    const org = organizerService.bySlug(slug);
    const [tab, setTab] = useState('upcoming');
    if (!org)
        return React.createElement("main", { className: "max-w-shell mx-auto px-5 py-24" },
            React.createElement(EmptyState, { title: "Organizer not found", body: "This profile may have been removed.", action: React.createElement(Btn, { onClick: () => go('/explore') }, "Explore trips") }));
    const all = tripService.byOrganizer(org.id);
    const upcoming = all.filter(t => t.status === 'PUBLISHED' || t.status === 'SOLD_OUT');
    const past = all.filter(t => t.status === 'COMPLETED');
    const list = tab === 'upcoming' ? upcoming : past;
    return (React.createElement("main", null,
        React.createElement("div", { className: "relative h-44 md:h-64 overflow-hidden" },
            React.createElement("img", { src: sceneURL(org.logoKind, org.logoSeed + 500), alt: "", className: "w-full h-full object-cover" }),
            React.createElement("div", { className: "absolute inset-0 bg-ink/35" })),
        React.createElement("div", { className: "max-w-shell mx-auto px-5 lg:px-8" },
            React.createElement("div", { className: "-mt-14 md:-mt-16 relative flex flex-col md:flex-row md:items-end gap-5" },
                React.createElement(Avatar, { kind: org.logoKind, seed: org.logoSeed, size: 112, name: org.name, className: "ring-4 ring-white shadow-lift" }),
                React.createElement("div", { className: "flex-1 pb-1" },
                    React.createElement("div", { className: "flex items-center gap-2.5 flex-wrap" },
                        React.createElement("h1", { className: "text-[28px] sm:text-[36px] font-extrabold tracking-[-0.03em]" }, org.name),
                        org.verified && React.createElement(Verified, { size: 15 })),
                    React.createElement("p", { className: "text-[14.5px] text-slatey mt-1" },
                        org.city,
                        " \u00B7 organizing trips since ",
                        org.since)),
                React.createElement("div", { className: "flex gap-2.5 pb-1" },
                    org.whatsapp && React.createElement(Btn, { as: "a", variant: "wa", icon: "wa", href: waLink(org.whatsapp, `Hi ${org.name}! I found you on Musafirrrr and wanted to ask about your upcoming trips.`), target: "_blank", rel: "noopener noreferrer" }, "WhatsApp"),
                    React.createElement(InstagramButton, { org: org, label: "Instagram" }))),
            React.createElement("p", { className: "mt-6 text-[16.5px] text-slatey leading-[1.75] max-w-[68ch]" }, org.bio),
            React.createElement("div", { className: "mt-7 grid grid-cols-3 gap-3 max-w-lg" }, [['Trips listed', all.length], ['Travellers taken', org.travellers.toLocaleString('en-IN')], ['Years active', new Date().getFullYear() - org.since]].map(([l, v]) => (React.createElement("div", { key: l, className: "rounded-2xl border border-line p-4" },
                React.createElement("div", { className: "text-[26px] font-extrabold tracking-tight" }, v),
                React.createElement("div", { className: "text-[12.5px] text-muted mt-0.5" }, l))))),
            React.createElement("div", { className: "mt-10 border-b border-line flex gap-6" }, [['upcoming', 'Upcoming trips', upcoming.length], ['past', 'Past trips', past.length]].map(([v, l, n]) => (React.createElement("button", { key: v, onClick: () => setTab(v), className: cls('pb-3 text-[15px] font-semibold border-b-2 -mb-px transition-colors', tab === v ? 'border-ink text-ink' : 'border-transparent text-muted hover:text-slatey') },
                l,
                " ",
                React.createElement("span", { className: "text-[13px] text-muted" }, n))))),
            React.createElement("div", { className: "mt-7" },
                React.createElement(TripGrid, { trips: list, cols: "3", empty: React.createElement(EmptyState, { title: tab === 'upcoming' ? 'No upcoming trips right now' : 'No past trips on record', body: tab === 'upcoming' ? 'Follow them on Instagram to hear when the next one opens.' : 'Their completed trips will show up here.', action: React.createElement(InstagramButton, { org: org }) }) })))));
}
