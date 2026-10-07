"use strict";
/* ============================================================
   MIDDLEWARE — STORE HOOK
   Connects React components to the store.
   ============================================================ */

/** React hook: re-renders a component whenever the store changes. */
/* ---------- AUTH STATE (shared by Navbar, Guard, App) ---------- */
const authState = { user: null, ready: false, subs: new Set() };

function useStore() {
    const [, bump] = useState(0);
    useEffect(() => { const cb = () => bump(x => x + 1); store.subs.add(cb); return () => store.subs.delete(cb); }, []);
    return store.state;
}

/**
 * Refresh the shared auth state.
 * Pass a user (or null) to set it directly, or nothing to fetch it.
 */
async function refreshAuth(user) {
    try {
        authState.user = user !== undefined ? user : await authService.current();
    } catch (err) {
        console.error("Auth refresh failed:", err);
        authState.user = null;
    }
    authState.ready = true;
    authState.subs.forEach(f => f());
}
window.refreshAuth = refreshAuth;

/** React hook: { user, ready } */
function useAuth() {
    const [, bump] = useState(0);
    useEffect(() => {
        const cb = () => bump(x => x + 1);
        authState.subs.add(cb);
        return () => authState.subs.delete(cb);
    }, []);
    return authState;
}

// Initial load, then follow Supabase auth events
refreshAuth();
window.sbClient.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" && session?.user?.id === authState.user?.id) return;
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setTimeout(() => refreshAuth(), 0);
    }
});
