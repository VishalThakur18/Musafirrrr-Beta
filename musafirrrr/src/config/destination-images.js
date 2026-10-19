"use strict";

// Change a filename here, or replace the matching file in assets/images/destinations/.
// Keys match a trip's destination or region. Paths are relative to index.html.
// A value can also be an array of photo paths: the first is the cover.
const DESTINATION_IMAGES = {
    Andaman: 'assets/images/destinations/andaman.jpg',
    Assam: 'assets/images/destinations/assam.jpg',
    Coorg: 'assets/images/destinations/coorg.jpg',
    Jaisalmer: 'assets/images/destinations/jaisalmer.jpg',
    Kashmir: 'assets/images/destinations/kashmir.jpg',
    Kerala: 'assets/images/destinations/kerala.jpg',
    Meghalaya: 'assets/images/destinations/meghalaya.jpg',
    Rishikesh: 'assets/images/destinations/rishikesh.jpg',
    Spiti: 'assets/images/destinations/spiti.jpg'
};

// Optional galleries for individual trips, keyed by the slug in /trip/:slug.
// Example: 'spiti-valley-circuit': ['assets/images/destinations/spiti.jpg', 'assets/images/spiti-2.jpg']
const TRIP_IMAGES = {};

function destinationImages(trip) {
    const value = DESTINATION_IMAGES[trip.destination] || DESTINATION_IMAGES[trip.region];
    return value ? (Array.isArray(value) ? value : [value]) : [];
}

function destinationImage(trip) {
    return destinationImages(trip)[0];
}
