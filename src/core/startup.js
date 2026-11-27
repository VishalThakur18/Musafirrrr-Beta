"use strict";
// Available before React and network dependencies load.
window.appStartup = (() => {
    let timer, revision = 0, finishing = 0;
    const loader = () => document.getElementById('boot-loader');
    function begin() {
        const token = ++revision;
        clearTimeout(timer);
        loader().hidden = false;
        loader().classList.remove('is-leaving');
        document.body.classList.remove('is-revealing');
        document.body.classList.add('is-booting');
        const root = document.getElementById('root');
        if (root) { root.inert = true; root.setAttribute('aria-busy', 'true'); }
        document.getElementById('boot-message').textContent = 'Getting your next adventure ready?';
        document.getElementById('boot-retry').hidden = true;
        timer = setTimeout(() => {
            if (token !== revision) return;
            document.getElementById('boot-message').textContent = 'This is taking longer than expected. You can wait or try again.';
            document.getElementById('boot-retry').hidden = false;
        }, 15000);
        return token;
    }
    async function finish() {
        if (loader().hidden || finishing === revision) return;
        const token = revision;
        finishing = token;
        const root = document.getElementById('root');
        // Wait for visible images and heading font, but never block on off-screen media.
        const images = Array.from(root.querySelectorAll('img')).filter(img => img.getBoundingClientRect().top < innerHeight);
        const media = images.map(img => img.decode ? img.decode().catch(() => {}) : Promise.resolve());
        if (document.fonts) media.push(document.fonts.ready);
        let deadline;
        await Promise.race([Promise.allSettled(media), new Promise(resolve => { deadline = setTimeout(resolve, 2500); })]);
        clearTimeout(deadline);
        if (token !== revision) return;
        clearTimeout(timer);
        // Paint the complete page beneath an opaque loader before fading the overlay.
        document.body.classList.add('is-revealing');
        requestAnimationFrame(() => requestAnimationFrame(() => {
            if (token !== revision) return;
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const complete = () => {
                if (token !== revision) return;
                loader().hidden = true;
                root.inert = false;
                root.removeAttribute('aria-busy');
                document.body.classList.remove('is-booting', 'is-revealing');
            };
            loader().classList.add('is-leaving');
            if (reduced) complete();
            else {
                let fallback;
                const ended = event => {
                    if (event.target !== loader() || event.propertyName !== 'opacity') return;
                    clearTimeout(fallback);
                    loader().removeEventListener('transitionend', ended);
                    complete();
                };
                loader().addEventListener('transitionend', ended);
                fallback = setTimeout(() => { loader().removeEventListener('transitionend', ended); complete(); }, 750);
            }
        }));
    }
    begin();
    return { begin, finish };
})();
