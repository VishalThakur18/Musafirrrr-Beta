"use strict";
/* ============================================================
   MIDDLEWARE — TOAST NOTIFICATIONS
   ============================================================ */

let toastId = 0;
let toastTimer = null;

/** Shows a temporary notification message. */
function toast(msg, kind = 'ok') {
    const id = ++toastId;
    if (toastTimer !== null) clearTimeout(toastTimer);
    store.quiet(s => { s.toasts = [{ id, msg, kind }]; });
    toastTimer = setTimeout(() => {
        store.quiet(s => { s.toasts = s.toasts.filter(t => t.id !== id); });
        if (id === toastId) toastTimer = null;
    }, 3200);
}
