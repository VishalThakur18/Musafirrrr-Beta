"use strict";
/* ============================================================
   BACKEND — STORE (mock database)
   Holds all data in memory, saves to localStorage, notifies subscribers.
   Swap this for a real database / API client when you add a server.
   ============================================================ */

/** Safe localStorage read (never throws). */
function lsGet(k, fb) { try {
    const r = localStorage.getItem(k);
    return r ? JSON.parse(r) : fb;
}
catch (e) {
    return fb;
} }

/** Safe localStorage write (never throws). */
function lsSet(k, v) { try {
    localStorage.setItem(k, JSON.stringify(v));
    return true;
}
catch (e) {
    return false;
} }

/** Previously saved state from localStorage, if any. */
const saved = lsGet(LS_KEY, null) || {};

/** Global in-memory database + subscribe/notify + persistence. */
const store = {
    state: {
        trips: saved.trips || TRIPS,
        organizers: saved.organizers || ORGANIZERS,
        users: { ...saved.users },
        enquiries: saved.enquiries || ENQUIRIES,
        wishlist: saved.wishlist || [], // trip ids — works logged out
        session: null,
        recent: saved.recent || [],
        toasts: []
    },
    subs: new Set(),
    persist() {
        const s = this.state;
        const ok = lsSet(LS_KEY, {
            trips: s.trips,
            organizers: s.organizers,
            users: s.users,
            enquiries: s.enquiries,
            wishlist: s.wishlist,
            recent: s.recent
        });
        if (!ok)
            console.warn('Local storage unavailable — changes will not survive a refresh.');
    },
    set(fn) { fn(this.state); this.state = { ...this.state }; this.persist(); this.subs.forEach(f => f()); },
    quiet(fn) { fn(this.state); this.state = { ...this.state }; this.subs.forEach(f => f()); }
};
