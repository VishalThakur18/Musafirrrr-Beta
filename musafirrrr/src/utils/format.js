"use strict";
/* ============================================================
   FORMATTERS
   Currency, date and duration formatting used across the UI.
   ============================================================ */

/** Formats a number as Indian rupees. */
const INR = n => '₹' + Number(n || 0).toLocaleString('en-IN');

/** Short month names. */
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Parses YYYY-MM-DD into a Date. */
function d(s) { return new Date(s + 'T00:00:00'); }

/** e.g. "Oct 12". */
function fmtDate(s) { const x = d(s); return MON[x.getMonth()] + ' ' + x.getDate(); }

/** e.g. "Oct 12, 2026". */
function fmtLong(s) { const x = d(s); return MON[x.getMonth()] + ' ' + x.getDate() + ', ' + x.getFullYear(); }

/** e.g. "Oct 12–15". */
function dateRange(a, b) { const A = d(a), B = d(b); return A.getMonth() === B.getMonth() ? `${MON[A.getMonth()]} ${A.getDate()}–${B.getDate()}` : `${fmtDate(a)} – ${fmtDate(b)}`; }

/** Days left until a date. */
function daysUntil(s) { return Math.ceil((d(s) - new Date()) / 86400000); }

/** e.g. "4D / 3N". */
function dur(t) { return `${t.days}D / ${t.nights}N`; }
