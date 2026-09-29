"use strict";
/* ============================================================
   BACKEND SERVICE — AUTH
   Login, signup (traveller/organizer), logout, current user.
   ============================================================ */

/** Login, signup and session handling (replace with real API calls). */
const authService = {
    current() { const s = store.state; return s.users.find(u => u.id === s.session) || null; },
    async login(email, password) {
        await wait(600);
        const u = store.state.users.find(x => x.email.toLowerCase() === String(email).toLowerCase().trim());
        if (!u)
            throw new Error('No account found for that email.');
        if (u.password !== password)
            throw new Error('That password does not match.');
        store.set(s => { s.session = u.id; });
        return u;
    },
    async signupTraveller(d) {
        await wait(700);
        if (store.state.users.some(u => u.email.toLowerCase() === d.email.toLowerCase()))
            throw new Error('An account already uses that email.');
        const u = { id: uid('u'), role: 'TRAVELLER', createdAt: today(), avatarKind: 'valley', avatarSeed: Math.floor(Math.random() * 90), prefs: { destinations: [], budget: 20000, types: [], style: 'Solo Friendly' }, ...d };
        store.set(s => { s.users = [...s.users, u]; s.session = u.id; });
        return u;
    },
    async signupOrganizer(d) {
        await wait(800);
        if (store.state.users.some(u => u.email.toLowerCase() === d.email.toLowerCase()))
            throw new Error('An account already uses that email.');
        const orgId = uid('o');
        const userId = uid('u');
        const org = { id: orgId, userId, name: d.orgName, slug: slugify(d.orgName), verified: false, city: d.city || 'India', since: new Date().getFullYear(),
            bio: d.bio || '', instagram: d.instagram || '', whatsapp: d.whatsapp || '', travellers: 0, logoKind: 'mountains', logoSeed: Math.floor(Math.random() * 90) };
        const u = { id: userId, role: 'ORGANIZER', name: d.name, email: d.email, phone: d.phone, password: d.password, organizerId: orgId, createdAt: today() };
        store.set(s => { s.organizers = [...s.organizers, org]; s.users = [...s.users, u]; s.session = userId; });
        return u;
    },
    logout() { store.set(s => { s.session = null; }); }
};
