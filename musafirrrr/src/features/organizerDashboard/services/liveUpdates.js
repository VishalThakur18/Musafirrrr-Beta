"use strict";

/** One organizer-scoped subscription owned by the shell. Polling also covers tables
 * not enabled in the Realtime publication, missed events and filtered deletions.
 * Reads remain in existing services, with their existing authentication/RLS.
 */
function startOrganizerLiveUpdates(organizerId, { client = window.sbClient, target = window, doc = document, online = () => navigator.onLine !== false } = {}) {
    if (!organizerId) return () => {};
    let disposed = false, debounce = null, channel = null;
    const visible = () => doc.visibilityState !== 'hidden' && online();
    const notify = () => {
        if (disposed || !visible() || debounce !== null) return;
        debounce = target.setTimeout(() => {
            debounce = null;
            if (!disposed && visible()) target.dispatchEvent(new CustomEvent('organizer-data-changed', { detail: { organizerId } }));
        }, 250);
    };
    try {
        if (client?.channel) {
            channel = client.channel('organizer-workspace:' + organizerId)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'enquiries', filter: 'organizer_id=eq.' + organizerId }, notify)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: 'organizer_id=eq.' + organizerId }, notify);
            channel.subscribe(status => { if (status === 'SUBSCRIBED') notify(); });
        }
    } catch (error) {
        // Automatic checks still work if the realtime connection is unavailable.
    }
    const interval = target.setInterval(notify, 15000);
    target.addEventListener('focus', notify);
    target.addEventListener('online', notify);
    target.addEventListener('leads-changed', notify);
    doc.addEventListener('visibilitychange', notify);
    return () => {
        disposed = true;
        target.clearInterval(interval);
        if (debounce !== null) target.clearTimeout(debounce);
        target.removeEventListener('focus', notify);
        target.removeEventListener('online', notify);
        target.removeEventListener('leads-changed', notify);
        doc.removeEventListener('visibilitychange', notify);
        if (channel) {
            try { Promise.resolve(client.removeChannel(channel)).catch(() => {}); } catch (error) { /* already disconnected */ }
        }
    };
}

/** Keep callbacks current without resubscribing on every render. Changes arriving
 * during an existing request queue one refresh, rather than cancelling the request.
 */
function useOrganizerLiveRefresh(organizerId, reload, loading) {
    const latest = useRef({ reload, loading });
    latest.current = { reload, loading };
    const pending = useRef(false);
    useEffect(() => {
        pending.current = false;
        const change = event => {
            if (!organizerId || event.detail?.organizerId !== organizerId) return;
            if (latest.current.loading) { pending.current = true; return; }
            latest.current.loading = true;
            latest.current.reload();
        };
        window.addEventListener('organizer-data-changed', change);
        return () => window.removeEventListener('organizer-data-changed', change);
    }, [organizerId]);
    useEffect(() => {
        if (!loading && pending.current) {
            pending.current = false;
            latest.current.loading = true;
            latest.current.reload();
        }
    }, [loading]);
}
