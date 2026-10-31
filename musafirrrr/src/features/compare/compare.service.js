"use strict";
/** Isolated API: caller identity is checked again inside the database function. */
const comparisonApi = {
    async update(owner, action, tripId = null) {
        const { data, error } = await window.sbClient.rpc('update_trip_comparison', {
            p_owner: owner, p_action: action, p_trip_id: tripId
        });
        if (error) throw error;
        if (!Array.isArray(data)) throw new Error('Invalid comparison response');
        return compareIds(data);
    }
};

/** One controller per account. No account selections are written to guest storage. */
class ComparisonController {
    constructor(owner, api = comparisonApi) {
        this.owner = owner;
        this.api = api;
        this.active = true;
        this.locked = false;
        this.failedAction = null;
        this.listeners = new Set();
        this.state = { ids: owner ? [] : readCompareIds(), busy: !!owner, initialized: !owner, syncError: null };
        this.subscribe = listener => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
        this.snapshot = () => this.state;
    }
    publish(patch) {
        if (!this.active) return;
        this.state = { ...this.state, ...patch };
        this.listeners.forEach(listener => listener());
    }
    async run(action, tripId = null) {
        if (!this.active || this.locked) return false;
        this.locked = true;
        if (!this.owner) {
            const ids = action === 'get' ? readCompareIds() : action === 'add'
                ? compareIds([...this.state.ids, tripId])
                : compareSelection(this.state.ids, { type: action, id: tripId });
            let syncError = null;
            try { localStorage.setItem(COMPARE_KEY, JSON.stringify(ids)); }
            catch (_) { syncError = 'Device storage is unavailable. Your selection lasts until this page closes.'; }
            this.publish({ ids, busy: false, initialized: true, syncError });
            this.locked = false;
            return true;
        }
        this.publish({ busy: true, syncError: null });
        try {
            const ids = await this.api.update(this.owner, action, tripId);
            if (!this.active) return false;
            this.failedAction = null;
            this.publish({ ids, initialized: true, syncError: null });
            return true;
        } catch (error) {
            this.failedAction = { action, tripId };
            const message = error.code === '22023' ? error.message :
                action === 'get' ? 'Could not load your account comparison. Please retry.' : 'Your comparison change could not be confirmed. Please retry.';
            this.publish({ syncError: message });
            return false;
        } finally {
            this.locked = false;
            this.publish({ busy: false });
        }
    }
    retry() {
        if (!this.owner) return this.run('persist');
        const failed = this.failedAction;
        return this.run(failed?.action || 'get', failed?.tripId || null);
    }
}
