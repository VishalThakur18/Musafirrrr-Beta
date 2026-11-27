"use strict";

// Small content units only: never transform a page, sticky rail or gallery.
const SITE_MOTION_SELECTOR = [
    '[data-scroll-reveal]', '.trip-card',
    'main h1', 'main h2', 'main h1 + p', 'main h2 + p',
    'main .grid > .rounded-2xl', 'main .grid > div:has(> h3)',
    'main ol > li', 'main > form > div',
    '.traveller-auth__fields > form',
    '.traveller-auth__fields > div:has(> button)'
].join(', ');

function siteMotionTarget(el) {
    // Specialized homepage/organizer motion owns its descendants. Avoid nested
    // reveals and preserve immediate access to overlays and sticky actions.
    if (el.closest('.home-motion, .org-motion, .traveller-slideshow, .trip-gallery, aside, nav, [role="dialog"], [aria-modal="true"]')) return false;
    if (el.parentElement?.closest('.site-reveal')) return false;
    if (el.contains(document.activeElement)) return false;
    const position = getComputedStyle(el).position;
    return position !== 'fixed' && position !== 'sticky';
}

function siteMotionKey(el) {
    if (el.hasAttribute('data-motion-key')) return el.getAttribute('data-motion-key');
    if (el.matches('.trip-card')) {
        // The same trip can appear in saved, recent and recommended grids.
        const section = el.closest('section');
        return (section?.querySelector('h2')?.textContent || 'trips') + ':' + el.querySelector('a')?.getAttribute('href');
    }
    return null;
}

function siteMotionGroup(el) {
    // Saved cards have a wrapper containing their Remove button.
    if (el.matches('.trip-card') && el.parentElement.parentElement?.matches('.grid')) return el.parentElement.parentElement;
    return el.parentElement;
}

function useSiteMotion(root, route) {
    useScrollReveal(root, {
        selector: SITE_MOTION_SELECTOR, prefix: 'site',
        enabled: route !== '/' && !route.startsWith('/organizer'),
        keyFor: siteMotionKey, groupFor: siteMotionGroup, shouldReveal: siteMotionTarget,
        visitKey: route, threshold: 0
    });
}
