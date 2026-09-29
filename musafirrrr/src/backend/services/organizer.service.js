"use strict";
/* ============================================================
   BACKEND SERVICE — ORGANIZERS
   ============================================================ */

/** Queries and updates for organizer profiles. */
const organizerService = {
    all() { return store.state.organizers; },
    byId(id) { return store.state.organizers.find(o => o.id === id); },
    bySlug(slug) { return store.state.organizers.find(o => o.slug === slug); },
    update(id, patch) { store.set(s => { s.organizers = s.organizers.map(o => o.id === id ? { ...o, ...patch } : o); }); }
};
