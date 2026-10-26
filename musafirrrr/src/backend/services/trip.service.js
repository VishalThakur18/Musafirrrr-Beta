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

/* ============================================================
   SUPABASE — PUBLIC TRIP QUERIES (trip page and enquiries)
   ============================================================ */

/** Phone digits as WhatsApp wants them (bare 10-digit numbers get the 91 prefix). */
function publicWa(n) {
    const d = String(n || '').replace(/\D/g, '');
    return d.length === 10 ? '91' + d : d;
}

/** Database organizer -> the shape the public pages already use. */
function dbToPublicOrganizer(o) {
    if (!o)
        return null;
    return {
        id: o.id, slug: o.slug, name: o.name,
        city: o.based_in || '', bio: o.bio || '', verified: !!o.verified,
        since: o.years_active > 0 ? new Date().getFullYear() - o.years_active : null,
        whatsapp: publicWa(o.whatsapp_number), instagram: o.instagram_handle || '',
        logo_url: o.logo_url || null, 
        banner_url: o.banner_url || null,
        logoKind: 'mountains', logoSeed: 11
    };
}

function publicTripFromRow(data) {
        const t = dbToTrip(data);
        const imgs = (data.trip_images || []).sort((a, b) => a.position - b.position).map(x => ({ k: 'file', url: x.image_url }));
        t.images = imgs.length ? imgs : [coverOf(t)];
        t.itinerary = (data.itinerary_days || []).sort((a, b) => a.day_number - b.day_number)
            .map((x, i) => ({ day: i + 1, title: x.title || '', detail: x.description || '' }));
        t.included = (data.trip_inclusions || []).filter(x => x.kind === 'included').map(x => x.item);
        t.excluded = (data.trip_inclusions || []).filter(x => x.kind === 'excluded').map(x => x.item);
        const ratings = (data.reviews || []).map(r => r.rating).filter(n => typeof n === 'number');
        t.reviews = ratings.length;
        t.rating = ratings.length ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length * 10) / 10 : 0;
        t.startingFrom = data.starting_location || '';
        t.advance = data.advance_amount || 0;
        t.organizer = dbToPublicOrganizer(data.organizers);
        t.fromDb = true;
        return t;
}

const tripApi = {
/** One visible trip with organizer, photos, itinerary, inclusions and review stats. */
async bySlug(slug) {
    return dataService.cachedRead('detail:' + slug, async () => {
        const { data, error } = await window.sbClient
            .from('trips')
            .select(`
                *,
                organizers(
                    id, slug, name, based_in, bio,
                    logo_url, whatsapp_number,
                    instagram_handle, verified, years_active
                ),
                trip_images(image_url, position),
                itinerary_days(day_number, title, description),
                trip_inclusions(item, kind)
            `)
            .eq('slug', slug)
            .maybeSingle();

        if (error) {
            throw error;
        }

        if (!data) {
            return null;
        }

        return publicTripFromRow(data);
    });
},
    /** Up to three other published trips by the same organizer. */
    async moreFrom(organizerId, excludeId) {
        const trips = await dataService.loadPublishedTrips();
        return trips.filter(t => t.organizerId === organizerId && t.id !== excludeId && t.status === 'PUBLISHED').slice(0, 3);
    },

    /** Sends an enquiry. The database trigger sets organizer, traveller and status. */
    async createEnquiry(d) {
        const { error } = await window.sbClient.from('enquiries').insert({
            trip_id: d.tripId, name: d.name, phone: d.phone, email: d.email || null,
            num_travellers: d.travellerCount, message: d.message || null
        });
        if (error)
            throw new Error(error.message);
    },

    /** Public organizer page: the organizer plus their visible trips. */
    organizerPage(slug) {
        return dataService.cachedRead('organizer:' + slug, () => this.fetchOrganizerPage(slug));
    },
    async fetchOrganizerPage(slug) {
        const { data, error } = await window.sbClient
            .from('organizers')
            .select('id, slug, name, based_in, bio, logo_url, banner_url, whatsapp_number, instagram_handle, verified, years_active, created_at')
            .eq('slug', slug)
            .maybeSingle();
        if (error)
            throw error;
        if (!data)
            return null;
        const { data: rows, error: e2 } = await window.sbClient
            .from('trips')
            .select('*')
            .eq('organizer_id', data.id)
            .in('status', ['published', 'sold_out', 'completed'])
            .order('start_date', { ascending: true });
        if (e2)
            throw e2;
        const base = dbToPublicOrganizer(data);
        const joined = data.created_at ? new Date(data.created_at).getFullYear() : null;
        const org = { ...base, since: base.since || joined };
        const trips = (rows || []).map(r => ({ ...dbToTrip(r), fromDb: true, organizer: org }));
        return { org, trips };
    },
};

window.tripApi = tripApi;
