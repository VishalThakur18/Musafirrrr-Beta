"use strict";
/* BACKEND SERVICE — REVIEWS (trip reviews + organizer reviews) */

const REVIEW_KINDS = {
    organizer: { table: "organizer_reviews", col: "organizer_id", rpc: "get_organizer_reviews", arg: "p_organizer_id", conflict: "organizer_id,traveller_id" },
};

/** "YYYY-MM-DD" today in the viewer's time zone (same format as trip dates). */
function reviewsToday() { return new Date().toLocaleDateString("en-CA"); }

const reviewApi = {
    async list(kind, id, offset = 0, size = 10) {
        const k = REVIEW_KINDS[kind];
        const { data, error } = await window.sbClient.rpc(k.rpc, { [k.arg]: id, p_limit: size, p_offset: offset });
        if (error) throw error;
        return data || [];
    },

    async summary(kind, id) {
        const k = REVIEW_KINDS[kind];
        const { data, error } = await window.sbClient.from(k.table).select("rating").eq(k.col, id);
        if (error) throw error;
        const n = (data || []).length;
        const avg = n ? Math.round(data.reduce((a, r) => a + r.rating, 0) / n * 10) / 10 : 0;
        return { avg, count: n };
    },

    /** The signed-in traveller's own review, if any. */
    async mine(kind, id, userId) {
        const k = REVIEW_KINDS[kind];
        const { data, error } = await window.sbClient.from(k.table)
            .select("id, rating, text").eq(k.col, id).eq("traveller_id", userId).maybeSingle();
        if (error) throw error;
        return data || null;
    },

    /** Creates or edits the traveller's review (one per traveller per trip / organizer). */
    async save(kind, id, userId, { rating, text, tripId }) {
        const k = REVIEW_KINDS[kind];
        const row = {
            [k.col]: id, traveller_id: userId, rating: Math.round(rating),
            text: String(text || "").trim().slice(0, 2000) || null,
            updated_at: new Date().toISOString(),
        };
        if (kind === "organizer" && tripId) row.trip_id = tripId;
        const { error } = await window.sbClient.from(k.table).upsert(row, { onConflict: k.conflict });
        dataService.invalidate();
    },

    async remove(kind, reviewId) {
        const k = REVIEW_KINDS[kind];
        const { data, error } = await window.sbClient.from(k.table).delete().eq("id", reviewId).select("id");
        if (error) throw new Error(error.message);
        if (!data || data.length === 0) throw new Error("Could not delete your review.");
        dataService.invalidate();
    },
};

/** The organizer's average rating for a trip (0 if none). */
function orgRating(t) { return (t.organizer && t.organizer.rating) || 0; }

window.reviewApi = reviewApi;