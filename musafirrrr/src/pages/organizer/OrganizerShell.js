"use strict";
/* ============================================================
   ORGANIZER — SIDEBAR LAYOUT
   ============================================================ */

/** Organizer layout with sidebar. */
function OrganizerShell({ children }) {
    const route = useRoute().split('?')[0];
    const me = authService.current();
    const org = organizerService.byId(me.organizerId);
    const s = useStore();
    const [drawer, setDrawer] = useState(false);
    useEffect(() => { setDrawer(false); }, [route]);
    const newLeads = enquiryService.forOrganizer(org.id).filter(e => e.status === 'NEW').length;
    const NavItems = ({ onClick }) => (React.createElement("nav", { className: "space-y-1" }, ORG_NAV.map(([to, ic, l]) => {
        const active = route === to;
        return (React.createElement(Link, { key: to, to: to, onClick: onClick, className: cls('flex items-center gap-3 px-3.5 h-11 rounded-xl text-[14.5px] font-semibold transition-colors', active ? 'bg-ink text-white' : 'text-slatey hover:bg-shell') },
            React.createElement(Icon, { name: ic, size: 18 }),
            l,
            l === 'Leads' && newLeads > 0 && React.createElement("span", { className: cls('ml-auto text-[11.5px] px-2 py-0.5 rounded-full', active ? 'bg-white/20' : 'bg-beige text-ink') }, newLeads)));
    })));
    return (React.createElement("div", { className: "max-w-shell mx-auto px-5 lg:px-8 py-6 md:py-10" },
        React.createElement("div", { className: "lg:hidden flex items-center gap-3 mb-6" },
            React.createElement("button", { onClick: () => setDrawer(true), className: "w-11 h-11 rounded-full border border-line flex items-center justify-center", "aria-label": "Organizer menu" },
                React.createElement(Icon, { name: "menu", size: 18 })),
            React.createElement("div", { className: "flex items-center gap-2.5 min-w-0" },
                React.createElement(Avatar, { kind: org.logoKind, seed: org.logoSeed, size: 34, name: org.name }),
                React.createElement("span", { className: "font-bold truncate" }, org.name)),
            React.createElement(Btn, { size: "sm", className: "ml-auto", icon: "plus", onClick: () => go('/organizer/create') }, "Trip")),
        React.createElement("div", { className: "grid lg:grid-cols-[236px_1fr] gap-10" },
            React.createElement("aside", { className: "hidden lg:block" },
                React.createElement("div", { className: "sticky", style: { top: 'calc(96px + env(safe-area-inset-top,0px))' } },
                    React.createElement("div", { className: "flex items-center gap-3 mb-6" },
                        React.createElement(Avatar, { kind: org.logoKind, seed: org.logoSeed, size: 44, name: org.name }),
                        React.createElement("div", { className: "min-w-0" },
                            React.createElement("div", { className: "font-bold text-[15px] truncate" }, org.name),
                            React.createElement(Link, { to: '/o/' + org.slug, className: "text-[12.5px] text-muted hover:text-earth" }, "View public page"))),
                    React.createElement(NavItems, null),
                    React.createElement("button", { onClick: () => { authService.logout(); go('/'); toast('Logged out'); }, className: "mt-6 flex items-center gap-3 px-3.5 h-11 rounded-xl text-[14.5px] font-semibold text-slatey hover:bg-shell w-full" },
                        React.createElement(Icon, { name: "logout", size: 18 }),
                        "Log out"))),
            React.createElement("div", { className: "min-w-0" }, children)),
        drawer && (React.createElement("div", { className: "lg:hidden fixed inset-0 z-[95]" },
            React.createElement("div", { className: "absolute inset-0 bg-ink/45 fade-in", onClick: () => setDrawer(false) }),
            React.createElement("div", { className: "absolute left-0 top-0 bottom-0 w-[82%] max-w-[320px] bg-white p-5 shadow-pop fade-in overflow-y-auto", style: { paddingTop: 'calc(20px + env(safe-area-inset-top,0px))' } },
                React.createElement("div", { className: "flex items-center justify-between mb-6" },
                    React.createElement(Logo, null),
                    React.createElement("button", { onClick: () => setDrawer(false), className: "w-9 h-9 rounded-full border border-line flex items-center justify-center" },
                        React.createElement(Icon, { name: "x", size: 16 }))),
                React.createElement(NavItems, { onClick: () => setDrawer(false) }),
                React.createElement("div", { className: "h-px bg-line my-5" }),
                React.createElement(Link, { to: '/o/' + org.slug, className: "block px-3.5 py-2.5 text-[14.5px] font-semibold text-slatey" }, "View public page"),
                React.createElement("button", { onClick: () => { authService.logout(); go('/'); }, className: "block px-3.5 py-2.5 text-[14.5px] font-semibold text-bad" }, "Log out"))))));
}
