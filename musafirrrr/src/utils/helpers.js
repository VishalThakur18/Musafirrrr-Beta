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
function today() { return new Date().toISOString().slice(0, 10); }

/** Turns a title into a URL-friendly slug. */
function slugify(s) { return String(s).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }

/** Joins CSS class names, skipping falsy values. */
function cls(...a) { return a.filter(Boolean).join(' '); }
