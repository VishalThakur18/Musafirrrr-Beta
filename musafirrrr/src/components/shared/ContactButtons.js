"use strict";
/* ============================================================
   SHARED — WHATSAPP & INSTAGRAM BUTTONS
   ============================================================ */

/** Opens WhatsApp chat with the organizer. */
function WhatsAppButton({ trip, org, size = 'md', className, label = 'Chat on WhatsApp' }) {
    if (!org || !org.whatsapp)
        return null;
    return React.createElement(Btn, { as: "a", href: waLink(org.whatsapp, tripWaMessage(trip, org)), target: "_blank", rel: "noopener noreferrer", variant: "wa", size: size, icon: "wa", className: className, onClick: () => { void tripAnalytics.track(trip, 'whatsapp_click'); toast('Opening WhatsApp with your message ready'); } }, label);
}

/** Opens the organizer's Instagram. */
function InstagramButton({ trip, org, size = 'md', className, label = 'Message on Instagram' }) {
    if (!org || !org.instagram)
        return null;
    return React.createElement(Btn, { as: "a", href: igLink(org.instagram), target: "_blank", rel: "noopener noreferrer", variant: "ig", size: size, icon: "ig", className: cls('btn-ig', className), onClick: () => { void tripAnalytics.track(trip, 'instagram_click'); } }, label);
}
