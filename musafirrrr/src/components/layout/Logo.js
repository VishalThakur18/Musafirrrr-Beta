"use strict";
/* ============================================================
   LAYOUT — LOGO
   Shows the logo image stored at src/assets/logo.jpeg.
   Used by: Navbar, Footer, OrganizerShell.
   ============================================================ */

/* Path is relative to index.html (NOT to this file). */
const LOGO_URL = 'src/assets/logo.jpeg';

/** Brand logo (image). `tone="light"` is used on dark backgrounds (footer). */
function Logo({ className, tone = 'ink' }) {
    return (
        React.createElement(
            Link,
            {
                to: "/",
                className: cls(
                    'inline-flex items-center',
                    className
                ),
                "aria-label": "Musafirrrr — home"
            },
            React.createElement("img", {
                src: LOGO_URL,
                alt: "Musafirrrr",
                className: cls(
                    'h-10 w-10 md:h-10 md:w-10 aspect-square rounded-full object-cover',
                    tone === 'light' && 'bg-white p-1'
                ),
                onError: (e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.insertAdjacentText(
                        'afterend',
                        'Musafirrrr'
                    );
                }
            })
        )
    );
}