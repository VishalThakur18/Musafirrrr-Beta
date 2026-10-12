"use strict";
/* ============================================================
   BACKEND SERVICE — ORGANIZERS
   ============================================================ */

/** Queries and updates for organizer profiles. */
const organizerService = {
    all() { return store.state.organizers; },
    byId(id) { return store.state.organizers.find(o => o.id === id); },
    bySlug(slug) { return store.state.organizers.find(o => o.slug === slug); },
    update(id, patch) { store.set(s => { s.organizers = s.organizers.map(o => o.id === id ? { ...o, ...patch } : o); }); }
};

/* ============================================================
   BACKEND SERVICE — ORGANIZER DATA (Supabase)
   Real trips and enquiries for the signed-in organizer.
   Rows are converted to the same shape the mock data used.
   ============================================================ */

/** ISO timestamp -> "YYYY-MM-DD" in the viewer's time zone (same format as the mock data). */
function isoDate(ts) {
    if (!ts) return "";
    return new Date(ts).toLocaleDateString("en-CA");
}

function dbToTrip(r) {
    return {
        id: r.id,
        slug: r.slug,
        organizerId: r.organizer_id,
        title: r.title,
        destination: r.destination,
        region: r.region || "",
        startingLocation: r.starting_location,
        category: r.category,
        groupType: r.group_type,
        description: r.description || "",
        startDate: r.start_date,              // date column, already "YYYY-MM-DD"
        endDate: r.end_date,
        days: r.duration_days,
        nights: r.duration_nights,
        price: r.price,
        currency: r.currency,
        advanceAmount: r.advance_amount,
        totalSpots: r.total_spots,
        availableSpots: r.spots_left,
        meetingPoint: r.meeting_point,
        cancellationPolicy: r.cancellation_policy,
        importantInfo: r.important_info,
        status: String(r.status).toUpperCase(),   // draft -> DRAFT, sold_out -> SOLD_OUT
        coverImage: r.cover_image_url ? { k: "file", url: r.cover_image_url } : null,
        createdAt: isoDate(r.created_at),
        publishedAt: isoDate(r.published_at),
    };
}

function dbToEnquiry(r) {
    return {
        id: r.id,
        tripId: r.trip_id,
        organizerId: r.organizer_id,
        travellerId: r.traveller_id,
        name: r.name,
        phone: r.phone,
        email: r.email || "",
        travellerCount: r.num_travellers || 1,
        message: r.message || "",
        status: String(r.status).toUpperCase(),   // new -> NEW
        createdAt: isoDate(r.created_at),
    };
}

/** Cover image for a trip, with a fallback for trips that have no photo yet. */
function coverOf(trip) {
    return trip.coverImage || { k: "scene", kind: "mountains", seed: 1 };
}

/** Digits only, with the India country code added to bare 10-digit numbers. */
function cleanWhatsApp(v) {
    let d = String(v || "").replace(/\D/g, "");
    if (d.length === 11 && d.startsWith("0")) d = d.slice(1);
    return d.length === 10 ? "91" + d : d;
}

/** Accepts "@name" or a pasted instagram.com link and returns just the username. */
function cleanInstagram(v) {
    return String(v || "").trim()
        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
        .replace(/^@/, "")
        .replace(/[/?].*$/, "");
}

