"use strict";
/* ============================================================
   AUTH — SHARED LAYOUT & DEMO CREDENTIALS
   ============================================================ */

/** Shared layout for login/signup. */
function AuthShell({ children, title, sub, travellerIntro = false, communityIntro = false, loginIntro = false, roleIntro = false, footer }) {
    const illustrated = travellerIntro || communityIntro || loginIntro || roleIntro;
    return (React.createElement("main", { className: illustrated ? "traveller-auth" + (loginIntro ? " login-auth" : "") + (roleIntro ? " role-auth" : "") : "min-h-[calc(100vh-72px)] grid lg:grid-cols-2" },
        roleIntro ? React.createElement(AuthWelcomePoster) : illustrated ? React.createElement(AuthIntroSlideshow, { audience: loginIntro ? 'all' : communityIntro ? 'community' : 'traveller', key: loginIntro ? 'all' : communityIntro ? 'community' : 'traveller' }) : React.createElement("div", { className: "hidden lg:block relative" },
            React.createElement("img", { src: sceneURL('mountains', 5150), alt: "", className: "absolute inset-0 w-full h-full object-cover" }),
            React.createElement("div", { className: "absolute inset-0 bg-ink/55" }),
            React.createElement("div", { className: "relative h-full flex flex-col justify-end p-12 text-white" },
                React.createElement("blockquote", { className: "text-[28px] font-extrabold tracking-[-0.03em] leading-[1.15] max-w-md" }, "Everything from a weekend in Rishikesh to eight days in Spiti \u2014 listed by the people who actually run them."),
                React.createElement("p", { className: "mt-4 text-white/70 text-[15px]" },
                    tripService.published().length,
                    " trips live from ",
                    ORGANIZERS.length,
                    " communities"))),
        React.createElement("div", { className: illustrated ? "traveller-auth__form" : "flex items-center justify-center px-5 py-12 sm:py-16" },
            React.createElement("div", { className: illustrated ? "traveller-auth__fields" : "w-full max-w-[420px]" },
                React.createElement("h1", { className: "text-[32px] font-extrabold tracking-[-0.03em] leading-tight" }, title),
                sub && React.createElement("p", { className: "mt-2 text-[15.5px] text-slatey leading-relaxed" }, sub),
                children,
                (roleIntro || loginIntro) && footer && React.createElement("div", { className: roleIntro ? "role-auth__footer" : "login-auth__footer" }, footer))),
        illustrated && !roleIntro && !loginIntro && footer && React.createElement("div", { className: "traveller-auth__footer" }, footer)));
}

/** A static introduction shared by both account types. */
function AuthWelcomePoster() {
    return React.createElement('aside', { className: 'traveller-slideshow auth-welcome-poster', 'aria-label': 'Meet Musafirrrr' },
        React.createElement('div', { className: 'traveller-slideshow__card' },
            React.createElement('img', { className: 'traveller-slideshow__image', src: 'assets/images/destinations/kashmir.jpg', alt: '' }),
            React.createElement('div', { className: 'traveller-slideshow__shade' }),
            React.createElement('span', { className: 'traveller-slideshow__location' }, React.createElement(Icon, { name: 'compass', size: 15 }), 'Meet Musafirrrr'),
            React.createElement('div', { className: 'traveller-slideshow__copy' },
                React.createElement('span', { className: 'traveller-slideshow__eyebrow' }, 'GREAT TRIPS BEGIN WITH CONNECTION.'),
                React.createElement('h2', null, 'Find your people. Share the journey.'),
                React.createElement('p', null, 'A place for travellers to discover their next group trip and travel communities to share their adventures, connect directly and grow together.'))));
}

/** Demo login shortcuts. */
function DemoCreds({ onUse }) {
    return (React.createElement("div", { className: "mt-6 rounded-2xl border border-dashed border-beige bg-sand p-4" },
        React.createElement("p", { className: "text-[12px] font-bold tracking-[.1em] text-earth" }, "DEMO ACCOUNTS"),
        React.createElement("div", { className: "mt-2.5 space-y-2 text-[13.5px]" },
            React.createElement("button", { onClick: () => onUse('traveller@demo.com'), className: "w-full text-left flex justify-between items-center hover:text-earth" },
                React.createElement("span", null, "Traveller \u00B7 traveller@demo.com"),
                React.createElement("span", { className: "font-semibold underline underline-offset-4" }, "Use")),
            React.createElement("button", { onClick: () => onUse('organizer@demo.com'), className: "w-full text-left flex justify-between items-center hover:text-earth" },
                React.createElement("span", null, "Organizer \u00B7 organizer@demo.com"),
                React.createElement("span", { className: "font-semibold underline underline-offset-4" }, "Use"))),
        React.createElement("p", { className: "mt-2.5 text-[12.5px] text-muted" },
            "Password for both: ",
            React.createElement("strong", null, "password"))));
}

