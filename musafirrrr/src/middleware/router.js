"use strict";
/* ============================================================
   MIDDLEWARE — HASH ROUTER
   Works on GitHub Pages with no server config (URLs look like #/explore).
   ============================================================ */

/** Hook returning the current hash route; scrolls to top on change. */
function useRoute() {
    const [h, setH] = useState(() => location.hash.slice(1) || '/');
    useEffect(() => {
        const on = () => { setH(location.hash.slice(1) || '/'); window.scrollTo({ top: 0, behavior: 'instant' }); };
        window.addEventListener('hashchange', on);
        return () => window.removeEventListener('hashchange', on);
    }, []);
    return h;
}

/** Navigate to a route programmatically. */
function go(path) { location.hash = path; }

/** Splits a hash into path, parts and query params. */
function parsePath(h) {
    const [p, q] = h.split('?');
    const params = {};
    new URLSearchParams(q || '').forEach((v, k) => params[k] = v);
    return { path: p.replace(/\/$/, '') || '/', parts: p.split('/').filter(Boolean), params };
}

/** Anchor that navigates using hash routing. */
function Link({ to, children, className, ...rest }) {
    return React.createElement("a", { href: '#' + to, className: className, ...rest }, children);
}
