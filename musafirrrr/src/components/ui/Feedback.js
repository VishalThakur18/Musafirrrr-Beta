"use strict";
/* ============================================================
   UI — TOASTS, EMPTY STATE, SKELETON
   ============================================================ */

/** Renders active toast messages. */
function Toasts() {
    const s = useStore();
    return (React.createElement("div", { className: "fixed left-1/2 -translate-x-1/2 bottom-24 md:bottom-8 z-[120] flex flex-col gap-2 items-center px-4 w-full max-w-md pointer-events-none" }, s.toasts.map(t => (React.createElement("div", { key: t.id, className: cls('fade-in pointer-events-auto rounded-full pl-4 pr-5 py-3 text-[13.5px] font-medium shadow-lift flex items-center gap-2', t.kind === 'bad' ? 'bg-bad text-white' : 'bg-ink text-white') },
        React.createElement(Icon, { name: t.kind === 'bad' ? 'info' : 'check', size: 16 }),
        t.msg)))));
}

/** Friendly empty/placeholder block. */
function EmptyState({ title, body, action, icon = 'compass' }) {
    return (React.createElement("div", { className: "text-center py-16 px-6" },
        React.createElement("div", { className: "mx-auto w-14 h-14 rounded-full bg-shell flex items-center justify-center text-earth" },
            React.createElement(Icon, { name: icon, size: 24 })),
        React.createElement("h3", { className: "mt-5 text-xl font-bold tracking-tight" }, title),
        body && React.createElement("p", { className: "mt-2 text-[15px] text-slatey max-w-sm mx-auto leading-relaxed" }, body),
        action && React.createElement("div", { className: "mt-6 flex justify-center" }, action)));
}

/** Loading placeholder for a trip card. */
function CardSkeleton() {
    return (React.createElement("div", { className: "rounded-xl2 overflow-hidden border border-line bg-white" },
        React.createElement("div", { className: "aspect-[4/3] shimmer" }),
        React.createElement("div", { className: "p-4 space-y-2.5" },
            React.createElement("div", { className: "h-3 w-20 shimmer rounded" }),
            React.createElement("div", { className: "h-4 w-4/5 shimmer rounded" }),
            React.createElement("div", { className: "h-3 w-2/3 shimmer rounded" }),
            React.createElement("div", { className: "h-6 w-24 shimmer rounded mt-3" }))));
}
