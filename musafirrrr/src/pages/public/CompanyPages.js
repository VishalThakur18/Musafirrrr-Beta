"use strict";
/* ============================================================
   PAGES — ABOUT (#/about) & CONTACT (#/contact)
   Contact channels live in COMPANY_CONTACT so they are edited in one place.
   ============================================================ */

const COMPANY_CONTACT = {
    whatsapp: '7985419494',
    instagram: 'musafirrrr.in'
};

/** About (#/about). */
function AboutPage() {
    return (React.createElement("main", { className: "consistent-page max-w-shell mx-auto px-5 lg:px-8 py-12 md:py-20" },
        React.createElement("div", { className: "page-hero" },
            React.createElement("h1", { className: "text-[38px] sm:text-[56px] font-extrabold tracking-[-0.035em] leading-[1.02]" }, "Every group trip in India, in one place."),
            React.createElement("p", { className: "mt-5 text-[18px] text-slatey leading-relaxed" }, "Group trips in India are run by hundreds of travel communities, and finding them means scrolling Instagram pages and WhatsApp groups one by one. Musafirrrr brings them together so you can compare trips side by side and talk straight to the people running them.")),
        React.createElement("div", { className: "mt-8 grid gap-6 md:grid-cols-3" }, [
            ['compass', 'For travellers', 'Search by destination, dates, budget or the kind of group you want, from treks to all-girls trips. Save the ones you like and compare them before you decide.'],
            ['users', 'For communities', 'A free public page for your community and every trip you run, with enquiries arriving with a name, phone number and email, ready to follow up.'],
            ['shield', 'No middleman', 'We never take your money or a commission. You enquire, chat with the organizer on WhatsApp, and book with them directly.']
        ].map(([icon, title, body]) => (React.createElement("div", { key: title, className: "page-card p-6 sm:p-8" },
            React.createElement("span", { className: "w-11 h-11 rounded-full bg-ink text-white flex items-center justify-center" },
                React.createElement(Icon, { name: icon, size: 20 })),
            React.createElement("h2", { className: "mt-5 text-[20px] font-extrabold tracking-tight" }, title),
            React.createElement("p", { className: "mt-2 text-[15px] text-slatey leading-relaxed" }, body))))),
        React.createElement("section", { className: "page-card mt-8 p-6 sm:p-10" },
            React.createElement("h2", { className: "text-2xl font-extrabold tracking-tight" }, "What we believe"),
            React.createElement("div", { className: "mt-6 grid md:grid-cols-2 gap-x-12 gap-y-7" }, [
                ['Know who you are travelling with', 'Every trip shows the organizer behind it, their past trips and reviews, and whether we have verified them.'],
                ['The full picture up front', 'Day-by-day itineraries, inclusions and exclusions, group size and cancellation policy, before you ever send a message.'],
                ['Small communities deserve to be found', 'A weekend trek run by five friends gets the same listing as the biggest operator.'],
                ['Built in beta, with you', 'Musafirrrr is still in beta. Tell us what is missing and we will keep building it.']
            ].map(([q, a]) => (React.createElement("div", { key: q },
                React.createElement("h3", { className: "font-bold text-[16px] tracking-tight" }, q),
                React.createElement("p", { className: "mt-1.5 text-[15px] text-slatey leading-relaxed" }, a))))),
            React.createElement("div", { className: "mt-9 flex flex-wrap gap-3" },
                React.createElement(Btn, { onClick: () => go('/explore'), icon: "search" }, "Explore trips"),
                React.createElement(Btn, { variant: "outline", onClick: () => go('/for-communities') }, "List your trips")))));
}

/** Contact (#/contact). */
function ContactPage() {
    const channels = [
        {
            icon: 'wa', title: 'WhatsApp', detail: '+91 ' + COMPANY_CONTACT.whatsapp,
            body: 'The quickest way to reach us, for questions about the site, your account or a listing.',
            href: waLink(COMPANY_CONTACT.whatsapp, 'Hi Musafirrrr! I have a question.'), cta: 'Chat on WhatsApp'
        },
        {
            icon: 'ig', title: 'Instagram', detail: '@' + COMPANY_CONTACT.instagram,
            body: 'Follow for new trips and updates, or send us a DM.',
            href: 'https://instagram.com/' + COMPANY_CONTACT.instagram, cta: 'Open Instagram'
        }
    ];
    return (React.createElement("main", { className: "consistent-page max-w-shell mx-auto px-5 lg:px-8 py-12 md:py-20" },
        React.createElement("div", { className: "page-hero" },
            React.createElement("h1", { className: "text-[38px] sm:text-[56px] font-extrabold tracking-[-0.035em] leading-[1.02]" }, "Talk to us."),
            React.createElement("p", { className: "mt-5 text-[18px] text-slatey leading-relaxed" }, "Questions, feedback, a problem with a listing, or want to bring your community on board? Message us and a real person will reply.")),
        React.createElement("div", { className: "mt-8 grid gap-6 md:grid-cols-2" }, channels.map(c => (React.createElement("div", { key: c.title, className: "page-card p-6 sm:p-8 flex flex-col" },
            React.createElement("span", { className: "w-11 h-11 rounded-full bg-ink text-white flex items-center justify-center" },
                React.createElement(Icon, { name: c.icon, size: 20 })),
            React.createElement("h2", { className: "mt-5 text-[20px] font-extrabold tracking-tight" }, c.title),
            React.createElement("p", { className: "mt-1 text-[15px] font-semibold text-ink" }, c.detail),
            React.createElement("p", { className: "mt-2 text-[15px] text-slatey leading-relaxed" }, c.body),
            React.createElement("a", { href: c.href, target: "_blank", rel: "noopener noreferrer", className: "mt-6 self-start inline-flex items-center gap-2 h-11 px-5 rounded-full bg-ink text-white text-sm font-semibold hover:bg-slatey transition-colors" }, c.cta,
                React.createElement(Icon, { name: "arrow", size: 15 })))))),
        React.createElement("section", { className: "page-card mt-8 p-6 sm:p-10" },
            React.createElement("h2", { className: "text-2xl font-extrabold tracking-tight" }, "Before you message"),
            React.createElement("div", { className: "mt-6 grid md:grid-cols-2 gap-x-12 gap-y-7" }, [
                ['A question about a specific trip?', 'The organizer knows it best. Use "Enquire" on the trip page to reach them directly.'],
                ['Payments or refunds?', 'We never handle money, so refunds are between you and the organizer. If something has gone wrong with a listing, do tell us.'],
                ['Run a travel community?', React.createElement(React.Fragment, null, 'Listing is free during the beta. ', React.createElement(Link, { to: "/for-communities", className: "font-semibold text-ink underline underline-offset-2" }, "See how it works"), '.')],
                ['Your data', React.createElement(React.Fragment, null, 'To get a copy of your data or delete your account, message us on WhatsApp. Read our ', React.createElement(Link, { to: "/privacy", className: "font-semibold text-ink underline underline-offset-2" }, "privacy policy"), '.')]
            ].map(([q, a]) => (React.createElement("div", { key: q },
                React.createElement("h3", { className: "font-bold text-[16px] tracking-tight" }, q),
                React.createElement("p", { className: "mt-1.5 text-[15px] text-slatey leading-relaxed" }, a))))))));
}
