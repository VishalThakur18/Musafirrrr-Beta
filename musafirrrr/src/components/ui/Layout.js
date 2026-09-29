"use strict";
/* ============================================================
   UI — STAT & SECTION HEADER
   ============================================================ */

/** Dashboard stat tile. */
function Stat({ label, value, sub, icon }) {
    return (React.createElement("div", { className: "rounded-2xl border border-line bg-white p-5" },
        React.createElement("div", { className: "flex items-center justify-between" },
            React.createElement("span", { className: "text-[13px] font-semibold text-muted" }, label),
            icon && React.createElement("span", { className: "text-beige" },
                React.createElement(Icon, { name: icon, size: 18 }))),
        React.createElement("div", { className: "mt-2 text-3xl font-extrabold tracking-tight text-ink" }, value),
        sub && React.createElement("div", { className: "mt-1 text-[12.5px] text-muted" }, sub)));
}

/** Section heading with optional action. */
function SectionHead({ title, sub, action }) {
    return (React.createElement("div", { className: "flex items-end justify-between gap-6 mb-6" },
        React.createElement("div", null,
            React.createElement("h2", { className: "text-[26px] sm:text-[32px] font-extrabold tracking-[-0.02em] leading-tight" }, title),
            sub && React.createElement("p", { className: "mt-1.5 text-[15px] text-slatey max-w-xl leading-relaxed" }, sub)),
        action));
}
