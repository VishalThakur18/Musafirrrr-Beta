#!/usr/bin/env node
'use strict';
/*
 * Bundles the application scripts into assets/js/app.min.js.
 *
 * The file list and its order come from the `app-scripts:start` ... `app-scripts:end` block
 * in index.html, so there is a single place to add or reorder files. The files are plain
 * scripts sharing one global scope, so they are concatenated in order (not wrapped in
 * modules) and then minified. Top-level names are kept so cross-file globals still resolve.
 *
 * Usage:  npm run build:js      (writes the bundle and updates its ?v= hash in index.html)
 *         node scripts/build-js.cjs --check   (exit 1 if the committed bundle is stale)
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'index.html');
const bundleRel = 'assets/js/app.min.js';
const bundlePath = path.join(root, bundleRel);
const bundleRef = /assets\/js\/app\.min\.js\?v=[0-9a-z]+/g;

/** Ordered list of script paths from index.html's app-scripts block. */
function readScriptList(html = fs.readFileSync(indexPath, 'utf8')) {
    const match = html.match(/app-scripts:start([\s\S]*?)app-scripts:end/);
    if (!match) throw new Error('index.html: app-scripts:start/end block not found');
    const files = [...match[1].matchAll(/^\s*'([^']+\.js)',?\s*$/gm)].map(m => m[1]);
    if (!files.length) throw new Error('index.html: no scripts listed in the app-scripts block');
    return files;
}

/** Concatenates and minifies the listed scripts. Returns { code, hash }. */
function buildBundle(html) {
    const esbuild = require('esbuild');
    const files = readScriptList(html);
    const parts = ['"use strict";'];
    for (const file of files) {
        const full = path.join(root, file);
        if (!fs.existsSync(full)) throw new Error(`index.html lists ${file}, but it does not exist`);
        // The trailing ";" stops a file without a final semicolon merging into the next one.
        // CRLF is normalised so the bundle is identical whatever line endings git checked out.
        parts.push(`// ${file}\n${fs.readFileSync(full, 'utf8').replace(/\r\n?/g, '\n')}\n;`);
    }
    const { code } = esbuild.transformSync(parts.join('\n'), {
        loader: 'js', minify: true, target: 'es2020', charset: 'utf8', legalComments: 'none', sourcefile: 'app.js',
    });
    return { code, hash: crypto.createHash('sha256').update(code).digest('hex').slice(0, 10), files };
}

function main() {
    const html = fs.readFileSync(indexPath, 'utf8');
    const { code, hash, files } = buildBundle(html);
    const versioned = `${bundleRel}?v=${hash}`;
    const refs = html.match(bundleRef) || [];
    if (refs.length !== 1) throw new Error(`index.html: expected 1 reference to ${bundleRel}?v=…, found ${refs.length}`);

    if (process.argv.includes('--check')) {
        const current = fs.existsSync(bundlePath) ? fs.readFileSync(bundlePath, 'utf8') : '';
        const stale = current !== code || refs.some(ref => ref !== versioned);
        if (stale) {
            console.error(`${bundleRel} is out of date with the source files. Run: npm run build:js`);
            process.exit(1);
        }
        console.log(`${bundleRel} is up to date (${files.length} files).`);
        return;
    }

    fs.mkdirSync(path.dirname(bundlePath), { recursive: true });
    fs.writeFileSync(bundlePath, code);
    fs.writeFileSync(indexPath, html.replace(bundleRef, versioned));
    console.log(`Bundled ${files.length} files into ${bundleRel} (${(code.length / 1024).toFixed(1)} KiB, v=${hash}).`);
}

module.exports = { readScriptList, buildBundle };
if (require.main === module) {
    try { main(); } catch (error) { console.error(error.message); process.exit(1); }
}
