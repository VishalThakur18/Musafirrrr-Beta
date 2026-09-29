"use strict";
/* ============================================================
   MIDDLEWARE — TOAST NOTIFICATIONS
   ============================================================ */

let toastId = 0;

/** Shows a temporary notification message. */
function toast(msg, kind = 'ok') {
    const id = ++toastId;
    store.quiet(s => { s.toasts = [...s.toasts, { id, msg, kind }]; });
    setTimeout(() => store.quiet(s => { s.toasts = s.toasts.filter(t => t.id !== id); }), 3200);
}
