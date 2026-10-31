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
    const previousUserId = authState.user && authState.user.id;

    try {
        authState.user = user !== undefined ? user : await authService.current();
    } catch (err) {
        console.error("Auth refresh failed:", err);
        authState.user = null;
    }

    const currentUserId = authState.user && authState.user.id;

    if (previousUserId !== currentUserId) {
        dataService.invalidate(false);
    }

    authState.ready = true;
    authState.subs.forEach(f => f());

    if (typeof wishlistService !== "undefined") {
        try {
            await wishlistService.load();
        } catch (err) {
            console.error("Wishlist load failed:", err);
        }
    }
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
window.authBooting = true;
window.sbClient.auth.onAuthStateChange((event, session) => {
    if (window.authBooting) return;
    if (event === "SIGNED_IN" && session?.user?.id === authState.user?.id) return;
    if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setTimeout(async () => {
            let viaGoogle = false;
            if (event === "SIGNED_IN" && session && session.user) {
                try { viaGoogle = await finishGoogleLogin(session.user); }
                catch (e) { console.error(e); toast(e.message || "Could not finish sign-in", "bad"); }
            }
            await refreshAuth();
            if (event === "SIGNED_IN") {
                let p = null;
                try { p = sessionStorage.getItem("postLoginPath"); sessionStorage.removeItem("postLoginPath"); } catch (e) {}
                const me = authState.user;
                if (p && !/^\/(traveller|organizer)\//.test(p)) go(p);          // e.g. the trip they were viewing
                else if (viaGoogle && me) go(me.role === "ORGANIZER" ? "/organizer/dashboard" : "/traveller/dashboard");
            }
        }, 0);
    }
});

/** React hook: runs an async loader and returns { loading, error, data, reload }. */
function useAsync(fn, deps, { keepPreviousData = false } = {}) {
    const [state, setState] = useState({ loading: true, error: null, data: null });
    const [tick, setTick] = useState(0);
    useEffect(() => {
        let active = true;
        setState(s => ({ ...s, loading: true, error: null }));
        fn().then(
            data => { if (active) setState({ loading: false, error: null, data }); },
            error => { console.error(error); if (active) setState(previous => ({ loading: false, error, data: keepPreviousData ? previous.data : null })); }
        );
        return () => { active = false; };
    }, [...deps, tick]);
    return { ...state, reload: () => setTick(t => t + 1) };
}
