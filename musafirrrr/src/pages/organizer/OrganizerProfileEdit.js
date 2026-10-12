"use strict";
/* ============================================================
   PAGE — ORGANIZER PROFILE EDIT  (#/organizer/profile)
   ============================================================ */

/** Round logo: the uploaded image if there is one, otherwise the generated avatar. */
function OrgLogo({ org, size = 40 }) {
    const url = org && (org.logo_url || org.logoUrl);
    if (url)
        return React.createElement("img", { src: url, alt: org.name || '', className: "rounded-full object-cover shrink-0", style: { width: size, height: size } });
    return React.createElement(Avatar, { kind: (org && org.logoKind) || 'mountains', seed: (org && org.logoSeed) || 11, size: size, name: org ? org.name : '' });
}

/** Edit organizer profile. */
function OrganizerProfileEdit() {
    const { user: me } = useAuth();
    const org = me ? me.organizer : null;
    if (!org)
        return React.createElement(EmptyState, { icon: "user", title: "Your community profile is missing", body: "We couldn't find your organizer profile. Please contact support." });
    return React.createElement(OrganizerProfileForm, { key: org.id, me: me, org: org });
}

function OrganizerProfileForm({ me, org }) {
    const start = {
        name: org.name || '', city: org.based_in || '', bio: org.bio || '',
        whatsapp: org.whatsapp_number || '', instagram: org.instagram_handle || ''
    };
    const [f, setF] = useState(start);
    const [saved, setSaved] = useState(start);
    const [err, setErr] = useState({});
    const [busy, setBusy] = useState(false);
    const [logoBusy, setLogoBusy] = useState(false);
    const fileRef = useRef(null);
    const dirty = JSON.stringify(f) !== JSON.stringify(saved);

    const validate = () => {
        const e = {};
        const name = f.name.trim();
        if (name.length < 2)
            e.name = 'Enter your community name.';
        else if (name.length > 80)
            e.name = 'Keep the name under 80 characters.';
        if (f.city.trim().length > 80)
            e.city = 'Keep this under 80 characters.';
        if (f.bio.trim().length > 600)
            e.bio = 'Keep the bio under 600 characters.';
        if (!/^\d{10,15}$/.test(cleanWhatsApp(f.whatsapp)))
            e.whatsapp = 'Enter a valid number with country code, e.g. 919876543210.';
        const ig = cleanInstagram(f.instagram);
        if (ig && !/^[A-Za-z0-9._]{1,30}$/.test(ig))
            e.instagram = 'Use letters, numbers, dots and underscores only.';
        setErr(e);
        return Object.keys(e).length === 0;
    };

    const save = async (ev) => {
        ev.preventDefault();
        if (busy || !validate())
            return;
        setBusy(true);
        try {
            await organizerApi.updateProfile(org.id, f);
            await window.refreshAuth();   // the sidebar and dashboard pick up the new details
            const next = { name: f.name.trim(), city: f.city.trim(), bio: f.bio.trim(), whatsapp: cleanWhatsApp(f.whatsapp), instagram: cleanInstagram(f.instagram) };
            setF(next);
            setSaved(next);
            toast('Profile saved');
        }
        catch (x) {
            console.error(x);
            toast(x.message || 'Could not save your profile. Try again.', 'bad');
        }
        finally {
            setBusy(false);
        }
    };

    const pickLogo = async (file) => {
        if (!file || logoBusy)
            return;
        setLogoBusy(true);
        let uploaded = null, linked = false;
        try {
            uploaded = await organizerApi.uploadLogo(file, me.id);
            await organizerApi.setLogo(org.id, uploaded.url);
            linked = true;
            if (org.logo_url)
                organizerApi.removeLogo(org.logo_url).catch(() => { });   // tidy up the old file
            await window.refreshAuth();
            toast('Logo updated');
        }
        catch (x) {
            console.error(x);
            if (uploaded && !linked)
                organizerApi.removeLogo(uploaded.path).catch(() => { });
            toast(x.message || 'Could not upload the logo. Try again.', 'bad');
        }
        finally {
            setLogoBusy(false);
        }
    };

    const removeLogo = async () => {
        if (logoBusy || !org.logo_url)
            return;
        setLogoBusy(true);
        try {
            await organizerApi.setLogo(org.id, null);
            organizerApi.removeLogo(org.logo_url).catch(() => { });
            await window.refreshAuth();
            toast('Logo removed');
        }
        catch (x) {
            console.error(x);
            toast(x.message || 'Could not remove the logo.', 'bad');
        }
        finally {
            setLogoBusy(false);
        }
    };

    return (React.createElement(React.Fragment, null,
        React.createElement(SectionHead, { title: "Community profile", sub: "What travellers see on your public page and on every trip you list." }),
        React.createElement("form", { onSubmit: save, className: "max-w-2xl space-y-5" },
            React.createElement("div", { className: "rounded-2xl border border-line p-5 flex items-center gap-4" },
                React.createElement(OrgLogo, { org: org, size: 64 }),
                React.createElement("div", null,
                    React.createElement("div", { className: "flex items-center gap-4" },
                        React.createElement("button", { type: "button", disabled: logoBusy, onClick: () => fileRef.current && fileRef.current.click(), className: "text-[13.5px] font-semibold underline underline-offset-4 hover:text-earth disabled:opacity-50" }, logoBusy ? 'Working...' : (org.logo_url ? 'Change logo' : 'Upload logo')),
                        org.logo_url && React.createElement("button", { type: "button", disabled: logoBusy, onClick: removeLogo, className: "text-[13.5px] text-muted hover:text-bad disabled:opacity-50" }, "Remove")),
                    React.createElement("p", { className: "text-[12.5px] text-muted mt-1" }, "JPG, PNG or WebP, up to 2 MB."),
                    React.createElement("p", { className: "text-[12.5px] text-muted" },
                        "Public page: musafirrrr.com/o/",
                        org.slug)),
                React.createElement("input", { ref: fileRef, type: "file", accept: "image/jpeg,image/png,image/webp", className: "hidden", onChange: e => { pickLogo(e.target.files[0]); e.target.value = ''; } }),
                React.createElement("div", { className: "ml-auto" }, org.verified ? React.createElement(Verified, { size: 15 }) : React.createElement(Tag_, { tone: "warn" }, "Not verified yet"))),
            React.createElement(Field, { label: "Community name", error: err.name },
                React.createElement(Input, { value: f.name, onChange: e => setF({ ...f, name: e.target.value }) })),
            React.createElement(Field, { label: "Based in", error: err.city },
                React.createElement(Input, { value: f.city, onChange: e => setF({ ...f, city: e.target.value }), placeholder: "New Delhi" })),
            React.createElement(Field, { label: "Bio", error: err.bio, hint: "Two or three sentences on how you run trips." },
                React.createElement(TextArea, { rows: 4, value: f.bio, onChange: e => setF({ ...f, bio: e.target.value }) })),
            React.createElement("div", { className: "grid sm:grid-cols-2 gap-5" },
                React.createElement(Field, { label: "WhatsApp number", error: err.whatsapp, hint: "With country code." },
                    React.createElement(Input, { value: f.whatsapp, onChange: e => setF({ ...f, whatsapp: e.target.value }), inputMode: "tel", placeholder: "919876543210" })),
                React.createElement(Field, { label: "Instagram username", error: err.instagram, hint: "Without the @. Leave blank to hide the button." },
                    React.createElement(Input, { value: f.instagram, onChange: e => setF({ ...f, instagram: e.target.value }), placeholder: "wanderlust.co" }))),
            React.createElement("div", { className: "flex gap-3" },
                React.createElement(Btn, { type: "submit", size: "lg", loading: busy, disabled: !dirty }, busy ? 'Saving' : 'Save changes'),
                React.createElement(Btn, { type: "button", variant: "outline", size: "lg", onClick: () => go('/o/' + org.slug) }, "View public page")))));
}