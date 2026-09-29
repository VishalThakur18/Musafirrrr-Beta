"use strict";
/* ============================================================
   UI — TAGS, BADGES, AVATAR
   ============================================================ */

/** Small coloured label. */
function Tag_({ children, tone = 'beige', className }) {
        const tones = { beige: 'bg-shell text-earth', ink: 'bg-ink text-white', out: 'border border-line text-slatey bg-white',
        ok: 'bg-[#E8F1EC] text-ok', warn: 'bg-[#F6EEDB] text-warn', bad: 'bg-[#F7E9E7] text-bad' };
    return React.createElement("span", { className: cls('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px] font-semibold tracking-wide', tones[tone], className) }, children);
}

/** Verified-organizer badge. */
function Verified({ size = 13 }) {
    return React.createElement("span", { className: "inline-flex items-center gap-1 text-ok font-semibold", title: "Verified by Musafirrrr" },
        React.createElement(Icon, { name: "shield", size: size }),
        " Verified");
}

/** Round generated avatar. */
function Avatar({ kind = 'valley', seed = 1, size = 40, name = '', className }) {
    return React.createElement("span", { className: cls('inline-block rounded-full overflow-hidden bg-shell shrink-0 ring-1 ring-line', className), style: { width: size, height: size } },
        React.createElement("img", { src: sceneURL(kind, seed), alt: name ? name + ' logo' : '', className: "w-full h-full object-cover" }));
}

/** Coloured status label (Published, Draft...). */
function StatusTag({ status }) {
    const map = { PUBLISHED: ['ok', 'Published'], DRAFT: ['warn', 'Draft'], SOLD_OUT: ['bad', 'Sold out'], COMPLETED: ['out', 'Completed'],
        NEW: ['ok', 'New'], CONTACTED: ['warn', 'Contacted'], CONFIRMED: ['ok', 'Confirmed'], CANCELLED: ['bad', 'Cancelled'] };
    const [tone, label] = map[status] || ['out', status];
    return React.createElement(Tag_, { tone: tone }, label);
}
