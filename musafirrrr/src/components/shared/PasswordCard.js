"use strict";

/** Change password (asks for the current one first). */
function PasswordCard({ me }) {
    const [open, setOpen] = useState(false);
    const [f, setF] = useState({ cur: '', next: '', again: '' });
    const [err, setErr] = useState({});
    const [busy, setBusy] = useState(false);
    const close = () => { setF({ cur: '', next: '', again: '' }); setErr({}); setOpen(false); };

    const submit = async (ev) => {
        ev.preventDefault();
        if (busy)
            return;
        const e = {};
        if (!f.cur)
            e.cur = 'Enter your current password.';
        if (f.next.length < 6)
            e.next = 'Use at least 6 characters.';
        else if (f.next === f.cur)
            e.next = 'Choose a password different from the current one.';
        if (f.again !== f.next)
            e.again = "The passwords don't match.";
        setErr(e);
        if (Object.keys(e).length)
            return;
        setBusy(true);
        try {
            await organizerApi.changePassword(me.email, f.cur, f.next);
            toast('Password changed');
            close();
        }
        catch (x) {
            console.error(x);
            setErr({ form: x.message || 'Could not change your password. Try again.' });
        }
        finally {
            setBusy(false);
        }
    };

    return (React.createElement("div", { className: "account-password-card rounded-2xl border border-line p-5" },
        React.createElement("h2", { className: "font-bold text-[16.5px] tracking-tight" }, "Password"),
        !open
            ? React.createElement(React.Fragment, null,
                React.createElement("p", { className: "mt-2 text-[14.5px] text-slatey leading-relaxed" }, "Changing your password also logs you out of your other devices."),
                React.createElement(Btn, { variant: "outline", size: "sm", className: "mt-4", onClick: () => setOpen(true) }, "Change password"))
            : React.createElement("form", { onSubmit: submit, className: "mt-4 space-y-4 max-w-sm" },
                React.createElement(Field, { label: "Current password", error: err.cur },
                    React.createElement(Input, { type: "password", value: f.cur, onChange: e => setF({ ...f, cur: e.target.value }), autoComplete: "current-password" })),
                React.createElement(Field, { label: "New password", error: err.next, hint: "At least 6 characters." },
                    React.createElement(Input, { type: "password", value: f.next, onChange: e => setF({ ...f, next: e.target.value }), autoComplete: "new-password" })),
                React.createElement(Field, { label: "Confirm new password", error: err.again },
                    React.createElement(Input, { type: "password", value: f.again, onChange: e => setF({ ...f, again: e.target.value }), autoComplete: "new-password" })),
                err.form && React.createElement("p", { role: "alert", className: "text-[13.5px] text-bad" }, err.form),
                React.createElement("div", { className: "flex gap-3" },
                    React.createElement(Btn, { type: "submit", size: "sm", loading: busy, disabled: busy }, busy ? 'Saving' : 'Update password'),
                    React.createElement(Btn, { type: "button", variant: "ghost", size: "sm", disabled: busy, onClick: close }, "Cancel")))));
}

