"use strict";

const analyticsReports = new Map();
const analyticsRequests = new Map();
let analyticsCacheVersion = 0;
const analyticsWarnings = new Set();
function invalidateAnalyticsReports() { analyticsCacheVersion++; analyticsReports.clear(); }

/** Best-effort telemetry: never blocks navigation or creates an enquiry. */
const tripAnalytics = {
    async track(trip, kind, eventId) {
        if (!trip?.fromDb || !['page_view', 'whatsapp_click', 'instagram_click', 'enquiry_open'].includes(kind)) return false;
        const params = { p_trip_id: trip.id, p_kind: kind, p_event_id: eventId || crypto.randomUUID() };
        let failure;
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const result = await window.sbClient.rpc('record_trip_event', params);
                if (!result.error) {
                    invalidateAnalyticsReports();
                    window.dispatchEvent(new CustomEvent('trip-analytics-recorded', { detail: { organizerId: trip.organizerId } }));
                    return true;
                }
                failure = result.error;
                if (result.status && result.status < 500 && result.status !== 429) break;
            } catch (error) { failure = error; }
            // Reuse the event ID so the database cannot count the retry twice.
            if (!attempt) await new Promise(resolve => setTimeout(resolve, 350));
        }
        const code = failure?.code || 'network';
        if (!analyticsWarnings.has(code)) {
            analyticsWarnings.add(code);
            console.warn('Trip analytics event was not recorded:', code, failure?.message || 'Connection unavailable');
        }
        return false;
    },
    async report(organizerId, days, { force = false } = {}) {
        if (![7, 30, 90].includes(days)) throw new Error('Invalid analytics period.');
        const userId = typeof authState !== 'undefined' ? authState.user?.id || 'anonymous' : 'anonymous';
        const key = JSON.stringify([userId, organizerId, days]);
        const cached = analyticsReports.get(key);
        if (!force && cached && Date.now() - cached.at < 10000) return cached.data;
        if (analyticsRequests.has(key)) return analyticsRequests.get(key);
        const version = analyticsCacheVersion;
        const request = (async () => {
        const { data, error } = await window.sbClient.rpc('organizer_trip_performance', {
            p_organizer_id: organizerId, p_days: days
        });
        if (error) throw error;
        if (!data || !Array.isArray(data.trips)) throw new Error('Analytics response unavailable.');
        if (data.days !== days) throw new Error('Analytics period does not match the request.');
        if (version === analyticsCacheVersion) {
            if (analyticsReports.size >= 12) analyticsReports.delete(analyticsReports.keys().next().value);
            analyticsReports.set(key, { data, at: Date.now() });
        }
        return data;
        })();
        analyticsRequests.set(key, request);
        try { return await request; } finally { if (analyticsRequests.get(key) === request) analyticsRequests.delete(key); }
    }
};

/** One event per visible modal opening, not per CTA click or form render.
 * Closing and reopening is a new open; typing, validation and submission are not.
 */
function useTripEnquiryOpen(trip, open) {
    const opening = useRef(null);
    useEffect(() => {
        if (!open) { opening.current = null; return; }
        if (!trip?.fromDb) return;
        if (opening.current?.tripId !== trip.id) {
            opening.current = { tripId: trip.id, eventId: crypto.randomUUID(), recorded: false };
        }
        const record = () => {
            if (document.visibilityState !== 'visible' || opening.current.recorded) return;
            opening.current.recorded = true;
            void tripAnalytics.track(trip, 'enquiry_open', opening.current.eventId);
        };
        record();
        document.addEventListener('visibilitychange', record);
        return () => document.removeEventListener('visibilitychange', record);
    }, [open, trip?.id, trip?.fromDb]);
}

/** Once per visible trip navigation; refreshes and return visits are new views. */
function useTripPageView(trip, slug) {
    const visit = useRef(null);
    useEffect(() => {
        visit.current = { id: crypto.randomUUID(), recorded: false };
    }, [slug]);
    useEffect(() => {
        if (!trip?.fromDb || trip.slug !== slug) return;
        const record = () => {
            if (document.visibilityState !== 'visible' || visit.current.recorded) return;
            visit.current.recorded = true;
            void tripAnalytics.track(trip, 'page_view', visit.current.id);
        };
        record();
        document.addEventListener('visibilitychange', record);
        return () => document.removeEventListener('visibilitychange', record);
    }, [trip?.id, slug]);
}
