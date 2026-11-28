'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { readScriptList, buildBundle } = require('../scripts/build-js.cjs');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('index.html script list is complete and starts the app last', () => {
    const files = readScriptList(html);
    files.forEach(file => assert.ok(fs.existsSync(path.join(root, file)), file));
    assert.equal(new Set(files).size, files.length, 'no duplicate scripts');
    assert.equal(files[files.length - 1], 'src/main.js');
    assert.ok(files.indexOf('src/config/supabase.js') < files.indexOf('src/backend/store.js'));
    assert.ok(!files.includes('src/core/startup.js'), 'startup.js loads separately, before #root');
});

test('committed bundle matches the source files (run `npm run build:js` if this fails)', { skip: !hasEsbuild() && 'esbuild not installed (npm install)' }, () => {
    const { code, hash } = buildBundle(html);
    assert.equal(fs.readFileSync(path.join(root, 'assets/js/app.min.js'), 'utf8'), code, 'assets/js/app.min.js is stale');
    const refs = html.match(/assets\/js\/app\.min\.js\?v=[0-9a-z]+/g);
    assert.deepEqual(refs, [`assets/js/app.min.js?v=${hash}`], 'index.html bundle version is stale');
});

function hasEsbuild() {
    try { require.resolve('esbuild'); return true; } catch (_) { return false; }
}
