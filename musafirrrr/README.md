# Musafirrrr — Group Trips Marketplace

Same website as before, now split into small files you can edit in VS Code.
No build step, no npm: just open `index.html` (or use the VS Code **Live Server** extension).

## Folder structure

```
index.html                  <- entry page (host this on GitHub Pages)
assets/css/styles.css       <- global CSS & animations
src/
  config/                   <- tailwind.config.js (colours/fonts), constants.js (option lists)
  core/react-globals.js     <- React hooks shortcuts
  utils/                    <- helpers.js, format.js (₹, dates), links.js (WhatsApp/Instagram)
  assets/                   <- imagery.js (generated SVG pictures), icons.js (icon paths)
  data/                     <- seed "database": organizers, trips, users, enquiries
  backend/                  <- store.js (database + localStorage) and services/
      services/             <- auth, trip, organizer, wishlist, enquiry logic
  middleware/               <- router.js, auth.guard.js, store.hooks.js, toast.js
  components/
      ui/                   <- Button, Form, Modal, Badges, Feedback, Icon, Layout
      shared/               <- TripCard, SearchBar, WhatsApp/Instagram buttons
      layout/               <- Navbar, Footer, MobileTabs, Logo
  pages/
      public/               <- Home, Explore, TripDetail, Organizer, HowItWorks, ForCommunities
      auth/                 <- Login, Signup
      traveller/            <- Saved, Dashboard, MyTrips, Profile
  features/organizerDashboard/        <- organizer dashboard frontend
      pages/                <- Dashboard, Leads, Trips, TripWizard, ProfileEdit, Settings
      components/           <- OrganizerShell and future organizer-only components
      styles/               <- organizerDashboard.css for new dashboard styles
  App.js                    <- route table + layout
  main.js                   <- starts the app (must load last)
```

## Where to edit what

| I want to change...            | Edit this                                   |
|--------------------------------|---------------------------------------------|
| Colours / fonts                | `src/config/tailwind.config.js`             |
| Demo trips / organizers        | `src/data/*.data.js`                        |
| Business logic (login, trips)  | `src/backend/services/*.service.js`         |
| A page's look                  | `src/pages/...`                             |
| Navbar / footer                | `src/components/layout/...`                 |
| Add a new page                 | create file in `src/pages`, add a `<script>` tag in `index.html` **before** `src/App.js`, add a route in `src/App.js` |

**Important:** files are plain scripts sharing one global scope, so the `<script>` order in `index.html` matters. If you add a file, place it before the files that use it.

## Changing trip photos across the website

The photo list lives in [destination-images.js](src/config/destination-images.js).
To change a photo, either replace its JPEG in [assets/images/destinations](assets/images/destinations/)
with the same filename, or update its path in the configuration. Paths are relative to
[index.html](index.html). Refresh the page after saving (hard refresh if an old image is cached).

Trending shows up to eight published or sold-out Supabase trips, ordered by rating, then price. For example, Alleppey uses the Kerala
photo through its region. Assam's photo is ready for when an Assam trip is added.
The supplied photos are resized for the web; the original Downloads files are untouched.
Image choices are resolved by `tripImages(trip)` and `tripCoverSrc(trip)` in
[imagery.js](src/assets/imagery.js) across cards, detail galleries, enquiries and
organizer listings. No localStorage reset or backend change is needed. Clicking a card,
opening a direct trip link, and refreshing all resolve the same photos from the trip data.

For several photos, change a destination value to an array of paths. The first photo
is its cover. To give one trip a different gallery, add its slug to `TRIP_IMAGES` in
[destination-images.js](src/config/destination-images.js), for example:

```js
const TRIP_IMAGES = {
    'spiti-valley-circuit': [
        'assets/images/destinations/spiti.jpg',
        'assets/images/destinations/spiti-extra.jpg'
    ]
};
```

Add the extra photo file before referencing it. Per-trip configuration takes priority,
followed by organizer-uploaded photos, destination photos, then existing illustration
fallbacks. Duplicate URLs are removed. A single-photo gallery fills the available width.
Popular destination tiles also use the destination configuration. Destinations without
supplied photos retain their existing images. Existing decorative scenes and logos remain separate.
Local photo URLs let the browser reuse downloaded images across pages; cards and
gallery thumbnails load lazily, while the main gallery photo loads immediately.

## Photo card colors and future uploads

Trending cards sample the lower half of a loaded photo using a tiny canvas in
[photo-tools.js](src/assets/photo-tools.js). Colors are cached for up to 100 URLs.
The text panel is opaque and darkened for readable white text. Cross-origin images
that disallow canvas access use a neutral dark fallback; the photo still displays.
Serve local files through Live Server for browser canvas access. Remote storage
must permit CORS if image color sampling is required.

Community photos are selected in the trip editor's photo picker. Before upload,
`optimizeTripPhoto` limits the longest edge to 1600 pixels and encodes WebP at 0.9
quality, keeping the original if the result is larger or conversion fails. This
preserves visual detail for web use, but is not lossless or pixel-identical.
The existing upload service and backend are unchanged. Adjust these two settings
in [photo-tools.js](src/assets/photo-tools.js). Current bundled photos are already resized.

For bundled images, edit [destination-images.js](src/config/destination-images.js)
or replace files in [assets/images/destinations](assets/images/destinations/).
For a particular trip, configure its slug in `TRIP_IMAGES`. Uploaded photos take
precedence over destination defaults; explicit `TRIP_IMAGES` overrides take priority
over both. Remove an override to let a community manage that trip's images.

## Demo logins
- Traveller: `traveller@demo.com` / `password`
- Organizer: `organizer@demo.com` / `password`

## Host on GitHub Pages
1. Push this folder to a GitHub repo (keep `index.html` at the root).
2. Repo → Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)`.
3. Open `https://<your-username>.github.io/<repo-name>/`.

Routing uses `#/...` URLs, so refreshing pages works on GitHub Pages.

## Connecting a real backend later
The UI only talks to `src/backend/services/*`. Replace the bodies of those functions with `fetch()` calls to your API and the pages stay unchanged.

## Consistent cover sizing

The shared card uses tripCoverLayout() from src/assets/photo-tools.js. Change TRIP_PHOTO_POLICY to adjust the cover ratio, upload maximum edge, or quality. Covers reserve their space before loading and use centered object-fit: cover cropping without stretching. Full uploaded compositions remain available to the gallery. fitTripPhoto() preserves upload proportions and never enlarges small photos. Grid rows have equal heights; card titles display up to two lines (the full title remains on the trip page).


## Shared public trip data

Home, Explore and published trip details share the snapshot in [data.service.js](src/backend/services/data.service.js). A 60-second in-memory TTL avoids repeated listing requests across routes, and in-flight requests are deduplicated. Navigation, focus and reconnect revalidate expired data; this is not continuous polling. A full reload fetches fresh data. Successful organizer saves, status/spot updates and deletes invalidate the snapshot immediately and notify other tabs on the same origin. Direct database changes appear on the next expired-cache revalidation. Public fetch failures show a retry notice; demo seed trips are not substituted for database results.

Related photos, organizers, itinerary and inclusions share one normalized shape in [trip.service.js](src/backend/services/trip.service.js). Organizer profile and non-listing detail reads are also cached for 60 seconds. Authentication identity changes invalidate cached reads. Supabase permissions remain enforced; no database policy or schema changes are required.

Run cache regression checks with `node tests/public-trip-cache.test.cjs`.
