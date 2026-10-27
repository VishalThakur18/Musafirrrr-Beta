"use strict";

// Only these routes opt into organizer scroll motion. No form/data logic lives here.
const ORGANIZER_MOTION_SELECTORS = {
    "/organizer/dashboard": ".org-overview-hero, .org-stat-grid > *, .org-panel, .org-action-row, .org-departure, .od-reminder, .org-lead-grid, .org-trip-preview, .od-analytics-chart",
    "/organizer/trips": ":scope > div:has(h2), .org-search, .org-trip-row",
    "/organizer/departures": ".od-departures-heading, .org-stat-grid > *, .od-departure-filters, .od-departure-group-heading, .od-departure-card, .od-departure-editor",
    "/organizer/create": ":scope > div:first-child, :scope > .u-scroll, :scope > .rounded-2xl, :scope > .rounded-2xl > div",
    "/organizer/leads": ".od-leads > div:has(> div > h2), .od-lead-filters, .org-lead-grid, .od-saved-note",
    "/organizer/finance": ".finance-header, .finance-metric, .finance-page > .finance-panel, .finance-trip, .finance-page .finance-table tbody tr",
    "/organizer/profile": ":scope > div:has(h2), :scope > form > div",
    "/organizer/settings": ":scope > div:has(h2):not(.max-w-2xl), :scope > .max-w-2xl > *"
};

// Stable keys prevent report refreshes and reminder pagination from replaying
// entrances for content already seen during this page visit.
function organizerRevealKey(el) {
    if (el.matches('.od-analytics-chart')) return 'chart:' + Array.from(el.parentElement.children).indexOf(el);
    if (el.parentElement.matches('.org-stat-grid')) return 'stat:' + (el.closest('.od-performance') ? 'analytics:' : 'overview:') + Array.from(el.parentElement.children).indexOf(el);
    if (el.matches('.od-reminder, .org-departure, .org-action-row')) return el.className.split(' ')[0] + ':' + el.getAttribute('href');
    if (el.matches('.org-trip-preview, .org-trip-row')) return 'trip:' + el.querySelector('a')?.getAttribute('href');
    if (el.matches('.org-lead-grid')) return 'lead:' + el.firstElementChild?.textContent;
    if (el.matches('.finance-metric')) return 'finance:' + el.getAttribute('aria-label');
    if (el.matches('.od-departure-card')) return 'departure:' + el.getAttribute('aria-label');
    return null;
}

function organizerRevealGroup(el) {
    if (el.matches('.org-lead-grid')) return el.closest('.od-lead-record')?.parentElement || el.parentElement.parentElement;
    return el.parentElement;
}

function useOrganizerMotion(root, route, enabled = true) {
    useScrollReveal(root, {
        selector: ORGANIZER_MOTION_SELECTORS[route] || '[data-no-organizer-motion]',
        prefix: 'od', enabled: enabled && !!ORGANIZER_MOTION_SELECTORS[route],
        keyFor: organizerRevealKey, groupFor: organizerRevealGroup, visitKey: route,
        threshold: 0
    });
}
