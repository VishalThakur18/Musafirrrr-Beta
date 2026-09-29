"use strict";
/* ============================================================
   APP — ROOT COMPONENT & ROUTE TABLE
   Maps every URL to a page and wraps them in the layout.
   ============================================================ */

/** Updates page title and meta description for SEO. */
function setMeta(title, desc) {
    document.title = title;
    let m = document.querySelector('meta[name="description"]');
    if (m)
        m.setAttribute('content', desc);
}

/** Sends a logged-in user to their dashboard. */
function RedirectHome() {
    const me = authService.current();
    useEffect(() => { go(me.role === 'ORGANIZER' ? '/organizer/dashboard' : '/traveller/dashboard'); }, []);
    return null;
}

/** Root component: routing + layout. */
function App() {
    const s = useStore();
    const hash = useRoute();
    const { path, parts, params } = parsePath(hash);
    const me = authService.current();
    useEffect(() => {
        if (parts[0] === 'trip' && parts[1]) {
            const t = tripService.bySlug(parts[1]);
            const o = t && organizerService.byId(t.organizerId);
            if (t)
                setMeta(`${t.title} — ${t.destination} · ${INR(t.price)} | Musafirrrr`, `${t.days}D/${t.nights}N group trip to ${t.destination} with ${o ? o.name : 'a verified organizer'}, ${dateRange(t.startDate, t.endDate)}. ${INR(t.price)} per person. ${t.description.slice(0, 110)}`);
        }
        else if (parts[0] === 'o' && parts[1]) {
            const o = organizerService.bySlug(parts[1]);
            if (o)
                setMeta(`${o.name} — group trips on Musafirrrr`, `${o.bio.slice(0, 150)} See upcoming trips from ${o.name}, based in ${o.city}.`);
        }
        else if (path === '/explore') {
            setMeta('Explore group trips across India | Musafirrrr', 'Search upcoming group trips by destination, dates, budget, trip type and group type.');
        }
        else {
            setMeta('Musafirrrr — All group trips. One place.', 'Discover upcoming group trips from trusted travel communities and organizers across India, then connect with them directly.');
        }
    }, [hash]);
    let page;
    if (path === '/')
        page = React.createElement(HomePage, null);
    else if (path === '/explore')
        page = React.createElement(ExplorePage, { params: params });
    else if (parts[0] === 'trip')
        page = React.createElement(TripDetailPage, { slug: parts[1] });
    else if (parts[0] === 'o')
        page = React.createElement(OrganizerPage, { slug: parts[1] });
    else if (path === '/how-it-works')
        page = React.createElement(HowItWorksPage, null);
    else if (path === '/for-communities')
        page = React.createElement(ForCommunitiesPage, null);
    else if (path === '/login')
        page = me ? React.createElement(RedirectHome, null) : React.createElement(LoginPage, { params: params });
    else if (path === '/signup')
        page = me ? React.createElement(RedirectHome, null) : React.createElement(SignupPage, { params: params });
    else if (path === '/saved')
        page = React.createElement(SavedPage, null);
    else if (path === '/traveller/dashboard')
        page = React.createElement(Guard, { role: "TRAVELLER" },
            React.createElement(TravellerDashboard, null));
    else if (path === '/traveller/my-trips')
        page = React.createElement(Guard, { role: "TRAVELLER" },
            React.createElement(TravellerMyTrips, null));
    else if (path === '/traveller/profile')
        page = React.createElement(Guard, { role: "TRAVELLER" },
            React.createElement(TravellerProfile, null));
    else if (path.startsWith('/organizer')) {
        const inner = path === '/organizer/dashboard' ? React.createElement(OrganizerDashboard, null) :
            path === '/organizer/trips' ? React.createElement(OrganizerTrips, null) :
                path === '/organizer/create' ? React.createElement(TripWizard, null) :
                    parts[1] === 'edit' ? React.createElement(TripWizard, { tripId: parts[2] }) :
                        path === '/organizer/leads' ? React.createElement(OrganizerLeads, null) :
                            path === '/organizer/profile' ? React.createElement(OrganizerProfileEdit, null) :
                                path === '/organizer/settings' ? React.createElement(OrganizerSettings, null) :
                                    React.createElement(OrganizerDashboard, null);
        page = React.createElement(Guard, { role: "ORGANIZER" },
            React.createElement(OrganizerShell, null, inner));
    }
    else
        page = (React.createElement("main", { className: "max-w-shell mx-auto px-5 py-24" },
            React.createElement(EmptyState, { icon: "compass", title: "This page doesn't exist", body: "The link may be old or mistyped. Everything live is on the explore page.", action: React.createElement(Btn, { onClick: () => go('/explore') }, "Explore trips") })));
    const bare = path === '/login' || path === '/signup';
    return (React.createElement(React.Fragment, null,
        React.createElement(Navbar, null),
        React.createElement("div", { key: hash, className: "fade-in" }, page),
        !bare && React.createElement(Footer, null),
        React.createElement(MobileTabs, null),
        React.createElement(Toasts, null)));
}
