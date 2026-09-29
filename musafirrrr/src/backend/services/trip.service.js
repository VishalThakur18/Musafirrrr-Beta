"use strict";
/* ============================================================
   BACKEND SERVICE — TRIPS
   Create, read, update, delete, duplicate trips.
   ============================================================ */

/** CRUD and queries for trips. */
const tripService = {
    all() { return store.state.trips; },
    published() { return store.state.trips.filter(t => t.status === 'PUBLISHED' || t.status === 'SOLD_OUT'); },
    bySlug(slug) { return store.state.trips.find(t => t.slug === slug); },
    byId(id) { return store.state.trips.find(t => t.id === id); },
    byOrganizer(oid) { return store.state.trips.filter(t => t.organizerId === oid); },
    create(oid, data) {
        const t = T({ id: uid('t'), organizerId: oid, createdAt: today(), ...data });
        t.slug = uniqueSlug(slugify(data.title || 'new-trip'));
        store.set(s => { s.trips = [t, ...s.trips]; });
        return t;
    },
    update(id, patch) {
        store.set(s => { s.trips = s.trips.map(t => t.id === id ? { ...t, ...patch } : t); });
        return tripService.byId(id);
    },
    remove(id) { store.set(s => { s.trips = s.trips.filter(t => t.id !== id); s.wishlist = s.wishlist.filter(w => w !== id); }); },
    duplicate(id) {
        const t = tripService.byId(id);
        if (!t)
            return;
        const copy = { ...t, id: uid('t'), title: t.title + ' (copy)', slug: uniqueSlug(t.slug + '-copy'), status: 'DRAFT', createdAt: today() };
        store.set(s => { s.trips = [copy, ...s.trips]; });
        return copy;
    },
    markViewed(id) {
        store.set(s => { s.recent = [id, ...s.recent.filter(x => x !== id)].slice(0, 8); });
    }
};

/** Makes sure a trip slug is unique. */
function uniqueSlug(base) { let s = base, i = 2; while (store.state.trips.some(t => t.slug === s)) {
    s = base + '-' + i;
    i++;
} return s; }
