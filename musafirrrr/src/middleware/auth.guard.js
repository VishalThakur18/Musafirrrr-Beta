"use strict";
/* ============================================================
   MIDDLEWARE — ROUTE GUARD
   Protects traveller/organizer pages by role.
   ============================================================ */

/** Route guard: only lets the right role in. */
function Guard({ role, children }) {
    const me = authService.current();
    if (!me)
        return (React.createElement("main", { className: "max-w-shell mx-auto px-5 py-24" },
            React.createElement(EmptyState, { icon: "user", title: "Log in to see this", body: "This page belongs to your account.", action: React.createElement("div", { className: "flex gap-3" },
                    React.createElement(Btn, { onClick: () => go('/login') }, "Log in"),
                    React.createElement(Btn, { variant: "outline", onClick: () => go('/signup') }, "Sign up")) })));
    if (role && me.role !== role)
        return (React.createElement("main", { className: "max-w-shell mx-auto px-5 py-24" },
            React.createElement(EmptyState, { icon: "shield", title: "Wrong door", body: `You're signed in as a ${me.role.toLowerCase()}. This area is for ${role.toLowerCase()} accounts.`, action: React.createElement(Btn, { onClick: () => go(me.role === 'ORGANIZER' ? '/organizer/dashboard' : '/traveller/dashboard') }, "Go to my dashboard") })));
    return children;
}
