"use strict";
/* ============================================================
   PAGE — ORGANIZER SETTINGS  (#/organizer/settings)
   ============================================================ */

/** Contact person and phone. Email is shown but can't be changed here. */
function AccountCard({ me, org }) {
    const start = { name: me.name || '', phone: me.phone || '' };
    const [f, setF] = useState(start);
    const [saved, setSaved] = useState(start);
    const [err, setErr] = useState({});
    const [busy, setBusy] = useState(false);
    const dirty = f.name !== saved.name || f.phone !== saved.phone;

    const save = async (ev) => {
        ev.preventDefault();
        if (busy)
            return;
        const e = {};
        if (f.name.trim().length < 2)
            e.name = 'Enter your name.';
        else if (f.name.trim().length > 100)
            e.name = 'Keep the name under 100 characters.';
        if (!/^\d{10,15}$/.test(f.phone.replace(/\D/g, '')))
            e.phone = 'Enter a valid phone number.';
        setErr(e);
        if (Object.keys(e).length)
            return;
        setBusy(true);
        try {
            await organizerApi.updateAccount(me.id, org.id, f);
            await window.refreshAuth();
            const next = { name: f.name.trim(), phone: f.phone.replace(/\D/g, '') };
            setF(next);
            setSaved(next);
            toast('Account details saved');
        }
        catch (x) {
            console.error(x);
            toast(x.message || 'Could not save your details. Try again.', 'bad');
        }
        finally {
            setBusy(false);
        }
    };

    return (React.createElement("form", { onSubmit: save, className: "rounded-2xl border border-line p-5" },
        React.createElement("h2", { className: "font-bold text-[16.5px] tracking-tight" }, "Account"),
        React.createElement("div", { className: "mt-4 space-y-4" },
            React.createElement("div", { className: "grid sm:grid-cols-2 gap-4" },
                React.createElement(Field, { label: "Contact person", error: err.name },
                    React.createElement(Input, { value: f.name, onChange: e => setF({ ...f, name: e.target.value }) })),
                React.createElement(Field, { label: "Phone", error: err.phone },
                    React.createElement(Input, { value: f.phone, onChange: e => setF({ ...f, phone: e.target.value }), inputMode: "tel" }))),
            React.createElement("div", { className: "space-y-3 text-[14.5px]" },
                React.createElement("div", { className: "flex justify-between gap-4" },
                    React.createElement("span", { className: "text-muted" }, "Email"),
                    React.createElement("strong", { className: "break-all text-right" }, me.email)),
                React.createElement("div", { className: "flex justify-between gap-4" },
                    React.createElement("span", { className: "text-muted" }, "Member since"),
                    React.createElement("strong", null, me.createdAt ? fmtLong(isoDate(me.createdAt)) : '\u2014')))),
        React.createElement(Btn, { type: "submit", size: "sm", className: "mt-4", loading: busy, disabled: !dirty }, busy ? 'Saving' : 'Save changes')));
}

/** Verified badge request. */
function VerificationCard({ org }) {
    const { loading, error, data: req, reload } = useAsync(() => organizerApi.latestVerification(org.id), [org.id]);
    const [msg, setMsg] = useState('');
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);

    const send = async (ev) => {
        ev.preventDefault();
        if (busy)
            return;
        const m = msg.trim();
        if (m.length < 30) {
            setErr('Tell us a little more, at least 30 characters.');
            return;
        }
        if (m.length > 1500) {
            setErr('Keep it under 1500 characters.');
            return;
        }
        setErr('');
        setBusy(true);
        try {
            await organizerApi.requestVerification(org.id, m);
            setMsg('');
            toast('Verification request sent');
            reload();
        }
        catch (x) {
            console.error(x);
            setErr(x.message || 'Could not send your request. Try again.');
        }
        finally {
            setBusy(false);
        }
    };

    const form = React.createElement("form", { onSubmit: send, className: "mt-4 space-y-3" },
        React.createElement(Field, { label: "Registration details and references", error: err, hint: "Your registration or GST number, a website or Instagram link, and contacts from three past trips." },
            React.createElement(TextArea, { rows: 5, value: msg, onChange: e => setMsg(e.target.value) })),
        React.createElement(Btn, { type: "submit", size: "sm", loading: busy }, busy ? 'Sending' : 'Request verification'));

    let body;
    if (org.verified)
        body = React.createElement("p", { className: "mt-2 text-[14.5px] text-slatey leading-relaxed" }, 'Your community is verified. The badge shows on every trip you list.');
    else if (loading && !req)
        body = React.createElement("p", { className: "mt-2 text-[14.5px] text-muted" }, "Checking your request...");
    else if (error && !req)
        body = React.createElement("div", { className: "mt-2" },
            React.createElement("p", { className: "text-[14.5px] text-bad" }, "We couldn't load your verification status."),
            React.createElement(Btn, { size: "sm", variant: "outline", className: "mt-3", onClick: reload }, "Try again"));
    else if (req && req.status === 'pending')
        body = React.createElement("p", { className: "mt-2 text-[14.5px] text-slatey leading-relaxed" }, `Your request was sent on ${fmtLong(isoDate(req.created_at))} and is waiting for review. We'll update this page when we've looked at it.`);
    else
        body = React.createElement(React.Fragment, null,
            React.createElement("p", { className: "mt-2 text-[14.5px] text-slatey leading-relaxed" }, req && req.status === 'rejected'
                ? 'Your last request wasn\'t approved.' + (req.reviewer_note ? ' Note from our team: ' + req.reviewer_note : '') + ' You can send a new request.'
                : 'Send us your registration details and references from three past trips to be reviewed for the verified badge.'),
            form);

    return (React.createElement("div", { className: "rounded-2xl border border-line p-5" },
        React.createElement("h2", { className: "font-bold text-[16.5px] tracking-tight" }, "Verification"),
        body));
}

/** Organizer settings. */
function OrganizerSettings() {
    const { user: me } = useAuth();
    const org = me ? me.organizer : null;
    if (!org)
        return React.createElement(EmptyState, { icon: "user", title: "Your community profile is missing", body: "We couldn't find your organizer profile. Please contact support." });
    return (React.createElement(React.Fragment, null,
        React.createElement(SectionHead, { title: "Settings", sub: "Your account, password and verification." }),
        React.createElement("div", { className: "max-w-2xl space-y-4" },
            React.createElement(AccountCard, { key: me.id, me: me, org: org }),
            React.createElement(PasswordCard, { me: me }),
            React.createElement(VerificationCard, { org: org }),
            React.createElement("div", { className: "rounded-2xl border border-line p-5" },
                React.createElement("h2", { className: "font-bold text-[16.5px] tracking-tight" }, "Notifications"),
                React.createElement("p", { className: "mt-2 text-[14.5px] text-slatey leading-relaxed" }, "Email and WhatsApp alerts for new enquiries aren't available yet. For now, new enquiries appear under Leads, and the number next to Leads in the sidebar shows how many are waiting for a reply.")))));
}