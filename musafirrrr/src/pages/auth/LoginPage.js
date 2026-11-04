"use strict";
/* ============================================================
   PAGE — LOGIN  (#/login)
   ============================================================ */

function ResetPasswordModal({ email, onClose, onDone }) {
    const [code, setCode] = useState('');
    const [pw, setPw] = useState('');
    const [pw2, setPw2] = useState('');
    const [busy, setBusy] = useState(false);
    const [err, setErr] = useState('');
    const [cooldown, setCooldown] = useState(60);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, []);

    useEffect(() => {
        if (cooldown <= 0) return;
        const id = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(id);
    }, [cooldown]);

    const submit = async (e) => {
        e.preventDefault();
        if (busy) return;
        if (!/^\d{6}$/.test(code)) { setErr('Enter the 6-digit code.'); return; }
        if (pw.length < 6) { setErr('Use at least 6 characters for the password.'); return; }
        if (pw !== pw2) { setErr('Passwords do not match.'); return; }
        setBusy(true);
        setErr('');
        try {
            const user = await authService.resetPasswordWithOtp(email, code, pw);
            onDone(user);
        } catch (x) {
            setErr(/expired|invalid/i.test(x.message)
                ? 'That code is wrong or has expired.'
                : (x.message || 'Could not reset the password. Try again.'));
        } finally {
            setBusy(false);
        }
    };

    const resend = async () => {
        if (cooldown > 0) return;
        try {
            await authService.sendPasswordReset(email);
            setCooldown(60);
            toast('New code sent.');
        } catch (x) {
            toast(x.message || 'Could not resend the code.');
        }
    };

    return React.createElement("div", {
        className: "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/50",
        role: "dialog",
        "aria-modal": "true",
        onClick: onClose
    },
        React.createElement("div", {
            className: "relative w-full max-w-md rounded-2xl bg-white p-7 shadow-card",
            onClick: (e) => e.stopPropagation()
        },
            React.createElement("button", {
                type: "button", onClick: onClose, "aria-label": "Close",
                className: "absolute right-4 top-4 text-muted hover:text-ink text-[22px] leading-none"
            }, "\u00D7"),
            React.createElement("h2", { className: "text-[22px] font-bold tracking-tight" }, "Reset your password"),
            React.createElement("p", { className: "mt-2 text-[14px] text-slatey" },
            "If an account exists for " + email + ", we sent a 6-digit code. Enter it below with your new password."),
            React.createElement("p", { className: "mt-1 text-[13px] text-muted" },
            "No code after a minute? You may not have an account yet. ",
            React.createElement(Link, { to: "/signup", className: "font-semibold underline underline-offset-4 hover:text-earth" }, "Create one")),
            React.createElement("form", { onSubmit: submit, className: "mt-6 space-y-4" },
                React.createElement(Field, { label: "Verification code" },
                    React.createElement(Input, {
                        value: code,
                        onChange: e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6)),
                        placeholder: "123456",
                        inputMode: "numeric",
                        autoComplete: "one-time-code",
                        maxLength: 6
                    })),
                React.createElement(Field, { label: "New password" },
                    React.createElement(Input, {
                        type: "password", value: pw,
                        onChange: e => setPw(e.target.value),
                        autoComplete: "new-password"
                    })),
                React.createElement(Field, { label: "Confirm new password" },
                    React.createElement(Input, {
                        type: "password", value: pw2,
                        onChange: e => setPw2(e.target.value),
                        autoComplete: "new-password"
                    })),
                err && React.createElement("p", { role: "alert", className: "text-[13.5px] text-bad flex items-center gap-1.5" },
                    React.createElement(Icon, { name: "info", size: 15 }), err),
                React.createElement(Btn, { type: "submit", size: "lg", className: "w-full", loading: busy }, "Reset password"),
                React.createElement("button", {
                    type: "button", onClick: resend, disabled: cooldown > 0,
                    className: "text-[13.5px] font-semibold underline underline-offset-4 disabled:opacity-50 disabled:no-underline"
                }, cooldown > 0 ? "Resend code in " + cooldown + "s" : "Resend code"))));
}

