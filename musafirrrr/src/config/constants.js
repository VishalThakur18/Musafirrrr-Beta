"use strict";
/* ============================================================
   APP CONSTANTS
   Static option lists used by filters, forms and navigation.
   ============================================================ */

/** localStorage key under which the whole app state is saved. */
const LS_KEY = 'musafirrrr.v1';

/** Trip categories. */
/* ---------- search module ---------- */
const CATEGORIES = ['Trek', 'Beach', 'Mountains', 'Backpacking', 'Weekend', 'Adventure', 'International'];

/** Group types. */
const GROUPS = ['All Girls', 'Mixed Group', 'Solo Friendly', 'Families', 'Couples', 'Backpackers'];

/** Popular destinations. */
const DESTS = ['Manali', 'Goa', 'Meghalaya', 'Kerala', 'Rishikesh', 'Ladakh', 'Kashmir', 'Spiti', 'Jaisalmer', 'Coorg', 'Andaman', 'Bali', 'Vietnam'];

/** Sort options. */
/* ---------- explore ---------- */
const SORTS = [['recommended', 'Recommended'], ['price_asc', 'Price: low to high'], ['price_desc', 'Price: high to low'], ['soonest', 'Soonest trip'], ['newest', 'Recently added']];

/** Duration filter options. */
const DURATIONS = [['', 'Any length'], ['1-3', '1–3 days'], ['4-7', '4–7 days'], ['8+', '8+ days']];

/** Organizer sidebar links. */
const ORG_NAV = [['/organizer/dashboard', 'chart', 'Dashboard'], ['/organizer/trips', 'grid', 'My trips'], ['/organizer/create', 'plus', 'Create trip'],
    ['/organizer/leads', 'inbox', 'Leads'], ['/organizer/profile', 'user', 'Profile'], ['/organizer/settings', 'gear', 'Settings']];

/** Wizard step names. */
const WIZARD = ['Basics', 'Dates', 'Pricing', 'Photos', 'Itinerary', 'Included', 'Not included', 'Contact', 'Preview'];
