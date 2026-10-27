"use strict";
/* SHARED — STARS + REVIEWS SECTION (trip or organizer) */

function Stars({ value, size = 14 }) {
    return React.createElement("span", { className: "inline-flex gap-0.5 text-star", "aria-label": value + " out of 5" },
        [1, 2, 3, 4, 5].map(n => React.createElement(Icon, { key: n, name: "star", size, fill: n <= Math.round(value) ? "currentColor" : "none" })));
}

function StarPicker({ value, onChange }) {
    const [hover, setHover] = useState(0);
    const lit = hover || value;
    return React.createElement("div", { role: "radiogroup", "aria-label": "Your rating", className: "flex gap-1" },
        [1, 2, 3, 4, 5].map(n => React.createElement("button", {
            key: n, type: "button", role: "radio", "aria-checked": value === n,
            "aria-label": n + (n === 1 ? " star" : " stars"),
            onMouseEnter: () => setHover(n), onMouseLeave: () => setHover(0), onClick: () => onChange(n),
            className: cls("transition-transform active:scale-90", n <= lit ? "text-star" : "text-star-empty")
        }, React.createElement(Icon, { name: "star", size: 30, fill: n <= lit ? "currentColor" : "none" }))));
}

function OrgRating({ org, size = 13 }) {
    if (!org || !(org.rating > 0)) return null;
    return React.createElement("span", {
        className: "inline-flex items-center gap-1 text-[13px] font-semibold text-ink shrink-0",
        "aria-label": "Rated " + org.rating + " out of 5 from " + (org.ratingCount || 0) + " reviews"
    },
        React.createElement(Icon, { name: "star", size, fill: "currentColor", className: "text-star" }),
        org.rating,
        org.ratingCount > 0 && React.createElement("span", { className: "font-normal text-muted" }, "(" + org.ratingCount + ")"));
}

/**
 * kind: "trip" | "organizer"     targetId: trip id or organizer id
 * open: true once reviews are allowed (trip has ended / organizer has a finished trip)
 * tripId: optional, stored on organizer reviews     onChanged: called after save/delete
 */
