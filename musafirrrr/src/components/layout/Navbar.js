"use strict";
/* ============================================================
   LAYOUT — NAVBAR
   ============================================================ */

/** Shared scroll behaviour. Passive events only schedule one update per frame. */
function useNavbarScroll(menuOpen, route, headerRef) {
    const [hidden, setHidden] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    useEffect(() => {
        const position = () => Math.max(0, Math.min(window.scrollY,
            Math.max(0, document.documentElement.scrollHeight - window.innerHeight)));
        let previous = position();
        let direction = 0;
        let travel = 0;
        let frame = 0;
        let keyboard = false;
        setHidden(false);
        setScrolled(previous > 12);
        const update = () => {
            frame = 0;
            const y = position();
            const delta = y - previous;
            previous = y;
            setScrolled(y > 12);
            if (menuOpen || y <= 24 || (keyboard && headerRef.current?.contains(document.activeElement))) {
                setHidden(false);
                direction = 0;
                travel = 0;
                return;
            }
            if (Math.abs(delta) < 1) return;
            const next = delta > 0 ? 1 : -1;
            if (next !== direction) { direction = next; travel = 0; }
            travel += Math.abs(delta);
            if (travel >= (direction > 0 ? 32 : 14)) {
                if (direction < 0 || y > (headerRef.current?.offsetHeight || 72) + 24) setHidden(direction > 0);
                travel = 0;
            }
        };
        const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
        const key = event => {
            if (event.key === 'Tab') { keyboard = true; setHidden(false); }
        };
        const pointer = () => { keyboard = false; };
        window.addEventListener('scroll', scroll, { passive: true });
        window.addEventListener('keydown', key);
        window.addEventListener('pointerdown', pointer, { passive: true });
        window.addEventListener('wheel', pointer, { passive: true });
        window.addEventListener('touchstart', pointer, { passive: true });
        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', scroll);
            window.removeEventListener('keydown', key);
            window.removeEventListener('pointerdown', pointer);
            window.removeEventListener('wheel', pointer);
            window.removeEventListener('touchstart', pointer);
        };
    }, [menuOpen, route]);
    return { hidden, scrolled, reveal: () => setHidden(false) };
}

/** Top navigation bar. */
function Navbar() {
    const s = useStore();
    const { user: me, ready: authReady } = useAuth();
    const [open, setOpen] = useState(false);
    const headerRef = useRef(null);
    const route = useRoute();
    const { hidden, scrolled, reveal } = useNavbarScroll(open, route, headerRef);
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

    return (React.createElement("header", { ref: headerRef, onFocusCapture: reveal, className: cls('site-navbar sticky z-50 bg-white/92 backdrop-blur-md border-b border-line', hidden && !open ? 'site-navbar--hidden' : '', scrolled ? 'shadow-[0_1px_0_#E7E0D7,0_8px_24px_-20px_rgba(19,32,37,.4)]' : ''), style: { top: 'env(safe-area-inset-top,0px)' } },
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
                            (me.role === 'ORGANIZER' && me.organizer)
                                ? React.createElement(OrgLogo, { org: me.organizer, size: 38 })
                                : React.createElement(Avatar, { kind: me.avatarKind || 'mountains', seed: me.avatarSeed || 5, size: 38, name: me.name }))),
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
