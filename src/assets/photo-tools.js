"use strict";

// One sizing policy for uploads and every card, independent of source orientation.
const TRIP_PHOTO_POLICY = Object.freeze({ coverWidth: 640, coverHeight: 572, maxUploadEdge: 1600, quality: 0.82 });

/** Responsive local assets and verified public Supabase image transformations.
 * Signed URLs, external hosts and data/blob URLs are never rewritten. */
function responsivePhoto(src, width = 960, sizes = '100vw') {
    try {
        const url = new URL(src);
        const origin = typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : '';
        if (url.origin === origin && !url.search && /^\/storage\/v1\/object\/public\/(trip-images|organizer-logos|organizer-banners)\//.test(url.pathname)) {
            const widths = width <= 256 ? [64, 128, 256] : [320, 640, 960, 1600];
            const variant = w => {
                const next = new URL(url.href);
                next.pathname = next.pathname.replace('/object/public/', '/render/image/public/');
                next.search = `width=${w}&quality=80&resize=contain`;
                return next.href;
            };
            return { src: variant(width), srcSet: widths.map(w => `${variant(w)} ${w}w`).join(', '), sizes };
        }
    } catch (_) { /* Local relative paths use the generated manifest below. */ }
    const manifest = typeof LOCAL_IMAGE_VARIANTS !== 'undefined' ? LOCAL_IMAGE_VARIANTS : {};
    const source = Object.keys(manifest).find(key => key === src || manifest[key].some(item => item.src === src));
    if (!source) return { src };
    const variants = [...new Map(manifest[source].map(item => [item.width, item])).values()].sort((a, b) => a.width - b.width);
    const selected = variants.find(item => item.width >= width) || variants[variants.length - 1];
    return { src: selected.src, srcSet: variants.map(item => `${item.src} ${item.width}w`).join(', '), sizes };
}

function originalPhotoOnError(event, original) {
    const image = event.currentTarget;
    if (image.dataset.originalFallback === original) return;
    image.dataset.originalFallback = original;
    image.removeAttribute('srcset');
    image.removeAttribute('sizes');
    image.src = original;
}

/** Native layout reserves the cover area before loading; no resize listeners needed. */
function tripCoverLayout() {
    return {
        width: TRIP_PHOTO_POLICY.coverWidth,
        height: TRIP_PHOTO_POLICY.coverHeight,
        style: { aspectRatio: `${TRIP_PHOTO_POLICY.coverWidth} / ${TRIP_PHOTO_POLICY.coverHeight}` }
    };
}

/** Preserve proportions and never upscale small uploads. */
function fitTripPhoto(width, height) {
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0)
        throw new Error('Invalid photo dimensions');
    const scale = Math.min(1, TRIP_PHOTO_POLICY.maxUploadEdge / Math.max(width, height));
    return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

// Small, bounded cache; sample only 144 pixels after a visible image has loaded.
const photoTones = new Map();
const DEFAULT_PHOTO_TONE = '30, 48, 52';
function photoTone(image) {
    const key = image.currentSrc || image.src;
    if (photoTones.has(key)) return photoTones.get(key);
    let tone = DEFAULT_PHOTO_TONE;
    try {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 12;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0, 12, 12);
        const pixels = ctx.getImageData(0, 6, 12, 6).data;
        const sum = [0, 0, 0];
        for (let i = 0; i < pixels.length; i += 4)
            for (let c = 0; c < 3; c++) sum[c] += pixels[i + c];
        // Cap every channel at 64: white text retains strong contrast on any photo.
        const average = sum.map(v => v / (pixels.length / 4));
        const scale = Math.min(0.65, 64 / Math.max(1, ...average));
        tone = average.map(v => Math.round(v * scale)).join(', ');
    } catch (_) { /* Cross-origin images without CORS use the readable neutral tone. */ }
    if (photoTones.size >= 100) photoTones.delete(photoTones.keys().next().value);
    photoTones.set(key, tone);
    return tone;
}

/** Compress locally before passing the file to the existing upload service. */
async function optimizeTripPhoto(file) {
    const url = URL.createObjectURL(file);
    try {
        const image = new Image();
        image.src = url;
        await image.decode();
        const size = fitTripPhoto(image.naturalWidth, image.naturalHeight);
        const canvas = document.createElement('canvas');
        canvas.width = size.width;
        canvas.height = size.height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', TRIP_PHOTO_POLICY.quality));
        if (!blob || blob.size >= file.size) return file;
        const extension = blob.type === 'image/webp' ? '.webp' : '.png';
        return new File([blob], file.name.replace(/\.[^.]+$/, '') + extension, { type: blob.type });
    } catch (_) { return file; }
    finally { URL.revokeObjectURL(url); }
}

function photoDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not read photo'));
        reader.readAsDataURL(file);
    });
}
