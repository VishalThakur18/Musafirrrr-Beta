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
      organizer/            <- Dashboard, Leads, Trips, TripWizard, ProfileEdit, Settings
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
