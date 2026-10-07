"use strict";

/* ============================================================
   ROUTE GUARD
   Protects traveller/organizer pages by role.
   ============================================================ */

function Guard({ role, children }) {
    const { user: me, ready } = useAuth();

    if (!ready) {
        return React.createElement("main", { className: "max-w-shell mx-auto px-5 py-24" },
            React.createElement("p", null, "Checking your session..."));
    }   

    if (!me) {
        return React.createElement(
            "main",
            { className: "max-w-shell mx-auto px-5 py-24" },
            React.createElement(EmptyState, {
                icon: "user",
                title: "Log in to see this",
                body: "This page belongs to your account.",
                action: React.createElement(
                    "div",
                    { className: "flex gap-3" },
                    React.createElement(
                        Btn,
                        { onClick: () => go("/login") },
                        "Log in"
                    ),
                    React.createElement(
                        Btn,
                        {
                            variant: "outline",
                            onClick: () => go("/signup")
                        },
                        "Sign up"
                    )
                )
            })
        );
    }

    const userRole = String(me.role || "").toUpperCase();
    const requiredRole = String(role || "").toUpperCase();

    if (requiredRole && userRole !== requiredRole) {
        const roleLabel = userRole
            ? userRole.toLowerCase()
            : "unknown";

        return React.createElement(
            "main",
            { className: "max-w-shell mx-auto px-5 py-24" },
            React.createElement(EmptyState, {
                icon: "shield",
                title: "Wrong door",
                body: `You're signed in as a ${roleLabel}. This area is for ${requiredRole.toLowerCase()} accounts.`,
                action: React.createElement(
                    Btn,
                    {
                        onClick: () =>
                            go(
                                userRole === "ORGANIZER"
                                    ? "/organizer/dashboard"
                                    : "/traveller/dashboard"
                            )
                    },
                    "Go to my dashboard"
                )
            })
        );
    }

    return children;
}