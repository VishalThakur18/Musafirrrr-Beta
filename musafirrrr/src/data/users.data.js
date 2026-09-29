"use strict";
/* ============================================================
   SEED DATA — USERS
   Demo login accounts: traveller@demo.com / organizer@demo.com (password: "password").
   ============================================================ */

/** USERS */
const USERS = [
    { id: 'u_trav1', role: 'TRAVELLER', name: 'Aarav Mehta', email: 'traveller@demo.com', phone: '9876500011', password: 'password',
        avatarKind: 'beach', avatarSeed: 3, createdAt: '2026-05-02',
        prefs: { destinations: ['Himachal Pradesh', 'Ladakh'], budget: 15000, types: ['Trek', 'Backpacking'], style: 'Solo Friendly' } },
    { id: 'u_org1', role: 'ORGANIZER', name: 'Ishita Rao', email: 'organizer@demo.com', phone: '9876543210', password: 'password',
        organizerId: 'o1', createdAt: '2019-03-11' }
];
