"use strict";

// Account-owned saves are kept in Supabase, never device-wide localStorage.
const wishlistService = {
    ownerId: null,
    loadedUserId: null,
    version: 0,
    pendingLoad: null,
    pendingToggles: new Set(),
    currentUser() { return typeof authState !== 'undefined' ? authState.user : null; },
    canSave() { const user = this.currentUser(); return !!user?.id && user.role === 'TRAVELLER'; },
    syncIdentity() {
        const ownerId = this.canSave() ? this.currentUser().id : null;
        if (ownerId === this.ownerId) return;
        this.ownerId = ownerId;
        this.loadedUserId = null;
        this.version++;
        this.pendingLoad = null;
        this.pendingToggles.clear();
        store.set(s => { s.wishlist = []; s.wishlistLoading = !!ownerId; s.wishlistError = null; });
    },
    ids() { return this.canSave() && this.ownerId === this.currentUser().id ? store.state.wishlist : []; },
    has(id) { return this.ids().includes(id); },
    isDatabaseId(id) {
        return typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    },
    async load() {
        this.syncIdentity();
        if (!this.canSave()) return [];
        const userId = this.ownerId;
        if (this.loadedUserId === userId) return [...this.ids()];
        if (this.pendingLoad) return this.pendingLoad;
        const version = this.version;
        const active = () => version === this.version && this.canSave() && this.currentUser().id === userId;
        store.set(s => { s.wishlistLoading = true; s.wishlistError = null; });
        const request = (async () => {
            try {
                const { data, error } = await window.sbClient.from('saved_trips').select('trip_id').eq('user_id', userId);
                if (error) throw error;
                if (!active()) return [];
                const ids = [...new Set((data || []).map(row => row.trip_id))];
                this.loadedUserId = userId;
                store.set(s => { s.wishlist = ids; });
                return [...ids];
            } catch (error) {
                if (active()) store.set(s => { s.wishlistError = error; });
                throw error;
            } finally {
                if (active()) store.set(s => { s.wishlistLoading = false; });
            }
        })();
        this.pendingLoad = request;
        try { return await request; }
        finally { if (this.pendingLoad === request) this.pendingLoad = null; }
    },
    async toggle(id) {
        this.syncIdentity();
        if (!this.canSave()) return false;
        if (!this.isDatabaseId(id)) { toast("This sample trip can't be synced to your account."); return false; }
        const userId = this.ownerId;
        const version = this.version;
        const key = version + ':' + id;
        const active = () => version === this.version && this.canSave() && this.currentUser().id === userId;
        if (this.pendingToggles.has(key)) return this.has(id);
        this.pendingToggles.add(key);
        try {
            await this.load();
            if (!active()) return false;
            const on = this.has(id);
            const { error } = on
                ? await window.sbClient.from('saved_trips').delete().eq('user_id', userId).eq('trip_id', id)
                : await window.sbClient.from('saved_trips').upsert({ user_id: userId, trip_id: id }, { onConflict: 'user_id,trip_id', ignoreDuplicates: true });
            if (error) throw error;
            if (!active()) return false;
            store.set(s => { s.wishlist = on ? s.wishlist.filter(x => x !== id) : [...new Set([id, ...s.wishlist])]; });
            toast(on ? 'Removed from saved trips' : 'Saved. Find it under Saved trips.');
            return !on;
        } catch (error) {
            if (active()) toast("Couldn't update saved trips. Please try again.");
            return false;
        } finally { this.pendingToggles.delete(key); }
    },
    trips() { return this.ids().map(id => store.state.trips.find(t => t.id === id) || tripService.byId(id)).filter(Boolean); }
};
window.wishlistService = wishlistService;
