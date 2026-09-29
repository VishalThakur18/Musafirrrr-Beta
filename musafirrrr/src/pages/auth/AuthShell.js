"use strict";
/* ============================================================
   AUTH — SHARED LAYOUT & DEMO CREDENTIALS
   ============================================================ */

/** Shared layout for login/signup. */
function AuthShell({ children, title, sub }) {
    return (React.createElement("main", { className: "min-h-[calc(100vh-72px)] grid lg:grid-cols-2" },
        React.createElement("div", { className: "hidden lg:block relative" },
            React.createElement("img", { src: sceneURL('mountains', 5150), alt: "", className: "absolute inset-0 w-full h-full object-cover" }),
            React.createElement("div", { className: "absolute inset-0 bg-ink/55" }),
            React.createElement("div", { className: "relative h-full flex flex-col justify-end p-12 text-white" },
                React.createElement("blockquote", { className: "text-[28px] font-extrabold tracking-[-0.03em] leading-[1.15] max-w-md" }, "Everything from a weekend in Rishikesh to eight days in Spiti \u2014 listed by the people who actually run them."),
                React.createElement("p", { className: "mt-4 text-white/70 text-[15px]" },
                    tripService.published().length,
                    " trips live from ",
                    ORGANIZERS.length,
                    " communities"))),
        React.createElement("div", { className: "flex items-center justify-center px-5 py-12 sm:py-16" },
            React.createElement("div", { className: "w-full max-w-[420px]" },
                React.createElement("h1", { className: "text-[32px] font-extrabold tracking-[-0.03em] leading-tight" }, title),
                sub && React.createElement("p", { className: "mt-2 text-[15.5px] text-slatey leading-relaxed" }, sub),
                children))));
}

/** Demo login shortcuts. */
function DemoCreds({ onUse }) {
    return (React.createElement("div", { className: "mt-6 rounded-2xl border border-dashed border-beige bg-sand p-4" },
        React.createElement("p", { className: "text-[12px] font-bold tracking-[.1em] text-earth" }, "DEMO ACCOUNTS"),
        React.createElement("div", { className: "mt-2.5 space-y-2 text-[13.5px]" },
            React.createElement("button", { onClick: () => onUse('traveller@demo.com'), className: "w-full text-left flex justify-between items-center hover:text-earth" },
                React.createElement("span", null, "Traveller \u00B7 traveller@demo.com"),
                React.createElement("span", { className: "font-semibold underline underline-offset-4" }, "Use")),
            React.createElement("button", { onClick: () => onUse('organizer@demo.com'), className: "w-full text-left flex justify-between items-center hover:text-earth" },
                React.createElement("span", null, "Organizer \u00B7 organizer@demo.com"),
                React.createElement("span", { className: "font-semibold underline underline-offset-4" }, "Use"))),
        React.createElement("p", { className: "mt-2.5 text-[12.5px] text-muted" },
            "Password for both: ",
            React.createElement("strong", null, "password"))));
}
