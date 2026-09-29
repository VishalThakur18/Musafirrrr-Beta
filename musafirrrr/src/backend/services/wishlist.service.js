"use strict";
/* ============================================================
   BACKEND SERVICE — WISHLIST
   ============================================================ */

/** Saved-trips (wishlist) logic. */
const wishlistService = {
    ids() { return store.state.wishlist; },
    has(id) { return store.state.wishlist.includes(id); },
    toggle(id) {
        const on = wishlistService.has(id);
        store.set(s => { s.wishlist = on ? s.wishlist.filter(x => x !== id) : [id, ...s.wishlist]; });
        toast(on ? 'Removed from saved trips' : 'Saved. Find it under Saved trips.');
        return !on;
    },
    trips() { return store.state.wishlist.map(id => tripService.byId(id)).filter(Boolean); }
};
