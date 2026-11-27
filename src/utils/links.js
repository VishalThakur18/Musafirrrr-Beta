"use strict";
/* ============================================================
   EXTERNAL LINK BUILDERS
   WhatsApp / Instagram links and the pre-filled enquiry message.
   ============================================================ */

/** Builds a WhatsApp click-to-chat link. */
function waLink(number, text) { return `https://wa.me/${String(number || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`; }

/** Builds an Instagram profile link. */
function igLink(handle) { return `https://instagram.com/${String(handle || '').replace(/^@/, '')}`; }

/** Pre-filled WhatsApp message for a trip. */
function tripWaMessage(trip, org) {
    return `Hi ${org ? org.name : ''}! I saw your trip "${trip.title}" to ${trip.destination} (${dateRange(trip.startDate, trip.endDate)}) on Musafirrrr and I'm interested in joining. Could you share more details?`;
}
