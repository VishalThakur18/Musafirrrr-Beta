"use strict";
/* ============================================================
   SEED DATA — ENQUIRIES
   Demo leads shown in the organizer dashboard.
   ============================================================ */

/** ENQUIRIES */
const ENQUIRIES = [
    { id: 'e1', tripId: 't1', organizerId: 'o1', travellerId: 'u_x1', name: 'Riya Sharma', email: 'riya@example.com', phone: '9811122233', travellerCount: 2, message: 'Is the Delhi pickup point flexible? We are coming from Gurgaon.', status: 'NEW', createdAt: '2026-09-18' },
    { id: 'e2', tripId: 't5', organizerId: 'o1', travellerId: 'u_x2', name: 'Karan Bedi', email: 'karan@example.com', phone: '9822233344', travellerCount: 1, message: 'First time rafting. Is it fine if I cannot swim?', status: 'CONTACTED', createdAt: '2026-09-17' },
    { id: 'e3', tripId: 't14', organizerId: 'o1', travellerId: 'u_x3', name: 'Neha Gupta', email: 'neha@example.com', phone: '9833344455', travellerCount: 4, message: 'Family of four, two kids aged 9 and 12. Suitable?', status: 'CONFIRMED', createdAt: '2026-09-15' },
    { id: 'e4', tripId: 't1', organizerId: 'o1', travellerId: 'u_x4', name: 'Dev Patel', email: 'dev@example.com', phone: '9844455566', travellerCount: 1, message: 'Do you have a female-only room option?', status: 'NEW', createdAt: '2026-09-19' },
    { id: 'e5', tripId: 't16', organizerId: 'o1', travellerId: 'u_x5', name: 'Sana Qureshi', email: 'sana@example.com', phone: '9855566677', travellerCount: 2, message: 'Missed this one — when is the next Kasol trip?', status: 'CANCELLED', createdAt: '2026-07-02' }
];
