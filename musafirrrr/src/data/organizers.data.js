"use strict";
/* ============================================================
   SEED DATA — ORGANIZERS
   Demo organizer profiles (mirrors an `organizers` DB table).
   ============================================================ */

/** ORGANIZERS */
const ORGANIZERS = [
    { id: 'o1', userId: 'u_org1', name: 'Wanderlust Co.', slug: 'wanderlust-co', verified: true, city: 'New Delhi', since: 2019,
        bio: 'A Delhi-based travel community running small-group trips across the Himalayas and North India since 2019. We keep groups under 18 people, always.',
        instagram: 'wanderlust.co', whatsapp: '919876543210', travellers: 2400, logoKind: 'mountains', logoSeed: 11 },
    { id: 'o2', userId: 'u_org2', name: 'Himalayan Trails', slug: 'himalayan-trails', verified: true, city: 'Manali', since: 2016,
        bio: 'High-altitude specialists. Certified mountain leaders, oxygen support on every expedition, and routes we have walked a hundred times.',
        instagram: 'himalayantrails', whatsapp: '919812345678', travellers: 5100, logoKind: 'snow', logoSeed: 23 },
    { id: 'o3', userId: 'u_org3', name: 'Coastal Collective', slug: 'coastal-collective', verified: true, city: 'Goa', since: 2020,
        bio: 'Beaches, backwaters and islands. Slow travel down the Indian coastline with people who actually live there.',
        instagram: 'coastal.collective', whatsapp: '919701122334', travellers: 1800, logoKind: 'beach', logoSeed: 31 },
    { id: 'o4', userId: 'u_org4', name: 'Northeast Nomads', slug: 'northeast-nomads', verified: true, city: 'Shillong', since: 2018,
        bio: 'Born in Shillong, run by locals. We take you to the Northeast the way we know it — homestays, living root bridges, and no rush.',
        instagram: 'northeast.nomads', whatsapp: '919436001122', travellers: 1200, logoKind: 'forest', logoSeed: 44 },
    { id: 'o5', userId: 'u_org5', name: 'Summit Sisters', slug: 'summit-sisters', verified: true, city: 'Dehradun', since: 2021,
        bio: 'All-girls treks and trips led by women guides. First-time trekkers welcome — most of our travellers start here.',
        instagram: 'summit.sisters', whatsapp: '919555667788', travellers: 900, logoKind: 'valley', logoSeed: 57 },
    { id: 'o6', userId: 'u_org6', name: 'Passport Gang', slug: 'passport-gang', verified: false, city: 'Mumbai', since: 2022,
        bio: 'Budget international group trips for first-time flyers. Visa help included, no hidden costs.',
        instagram: 'passportgang', whatsapp: '919333445566', travellers: 640, logoKind: 'island', logoSeed: 69 }
];
