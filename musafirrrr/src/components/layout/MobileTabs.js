"use strict";
/* ============================================================
   LAYOUT — MOBILE TAB BAR
   ============================================================ */

/** Bottom tab bar on mobile. */
function MobileTabs() {
    const me = authService.current();
    const s = useStore();
    const route = useRoute();
    if (!me || me.role !== 'TRAVELLER')
        return null;
    const items = [['/traveller/dashboard', 'grid', 'Home'], ['/explore', 'search', 'Explore'], ['/saved', 'heart', 'Saved'], ['/traveller/my-trips', 'bag', 'My trips'], ['/traveller/profile', 'user', 'Profile']];
    return (React.createElement("nav", { className: "md:hidden fixed bottom-0 left-0 right-0 z-[80] bg-white border-t border-line", style: { paddingBottom: 'env(safe-area-inset-bottom,0px)' } },
        React.createElement("div", { className: "grid grid-cols-5" }, items.map(([to, ic, label]) => {
            const active = route.split('?')[0] === to;
            return (React.createElement(Link, { key: to, to: to, className: cls('flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors', active ? 'text-ink' : 'text-muted') },
                React.createElement("span", { className: "relative" },
                    React.createElement(Icon, { name: ic, size: 21, fill: ic === 'heart' && s.wishlist.length && active ? 'currentColor' : 'none' }),
                    ic === 'heart' && s.wishlist.length > 0 && React.createElement("span", { className: "absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-bad text-white text-[9px] flex items-center justify-center" }, s.wishlist.length)),
                label));
        }))));
}
