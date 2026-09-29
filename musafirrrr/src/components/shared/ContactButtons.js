"use strict";
/* ============================================================
   SHARED — WHATSAPP & INSTAGRAM BUTTONS
   ============================================================ */

/** Opens WhatsApp chat with the organizer. */
function WhatsAppButton({ trip, org, size = 'md', className, label = 'Chat on WhatsApp' }) {
    if (!org || !org.whatsapp)
        return null;
    return React.createElement(Btn, { as: "a", href: waLink(org.whatsapp, tripWaMessage(trip, org)), target: "_blank", rel: "noopener noreferrer", variant: "wa", size: size, icon: "wa", className: className, onClick: () => toast('Opening WhatsApp with your message ready') }, label);
}

/** Opens the organizer's Instagram. */
function InstagramButton({ org, size = 'md', className, label = 'Message on Instagram' }) {
    if (!org || !org.instagram)
        return null;
    return React.createElement(Btn, { as: "a", href: igLink(org.instagram), target: "_blank", rel: "noopener noreferrer", variant: "ig", size: size, icon: "ig", className: className }, label);
}
