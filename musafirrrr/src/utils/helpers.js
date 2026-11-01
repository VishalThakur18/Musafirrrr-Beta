"use strict";
/* ============================================================
   GENERAL HELPERS
   Small pure functions: ids, slugs, class-name joining, fake latency.
   ============================================================ */

/** Generates a short unique id with a prefix. */
const uid = p => p + '_' + Math.random().toString(36).slice(2, 9);

/** Simulates network latency. */
/* ---------- helpers ---------- */
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

/** Today as YYYY-MM-DD. */
function today() {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
}

/** Calendar dates without timezone conversion or JavaScript date rollover. */
function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    const parsed = new Date(value + 'T00:00:00Z');
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

/** Clear an end date when a changed range would put it before its start. */
function dateRangePatch(current, patch, start = 'start', end = 'end') {
    const next = { ...current, ...patch };
    if (next[start] && next[end] && next[end] < next[start]) next[end] = '';
    return next;
}

/** Turns a title into a URL-friendly slug. */
function slugify(s) { return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

/** Joins CSS class names, skipping falsy values. */
function cls(...a) { return a.filter(Boolean).join(' '); }
