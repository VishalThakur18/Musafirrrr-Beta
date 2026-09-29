"use strict";
/* ============================================================
   BACKEND SERVICE — ENQUIRIES
   ============================================================ */

/** Traveller enquiries / organizer leads logic. */
const enquiryService = {
    all() { return store.state.enquiries; },
    forOrganizer(oid) { return store.state.enquiries.filter(e => e.organizerId === oid); },
    forTraveller(uid_) { return store.state.enquiries.filter(e => e.travellerId === uid_); },
    async create(d) {
        await wait(800);
        const e = { id: uid('e'), status: 'NEW', createdAt: today(), ...d };
        store.set(s => {
            s.enquiries = [e, ...s.enquiries];
            s.trips = s.trips.map(t => t.id === d.tripId ? { ...t, availableSpots: Math.max(0, t.availableSpots) } : t);
        });
        return e;
    },
    setStatus(id, status) { store.set(s => { s.enquiries = s.enquiries.map(e => e.id === id ? { ...e, status } : e); }); }
};
