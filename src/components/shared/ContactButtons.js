"use strict";
/* ============================================================
   SHARED — WHATSAPP & INSTAGRAM BUTTONS
   ============================================================ */

/** Card shown when a logged-out visitor tries to contact an organizer. */
function LoginPrompt({ open, onClose, action = 'contact the organizer' }) {
    const goTo = path => {
        try { sessionStorage.setItem('postLoginPath', location.hash.replace(/^#/, '') || '/'); } catch (e) {}
        onClose();
        go(path);
    };
    return React.createElement(Modal, { open: open, onClose: onClose, size: "sm", label: "Log in to continue" },
        React.createElement("div", { className: "p-6 sm:p-7 text-center" },
            React.createElement("div", { className: "mx-auto w-14 h-14 rounded-full bg-sand flex items-center justify-center text-ink" },
                React.createElement(Icon, { name: "users", size: 24 })),
            React.createElement("h3", { className: "mt-4 text-xl font-bold tracking-tight" }, "Log in to continue"),
            React.createElement("p", { className: "mt-2 text-[15px] text-slatey leading-relaxed" }, "Log in or create a free account to " + action + ". It takes a minute."),
            React.createElement("div", { className: "mt-6 flex flex-col gap-3" },
                React.createElement(Btn, { size: "lg", className: "w-full", onClick: () => goTo('/login') }, "Log in"),
                React.createElement(Btn, { size: "lg", variant: "outline", className: "w-full", onClick: () => goTo('/signup') }, "Create an account"))));
}

/** Returns [gate, prompt]. gate is null for signed-in users, or a click handler that opens the card.
 *  Render `prompt` once next to whatever uses `gate`. */
function useContactGate(action) {
    const { user: me } = useAuth();
    const [open, setOpen] = useState(false);
    const prompt = React.createElement(LoginPrompt, { open: open, onClose: () => setOpen(false), action: action });
    return [me ? null : () => setOpen(true), prompt];
}

function WhatsAppButton({ trip, org, size = 'md', className, label = 'Chat on WhatsApp', message })  {
    const [gate, prompt] = useContactGate('chat with the organizer on WhatsApp');
    if (!org || !org.whatsapp)
        return null;
    const content = React.createElement("span", { className: "inline-flex items-center gap-2" },
        React.createElement(Icon, { name: "wa", size: size === 'sm' ? 16 : 18, className: "text-[#25D366]" }),
        label);
    const btn = gate
        ? React.createElement(Btn, { variant: "outline", size: size, className: className, onClick: gate }, content)
        : React.createElement(Btn, { as: "a", href: waLink(org.whatsapp, message || tripWaMessage(trip, org)), target: "_blank", rel: "noopener noreferrer", variant: "outline", size: size, className: className, onClick: () => { void tripAnalytics.track(trip, 'whatsapp_click'); toast('Opening WhatsApp with your message ready'); } }, content);
    return React.createElement(React.Fragment, null, btn, prompt);
}

function InstagramButton({ trip, org, size = 'md', className, label = 'Message on Instagram' }) {
    const [gate, prompt] = useContactGate('message the organizer on Instagram');
    if (!org || !org.instagram)
        return null;
    const content = React.createElement("span", { className: "inline-flex items-center gap-2" },
        React.createElement(Icon, { name: "ig", size: size === 'sm' ? 16 : 18, className: "text-[#E1306C]" }),
        label);
    const btn = gate
        ? React.createElement(Btn, { variant: "outline", size: size, className: className, onClick: gate }, content)
        : React.createElement(Btn, { as: "a", href: igLink(org.instagram), target: "_blank", rel: "noopener noreferrer", variant: "outline", size: size, className: className, onClick: () => { void tripAnalytics.track(trip, 'instagram_click'); } }, content);
    return React.createElement(React.Fragment, null, btn, prompt);
}
