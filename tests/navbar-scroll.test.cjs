const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/components/layout/Navbar.js'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '../assets/css/styles.css'), 'utf8');
assert.match(source, /site-navbar--hidden/);
assert.match(css, /\.site-navbar\.site-navbar--hidden\s*\{[^}]*translate3d/);
function mount(menuOpen = false) {
    const state = [], events = new Map(), frames = new Map();
    let effect, cleanup, frameId = 0;
    const header = { offsetHeight: 72, contains: el => el === 'nav-link' };
    const context = {
        useState(value) { const index = state.length; state.push(value); return [value, next => { state[index] = next; }]; },
        useEffect(fn) { effect = fn; },
        window: { scrollY: 0, innerHeight: 800, addEventListener(name, fn) { events.set(name, fn); }, removeEventListener(name) { events.delete(name); } },
        document: { documentElement: { scrollHeight: 2400 }, activeElement: null },
        requestAnimationFrame(fn) { frames.set(++frameId, fn); return frameId; },
        cancelAnimationFrame(id) { frames.delete(id); }
    };
    vm.createContext(context);
    vm.runInContext(source, context);
    context.useNavbarScroll(menuOpen, '/test', { current: header });
    cleanup = effect();
    return {
        state, context, events, cleanup,
        emit(name, event = {}) { events.get(name)?.(event); },
        scroll(y) { context.window.scrollY = y; events.get('scroll')(); const pending = [...frames.values()]; frames.clear(); pending.forEach(fn => fn()); }
    };
}
const nav = mount();
nav.scroll(300); assert.equal(nav.state[0], true, 'hide while scrolling down');
nav.scroll(296); assert.equal(nav.state[0], true, 'ignore tiny reversal');
nav.scroll(270); assert.equal(nav.state[0], false, 'show after meaningful upward movement');
nav.context.document.activeElement = 'nav-link';
nav.emit('pointerdown'); nav.scroll(450);
assert.equal(nav.state[0], true, 'mouse focus must not pin the navbar');
nav.emit('keydown', { key: 'Tab' }); nav.scroll(600);
assert.equal(nav.state[0], false, 'keyboard navigation stays visible');
nav.emit('wheel'); nav.scroll(750);
assert.equal(nav.state[0], true, 'wheel scrolling resumes hiding');
nav.scroll(0); assert.equal(nav.state[0], false, 'always visible at top');
nav.scroll(1700); assert.equal(nav.state[0], true);
nav.scroll(1650); assert.equal(nav.state[0], true, 'bottom overscroll must not cause a false reversal');
nav.cleanup(); assert.equal(nav.events.size, 0, 'clean up all listeners');
const menu = mount(true); menu.scroll(400); assert.equal(menu.state[0], false, 'keep open menu visible'); menu.cleanup();
const route = mount(); assert.equal(route.state[0], false, 'new route starts visible'); route.cleanup();
console.log('PASS: navbar directions, jitter, pointer/keyboard focus, menu, overscroll, route reset, cleanup and CSS integration');
