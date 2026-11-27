"use strict";

/** Progressive enhancement: only observed elements are ever hidden. */
function useScrollReveal(root, { selector, prefix, enabled = true, keyFor, groupFor, visitKey, threshold = 0.08, shouldReveal } = {}) {
    useEffect(() => {
        const host = root.current;
        if (!enabled || !host || !window.IntersectionObserver) return;
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const seen = new WeakSet();
        const revealed = new Set();
        const reveal = el => {
            el.classList.remove(`${prefix}-reveal--pending`);
            const key = keyFor?.(el);
            if (key) revealed.add(key);
            observer.unobserve(el);
        };
        const observer = new IntersectionObserver(entries => {
            // Stagger only siblings entering together; mobile and horizontal rows
            // never wait for cards that are still outside their viewport.
            const groups = new Map();
            entries.filter(entry => entry.isIntersecting).forEach(({ target }) => {
                const group = groupFor?.(target) || target.parentElement;
                const index = groups.get(group) || 0;
                groups.set(group, index + 1);
                const delay = Math.max(index * 80, Number(target.getAttribute(`data-${prefix}-delay`)) || 0);
                target.style.setProperty(`--${prefix}-delay`, media.matches ? '0ms' : `${delay}ms`);
                reveal(target);
            });
        }, { threshold });
        const scan = () => {
            host.querySelectorAll(selector).forEach(el => {
                if (seen.has(el)) return;
                seen.add(el);
                // Forms in dialogs must remain immediate and viewport-positioned.
                if (el.closest('[role="dialog"], [aria-modal="true"]')) return;
                if (shouldReveal && !shouldReveal(el)) return;
                el.classList.add(`${prefix}-reveal`);
                const bounds = el.getBoundingClientRect();
                const visibleAtStartup = document.body.classList.contains('is-booting') && bounds.top < window.innerHeight && bounds.bottom > 0;
                if (media.matches || visibleAtStartup || (keyFor && revealed.has(keyFor(el)))) return;
                observer.observe(el);
                el.classList.add(`${prefix}-reveal--pending`);
            });
        };
        const mutations = new MutationObserver(scan);
        const preference = () => {
            if (media.matches) host.querySelectorAll(`.${prefix}-reveal--pending`).forEach(reveal);
        };
        const focus = event => {
            let el = event.target.closest(`.${prefix}-reveal`);
            while (el && host.contains(el)) {
                el.style.setProperty(`--${prefix}-delay`, '0ms');
                reveal(el);
                el = el.parentElement?.closest(`.${prefix}-reveal`);
            }
        };
        scan();
        mutations.observe(host, { childList: true, subtree: true });
        media.addEventListener('change', preference);
        host.addEventListener('focusin', focus);
        return () => {
            observer.disconnect();
            mutations.disconnect();
            media.removeEventListener('change', preference);
            host.removeEventListener('focusin', focus);
            host.querySelectorAll(`.${prefix}-reveal`).forEach(el => {
                el.classList.remove(`${prefix}-reveal`, `${prefix}-reveal--pending`);
                el.style.removeProperty(`--${prefix}-delay`);
            });
        };
    }, [root, selector, prefix, enabled, keyFor, groupFor, visitKey, threshold, shouldReveal]);
}

