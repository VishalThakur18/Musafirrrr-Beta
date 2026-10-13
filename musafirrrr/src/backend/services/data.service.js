
"use strict";

/* BACKEND SERVICE — TRAVELLER DATA */

const dataService = {
    async loadPublishedTrips() {
        const { data, error } = await window.sbClient
            .from("trips")
            .select(`
                *,
                trip_images(image_url, position),
                itinerary_days(day_number, title, description),
                trip_inclusions(item, kind)
            `)
            .in("status", ["published", "sold_out"])
            .order("start_date", { ascending: true });

        if (error) {
            console.error("Could not load trips from Supabase:", error);
            throw error;
        }

        return (data || []).map(row => ({
            ...row,
            organizerId: row.organizer_id,
            startingFrom: row.starting_location,
            startingLocation: row.starting_location,
            groupType: row.group_type,
            startDate: row.start_date,
            endDate: row.end_date,
            days: row.duration_days,
            nights: row.duration_nights,
            totalSpots: row.total_spots,
            availableSpots: row.spots_left,
            meetingPoint: row.meeting_point,
            advance: row.advance_amount,
            advanceAmount: row.advance_amount,
            status: String(row.status || "").toUpperCase(),
            currency: row.currency || "INR",
            rating: row.rating ?? 4.6,
            reviews: row.reviews ?? 0,
            coverImage: row.cover_image_url
                ? { k: "file", url: row.cover_image_url }
                : null,
            images: (row.trip_images || [])
                .sort((a, b) => a.position - b.position)
                .map(image => image.image_url),
            itinerary: (row.itinerary_days || [])
                .sort((a, b) => a.day_number - b.day_number)
                .map(day => ({
                    day: day.day_number,
                    title: day.title || "",
                    detail: day.description || ""
                })),
            included: (row.trip_inclusions || [])
                .filter(item => item.kind === "included")
                .map(item => item.item),
            excluded: (row.trip_inclusions || [])
                .filter(item => item.kind === "excluded")
                .map(item => item.item),
            createdAt: row.created_at
                ? row.created_at.slice(0, 10)
                : null
        }));
    },

    async loadIntoStore() {
        const trips = await this.loadPublishedTrips();

        store.set(s => {
            s.trips = [...trips];
        });

        return trips;
    }
};

window.dataService = dataService;
