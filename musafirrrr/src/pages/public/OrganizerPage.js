"use strict";
/* ============================================================
   PAGE — PUBLIC ORGANIZER PROFILE  (#/o/:slug)
   ============================================================ */

/** Public organizer profile (#/o/:slug). */
/* ---------- organizer public profile ---------- */
function OrganizerPage({ slug }) {
    const s = useStore();
    const { loading, error, data, reload } = useAsync(() => tripApi.organizerPage(slug), [slug]);
    const [tab, setTab] = useState('upcoming');
    const [loginOpen, setLoginOpen] = useState(false);

    // Real organizer first; the mock store is only a fallback until Explore and Home are converted
    const org = data ? data.org : organizerService.bySlug(slug);

    useEffect(() => {
        if (!data)
            return;
        const o = data.org;
        setMeta(`${o.name} — group trips on Musafirrrr`, `${(o.bio || '').slice(0, 150)} See upcoming trips from ${o.name}${o.city ? ', based in ' + o.city : ''}.`);
    }, [data ? data.org.id : null]);

    if (!org) {
        if (loading)
            return React.createElement("main", { className: "max-w-shell mx-auto px-5 py-24" },
                React.createElement("p", { className: "text-slatey" }, "Loading profile..."));
        if (error)
            return React.createElement("main", { className: "max-w-shell mx-auto px-5 py-24" },
                React.createElement(EmptyState, { title: "We couldn't load this profile", body: "Check your connection and try again.", action: React.createElement(Btn, { onClick: reload }, "Try again") }));
        return React.createElement("main", { className: "max-w-shell mx-auto px-5 py-24" },
            React.createElement(EmptyState, { title: "Organizer not found", body: "This profile may have been removed.", action: React.createElement(Btn, { onClick: () => go('/explore') }, "Explore trips") }));
    }

    const all = data ? data.trips : tripService.byOrganizer(org.id);
    const upcoming = all.filter(t => t.status === 'PUBLISHED' || t.status === 'SOLD_OUT');
    const past = all.filter(t => t.status === 'COMPLETED')
        .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)));
    const list = (tab === 'upcoming' ? upcoming : past).map(t => data ? t : { ...t, organizer: org });

    const years = org.since ? new Date().getFullYear() - org.since : 0;
    const stats = [['Trips listed', all.length]];
    stats.push(org.travellers ? ['Travellers taken', org.travellers.toLocaleString('en-IN')] : ['Trips completed', past.length]);
    if (years >= 1)
        stats.push(['Years active', years]);
    const subline = [org.city, org.since ? 'organizing trips since ' + org.since : null].filter(Boolean).join(' \u00B7 ');

    return (React.createElement("main", { className: "consistent-page public-organizer-profile" },
        React.createElement("div", { className: "public-profile-cover relative overflow-hidden bg-shell" },
            React.createElement("img", { ...responsivePhoto(org.banner_url || sceneURL(org.logoKind || 'mountains', (org.logoSeed || 11) + 500), 1600, '100vw'), onError: e => originalPhotoOnError(e, org.banner_url || sceneURL(org.logoKind || 'mountains', (org.logoSeed || 11) + 500)), fetchPriority: 'high', decoding: 'async', alt: "", className: "w-full h-full object-cover" }),
            React.createElement("div", { className: cls('absolute inset-0', org.banner_url ? 'bg-ink/10' : 'bg-ink/35') })),
        React.createElement("div", { className: "max-w-shell mx-auto px-5 lg:px-8" },
            React.createElement("section", { className: "public-profile-summary page-card", "aria-label": "About this community" },
            React.createElement("div", { className: "public-profile-identity" },
                React.createElement("div", { className: "rounded-full ring-4 ring-white shadow-lift shrink-0 self-start" },
                    React.createElement(OrgLogo, { org: org, size: 96 })),
                React.createElement("div", { className: "public-profile-name" },
                    React.createElement("div", { className: "flex items-center gap-2.5 flex-wrap" },
                    React.createElement("h1", { className: "text-[28px] sm:text-[36px] font-extrabold tracking-[-0.03em]" }, org.name),
                    org.verified && React.createElement(Verified, { size: 15 }),
                    React.createElement(OrgRating, { org, size: 16 })),
                    subline && React.createElement("p", { className: "text-[14.5px] text-slatey mt-1" }, subline)),
                React.createElement("div", { className: "public-profile-contact" },
                    org.whatsapp && React.createElement(WhatsAppButton, { org: org, label: "WhatsApp", message: `Hi ${org.name}! I found you on Musafirrrr and wanted to ask about your upcoming trips.` }),
                    React.createElement(InstagramButton, { org: org, label: "Instagram" }))),
            org.bio && React.createElement("p", { className: "public-profile-bio" }, org.bio),
            React.createElement("div", { className: cls('public-profile-stats grid gap-3', stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2') }, stats.map(([l, v]) => (React.createElement("div", { key: l, className: "public-profile-stat" },
                React.createElement("div", { className: "text-[26px] font-extrabold tracking-tight" }, v),
                React.createElement("div", { className: "text-[12.5px] text-muted mt-0.5" }, l))))),
            ),
            React.createElement("div", { className: "public-profile-trips-heading" },
                React.createElement("h2", null, "Find your next adventure"),
                React.createElement("p", null, "Explore the journeys this community brings to life.")),
            React.createElement("div", { className: "public-profile-tabs", "aria-label": "Filter trips" }, [['upcoming', 'Upcoming trips', upcoming.length], ['past', 'Past trips', past.length]].map(([v, l, n]) => (React.createElement("button", { key: v, type: "button", "aria-pressed": tab === v, onClick: () => setTab(v), className: cls('public-profile-tab', tab === v && 'is-active') },
                l,
                " ",
                React.createElement("span", { className: "text-[13px] text-muted" }, n))))),
            React.createElement("div", { className: "mt-7" },
                React.createElement(TripGrid, { trips: list, cols: "4", empty: React.createElement(EmptyState, { title: tab === 'upcoming' ? 'No upcoming trips right now' : 'No past trips on record', body: tab === 'upcoming' ? 'Follow them on Instagram to hear when the next one opens.' : 'Their completed trips will show up here.', action: org.instagram ? React.createElement(InstagramButton, { org: org }) : undefined }) })),
                React.createElement("section", { className: "public-profile-reviews page-card" },
                React.createElement(ReviewsSection, { kind: "organizer", targetId: org.id, heading: "Reviews of " + org.name, open: all.some(t => t.endDate && t.endDate < reviewsToday()), onLogin: () => setLoginOpen(true), onChanged: reload }))),
            React.createElement(LoginPrompt, { open: loginOpen, onClose: () => setLoginOpen(false), action: 'write a review' })));
}
