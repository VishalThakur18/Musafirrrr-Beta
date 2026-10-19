"use strict";

// One sizing policy for uploads and every card, independent of source orientation.
const TRIP_PHOTO_POLICY = Object.freeze({ coverWidth: 640, coverHeight: 572, maxUploadEdge: 1600, quality: 0.9 });

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
