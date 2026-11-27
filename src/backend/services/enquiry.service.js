"use strict";

/* ============================================================
   BACKEND SERVICE — ENQUIRIES
   ============================================================ */

const enquiryService = {
    /**
     * Return locally stored enquiries.
     */
    all() {
        return store.state.enquiries;
    },

    /**
     * Return locally stored enquiries for an organizer.
     */
    forOrganizer(oid) {
        return store.state.enquiries.filter(
            e => e.organizerId === oid
        );
    },

    /**
     * Return locally stored enquiries for a traveller.
     */
    forTraveller(uid_) {
        return store.state.enquiries.filter(
            e => e.travellerId === uid_
        );
    },

    /**
     * Fetch the signed-in traveller's enquiries from Supabase.
     * Fetch associated trips separately to avoid relying on a
     * nested Supabase relationship.
     */
    async forTravellerFromDb(uid_) {
        if (!uid_) return [];

        if (!window.sbClient) {
            throw new Error("Supabase client is not initialized.");
        }

        // 1. Fetch the traveller's enquiries.
        const { data, error } = await window.sbClient
            .from("enquiries")
            .select(`
                id,
                trip_id,
                organizer_id,
                traveller_id,
                name,
                phone,
                email,
                num_travellers,
                message,
                status,
                created_at
            `)
            .eq("traveller_id", uid_)
            .order("created_at", { ascending: false });

        if (error) throw error;

        const rows = data || [];

        if (rows.length === 0) {
            return [];
        }

        // 2. Collect unique trip IDs.
        const tripIds = [
            ...new Set(
                rows
                    .map(row => row.trip_id)
                    .filter(Boolean)
            )
        ];

        // 3. Fetch the associated trips.
        let trips = [];

        if (tripIds.length > 0) {
            const {
                data: tripData,
                error: tripError
            } = await window.sbClient
                .from("trips")
                .select("*")
                .in("id", tripIds);

            if (tripError) throw tripError;

            trips = tripData || [];
        }

        // 4. Index trips by ID for quick lookup.
        const tripsById = new Map(
            trips.map(trip => [
                trip.id,
                {
                    id: trip.id,
                    slug: trip.slug,
                    title: trip.title,
                    destination: trip.destination,
                    startDate: trip.start_date,
                    endDate: trip.end_date,
                    price: trip.price,
                    status: String(
                        trip.status || ""
                    ).toUpperCase(),
                    coverImage:
                        trip.cover_image_url ||
                        trip.cover_image ||
                        trip.image_url ||
                        ""
                }
            ])
        );

        // 5. Return enquiries in the format used by the UI.
        return rows.map(row => ({
            id: row.id,
            tripId: row.trip_id,
            organizerId: row.organizer_id,
            travellerId: row.traveller_id,
            name: row.name,
            phone: row.phone,
            email: row.email,
            travellerCount: row.num_travellers,
            message: row.message,
            status: String(
                row.status || "new"
            ).toUpperCase(),
            createdAt: row.created_at,
            trip: tripsById.get(row.trip_id) || null
        }));
    },

    /**
     * Create a local enquiry.
     * Existing local/demo behavior is preserved.
     */
    async create(d) {
        await wait(800);

        const e = {
            id: uid("e"),
            status: "NEW",
            createdAt: today(),
            ...d
        };

        store.set(s => {
            s.enquiries = [e, ...s.enquiries];

            s.trips = s.trips.map(t =>
                t.id === d.tripId
                    ? {
                        ...t,
                        availableSpots: Math.max(
                            0,
                            t.availableSpots
                        )
                    }
                    : t
            );
        });

        return e;
    },

    /**
     * Update the status of a locally stored enquiry.
     */
    setStatus(id, status) {
        store.set(s => {
            s.enquiries = s.enquiries.map(e =>
                e.id === id
                    ? { ...e, status }
                    : e
            );
        });
    }
};