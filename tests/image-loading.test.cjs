const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ URL, SUPABASE_URL: 'https://example.supabase.co' });
for (const file of ['src/config/image-variants.js', 'src/assets/photo-tools.js']) vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context);
const local = context.responsivePhoto('assets/images/categories/adventure.jpg', 480, '240px');
assert.ok(local.src.endsWith('adventure-480.jpg'));
assert.equal(local.sizes, '240px');
const remote = 'https://example.supabase.co/storage/v1/object/public/trip-images/test.webp';
assert.ok(context.responsivePhoto(remote, 640).src.includes('/render/image/public/trip-images/test.webp?width=640'));
for (const url of [remote + '?token=secret', remote.replace('/public/', '/sign/'), remote.replace('example.supabase.co', 'external.example'), 'blob:example', 'data:image/png;base64,AA']) assert.equal(context.responsivePhoto(url).src, url);
const manifest = vm.runInContext('LOCAL_IMAGE_VARIANTS', context);
for (const [original, variants] of Object.entries(manifest)) {
    assert.ok(fs.existsSync(path.join(root, original)));
    for (const item of variants) { assert.ok(item.width > 100); assert.ok(fs.statSync(path.join(root, item.src)).size > 1000); }
    const widths = context.responsivePhoto(original).srcSet.split(', ').map(item => item.split(' ').pop());
    assert.equal(new Set(widths).size, widths.length);
}
const image = { dataset: {}, removed: [], removeAttribute(name) { this.removed.push(name); } };
context.originalPhotoOnError({ currentTarget: image }, remote);
assert.equal(image.src, remote); assert.deepEqual(image.removed, ['srcset', 'sizes']);
context.originalPhotoOnError({ currentTarget: image }, remote); assert.equal(image.removed.length, 2, 'Fallback cannot loop');
assert.ok(fs.statSync(path.join(root, 'assets/images/optimized/logo.png')).size < 25000);
console.log('PASS: local variants, public remote resizing, signed/external URL preservation, valid manifest files and one-shot fallback.');
