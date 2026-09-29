"use strict";
/* ============================================================
   PAGE — LOGIN  (#/login)
   ============================================================ */

/** Login (#/login). */
function LoginPage({ params }) {
    const [email, setEmail] = useState('');
    const [pw, setPw] = useState('');
    const [show, setShow] = useState(false);
    const [err, setErr] = useState('');
    const [busy, setBusy] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setErr('');
        if (!email || !pw) {
            setErr('Enter your email and password.');
            return;
        }
        setBusy(true);
        try {
            const u = await authService.login(email, pw);
            toast('Welcome back, ' + u.name.split(' ')[0]);
            go(u.role === 'ORGANIZER' ? '/organizer/dashboard' : '/traveller/dashboard');
        }
        catch (x) {
            setErr(x.message);
        }
        finally {
            setBusy(false);
        }
    };
    return (React.createElement(AuthShell, { title: "Welcome back", sub: "Log in to pick up where you left off." },
        React.createElement("form", { onSubmit: submit, className: "mt-8 space-y-4" },
            React.createElement(Field, { label: "Email or phone", error: err && !pw ? err : '' },
                React.createElement(Input, { value: email, onChange: e => setEmail(e.target.value), placeholder: "you@email.com", autoComplete: "username" })),
            React.createElement(Field, { label: "Password" },
                React.createElement("div", { className: "relative" },
                    React.createElement(Input, { type: show ? 'text' : 'password', value: pw, onChange: e => setPw(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", autoComplete: "current-password", className: "pr-11" }),
                    React.createElement("button", { type: "button", onClick: () => setShow(s => !s), "aria-label": show ? 'Hide password' : 'Show password', className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" },
                        React.createElement(Icon, { name: show ? 'eyeOff' : 'eye', size: 17 })))),
            err && React.createElement("p", { className: "text-[13.5px] text-bad flex items-center gap-1.5" },
                React.createElement(Icon, { name: "info", size: 15 }),
                err),
            React.createElement(Btn, { type: "submit", size: "lg", className: "w-full", loading: busy }, busy ? 'Signing in' : 'Continue')),
        React.createElement("div", { className: "mt-4 flex justify-between text-[13.5px]" },
            React.createElement("button", { onClick: () => toast('Password reset is not wired up in this demo'), className: "text-slatey hover:text-ink underline underline-offset-4" }, "Forgot password?"),
            React.createElement(Link, { to: "/signup", className: "font-semibold hover:text-earth" }, "Create an account")),
        React.createElement("div", { className: "mt-7 flex items-center gap-3 text-[12.5px] text-muted" },
            React.createElement("span", { className: "h-px flex-1 bg-line" }),
            "or",
            React.createElement("span", { className: "h-px flex-1 bg-line" })),
        React.createElement(Btn, { variant: "outline", size: "lg", className: "w-full mt-5", onClick: () => toast('Google sign-in is not connected in this demo') }, "Continue with Google"),
        React.createElement(DemoCreds, { onUse: em => { setEmail(em); setPw('password'); toast('Demo details filled in — hit Continue'); } })));
}
