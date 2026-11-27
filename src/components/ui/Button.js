"use strict";
/* ============================================================
   UI — BUTTON
   ============================================================ */

/** Button / link with variants, sizes and loading state. */
function Btn({ as = 'button', variant = 'primary', size = 'md', loading, icon, children, className, ...rest }) {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed select-none';
    const sizes = { sm: 'text-[13px] px-4 h-9', md: 'text-sm px-5 h-11', lg: 'text-[15px] px-7 h-12 md:h-14' };
    const vars = {
        primary: 'bg-ink text-white hover:bg-slatey active:scale-[.985] shadow-card',
        earth: 'bg-earth text-white hover:bg-[#59493a] active:scale-[.985]',
        beige: 'bg-beige text-ink hover:bg-[#cbb69f] active:scale-[.985]',
        outline: 'border border-line bg-white text-ink hover:border-ink/40 hover:bg-sand',
        ghost: 'text-ink hover:bg-shell',
        danger: 'bg-bad text-white hover:bg-[#a04a42]',
        wa: 'bg-[#1F7A4C] text-white hover:bg-[#186139]',
        ig: 'bg-[#33464A] text-white hover:bg-[#25363a]'
    };
    const Tag = as;
    return (React.createElement(Tag, { className: cls(base, sizes[size], vars[variant], className), ...rest },
        loading && React.createElement("span", { className: "w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" }),
        !loading && icon && React.createElement(Icon, { name: icon, size: size === 'sm' ? 15 : 17 }),
        children));
}
