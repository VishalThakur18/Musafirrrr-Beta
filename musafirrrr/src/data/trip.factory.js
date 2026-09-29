"use strict";
/* ============================================================
   TRIP FACTORY & DEFAULTS
   Default inclusions/exclusions and the T() helper that fills default trip fields.
   ============================================================ */

/** Default "what's included" list for new trips. */
const INC_DEF = ['Accommodation on twin/triple sharing', 'Transport as per itinerary', 'Daily breakfast and dinner', 'Trip captain for the full duration', 'Permits and entry fees', 'Basic first-aid support'];

/** Default "what's not included" list for new trips. */
const EXC_DEF = ['Flights and train tickets to the starting point', 'Lunches and personal meals', 'Personal expenses, shopping and tips', 'Anything not listed under what\'s included', 'Travel insurance', 'Costs due to weather delays or roadblocks'];

/** Trip factory: fills in default fields for every trip record. */
function T(o) {
    return Object.assign({
        currency: 'INR', status: 'PUBLISHED', included: INC_DEF, excluded: EXC_DEF,
        rating: 4.6, reviews: 24, images: [], createdAt: '2026-08-01', advance: 2000
    }, o);
}
