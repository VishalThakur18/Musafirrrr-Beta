"use strict";
/* ============================================================
   IMAGERY
   Procedural SVG travel scenes (no remote images). Deterministic per trip.
   Replace sceneURL() with real photo URLs to use photography.
   ============================================================ */

/** Seeded pseudo-random generator so each trip always gets the same picture. */
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/** Colour palettes for each kind of generated travel scene. */
const SCENES = {
    mountains: { sky: ['#E4EDF2', '#B9CCD6'], sun: '#F6E7CE', style: 'ridge',
        layers: ['#8FA6AE', '#69838D', '#4C6570', '#33464A', '#1D2E34'] },
    snow: { sky: ['#EEF3F7', '#C8D8E3'], sun: '#FFF4E2', style: 'ridge',
        layers: ['#C4D2DA', '#9FB2BD', '#7A909B', '#55686F', '#2A3A40'] },
    valley: { sky: ['#EAEFE6', '#C2D0C0'], sun: '#F3E6C9', style: 'ridge',
        layers: ['#A8B79C', '#88997C', '#667661', '#4A5744', '#2B3527'] },
    beach: { sky: ['#F2EFE7', '#CFE0DF'], sun: '#F8E3C2', style: 'water',
        layers: ['#BCD3CE', '#9BC0BB', '#74A8A4', '#4E8382', '#BFA68E'] },
    backwater: { sky: ['#EDF0E4', '#C6D2B8'], sun: '#F5EBCB', style: 'water',
        layers: ['#AFC19A', '#8CA37B', '#6B8460', '#4C6449', '#33464A'] },
    desert: { sky: ['#F7EFE2', '#E2C9A6'], sun: '#FBE9C4', style: 'dunes',
        layers: ['#E0C49C', '#CFAE80', '#B79166', '#94724D', '#44372B'] },
    forest: { sky: ['#E9EEE8', '#BFD0C2'], sun: '#F1E8CB', style: 'ridge',
        layers: ['#9DB79F', '#7A9A80', '#588062', '#3C6047', '#22392C'] },
    island: { sky: ['#F1F2EA', '#CDE2E0'], sun: '#FAE6C6', style: 'water',
        layers: ['#CBE0DA', '#A7CFC9', '#7FB8B4', '#54918F', '#E3D6BF'] },
    city: { sky: ['#EFEAE3', '#CDBFAE'], sun: '#F6E2BE', style: 'skyline',
        layers: ['#C3B4A3', '#A4937F', '#83705C', '#5E4E3E', '#44372B'] }
};

/** Builds the polygon points for a mountain ridge layer. */
function ridgePoints(rnd, w, h, base, rough, steps) {
    let pts = `0,${h} 0,${base + rough * 0.35}`;
    for (let s = 0; s <= steps; s++) {
        const x = (w / steps) * s;
        const y = base - (rnd() * rough);
        pts += ` ${x.toFixed(0)},${y.toFixed(0)}`;
    }
    return pts + ` ${w},${h}`;
}

/** Builds an SVG path for a wavy water/dune layer. */
function wavePath(rnd, w, h, base, amp) {
    let d = `M0 ${h} L0 ${base}`;
    const seg = 5;
    for (let s = 0; s < seg; s++) {
        const x1 = (w / seg) * (s + 0.5), x2 = (w / seg) * (s + 1);
        const y1 = base + (rnd() - 0.5) * amp;
        d += ` Q${x1.toFixed(0)} ${y1.toFixed(0)} ${x2.toFixed(0)} ${base.toFixed(0)}`;
    }
    return d + ` L${w} ${h} Z`;
}