const organizerApi = {
    /* ---------- reading ---------- */

    async trips(organizerId) {
        const { data, error } = await window.sbClient
            .from("trips")
            .select("*")
            .eq("organizer_id", organizerId)
            .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(dbToTrip);
    },

    async enquiries(organizerId) {
        const { data, error } = await window.sbClient
            .from("enquiries")
            .select("*")
            .eq("organizer_id", organizerId)
            .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []).map(dbToEnquiry);
    },

    async newLeadCount(organizerId) {
        const { count, error } = await window.sbClient
            .from("enquiries")
            .select("id", { count: "exact", head: true })
            .eq("organizer_id", organizerId)
            .eq("status", "new");
        if (error) throw error;
        return count || 0;
    },

    /** One trip with its photos, itinerary and inclusions (for the edit screen). */
    async tripForEdit(tripId, organizerId) {
        const { data, error } = await window.sbClient
            .from("trips")
            .select("*, trip_images(image_url, position), itinerary_days(day_number, title, description), trip_inclusions(item, kind)")
            .eq("id", tripId)
            .eq("organizer_id", organizerId)
            .maybeSingle();
        if (error) throw error;
        if (!data) return null;
        const t = dbToTrip(data);
        t.images = (data.trip_images || []).sort((a, b) => a.position - b.position).map(x => x.image_url);
        t.itinerary = (data.itinerary_days || []).sort((a, b) => a.day_number - b.day_number)
            .map(x => ({ title: x.title || "", detail: x.description || "" }));
        t.included = (data.trip_inclusions || []).filter(x => x.kind === "included").map(x => x.item);
        t.excluded = (data.trip_inclusions || []).filter(x => x.kind === "excluded").map(x => x.item);
        return t;
    },

    /* ---------- enquiries ---------- */

    async setEnquiryStatus(id, status) {
        const { data, error } = await window.sbClient
            .from("enquiries")
            .update({ status: String(status).toLowerCase() })
            .eq("id", id)
            .select("id");
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("You can't update this enquiry.");
    },

    /* ---------- photos ---------- */

    async uploadTripImage(file, userId) {
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Use JPG, PNG or WebP photos.");
        if (file.size > 5 * 1024 * 1024) throw new Error(file.name + " is larger than 5 MB.");
        const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        const path = userId + "/" + crypto.randomUUID() + "." + ext;
        const { error } = await window.sbClient.storage
            .from("trip-images")
            .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
        if (error) throw error;
        const { data } = window.sbClient.storage.from("trip-images").getPublicUrl(path);
        return { path, url: data.publicUrl };
    },

    async removeTripImages(paths) {
        await window.sbClient.storage.from("trip-images").remove(paths);
    },

    /* ---------- saving trips ---------- */

    /** Creates (tripId = null) or updates a trip with all its child rows in one transaction. */
    async saveTrip(tripId, payload) {
        const { data, error } = await window.sbClient.rpc("save_trip", { p_trip_id: tripId, p: payload });
        if (error) throw error;
        return data;
    },

    async updateContact(organizerId, { whatsapp, instagram }) {
        const wa = cleanWhatsApp(whatsapp);
        if (!wa) throw new Error("A WhatsApp number is required.");
        const ig = cleanInstagram(instagram);
        if (!ig) throw new Error("An Instagram handle is required.");
        const { data, error } = await window.sbClient
            .from("organizers")
            .update({ whatsapp_number: wa, instagram_handle: ig || null })
            .eq("id", organizerId)
            .select("id");
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Could not update your contact details.");
    },

    /* ---------- trips list actions ---------- */

    async setTripStatus(id, status) {
        const { data, error } = await window.sbClient
            .from("trips").update({ status }).eq("id", id).select("id");
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("You can't change this trip.");
    },

    async setTripSpots(id, spotsLeft, status) {
        const patch = { spots_left: spotsLeft };
        if (status) patch.status = status;
        const { data, error } = await window.sbClient
            .from("trips").update(patch).eq("id", id).select("id");
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("You can't change this trip.");
    },

    async deleteTrip(id) {
        const { data, error } = await window.sbClient
            .from("trips").delete().eq("id", id).select("id");
        if (error) {
            if (error.code === "23503")
                throw new Error("This trip has enquiries or reviews, so it can't be deleted. Unpublish it instead.");
            throw error;
        }
        if (!data || data.length === 0) throw new Error("You can't delete this trip.");
    },

    /** Copies a trip (photos, itinerary, inclusions) as a new draft. Returns the new trip id. */
    async duplicateTrip(tripId, organizerId) {
        const t = await organizerApi.tripForEdit(tripId, organizerId);
        if (!t) throw new Error("Trip not found.");
        return organizerApi.saveTrip(null, {
            title: t.title + " (copy)", destination: t.destination, region: t.region,
            starting_location: t.startingLocation, category: t.category, group_type: t.groupType,
            description: t.description, start_date: t.startDate, end_date: t.endDate,
            duration_days: t.days, duration_nights: t.nights, price: t.price, currency: t.currency,
            advance_amount: t.advanceAmount, total_spots: t.totalSpots, spots_left: t.totalSpots,
            meeting_point: t.meetingPoint, status: "draft", cover_image_url: t.images[0] || null,
            images: t.images,
            itinerary: t.itinerary.map(x => ({ title: x.title, description: x.detail })),
            included: t.included, excluded: t.excluded
        });
    },

    /* ---------- organizer profile ---------- */

    async updateProfile(organizerId, f) {
        const { data, error } = await window.sbClient
            .from("organizers")
            .update({
                name: String(f.name || "").trim(),
                based_in: String(f.city || "").trim() || null,
                bio: String(f.bio || "").trim() || null,
                whatsapp_number: cleanWhatsApp(f.whatsapp),
                instagram_handle: cleanInstagram(f.instagram) || null,
            })
            .eq("id", organizerId)
            .select("id");
        if (error) throw new Error(error.message);   // the database trigger's messages are readable
        if (!data || data.length === 0) throw new Error("Could not save your profile.");
    },

    async uploadLogo(file, userId) {
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Use a JPG, PNG or WebP image.");
        if (file.size > 2 * 1024 * 1024) throw new Error("The logo must be under 2 MB.");
        const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
        const path = userId + "/" + crypto.randomUUID() + "." + ext;
        const { error } = await window.sbClient.storage
            .from("organizer-logos")
            .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
        if (error) throw error;
        const { data } = window.sbClient.storage.from("organizer-logos").getPublicUrl(path);
        return { path, url: data.publicUrl };
    },

    async setLogo(organizerId, url) {
        const { data, error } = await window.sbClient
            .from("organizers").update({ logo_url: url }).eq("id", organizerId).select("id");
        if (error) throw error;
        if (!data || data.length === 0) throw new Error("Could not update your logo.");
    },

    /** Deletes a logo file. Accepts a storage path or the public URL. */
    async removeLogo(pathOrUrl) {
        const marker = "/organizer-logos/";
        const s = String(pathOrUrl || "");
        const i = s.indexOf(marker);
        const path = i === -1 ? s : decodeURIComponent(s.slice(i + marker.length).split("?")[0]);
        if (path) await window.sbClient.storage.from("organizer-logos").remove([path]);
    },

        /* ---------- account settings ---------- */

    async updateAccount(userId, organizerId, { name, phone }) {
        const full = String(name || "").trim();
        const digits = String(phone || "").replace(/\D/g, "");
        const { data, error } = await window.sbClient
            .from("profiles")
            .update({ full_name: full, phone: digits })
            .eq("id", userId)
            .select("id");
        if (error) throw new Error(error.message);   // the trigger's messages are readable
        if (!data || data.length === 0) throw new Error("Could not save your details.");
        if (organizerId) {
            // keep the organizer's contact person in step (not critical if it fails)
            const { error: e2 } = await window.sbClient
                .from("organizers").update({ contact_person: full }).eq("id", organizerId);
            if (e2) console.warn("contact_person not synced:", e2.message);
        }
    },

    async changePassword(email, current, next) {
        const sb = window.sbClient;
        // Confirm the current password first, so a borrowed open session can't change it
        const { error: e1 } = await sb.auth.signInWithPassword({ email, password: current });
        if (e1) {
            if (e1.code === "invalid_credentials" || /invalid login/i.test(e1.message))
                throw new Error("Your current password is incorrect.");
            throw new Error(e1.message);
        }
        const { error } = await sb.auth.updateUser({ password: next });
        if (error) throw new Error(error.message);
        // Log out every other device that was signed in with the old password
        try { await sb.auth.signOut({ scope: "others" }); } catch (e) { /* not critical */ }
    },

    async latestVerification(organizerId) {
        const { data, error } = await window.sbClient
            .from("verification_requests")
            .select("id, status, message, reviewer_note, created_at, reviewed_at")
            .eq("organizer_id", organizerId)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) throw error;
        return data || null;
    },

    async requestVerification(organizerId, message) {
        const { error } = await window.sbClient
            .from("verification_requests")
            .insert({ organizer_id: organizerId, message: String(message || "").trim() });
        if (error) {
            if (error.code === "23505") throw new Error("You already have a request waiting for review.");
            if (error.code === "23514") throw new Error("Please write between 30 and 1500 characters.");
            throw new Error(error.message);
        }
    },
};

window.organizerApi = organizerApi;