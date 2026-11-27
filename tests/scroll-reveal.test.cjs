const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../src/components/ui/ScrollReveal.js'), 'utf8');

function mount({ available = true, reduced = false, enabled = true, booting = false } = {}) {
    const nodes = [], observed = new Set(), listeners = new Map();
    let effect, onIntersection, onMutation, preference, disconnected = false;
    const media = { matches: reduced, addEventListener(_, fn) { preference = fn; }, removeEventListener() { preference = null; } };
    const host = {
        querySelectorAll(selector) { return nodes.filter(el => selector === '[data-test]' || el.classList.contains(selector.slice(1))); },
        contains(el) { return nodes.includes(el); },
        addEventListener(name, fn) { listeners.set(name, fn); },
        removeEventListener(name) { listeners.delete(name); }
    };
    class Observer {
        constructor(fn) { onIntersection = fn; }
        observe(el) { observed.add(el); }
        unobserve(el) { observed.delete(el); }
        disconnect() { observed.clear(); }
    }
    const context = { useEffect(fn) { effect = fn; }, document: { body: { classList: { contains: () => booting } } }, window: { innerHeight: 800, IntersectionObserver: available ? Observer : undefined, matchMedia: () => media },
        IntersectionObserver: Observer, MutationObserver: class {
            constructor(fn) { onMutation = fn; }
            observe() {}
            disconnect() { disconnected = true; }
        }
    };
    vm.runInNewContext(source, context);
    const group = { closest() { return null; } };
    function add(key, parentElement = group) {
        const classes = new Set(), styles = new Map();
        const el = { key, parentElement, getBoundingClientRect() { return { top: 100, bottom: 300 }; },
            classList: { add(...names) { names.forEach(n => classes.add(n)); }, remove(...names) { names.forEach(n => classes.delete(n)); }, contains(n) { return classes.has(n); } },
            style: { setProperty(k, v) { styles.set(k, v); }, removeProperty(k) { styles.delete(k); } },
            getAttribute() { return null; }, closest(selector) { return selector.startsWith('.') || el.dialog ? el : null; }, styles
        };
        nodes.push(el);
        return el;
    }
    const first = add('first'), second = add('second');
    context.useScrollReveal({ current: host }, { selector: '[data-test]', prefix: 'test', enabled, keyFor: el => el.key });
    const cleanup = effect();
    return { first, second, nodes, observed, listeners, add, cleanup,
        enter(...els) { onIntersection(els.map(target => ({ target, isIntersecting: true }))); },
        mutate() { onMutation(); },
        reduce() { media.matches = true; preference(); },
        get disconnected() { return disconnected; }
    };
}

const run = mount();
assert.equal(run.observed.size, 2);
run.enter(run.first, run.second);
assert.equal(run.first.styles.get('--test-delay'), '0ms');
assert.equal(run.second.styles.get('--test-delay'), '80ms');
assert.equal(run.observed.size, 0, 'revealed nodes are unobserved');
run.mutate();
assert.equal(run.observed.size, 0, 'ordinary rerenders never replay entrances');
const late = run.add('late');
run.mutate();
assert.ok(run.observed.has(late), 'async content is observed');
run.listeners.get('focusin')({ target: late });
assert.ok(!late.classList.contains('test-reveal--pending'), 'keyboard focus reveals immediately');
const dialog = run.add('dialog');
dialog.dialog = true;
run.mutate();
assert.ok(!run.observed.has(dialog), 'dialogs never receive scroll reveals');
const reducedLate = run.add('reduced-late');
run.mutate();
const revisited = run.add('first');
run.mutate();
assert.ok(!run.observed.has(revisited), 'remounted logical items reveal only once per visit');
run.reduce();
assert.equal(run.observed.size, 0);
assert.ok(!late.classList.contains('test-reveal--pending'));
assert.ok(!reducedLate.classList.contains('test-reveal--pending'));
run.cleanup();
assert.equal(run.listeners.size, 0);
assert.ok(run.disconnected);
assert.ok(run.nodes.every(el => !el.classList.contains('test-reveal')));
for (const options of [{ available: false }, { reduced: true }, { enabled: false }]) {
    const fallback = mount(options);
    assert.equal(fallback.observed.size, 0);
    assert.ok(fallback.nodes.every(el => !el.classList.contains('test-reveal--pending')));
    fallback.cleanup?.();
}
const visit = mount();
assert.equal(visit.observed.size, 2, 'new visits start a fresh reveal lifecycle');
visit.cleanup();
console.log('PASS: stagger, async insertion, once-per-visit keys, reduced motion, missing observer, delayed mount and cleanup');

const startup = mount({ booting: true });
assert.equal(startup.observed.size, 0, 'Visible startup content should not animate again after the loader');
assert.equal(startup.first.classList.contains('test-reveal--pending'), false);
startup.cleanup();
