"use strict";
/* ============================================================
   PAGE — ORGANIZER PROFILE EDIT  (#/organizer/profile)
   ============================================================ */

/** Edit organizer profile. */
function OrganizerProfileEdit() {
    const s = useStore();
    const me = authService.current();
    const org = organizerService.byId(me.organizerId);
    const [f, setF] = useState({ ...org });
    const [busy, setBusy] = useState(false);
    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        await wait(500);
        organizerService.update(org.id, { name: f.name, bio: f.bio, city: f.city, instagram: f.instagram, whatsapp: f.whatsapp, slug: slugify(f.name) });
        setBusy(false);
        toast('Profile saved');
    };
    return (React.createElement(React.Fragment, null,
        React.createElement(SectionHead, { title: "Community profile", sub: "What travellers see on your public page and on every trip you list." }),
        React.createElement("form", { onSubmit: save, className: "max-w-2xl space-y-5" },
            React.createElement("div", { className: "rounded-2xl border border-line p-5 flex items-center gap-4" },
                React.createElement(Avatar, { kind: org.logoKind, seed: org.logoSeed, size: 64, name: org.name }),
                React.createElement("div", null,
                    React.createElement("button", { type: "button", onClick: () => organizerService.update(org.id, { logoSeed: Math.floor(Math.random() * 900) }), className: "text-[13.5px] font-semibold underline underline-offset-4 hover:text-earth" }, "Change logo"),
                    React.createElement("p", { className: "text-[12.5px] text-muted mt-1" },
                        "Public page: musafirrrr.com/o/",
                        slugify(f.name || ''))),
                React.createElement("div", { className: "ml-auto" }, org.verified ? React.createElement(Verified, { size: 15 }) : React.createElement(Tag_, { tone: "warn" }, "Not verified yet"))),
            React.createElement(Field, { label: "Community name" },
                React.createElement(Input, { value: f.name, onChange: e => setF({ ...f, name: e.target.value }) })),
            React.createElement(Field, { label: "Based in" },
                React.createElement(Input, { value: f.city, onChange: e => setF({ ...f, city: e.target.value }) })),
            React.createElement(Field, { label: "Bio", hint: "Two or three sentences on how you run trips." },
                React.createElement(TextArea, { rows: 4, value: f.bio, onChange: e => setF({ ...f, bio: e.target.value }) })),
            React.createElement("div", { className: "grid sm:grid-cols-2 gap-5" },
                React.createElement(Field, { label: "WhatsApp number", hint: "With country code." },
                    React.createElement(Input, { value: f.whatsapp, onChange: e => setF({ ...f, whatsapp: e.target.value }) })),
                React.createElement(Field, { label: "Instagram username" },
                    React.createElement(Input, { value: f.instagram, onChange: e => setF({ ...f, instagram: e.target.value }) }))),
            React.createElement("div", { className: "flex gap-3" },
                React.createElement(Btn, { type: "submit", size: "lg", loading: busy }, busy ? 'Saving' : 'Save changes'),
                React.createElement(Btn, { type: "button", variant: "outline", size: "lg", onClick: () => go('/o/' + org.slug) }, "View public page")))));
}
