"use strict";
/* ============================================================
   MIDDLEWARE — STORE HOOK
   Connects React components to the store.
   ============================================================ */

/** React hook: re-renders a component whenever the store changes. */
function useStore() {
    const [, bump] = useState(0);
    useEffect(() => { const cb = () => bump(x => x + 1); store.subs.add(cb); return () => store.subs.delete(cb); }, []);
    return store.state;
}
