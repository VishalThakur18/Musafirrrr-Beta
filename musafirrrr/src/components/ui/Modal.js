"use strict";
/* ============================================================
   UI — MODAL & CONFIRM DIALOG
   ============================================================ */

/** Accessible modal / bottom-sheet. */
function Modal({ open, onClose, children, size = 'md', label }) {
    useEffect(() => {
        if (!open)
            return;
        document.body.classList.add('no-scroll');
        const k = e => { if (e.key === 'Escape')
            onClose && onClose(); };
        window.addEventListener('keydown', k);
        return () => { document.body.classList.remove('no-scroll'); window.removeEventListener('keydown', k); };
    }, [open, onClose]);
    if (!open)
        return null;
    const w = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl' }[size];
    return (React.createElement("div", { className: "fixed inset-0 z-[90] flex items-end sm:items-center justify-center", role: "dialog", "aria-modal": "true", "aria-label": label },
        React.createElement("div", { className: "absolute inset-0 bg-ink/45 backdrop-blur-[2px] fade-in", onClick: onClose }),
        React.createElement("div", { className: cls('relative w-full bg-white rounded-t-3xl sm:rounded-3xl shadow-pop sheet-up max-h-[92vh] overflow-y-auto', w), style: { paddingBottom: 'env(safe-area-inset-bottom,0px)' } },
            React.createElement("button", { onClick: onClose, "aria-label": "Close", className: "absolute right-4 top-4 z-10 w-9 h-9 rounded-full bg-white/90 border border-line flex items-center justify-center hover:bg-shell" },
                React.createElement(Icon, { name: "x", size: 16 })),
            children)));
}

/** Confirmation dialog. */
function Confirm({ open, title, body, confirmLabel = 'Delete', onConfirm, onClose, tone = 'danger' }) {
    return (React.createElement(Modal, { open: open, onClose: onClose, size: "sm", label: title },
        React.createElement("div", { className: "p-6 sm:p-7" },
            React.createElement("h3", { className: "text-xl font-bold tracking-tight" }, title),
            React.createElement("p", { className: "mt-2 text-[15px] text-slatey leading-relaxed" }, body),
            React.createElement("div", { className: "mt-6 flex gap-3 justify-end" },
                React.createElement(Btn, { variant: "outline", onClick: onClose }, "Keep it"),
                React.createElement(Btn, { variant: tone, onClick: () => { onConfirm(); onClose(); } }, confirmLabel)))));
}
