"use strict";
/* ============================================================
   PAGE — LOGIN  (#/login)
   ============================================================ */

function LoginPage({ params }) {
    const [email, setEmail] = useState('');
    const [pw, setPw] = useState('');
    const [show, setShow] = useState(false);
    const [err, setErr] = useState('');
    const [needsConfirm, setNeedsConfirm] = useState(false);
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (busy) return;
        setErr('');
        setNeedsConfirm(false);
        if (!email.trim() || !pw) {
            setErr('Enter your email and password.');
            return;
        }
        setBusy(true);
        try {
            const u = await authService.login(email, pw);
            const first = String(u.name || '').trim().split(' ')[0];
            toast(first ? 'Welcome back, ' + first : 'Welcome back');
            go(u.role === 'ORGANIZER' ? '/organizer/dashboard' : '/traveller/dashboard');
        }
        catch (x) {
            setErr(x.message || 'Could not log in. Try again.');
            setNeedsConfirm(x.code === 'email_not_confirmed');
        }
        finally {
            setBusy(false);
        }
    };

    const resend = async () => {
        try {
            await authService.resendConfirmation(email);
            toast('Confirmation email sent. Check your inbox.');
        } catch (x) {
            toast(x.message || 'Could not resend the email.');
        }
    };

    return (React.createElement(AuthShell, { title: "Welcome back", sub: "Log in to pick up where you left off." },
        React.createElement("form", { onSubmit: submit, className: "mt-8 space-y-4" },
            React.createElement(Field, { label: "Email" },
                React.createElement(Input, { type: "email", value: email, onChange: e => setEmail(e.target.value), placeholder: "you@email.com", autoComplete: "username" })),
            React.createElement(Field, { label: "Password" },
                React.createElement("div", { className: "relative" },
                    React.createElement(Input, { type: show ? 'text' : 'password', value: pw, onChange: e => setPw(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", autoComplete: "current-password", className: "pr-11" }),
                    React.createElement("button", { type: "button", onClick: () => setShow(s => !s), "aria-label": show ? 'Hide password' : 'Show password', className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" },
                        React.createElement(Icon, { name: show ? 'eyeOff' : 'eye', size: 17 })))),
            err && React.createElement("p", { role: "alert", className: "text-[13.5px] text-bad flex items-center gap-1.5" },
                React.createElement(Icon, { name: "info", size: 15 }),
                err),
            needsConfirm && React.createElement("button", { type: "button", onClick: resend, className: "text-[13.5px] font-semibold underline underline-offset-4 hover:text-earth" }, "Resend confirmation email"),
            React.createElement(Btn, { type: "submit", size: "lg", className: "w-full", loading: busy }, busy ? 'Signing in' : 'Continue')),
        React.createElement("div", { className: "mt-4 flex justify-between text-[13.5px]" },
            React.createElement("span", null),
            React.createElement(Link, { to: "/signup", className: "font-semibold hover:text-earth" }, "Create an account"))));
}