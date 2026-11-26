"use strict";
/* ============================================================
   PAGES — TERMS (#/terms) & PRIVACY (#/privacy)
   Plain-language drafts written for the beta. Have them reviewed
   by a lawyer before the public launch, and update LEGAL_UPDATED
   whenever the wording changes.
   ============================================================ */

const LEGAL_UPDATED = '27 November 2026';

/** Shared layout: title, last-updated line, numbered sections, contact footer. */
function LegalPage({ title, intro, sections }) {
    return (React.createElement("main", { className: "consistent-page max-w-shell mx-auto px-5 lg:px-8 py-12 md:py-20" },
        React.createElement("div", { className: "page-hero" },
            React.createElement("h1", { className: "text-[38px] sm:text-[56px] font-extrabold tracking-[-0.035em] leading-[1.02]" }, title),
            React.createElement("p", { className: "mt-4 text-[14px] text-muted" }, "Last updated ", LEGAL_UPDATED),
            React.createElement("p", { className: "mt-5 text-[18px] text-slatey leading-relaxed" }, intro)),
        React.createElement("div", { className: "page-card mt-8 p-6 sm:p-10" },
            React.createElement("ol", { className: "space-y-9 max-w-3xl" }, sections.map(([heading, paragraphs], i) => (React.createElement("li", { key: heading },
                React.createElement("h2", { className: "text-[20px] font-extrabold tracking-tight" }, i + 1, ". ", heading),
                paragraphs.map((p, j) => React.createElement("p", { key: j, className: "mt-2.5 text-[15px] text-slatey leading-relaxed" }, p)))))),
            React.createElement("div", { className: "mt-10 pt-6 border-t border-line max-w-3xl" },
                React.createElement("h2", { className: "text-[18px] font-extrabold tracking-tight" }, "Questions?"),
                React.createElement("p", { className: "mt-2 text-[15px] text-slatey leading-relaxed" },
                    "Message us on ",
                    React.createElement("a", { href: waLink('7985419494', 'Hi Musafirrrr! I have a question about your ' + title.toLowerCase() + '.'), target: "_blank", rel: "noopener noreferrer", className: "font-semibold text-ink underline underline-offset-2" }, "WhatsApp"),
                    " or ",
                    React.createElement("a", { href: "https://instagram.com/musafirrrr.in", target: "_blank", rel: "noopener noreferrer", className: "font-semibold text-ink underline underline-offset-2" }, "Instagram"),
                    ". See also our ",
                    React.createElement(Link, { to: title === 'Terms of use' ? '/privacy' : '/terms', className: "font-semibold text-ink underline underline-offset-2" }, title === 'Terms of use' ? 'Privacy policy' : 'Terms of use'),
                    ".")))));
}

/** Terms of use (#/terms). */
function TermsPage() {
    return React.createElement(LegalPage, {
        title: 'Terms of use',
        intro: 'These terms cover your use of Musafirrrr, whether you are browsing trips, saving them, or listing trips as an organizer. By using the site you agree to them.',
        sections: [
            ['What Musafirrrr is', [
                'Musafirrrr is a listing platform. Travel communities and organizers publish group trips here, and travellers browse them and contact the organizer directly.',
                'We do not run, operate or sell any trip. The organizer is solely responsible for the trip itself: itinerary, safety, transport, stays, pricing, refunds and anything that happens on it.'
            ]],
            ['Bookings and payments', [
                'We do not process payments or hold your money. Any booking, payment or cancellation is an agreement between you and the organizer, on the organizer\'s own terms.',
                'Read the trip\'s inclusions, exclusions and cancellation policy, and confirm details with the organizer before you pay.'
            ]],
            ['Your account', [
                'You need an account to save trips, send enquiries or list trips. Keep your login details private, and tell us if you think someone else has used your account.',
                'Give accurate information when you sign up and when you enquire. We may suspend accounts that are used to mislead, spam or harass others.'
            ]],
            ['For organizers', [
                'Only list trips you are actually running and are entitled to sell. Keep dates, prices, available spots and inclusions accurate and up to date.',
                'Use photos and text you own or have permission to use. You keep ownership of your content, and you allow us to display it on Musafirrrr and in our promotion of your listing.',
                'Treat traveller contact details shared through enquiries as confidential, and use them only to discuss the trip they asked about.',
                'A "verified" badge means we have reviewed your registration details and references. It is not a guarantee of any trip. We may remove listings that break these terms.'
            ]],
            ['Acceptable use', [
                'Do not post false, misleading, offensive or illegal content, scrape the site, try to break its security, or use it to send unsolicited messages.'
            ]],
            ['Beta and sample content', [
                'Musafirrrr is in beta. Some trips and organizers on the site are sample data for demonstration, and features may change or be unavailable at times.'
            ]],
            ['Liability', [
                'The site is provided "as is". To the extent the law allows, Musafirrrr is not liable for any trip, for anything an organizer or traveller does, or for losses arising from bookings made through contacts found here.'
            ]],
            ['Changes and governing law', [
                'We may update these terms; the date above shows the latest version, and continuing to use the site means you accept the changes.',
                'These terms are governed by the laws of India.'
            ]]
        ]
    });
}

/** Privacy policy (#/privacy). */
function PrivacyPage() {
    return React.createElement(LegalPage, {
        title: 'Privacy policy',
        intro: 'This explains what information Musafirrrr collects, why, and who can see it. We collect only what the site needs to work, and we do not sell your data.',
        sections: [
            ['What we collect', [
                'Account details: your name, email address, phone number and password (stored securely, never in plain text), and whether you are a traveller or an organizer.',
                'Enquiries: the details you submit when you enquire about a trip, such as your name, phone number, email, group size and message.',
                'Organizer profiles and listings: community name, bio, social links, contact numbers, trip details and photos.',
                'Activity on the site: trips you save or compare, and basic usage such as listing views, which organizers see as analytics.'
            ]],
            ['How we use it', [
                'To run your account, show your saved trips, send your enquiries to the right organizer, show organizers their listings and enquiries, and keep the site secure and working.'
            ]],
            ['Who can see it', [
                'When you send an enquiry, the organizer of that trip receives your enquiry details so they can reply. Organizer profiles and published trips are public.',
                'We use trusted service providers to host the site and store data. They process it only on our behalf. We do not sell or rent your personal data, and we share it with authorities only when the law requires.'
            ]],
            ['Storage on your device', [
                'The site stores some information in your browser\'s local storage so it loads quickly and remembers your session and preferences. Clearing your browser data removes it.'
            ]],
            ['How long we keep it', [
                'We keep your information while your account is active. If you ask us to delete your account, we delete or anonymise your data unless we must keep it to meet a legal obligation.'
            ]],
            ['Your choices and rights', [
                'You can update your profile at any time. You can ask us for a copy of your data, to correct it, or to delete your account, by contacting us below.',
                'We handle personal data in line with India\'s Digital Personal Data Protection Act, 2023.'
            ]],
            ['Changes', [
                'We may update this policy as the site changes. The date above shows the latest version.'
            ]]
        ]
    });
}
