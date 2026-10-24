
"use strict";
/* ============================================================
   BACKEND SERVICE — WISHLIST
   Guest saves use local storage.
   Signed-in traveller saves use Supabase.
   ============================================================ */

const wishlistService = {
    guestIds: [...store.state.wishlist],
    loadedUserId: null,
    loadVersion: 0,
    pendingLoads: new Map(),
    pendingToggles: new Set(),

    ids() {
        return store.state.wishlist;
    },

    has(id) {
        return store.state.wishlist.includes(id);
    },

    currentUser() {
        return typeof authState !== "undefined" ? authState.user : null;
    },

    isDatabaseId(id) {
        return typeof id === "string" &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    },

    async load() {
        const user = this.currentUser();
        const userId = user && user.id;

        // Guest mode: restore the device's guest wishlist.
        if (!userId) {
            this.loadVersion++;
            this.loadedUserId = null;

            store.set(s => {
                s.wishlist = [...this.guestIds];
            });

            return [...this.guestIds];
        }

        if (this.loadedUserId === userId) {
            return [...store.state.wishlist];
        }

        if (this.pendingLoads.has(userId)) {
            return this.pendingLoads.get(userId);
        }

        const version = ++this.loadVersion;

        const request = (async () => {
            const { data, error } = await window.sbClient
                .from("saved_trips")
                .select("trip_id")
                .eq("user_id", userId);

            if (error) throw error;

            // Ignore results from an outdated request or account.
            if (
                version !== this.loadVersion ||
                this.currentUser()?.id !== userId
            ) {
                return [];
            }

            const ids = [...new Set((data || []).map(row => row.trip_id))];

            this.loadedUserId = userId;

            store.set(s => {
                s.wishlist = ids;
            });

            return [...ids];
        })();

        this.pendingLoads.set(userId, request);

        try {
            return await request;
        } finally {
            if (this.pendingLoads.get(userId) === request) {
                this.pendingLoads.delete(userId);
            }
        }
    },

    async toggle(id) {
        const user = this.currentUser();
        const userId = user && user.id;

        // Guest mode: retain the existing local-only behavior.
        if (!userId) {
            const on = this.guestIds.includes(id);

            this.guestIds = on
                ? this.guestIds.filter(x => x !== id)
                : [id, ...this.guestIds];

            store.set(s => {
                s.wishlist = [...this.guestIds];
            });

            toast(on
                ? "Removed from saved trips"
                : "Saved. Find it under Saved trips.");

            return !on;
        }

        if (!this.isDatabaseId(id)) {
            toast("This sample trip can't be synced to your account.");
            return false;
        }

        // Avoid duplicate operations caused by rapid repeated clicks.
        const operationKey = `${userId}:${id}`;

        if (this.pendingToggles.has(operationKey)) {
            return this.has(id);
        }

        this.pendingToggles.add(operationKey);

        try {
            if (this.loadedUserId !== userId) {
                await this.load();
            }

            // The user may have switched accounts during the load.
            if (this.currentUser()?.id !== userId) {
                return false;
            }

            const on = this.has(id);

            if (on) {
                const { error } = await window.sbClient
                    .from("saved_trips")
                    .delete()
                    .eq("user_id", userId)
                    .eq("trip_id", id);

                if (error) throw error;

                if (this.currentUser()?.id === userId) {
                    store.set(s => {
                        s.wishlist = s.wishlist.filter(x => x !== id);
                    });
                }

                toast("Removed from saved trips");
                return false;
            }

            const { error } = await window.sbClient
                .from("saved_trips")
                .upsert(
                    { user_id: userId, trip_id: id },
                    { onConflict: "user_id,trip_id", ignoreDuplicates: true }
                );

            if (error) throw error;

            if (this.currentUser()?.id === userId) {
                store.set(s => {
                    if (!s.wishlist.includes(id)) {
                        s.wishlist = [id, ...s.wishlist];
                    }
                });
            }

            toast("Saved. Find it under Saved trips.");
            return true;
        } catch (error) {
            console.error("Wishlist sync failed:", error);
            toast("Couldn't update saved trips. Please try again.");
            return false;
        } finally {
            this.pendingToggles.delete(operationKey);
        }
    },

    trips() {
        return store.state.wishlist
            .map(id =>
                store.state.trips.find(t => t.id === id) ||
                tripService.byId(id)
            )
            .filter(Boolean);
    }
};

window.wishlistService = wishlistService;