const COMMUNITY_AUTH_SLIDES = [
        { image: 'destinations/spiti.jpg', place: 'Spiti Valley', title: 'Your next trip. Their next adventure.', description: 'Publish your group trips with itineraries, dates and inclusions. Help travellers discover what your community has planned.' },
        { image: 'destinations/meghalaya.jpg', place: 'Meghalaya', title: 'More conversations. New connections.', description: 'Receive enquiries from interested travellers and connect directly on WhatsApp. Keep your leads together in your dashboard.' },
        { image: 'destinations/jaisalmer.jpg', place: 'Jaisalmer', title: 'Give your community a place to shine.', description: 'Create a public profile with your story, social links and upcoming trips. Let travellers get to know the people behind the journey.' }
    ].map(item => ({ ...item, eyebrow: 'YOUR COMMUNITY. THEIR NEXT ADVENTURE.' }));
const TRAVELLER_AUTH_SLIDES = [
        { image: 'destinations/andaman.jpg', place: 'Andaman', title: 'So many communities. One place to discover.', description: 'Discover group trips from multiple travel communities, all in one place.' },
        { image: 'destinations/kerala.jpg', place: 'Kerala', title: 'Your next journey starts with a hello.', description: 'Connect directly with the organizer. Ask your questions, then plan your adventure together.' },
        { image: 'categories/beach.jpg', place: 'Find your coast', title: 'Find a trip that feels like you.', description: 'A beach escape or a new adventure. Choose the trip that goes with your vibe.' }
    ].map(item => ({ ...item, eyebrow: 'A WORLD OF TRIPS. YOUR KIND OF PEOPLE.' }));

// Reuse the same cards on signup and interleave both audiences on login.
const ALL_AUTH_SLIDES = TRAVELLER_AUTH_SLIDES.flatMap((item, index) => [item, COMMUNITY_AUTH_SLIDES[index]]);
function AuthIntroSlideshow({ audience = 'traveller' }) {
    const [slide, setSlide] = useState(0);
    const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const slides = audience === 'all' ? ALL_AUTH_SLIDES : audience === 'community' ? COMMUNITY_AUTH_SLIDES : TRAVELLER_AUTH_SLIDES;
    useEffect(() => {
        const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReducedMotion(preference.matches);
        preference.addEventListener('change', update);
        return () => preference.removeEventListener('change', update);
    }, []);
    useEffect(() => {
        if (reducedMotion) return;
        const timer = window.setInterval(() => {
            if (!document.hidden) setSlide(current => (current + 1) % slides.length);
        }, 5000);
        return () => window.clearInterval(timer);
    }, [slide, reducedMotion, slides.length]);
    return React.createElement('aside', {
        className: 'traveller-slideshow', 'aria-label': audience === 'community' ? 'Grow your travel community with Musafirrrr' : 'Why travel with Musafirrrr', 'aria-roledescription': 'carousel'
    },
        React.createElement('div', { className: 'traveller-slideshow__card' },
            slides.map((item, index) => React.createElement('section', {
                key: item.image, className: 'traveller-slideshow__slide' + (index === slide ? ' is-active' : ''),
                'aria-hidden': index !== slide, 'aria-label': (index + 1) + ' of ' + slides.length, 'aria-roledescription': 'slide'
            },
                React.createElement('img', { src: 'assets/images/' + item.image, alt: '', className: 'traveller-slideshow__image' }),
                React.createElement('div', { className: 'traveller-slideshow__shade' }),
                React.createElement('span', { className: 'traveller-slideshow__location' }, React.createElement(Icon, { name: 'map', size: 15 }), item.place),
                React.createElement('div', { className: 'traveller-slideshow__copy' },
                    React.createElement('span', { className: 'traveller-slideshow__eyebrow' }, item.eyebrow),
                    React.createElement('h2', null, item.title),
                    React.createElement('p', null, item.description)))),
            React.createElement('div', { className: 'traveller-slideshow__bottom' },
                React.createElement('div', { className: 'traveller-slideshow__dots', 'aria-label': 'Choose a slide' },
                    slides.map((item, index) => React.createElement('button', {
                        key: item.image, type: 'button', 'aria-label': 'Slide ' + (index + 1) + ': ' + item.title,
                        'aria-pressed': slide === index, onClick: () => setSlide(index)
                    }, React.createElement('span', null)))))));
}