/** Renders a complete travel scene as an SVG string. */
function sceneSVG(kind, seed, w = 1400, h = 980) {
    const p = SCENES[kind] || SCENES.mountains;
    const rnd = mulberry32(seed * 2654435761 % 4294967296);
    const sunX = w * (0.18 + rnd() * 0.64), sunY = h * (0.16 + rnd() * 0.14), sunR = h * 0.075;
    let body = '';
    const n = p.layers.length;
    for (let i = 0; i < n; i++) {
        const base = h * (0.40 + i * 0.115);
        if (p.style === 'ridge') {
            body += `<polygon points="${ridgePoints(rnd, w, h, base, h * (0.26 - i * 0.035), i < 2 ? 5 : 7)}" fill="${p.layers[i]}"/>`;
        }
        else if (p.style === 'water') {
            body += `<path d="${wavePath(rnd, w, h, h * (0.52 + i * 0.095), h * 0.035)}" fill="${p.layers[i]}"/>`;
        }
        else if (p.style === 'dunes') {
            body += `<path d="${wavePath(rnd, w, h, h * (0.46 + i * 0.11), h * 0.10)}" fill="${p.layers[i]}"/>`;
        }
        else {
            body += `<polygon points="${ridgePoints(rnd, w, h, base, h * 0.05, 3)}" fill="${p.layers[i]}"/>`;
            if (i > 1) {
                for (let b = 0; b < 7; b++) {
                    const bw = w * (0.03 + rnd() * 0.05), bx = rnd() * w, bh = h * (0.06 + rnd() * 0.16);
                    body += `<rect x="${bx.toFixed(0)}" y="${(base - bh).toFixed(0)}" width="${bw.toFixed(0)}" height="${bh.toFixed(0)}" fill="${p.layers[i]}"/>`;
                }
            }
        }
    }
    let birds = '';
    for (let b = 0; b < 3; b++) {
        const bx = w * (0.12 + rnd() * 0.7), by = h * (0.14 + rnd() * 0.18), s = h * 0.012;
        birds += `<path d="M${bx} ${by} q${s} ${-s} ${s * 2} 0 q${s} ${-s} ${s * 2} 0" fill="none" stroke="#132025" stroke-opacity=".28" stroke-width="${(h * 0.0035).toFixed(1)}" stroke-linecap="round"/>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.sky[0]}"/><stop offset="1" stop-color="${p.sky[1]}"/></linearGradient>
<radialGradient id="g"><stop offset="0" stop-color="${p.sun}" stop-opacity=".95"/><stop offset="1" stop-color="${p.sun}" stop-opacity="0"/></radialGradient>
<linearGradient id="v" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#132025" stop-opacity="0"/><stop offset="1" stop-color="#132025" stop-opacity=".40"/></linearGradient>
</defs>
<rect width="${w}" height="${h}" fill="url(#s)"/>
<circle cx="${sunX.toFixed(0)}" cy="${sunY.toFixed(0)}" r="${(sunR * 3.2).toFixed(0)}" fill="url(#g)"/>
<circle cx="${sunX.toFixed(0)}" cy="${sunY.toFixed(0)}" r="${sunR.toFixed(0)}" fill="${p.sun}"/>
${birds}${body}
<rect width="${w}" height="${h}" fill="url(#v)"/>
</svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

/** _sceneCache */
const _sceneCache = {};

/** Returns a cached data-URI for a scene (swap for a CDN URL to use real photos). */
function sceneURL(kind, seed) {
    const k = kind + ':' + seed;
    if (!_sceneCache[k])
        _sceneCache[k] = sceneSVG(kind, seed);
    return _sceneCache[k];
}

/** Resolves any image reference (scene, uploaded file or URL) to an <img> src. */
/* An image ref is either a generated scene {k:'scene',kind,seed} or an upload {k:'file',url} */
function imgSrc(ref) {
    if (!ref)
        return sceneURL('mountains', 7);
    if (typeof ref === 'string')
        return ref;
    return ref.k === 'file' ? ref.url : sceneURL(ref.kind, ref.seed);
}

/** List of all available scene kinds. */
const SCENE_KINDS = Object.keys(SCENES);
