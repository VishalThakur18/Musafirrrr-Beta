"use strict";
/* ============================================================
   UI — ICON
   ============================================================ */

/** Renders an icon by name. */
function Icon({ name, size = 18, className = '', stroke = 1.7, fill = 'none' }) {
    const paths = (P[name] || '').split('|');
    return (React.createElement("svg", { viewBox: "0 0 24 24", width: size, height: size, className: className, fill: fill, stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": "true" }, paths.map((dd, i) => React.createElement("path", { key: i, d: dd }))));
}
