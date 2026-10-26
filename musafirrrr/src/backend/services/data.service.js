"use strict";

/** One public snapshot shared by listings, details and traveller pages.
 * Memory-only: never persists authenticated data or stale demo trips to disk.
 * TTL refreshes on navigation/focus; simultaneous consumers share one request.
 */
const dataService = {
    ttl: 60000,
    expiresAt: 0,
    pending: null,
    generation: 0,
    snapshot: null,
    reads: new Map(),
    cachedRead(key, loader) {
        const hit = this.reads.get(key);
        if (hit && Date.now() < hit.expires) return hit.promise;
        const entry = { expires: Date.now() + this.ttl };
        entry.promise = Promise.resolve().then(loader).catch(error => {
            if (this.reads.get(key) === entry) this.reads.delete(key);
            throw error;
        });
        if (this.reads.size >= 100) this.reads.delete(this.reads.keys().next().value);
        this.reads.set(key, entry);
        return entry.promise;
    },
    invalidate(broadcast = true) {
        if (broadcast) { try { localStorage.setItem('musafirrrr.publicTrips.changed', String(Date.now())); } catch (_) {} }
        this.generation++;
        this.reads.clear();
        this.expiresAt = 0;
        this.snapshot = null;
        store.quiet(s => { s.trips = []; s.tripsLoading = true; });
        this.loadIntoStore().catch(() => {});
    },
    loadPublishedTrips() {
        if (this.pending) return this.pending;
        if (this.snapshot && Date.now() < this.expiresAt) return Promise.resolve(this.snapshot);
        this.pending = this.fetchSnapshot().finally(() => { this.pending = null; });
        return this.pending;
    },
    async fetchSnapshot() {
        store.quiet(s => { s.tripsLoading = !this.snapshot; s.tripsError = null; });
        try {
            let trips;
            let version;
            do {
                version = this.generation;
                const { data, error } = await window.sbClient.from('trips')
                    .select('*, organizers(id, slug, name, based_in, bio, logo_url, banner_url, whatsapp_number, instagram_handle, verified, years_active), trip_images(image_url, position), itinerary_days(day_number, title, description), trip_inclusions(item, kind)')
                    .in('status', ['published', 'sold_out'])
                    .order('start_date', { ascending: true });
                if (error) throw error;
                trips = (data || []).map(publicTripFromRow);
            } while (version !== this.generation);
            this.snapshot = trips;
            this.expiresAt = Date.now() + this.ttl;
            store.quiet(s => { s.trips = trips; s.tripsLoading = false; s.tripsError = null; });
            return trips;
        } catch (error) {
            store.quiet(s => { s.tripsLoading = false; s.tripsError = error; });
            throw error;
        }
    },
    loadIntoStore() { return this.loadPublishedTrips(); }
};
window.dataService = dataService;

window.addEventListener("storage", event => {
    if (event.key === "musafirrrr.publicTrips.changed") dataService.invalidate(false);
});
