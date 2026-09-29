"use strict";
/* ============================================================
   UI — FORM CONTROLS
   ============================================================ */

/** Form field wrapper with label, hint and error. */
function Field({ label, hint, error, children, className }) {
    return (React.createElement("label", { className: cls('block', className) },
        React.createElement("span", { className: "block text-[13px] font-semibold text-slatey mb-1.5" }, label),
        children,
        error ? React.createElement("span", { className: "block text-[12px] text-bad mt-1.5" }, error)
            : hint ? React.createElement("span", { className: "block text-[12px] text-muted mt-1.5" }, hint) : null));
}

/** Shared input styling. */
const inputCls = 'w-full h-11 px-3.5 rounded-xl border border-line bg-white text-[15px] text-ink placeholder:text-muted/70 focus:border-slatey focus:ring-0 transition-colors duration-200';

/** Text input. */
function Input(props) { return React.createElement("input", { ...props, className: cls(inputCls, props.className) }); }

/** Dropdown select. */
function Select({ children, ...p }) {
    return (React.createElement("div", { className: "relative" },
        React.createElement("select", { ...p, className: cls(inputCls, 'appearance-none pr-9', p.className) }, children),
        React.createElement(Icon, { name: "chevD", size: 16, className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" })));
}

/** Multi-line input. */
function TextArea(props) { return React.createElement("textarea", { ...props, className: cls(inputCls, 'h-auto py-3 leading-relaxed resize-y', props.className) }); }

/** Selectable pill. */
function Chip({ active, children, onClick, className }) {
    return (React.createElement("button", { type: "button", onClick: onClick, className: cls('whitespace-nowrap rounded-full px-4 h-9 text-[13.5px] font-medium border transition-all duration-200', active ? 'bg-ink text-white border-ink' : 'bg-white text-slatey border-line hover:border-ink/35', className) }, children));
}