function ReviewsSection({ kind, targetId, tripId = null, heading, open, onLogin, onChanged }) {
    const h = React.createElement;
    const { user } = useAuth();
    const PAGE = 10;
    const [items, setItems] = useState([]);
    const [more, setMore] = useState(false);
    const [summary, setSummary] = useState({ avg: 0, count: 0 });
    const [mine, setMine] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [rating, setRating] = useState(0);
    const [text, setText] = useState("");
    const [busy, setBusy] = useState(false);
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let live = true;
        setLoading(true);
        Promise.all([
            reviewApi.list(kind, targetId, 0, PAGE),
            reviewApi.summary(kind, targetId),
            user ? reviewApi.mine(kind, targetId, user.id) : Promise.resolve(null),
        ]).then(([rows, sum, my]) => {
            if (!live) return;
            setItems(rows); setMore(rows.length === PAGE); setSummary(sum); setMine(my);
            setRating(my ? my.rating : 0); setText(my && my.text ? my.text : ""); setEditing(false);
        }).catch(err => console.error(err)).finally(() => { if (live) setLoading(false); });
        return () => { live = false; };
    }, [kind, targetId, user ? user.id : null, tick]);

    const refresh = () => { setTick(t => t + 1); if (onChanged) onChanged(); };

    const loadMore = async () => {
        try {
            const rows = await reviewApi.list(kind, targetId, items.length, PAGE);
            setItems(x => [...x, ...rows]); setMore(rows.length === PAGE);
        } catch (e) { toast("Could not load more reviews.", "bad"); }
    };

    const submit = async e => {
        e.preventDefault();
        if (busy) return;
        if (!rating) { toast("Pick a star rating first.", "bad"); return; }
        setBusy(true);
        try {
            await reviewApi.save(kind, targetId, user.id, { rating, text, tripId });
            toast(mine ? "Review updated" : "Thanks for your review");
            refresh();
        } catch (x) { toast(x.message, "bad"); }
        finally { setBusy(false); }
    };

    const remove = async () => {
        if (!mine || !window.confirm("Delete your review?")) return;
        try { await reviewApi.remove(kind, mine.id); toast("Review deleted"); refresh(); }
        catch (x) { toast(x.message, "bad"); }
    };

    const isTraveller = !!user && user.role === "TRAVELLER";

    // What the visitor sees above the list
    let composer = null;
    if (!open) {
       composer = h("p", { className: "text-[14px] text-muted" },
            "Reviews open once this organizer has completed a trip.");
        } else if (!user) {
        composer = h(Btn, { variant: "outline", onClick: onLogin }, "Log in to write a review");
    } else if (isTraveller && mine && !editing) {
        composer = h("div", { className: "flex items-center gap-3 text-[14px] text-slatey" },
            "You reviewed this.",
            h("button", { type: "button", className: "font-semibold underline underline-offset-4", onClick: () => setEditing(true) }, "Edit"),
            h("button", { type: "button", className: "font-semibold text-bad underline underline-offset-4", onClick: remove }, "Delete"));
    } else if (isTraveller) {
        composer = h("form", { onSubmit: submit, className: "rounded-2xl border border-line p-5 space-y-3" },
            h("div", { className: "font-bold text-[15px]" }, mine ? "Edit your review" : "Rate your experience"),
            h(StarPicker, { value: rating, onChange: setRating }),
            h(TextArea, { rows: 4, maxLength: 2000, value: text, onChange: e => setText(e.target.value), placeholder: "Share what it was like, for future travellers" }),
            h("div", { className: "flex gap-2.5" },
                h(Btn, { type: "submit", loading: busy }, mine ? "Update review" : "Post review"),
                mine && h(Btn, { type: "button", variant: "ghost", onClick: () => setEditing(false) }, "Cancel")));
    }
    // organizers and admins get no composer: they can read reviews but not write or reply

    return h("div", null,
        h("div", { className: "flex items-end justify-between gap-4 flex-wrap" },
            h("h2", { className: "text-2xl font-extrabold tracking-tight" }, heading),
            summary.count > 0 && h("div", { className: "inline-flex items-center gap-2 text-[15px]" },
                h(Stars, { value: summary.avg, size: 16 }),
                h("strong", null, summary.avg), h("span", { className: "text-muted" }, "(" + summary.count + (summary.count === 1 ? " review)" : " reviews)")))),
        h("div", { className: "mt-4" }, composer),
        loading && !items.length
            ? h("p", { className: "mt-6 text-slatey" }, "Loading reviews...")
            : items.length === 0
                ? h("p", { className: "mt-6 text-[15px] text-slatey" }, "No reviews yet.")
                : h("ul", { className: "mt-4" }, items.map(r => h("li", { key: r.id, className: "py-5 border-b border-line last:border-0" },
                    h("div", { className: "flex items-center gap-3" },
                        h("span", { className: "w-9 h-9 rounded-full bg-shell flex items-center justify-center text-[13px] font-bold" }, (r.reviewer_name || "T").charAt(0).toUpperCase()),
                        h("div", null,
                            h("div", { className: "text-[14.5px] font-semibold" }, r.reviewer_name || "Traveller"),
                            h("div", { className: "text-[12.5px] text-muted" }, new Date(r.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }))),
                        h("span", { className: "ml-auto" }, h(Stars, { value: r.rating }))),
                    r.review_text && h("p", { className: "mt-3 text-[15px] text-slatey leading-relaxed max-w-[68ch] whitespace-pre-line" }, r.review_text)))),
        more && h("div", { className: "mt-4" }, h(Btn, { variant: "outline", onClick: loadMore }, "Show more reviews")));
}