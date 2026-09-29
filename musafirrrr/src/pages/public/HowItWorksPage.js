"use strict";
/* ============================================================
   PAGE — HOW IT WORKS  (#/how-it-works)
   ============================================================ */

/** How it works (#/how-it-works). */
/* ---------- static pages ---------- */
function HowItWorksPage() {
    return (React.createElement("main", { className: "max-w-shell mx-auto px-5 lg:px-8 py-12 md:py-20" },
        React.createElement("div", { className: "max-w-3xl" },
            React.createElement("h1", { className: "text-[38px] sm:text-[56px] font-extrabold tracking-[-0.035em] leading-[1.02]" }, "Find a trip. Talk to the person running it."),
            React.createElement("p", { className: "mt-5 text-[18px] text-slatey leading-relaxed" }, "Musafirrrr is a noticeboard for group trips. Travel communities list what they are running; you browse everything in one place and take it from there with the organizer directly.")),
        React.createElement("div", { className: "mt-14 grid gap-10 md:grid-cols-2" },
            React.createElement("div", null,
                React.createElement("h2", { className: "text-2xl font-extrabold tracking-tight" }, "If you're travelling"),
                React.createElement("ol", { className: "mt-5 space-y-6" }, [['Search', 'Enter a destination, your dates or a budget. Filter by trek, beach, all-girls, solo-friendly and more.'],
                    ['Save what you like', 'Tap the heart on any trip. No account needed — your saved list stays on this device until you sign up.'],
                    ['Read the whole trip', 'Day-by-day itinerary, what is and is not included, group size, meeting point and the cancellation policy.'],
                    ['Enquire', 'Send your details to the organizer, then continue on WhatsApp. You pay them directly; we never hold your money.']
                ].map(([t, b], i) => (React.createElement("li", { key: t, className: "flex gap-4" },
                    React.createElement("span", { className: "w-8 h-8 rounded-full bg-ink text-white flex items-center justify-center text-[13px] font-bold shrink-0" }, i + 1),
                    React.createElement("div", null,
                        React.createElement("h3", { className: "font-bold text-[16.5px] tracking-tight" }, t),
                        React.createElement("p", { className: "mt-1 text-[15px] text-slatey leading-relaxed" }, b)))))),
                React.createElement(Btn, { className: "mt-8", onClick: () => go('/explore'), icon: "search" }, "Explore trips")),
            React.createElement("div", null,
                React.createElement("h2", { className: "text-2xl font-extrabold tracking-tight" }, "If you organize trips"),
                React.createElement("ol", { className: "mt-5 space-y-6" }, [['Create your community profile', 'Your name, bio, Instagram and WhatsApp. This becomes your public page on Musafirrrr.'],
                    ['Add a trip', 'Nine short steps: basics, dates, price, photos, itinerary, inclusions and contact. Save a draft any time.'],
                    ['Publish', 'Your trip enters the feed and shows up in search and filters the moment it goes live.'],
                    ['Answer enquiries', 'Every enquiry arrives with a name, phone number and email. Mark them contacted, confirmed or cancelled as you go.']
                ].map(([t, b], i) => (React.createElement("li", { key: t, className: "flex gap-4" },
                    React.createElement("span", { className: "w-8 h-8 rounded-full bg-earth text-white flex items-center justify-center text-[13px] font-bold shrink-0" }, i + 1),
                    React.createElement("div", null,
                        React.createElement("h3", { className: "font-bold text-[16.5px] tracking-tight" }, t),
                        React.createElement("p", { className: "mt-1 text-[15px] text-slatey leading-relaxed" }, b)))))),
                React.createElement(Btn, { variant: "earth", className: "mt-8", onClick: () => go('/signup?role=ORGANIZER') }, "List your first trip"))),
        React.createElement("section", { className: "mt-20 rounded-3xl bg-sand border border-line p-7 sm:p-12" },
            React.createElement("h2", { className: "text-2xl font-extrabold tracking-tight" }, "Questions people ask"),
            React.createElement("div", { className: "mt-6 grid md:grid-cols-2 gap-x-12 gap-y-7" }, [['Do I pay Musafirrrr?', 'No. Every rupee goes to the organizer running your trip. We do not process payments.'],
                ['What does "verified" mean?', 'We have seen the organizer\'s registration details and references from past trips. Organizers without the mark are simply unverified, not unsafe.'],
                ['Can I go alone?', 'Most trips here are built for solo travellers. Filter by "Solo friendly" to see them.'],
                ['Is there a listing fee?', 'Listing trips is free during the beta. We take no commission on your bookings.']
            ].map(([q, a]) => (React.createElement("div", { key: q },
                React.createElement("h3", { className: "font-bold text-[16px] tracking-tight" }, q),
                React.createElement("p", { className: "mt-1.5 text-[15px] text-slatey leading-relaxed" }, a))))))));
}