function LoginPage({ params }) {
    const [email, setEmail] = useState('');
    const [pw, setPw] = useState('');
    const [show, setShow] = useState(false);
    const [err, setErr] = useState('');
    const [needsConfirm, setNeedsConfirm] = useState(false);
    const [busy, setBusy] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [resetOpen, setResetOpen] = useState(false);
    const [sendingReset, setSendingReset] = useState(false);
    const [badCreds, setBadCreds] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (busy) return;
        setErr('');
        setNeedsConfirm(false);
        setBadCreds(false);
        if (!email.trim() || !pw) {
            setErr('Enter your email and password.');
            return;
        }
        setBusy(true);
        window.appStartup.begin();
        try {
            const u = await authService.login(email, pw);
            const first = String(u.name || '').trim().split(' ')[0];
            toast(first ? 'Welcome back, ' + first : 'Welcome back');
            go(u.role === 'ORGANIZER' ? '/organizer/dashboard' : '/traveller/dashboard');
        }
        catch (x) {
            window.appStartup.finish();
            const bad = x.code === 'invalid_credentials' || /invalid login credentials/i.test(x.message || '');
            setErr(bad ? 'Incorrect email or password.' : (x.message || 'Could not log in. Try again.'));
            setBadCreds(bad);
            setNeedsConfirm(x.code === 'email_not_confirmed');
        }
        finally {
            setBusy(false);
        }
    };

    const startVerify = async () => {
        try {
            await authService.resendConfirmation(email);
            setVerifying(true);
            toast('We sent you a new code.');
        } catch (x) {
            toast(x.message || 'Could not send the code.');
        }
    };

    const forgotPassword = async () => {
    if (sendingReset) return;
    setErr('');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
        setErr('Enter your email above first, then click "Forgot password?".');
        return;
    }
    setSendingReset(true);
    try {
        await authService.sendPasswordReset(email);
        setResetOpen(true);
        toast('If an account exists for this email, we sent a code.');
    } catch (x) {
        setErr(x.message || 'Could not send the code. Try again.');
    } finally {
        setSendingReset(false);
    }
};

    const showGoogle = !(params && params.role === 'ORGANIZER');

        const footer = React.createElement("p", { className: "text-[14px] text-slatey" }, "New to Musafirrrr? ",
        React.createElement(Link, { to: "/signup", className: "font-semibold hover:text-earth underline underline-offset-4" }, "Create an account"));

    const page = React.createElement(AuthShell, { loginIntro: true, footer, title: "Welcome back", sub: "Log in to pick up where you left off." },
        React.createElement("form", { onSubmit: submit, className: "mt-8 space-y-4" },
            showGoogle && React.createElement(GoogleButton, { label: "Continue with Google" }),
            showGoogle && React.createElement(OrDivider, null),
            React.createElement(Field, { label: "Email" },
                React.createElement(Input, { type: "email", value: email, onChange: e => setEmail(e.target.value), placeholder: "you@email.com", autoComplete: "username" })),
            React.createElement(Field, { label: "Password" },
                React.createElement("div", { className: "relative" },
                    React.createElement(Input, { type: show ? 'text' : 'password', value: pw, onChange: e => setPw(e.target.value), placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", autoComplete: "current-password", className: "pr-11" }),
                    React.createElement("button", { type: "button", onClick: () => setShow(s => !s), "aria-label": show ? 'Hide password' : 'Show password', className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" },
                        React.createElement(Icon, { name: show ? 'eyeOff' : 'eye', size: 17 })))),
            React.createElement("div", { className: "flex justify-end -mt-2" },
                React.createElement("button", { type: "button", onClick: forgotPassword, disabled: sendingReset,
                    className: "text-[13.5px] font-semibold underline underline-offset-4 hover:text-earth disabled:opacity-60" }, sendingReset ? "Sending code..." : "Forgot password?")),
            err && React.createElement("p", { role: "alert", className: "text-[13.5px] text-bad flex items-center gap-1.5" },
                React.createElement(Icon, { name: "info", size: 15 }),
                err),
            badCreds && React.createElement("p", { className: "text-[13.5px] text-slatey" }, "New here? ",
            React.createElement(Link, { to: "/signup", className: "font-semibold underline underline-offset-4 hover:text-earth" }, "Create an account"),
                ". Otherwise, try \"Forgot password?\"."),
            needsConfirm && React.createElement("button", { type: "button", onClick: startVerify, className: "text-[13.5px] font-semibold underline underline-offset-4 hover:text-earth" }, "Verify with a code"),
            React.createElement(Btn, { type: "submit", size: "lg", className: "w-full", loading: busy }, busy ? 'Signing in' : 'Continue')));
            return React.createElement(React.Fragment, null, page, verifying && React.createElement(VerifyModal, {email,
            onClose: () => setVerifying(false),
            onDone: (u) => {
                setVerifying(false);
                toast('Email verified. Welcome back!');
                go(u.role === 'ORGANIZER' ? '/organizer/dashboard' : '/traveller/dashboard');
            }
        }),
        resetOpen && React.createElement(ResetPasswordModal, {
            email,
            onClose: () => setResetOpen(false),
            onDone: (u) => {
                setResetOpen(false);
                toast('Password updated. Welcome back!');
                go(u.role === 'ORGANIZER' ? '/organizer/dashboard' : '/traveller/dashboard');
            }
        }));
}
