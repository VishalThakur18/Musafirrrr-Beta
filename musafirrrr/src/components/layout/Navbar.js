"use strict";
/* ============================================================
   LAYOUT — NAVBAR
   ============================================================ */

/** Top navigation bar. */
function Navbar() {
    const s = useStore();
    const { user: me, ready: authReady } = useAuth();
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const route = useRoute();
    useEffect(() => { const f = () => setScrolled(window.scrollY > 12); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
    useEffect(() => { setOpen(false); }, [route]);
    const savedCount = s.wishlist.length;

    const logout = async () => {
        try {
            await authService.logout();   // also clears the shared auth state
            go('/');
            toast('Logged out');
        } catch (x) {
            toast(x.message || 'Could not log out. Try again.');
        }
    };

    return (React.createElement("header", { className: cls('sticky z-50 bg-white/92 backdrop-blur-md transition-shadow duration-200', scrolled ? 'shadow-[0_1px_0_#E7E0D7,0_8px_24px_-20px_rgba(19,32,37,.4)]' : 'border-b border-line'), style: { top: 'env(safe-area-inset-top,0px)' } },
        React.createElement("div", { className: "max-w-shell mx-auto px-5 lg:px-8" },
            React.createElement("div", { className: "h-16 md:h-[72px] flex items-center gap-6" },
                React.createElement(Logo, null),
                React.createElement("nav", { className: "hidden lg:flex items-center gap-1 text-[14.5px] font-medium text-slatey ml-2" },
                    React.createElement(Link, { to: "/explore", className: "px-3 py-2 rounded-full hover:bg-sand hover:text-ink transition-colors" }, "Explore"),
                    React.createElement(Link, { to: "/how-it-works", className: "px-3 py-2 rounded-full hover:bg-sand hover:text-ink transition-colors" }, "How it works"),
                    React.createElement(Link, { to: "/for-communities", className: "px-3 py-2 rounded-full hover:bg-sand hover:text-ink transition-colors" }, "For communities")),
                React.createElement("div", { className: "ml-auto flex items-center gap-2" },
                    React.createElement(Link, { to: "/saved", className: "relative hidden sm:inline-flex items-center gap-2 px-3 h-10 rounded-full text-[14.5px] font-medium text-slatey hover:bg-sand hover:text-ink transition-colors" },
                        React.createElement(Icon, { name: "heart", size: 17, fill: savedCount ? 'currentColor' : 'none', className: savedCount ? 'text-bad' : '' }),
                        " Saved",
                        savedCount > 0 && React.createElement("span", { className: "text-[12px] font-bold text-ink" }, savedCount)),
                    authReady && !me && React.createElement(React.Fragment, null,
                        React.createElement(Link, { to: "/for-communities", className: "hidden md:inline-flex items-center px-3 h-10 rounded-full text-[14.5px] font-medium text-slatey hover:bg-sand hover:text-ink transition-colors" }, "List a trip"),
                        React.createElement(Btn, { size: "sm", variant: "ghost", className: "hidden sm:inline-flex", onClick: () => go('/login') }, "Log in"),
                        React.createElement(Btn, { size: "sm", onClick: () => go('/signup'), className: "hidden sm:inline-flex" }, "Sign up")),
                    me && React.createElement(React.Fragment, null,
                        React.createElement(Btn, { size: "sm", variant: "outline", className: "hidden md:inline-flex", onClick: () => go(me.role === 'ORGANIZER' ? '/organizer/dashboard' : '/traveller/dashboard') }, me.role === 'ORGANIZER' ? 'Dashboard' : 'My trips'),
                        React.createElement("button", { onClick: () => go(me.role === 'ORGANIZER' ? '/organizer/profile' : '/traveller/profile'), className: "hidden sm:block", "aria-label": "Your profile" },
                            React.createElement(Avatar, { kind: me.avatarKind || 'mountains', seed: me.avatarSeed || 5, size: 38, name: me.name }))),
                    React.createElement("button", { onClick: () => setOpen(o => !o), "aria-label": "Menu", "aria-expanded": open, className: "lg:hidden w-10 h-10 rounded-full border border-line flex items-center justify-center" },
                        React.createElement(Icon, { name: open ? 'x' : 'menu', size: 18 }))))),
        open && (React.createElement("div", { className: "lg:hidden border-t border-line bg-white fade-in" },
            React.createElement("div", { className: "px-5 py-4 flex flex-col gap-1 text-[15.5px] font-medium" },
                React.createElement(Link, { to: "/explore", className: "py-2.5" }, "Explore trips"),
                React.createElement(Link, { to: "/saved", className: "py-2.5" },
                    "Saved trips ",
                    savedCount > 0 && React.createElement("span", { className: "text-muted" },
                        "(",
                        savedCount,
                        ")")),
                React.createElement(Link, { to: "/how-it-works", className: "py-2.5" }, "How it works"),
                React.createElement(Link, { to: "/for-communities", className: "py-2.5" }, "For communities"),
                React.createElement("div", { className: "h-px bg-line my-2" }),
                me ? React.createElement(React.Fragment, null,
                    React.createElement(Link, { to: me.role === 'ORGANIZER' ? '/organizer/dashboard' : '/traveller/dashboard', className: "py-2.5" }, "Dashboard"),
                    React.createElement("button", { className: "py-2.5 text-left text-bad", onClick: logout }, "Log out")) : authReady && React.createElement("div", { className: "flex gap-3 pt-1" },
                    React.createElement(Btn, { variant: "outline", className: "flex-1", onClick: () => go('/login') }, "Log in"),
                    React.createElement(Btn, { className: "flex-1", onClick: () => go('/signup') }, "Sign up")))))));
}