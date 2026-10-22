"use strict";

/** Best-effort telemetry: never blocks navigation or creates an enquiry. */
const tripAnalytics = {
    async track(trip, kind, eventId) {
        if (!trip?.fromDb || !['page_view', 'whatsapp_click', 'instagram_click', 'enquiry_open'].includes(kind)) return false;
        try {
            const { error } = await window.sbClient.rpc('record_trip_event', {
                p_trip_id: trip.id, p_kind: kind, p_event_id: eventId || crypto.randomUUID()
            });
            return !error;
        } catch (_) { return false; }
    },
    async report(organizerId, days) {
        if (![7, 30, 90].includes(days)) throw new Error('Invalid analytics period.');
        const { data, error } = await window.sbClient.rpc('organizer_trip_performance', {
            p_organizer_id: organizerId, p_days: days
        });
        if (error) throw error;
        if (!data || !Array.isArray(data.trips)) throw new Error('Analytics response unavailable.');
        return data;
    }
};

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
