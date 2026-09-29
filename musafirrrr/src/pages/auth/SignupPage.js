"use strict";
/* ============================================================
   PAGE — SIGN UP  (#/signup)
   ============================================================ */

/** Signup (#/signup). */
function SignupPage({ params }) {
    const [role, setRole] = useState(params.role || '');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState({});
    const [t, setT] = useState({ name: '', email: '', phone: '', password: '' });
    const [o, setO] = useState({ orgName: '', name: '', email: '', phone: '', password: '', city: '', instagram: '', whatsapp: '', bio: '' });
    if (!role)
        return (React.createElement(AuthShell, { title: "Welcome to Musafirrrr", sub: "Two ways in. Pick the one that sounds like you." },
            React.createElement("div", { className: "mt-8 space-y-3.5" }, [['TRAVELLER', 'I\'m a traveller', 'Find group trips, save the ones you like and enquire directly.', 'compass'],
                ['ORGANIZER', 'I\'m a travel community', 'List your upcoming trips and receive enquiries.', 'users']
            ].map(([v, t_, b, ic]) => (React.createElement("button", { key: v, onClick: () => setRole(v), className: "w-full text-left rounded-2xl border border-line p-5 flex items-start gap-4 hover:border-ink/40 hover:shadow-card transition-all duration-200" },
                React.createElement("span", { className: "w-11 h-11 rounded-full bg-shell text-earth flex items-center justify-center shrink-0" },
                    React.createElement(Icon, { name: ic, size: 20 })),
                React.createElement("span", { className: "flex-1" },
                    React.createElement("span", { className: "block font-bold text-[16.5px] tracking-tight" }, t_),
                    React.createElement("span", { className: "block text-[14px] text-slatey mt-1 leading-relaxed" }, b)),
                React.createElement(Icon, { name: "chev", size: 18, className: "text-muted mt-3" }))))),
            React.createElement("p", { className: "mt-7 text-[14px] text-slatey" },
                "Already have an account? ",
                React.createElement(Link, { to: "/login", className: "font-semibold hover:text-earth underline underline-offset-4" }, "Log in"))));
    const validate = (d, fields) => {
        const e = {};
        fields.forEach(f => { if (!String(d[f] || '').trim())
            e[f] = 'Required'; });
        if (d.email && !/^\S+@\S+\.\S+$/.test(d.email))
            e.email = 'Enter a valid email address.';
        if (d.phone && !/^[6-9]\d{9}$/.test(String(d.phone).replace(/\D/g, '').slice(-10)))
            e.phone = 'Enter a 10-digit mobile number.';
        if (d.password && d.password.length < 6)
            e.password = 'Use at least 6 characters.';
        setErr(e);
        return Object.keys(e).length === 0;
    };
    const submitTraveller = async (e) => {
        e.preventDefault();
        if (!validate(t, ['name', 'email', 'phone', 'password']))
            return;
        setBusy(true);
        try {
            const u = await authService.signupTraveller(t);
            toast('Account created. Happy travels, ' + u.name.split(' ')[0]);
            go('/traveller/dashboard');
        }
        catch (x) {
            setErr({ email: x.message });
        }
        finally {
            setBusy(false);
        }
    };
    const submitOrg = async (e) => {
        e.preventDefault();
        if (!validate(o, ['orgName', 'name', 'email', 'phone', 'password', 'whatsapp']))
            return;
        setBusy(true);
        try {
            await authService.signupOrganizer(o);
            toast('Community profile created. Add your first trip.');
            go('/organizer/create');
        }
        catch (x) {
            setErr({ email: x.message });
        }
        finally {
            setBusy(false);
        }
    };
    return (React.createElement(AuthShell, { title: role === 'TRAVELLER' ? 'Create your traveller account' : 'Create your community profile', sub: role === 'TRAVELLER' ? 'Saved trips and enquiries, all in one place.' : 'This becomes your public page on Musafirrrr.' },
        React.createElement("button", { onClick: () => setRole(''), className: "mt-4 inline-flex items-center gap-1.5 text-[13.5px] text-slatey hover:text-ink" },
            React.createElement(Icon, { name: "chevL", size: 15 }),
            " Change account type"),
        role === 'TRAVELLER' ? (React.createElement("form", { onSubmit: submitTraveller, className: "mt-6 space-y-4" },
            React.createElement(Field, { label: "Full name", error: err.name },
                React.createElement(Input, { value: t.name, onChange: e => setT({ ...t, name: e.target.value }), placeholder: "Aarav Mehta" })),
            React.createElement(Field, { label: "Email", error: err.email },
                React.createElement(Input, { type: "email", value: t.email, onChange: e => setT({ ...t, email: e.target.value }), placeholder: "you@email.com" })),
            React.createElement(Field, { label: "Phone", error: err.phone },
                React.createElement(Input, { value: t.phone, onChange: e => setT({ ...t, phone: e.target.value }), placeholder: "98765 43210", inputMode: "tel" })),
            React.createElement(Field, { label: "Password", error: err.password, hint: "At least 6 characters." },
                React.createElement(Input, { type: "password", value: t.password, onChange: e => setT({ ...t, password: e.target.value }), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })),
            React.createElement(Btn, { type: "submit", size: "lg", className: "w-full", loading: busy }, busy ? 'Creating account' : 'Create account'),
            React.createElement("p", { className: "text-[12.5px] text-muted text-center" }, "Any trips you saved on this device move into your account."))) : (React.createElement("form", { onSubmit: submitOrg, className: "mt-6 space-y-4" },
            React.createElement(Field, { label: "Community or agency name", error: err.orgName },
                React.createElement(Input, { value: o.orgName, onChange: e => setO({ ...o, orgName: e.target.value }), placeholder: "Wanderlust Co." })),
            React.createElement("div", { className: "grid sm:grid-cols-2 gap-4" },
                React.createElement(Field, { label: "Contact person", error: err.name },
                    React.createElement(Input, { value: o.name, onChange: e => setO({ ...o, name: e.target.value }), placeholder: "Your name" })),
                React.createElement(Field, { label: "Based in" },
                    React.createElement(Input, { value: o.city, onChange: e => setO({ ...o, city: e.target.value }), placeholder: "New Delhi" }))),
            React.createElement(Field, { label: "Email", error: err.email },
                React.createElement(Input, { type: "email", value: o.email, onChange: e => setO({ ...o, email: e.target.value }), placeholder: "hello@community.com" })),
            React.createElement("div", { className: "grid sm:grid-cols-2 gap-4" },
                React.createElement(Field, { label: "Phone", error: err.phone },
                    React.createElement(Input, { value: o.phone, onChange: e => setO({ ...o, phone: e.target.value }), placeholder: "98765 43210", inputMode: "tel" })),
                React.createElement(Field, { label: "WhatsApp number", error: err.whatsapp, hint: "With country code." },
                    React.createElement(Input, { value: o.whatsapp, onChange: e => setO({ ...o, whatsapp: e.target.value }), placeholder: "919876543210", inputMode: "tel" }))),
            React.createElement(Field, { label: "Instagram username", hint: "Optional \u2014 shown on your trips." },
                React.createElement(Input, { value: o.instagram, onChange: e => setO({ ...o, instagram: e.target.value }), placeholder: "wanderlust.co" })),
            React.createElement(Field, { label: "Password", error: err.password },
                React.createElement(Input, { type: "password", value: o.password, onChange: e => setO({ ...o, password: e.target.value }), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" })),
            React.createElement(Field, { label: "Short bio", hint: "Two lines on who you are and how you run trips." },
                React.createElement(TextArea, { rows: 3, value: o.bio, onChange: e => setO({ ...o, bio: e.target.value }), placeholder: "We run small-group trips across the Himalayas\u2026" })),
            React.createElement(Btn, { type: "submit", variant: "earth", size: "lg", className: "w-full", loading: busy }, busy ? 'Creating profile' : 'Create community profile'))),
        React.createElement("p", { className: "mt-6 text-[14px] text-slatey" },
            "Already have an account? ",
            React.createElement(Link, { to: "/login", className: "font-semibold hover:text-earth underline underline-offset-4" }, "Log in"))));
}
