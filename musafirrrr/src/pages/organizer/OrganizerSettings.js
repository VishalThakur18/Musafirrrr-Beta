"use strict";
/* ============================================================
   PAGE — ORGANIZER SETTINGS  (#/organizer/settings)
   ============================================================ */

/** Organizer settings & demo reset. */
function OrganizerSettings() {
    const s = useStore();
    const me = authService.current();
    const org = organizerService.byId(me.organizerId);
    const [reset, setReset] = useState(false);
    return (React.createElement(React.Fragment, null,
        React.createElement(SectionHead, { title: "Settings", sub: "Account, notifications and the demo data behind this build." }),
        React.createElement("div", { className: "max-w-2xl space-y-4" },
            React.createElement("div", { className: "rounded-2xl border border-line p-5" },
                React.createElement("h2", { className: "font-bold text-[16.5px] tracking-tight" }, "Account"),
                React.createElement("div", { className: "mt-4 space-y-3 text-[14.5px]" },
                    React.createElement("div", { className: "flex justify-between" },
                        React.createElement("span", { className: "text-muted" }, "Contact person"),
                        React.createElement("strong", null, me.name)),
                    React.createElement("div", { className: "flex justify-between" },
                        React.createElement("span", { className: "text-muted" }, "Email"),
                        React.createElement("strong", null, me.email)),
                    React.createElement("div", { className: "flex justify-between" },
                        React.createElement("span", { className: "text-muted" }, "Phone"),
                        React.createElement("strong", null, me.phone)),
                    React.createElement("div", { className: "flex justify-between" },
                        React.createElement("span", { className: "text-muted" }, "Member since"),
                        React.createElement("strong", null, fmtLong(me.createdAt)))),
                React.createElement(Btn, { variant: "outline", size: "sm", className: "mt-4", onClick: () => toast('Password change is not wired up in this demo') }, "Change password")),
            React.createElement("div", { className: "rounded-2xl border border-line p-5" },
                React.createElement("h2", { className: "font-bold text-[16.5px] tracking-tight" }, "Notifications"),
                [['New enquiry on WhatsApp', true], ['Daily lead summary by email', true], ['Product updates from Musafirrrr', false]].map(([l, on]) => (React.createElement("label", { key: l, className: "flex items-center justify-between gap-4 py-3 border-b border-line last:border-0 text-[14.5px]" },
                    l,
                    React.createElement("input", { type: "checkbox", defaultChecked: on, onChange: () => toast('Preference saved'), className: "w-5 h-5 rounded-md border-line text-ink focus:ring-slatey" }))))),
            React.createElement("div", { className: "rounded-2xl border border-line p-5" },
                React.createElement("h2", { className: "font-bold text-[16.5px] tracking-tight" }, "Verification"),
                React.createElement("p", { className: "mt-2 text-[14.5px] text-slatey leading-relaxed" }, org.verified ? 'Your community is verified. The badge shows on every trip you list.'
                    : 'Send us your registration details and references from three past trips to be reviewed for the verified badge.'),
                !org.verified && React.createElement(Btn, { size: "sm", className: "mt-4", onClick: () => toast('Verification request noted — we will be in touch') }, "Request verification")),
            React.createElement("div", { className: "rounded-2xl border border-dashed border-beige bg-sand p-5" },
                React.createElement("h2", { className: "font-bold text-[16.5px] tracking-tight" }, "Demo data"),
                React.createElement("p", { className: "mt-2 text-[14.5px] text-slatey leading-relaxed" }, "This build stores everything in your browser. Resetting restores the original sample trips, leads and saved list."),
                React.createElement(Btn, { variant: "outline", size: "sm", className: "mt-4", onClick: () => setReset(true) }, "Reset demo data"))),
        React.createElement(Confirm, { open: reset, title: "Reset the demo?", body: "Trips you created, leads you changed and saved trips will be wiped and the sample data restored.", confirmLabel: "Reset everything", onClose: () => setReset(false), onConfirm: () => { try {
                localStorage.removeItem(LS_KEY);
            }
            catch (e) { } location.hash = '/'; location.reload(); } })));
}
