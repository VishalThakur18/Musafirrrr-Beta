"use strict";
/* ============================================================
   PAGE — TRAVELLER PROFILE  (#/traveller/profile)
   ============================================================ */

/** Traveller profile & preferences. */
function TravellerProfile() {
    const s = useStore();
    const me = authService.current();
    const [f, setF] = useState({ name: me.name, email: me.email, phone: me.phone, ...me.prefs });
    const [saving, setSaving] = useState(false);
    const toggleType = c => setF(x => ({ ...x, types: (x.types || []).includes(c) ? x.types.filter(y => y !== c) : [...(x.types || []), c] }));
    const toggleDest = dst => setF(x => ({ ...x, destinations: (x.destinations || []).includes(dst) ? x.destinations.filter(y => y !== dst) : [...(x.destinations || []), dst] }));
    const save = async (e) => {
        e.preventDefault();
        setSaving(true);
        await wait(500);
        store.set(st => {
            st.users = st.users.map(u => u.id === me.id ? { ...u, name: f.name, email: f.email, phone: f.phone,
                prefs: { destinations: f.destinations || [], budget: +f.budget || 20000, types: f.types || [], style: f.style } } : u);
        });
        setSaving(false);
        toast('Profile saved');
    };
    return (React.createElement("main", { className: "max-w-3xl mx-auto px-5 lg:px-8 py-10 md:py-14 pb-28 md:pb-14" },
        React.createElement(SectionHead, { title: "Your profile", sub: "Used to pre-fill enquiries and shape what we recommend." }),
        React.createElement("form", { onSubmit: save, className: "space-y-8" },
            React.createElement("div", { className: "rounded-2xl border border-line p-6" },
                React.createElement("div", { className: "flex items-center gap-4" },
                    React.createElement(Avatar, { kind: me.avatarKind || 'valley', seed: me.avatarSeed || 5, size: 64, name: me.name }),
                    React.createElement("div", null,
                        React.createElement("button", { type: "button", onClick: () => store.set(st => { st.users = st.users.map(u => u.id === me.id ? { ...u, avatarSeed: Math.floor(Math.random() * 900) } : u); }), className: "text-[13.5px] font-semibold underline underline-offset-4 hover:text-earth" }, "Change photo"),
                        React.createElement("p", { className: "text-[12.5px] text-muted mt-1" }, "Demo build \u2014 generates a new image."))),
                React.createElement("div", { className: "mt-6 grid sm:grid-cols-2 gap-4" },
                    React.createElement(Field, { label: "Full name" },
                        React.createElement(Input, { value: f.name, onChange: e => setF({ ...f, name: e.target.value }) })),
                    React.createElement(Field, { label: "Phone" },
                        React.createElement(Input, { value: f.phone, onChange: e => setF({ ...f, phone: e.target.value }) })),
                    React.createElement(Field, { label: "Email", className: "sm:col-span-2" },
                        React.createElement(Input, { type: "email", value: f.email, onChange: e => setF({ ...f, email: e.target.value }) })))),
            React.createElement("div", { className: "rounded-2xl border border-line p-6" },
                React.createElement("h2", { className: "font-bold text-[17px] tracking-tight" }, "Travel preferences"),
                React.createElement("div", { className: "mt-5 space-y-6" },
                    React.createElement("div", null,
                        React.createElement("h3", { className: "text-[13px] font-bold tracking-[.1em] text-muted mb-3" }, "PREFERRED DESTINATIONS"),
                        React.createElement("div", { className: "flex flex-wrap gap-2" }, DESTS.slice(0, 10).map(dst => React.createElement(Chip, { key: dst, active: (f.destinations || []).includes(dst), onClick: () => toggleDest(dst) }, dst)))),
                    React.createElement("div", null,
                        React.createElement("h3", { className: "text-[13px] font-bold tracking-[.1em] text-muted mb-3" }, "TRIP TYPES"),
                        React.createElement("div", { className: "flex flex-wrap gap-2" }, CATEGORIES.map(c => React.createElement(Chip, { key: c, active: (f.types || []).includes(c), onClick: () => toggleType(c) }, c)))),
                    React.createElement("div", { className: "grid sm:grid-cols-2 gap-4" },
                        React.createElement(Field, { label: "Usual budget per trip" },
                            React.createElement(Input, { type: "number", step: "500", value: f.budget || '', onChange: e => setF({ ...f, budget: e.target.value }) })),
                        React.createElement(Field, { label: "Travel style" },
                            React.createElement(Select, { value: f.style || '', onChange: e => setF({ ...f, style: e.target.value }) }, GROUPS.map(g => React.createElement("option", { key: g }, g))))))),
            React.createElement("div", { className: "flex flex-wrap gap-3" },
                React.createElement(Btn, { type: "submit", size: "lg", loading: saving }, saving ? 'Saving' : 'Save changes'),
                React.createElement(Btn, { type: "button", variant: "outline", size: "lg", icon: "logout", onClick: () => { authService.logout(); go('/'); toast('Logged out'); } }, "Log out")))));
}
