const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = vm.createContext({ CustomEvent: class { constructor(type, init) { this.type = type; this.detail = init.detail; } } });
const root = path.resolve(__dirname, '..');
vm.runInContext(fs.readFileSync(path.join(root, 'src/features/organizerDashboard/services/liveUpdates.js'), 'utf8'), context);
function environment(fail = false) {
    const listeners = new Map(), docListeners = new Map(), timeouts = new Map(), intervals = new Map(), events = [], subscriptions = [];
    let seq = 0, status, removed = 0, isOnline = true;
    const channel = { on(event, config, fn) { subscriptions.push({ config, fn }); return this; }, subscribe(fn) { status = fn; return this; } };
    const target = {
        setTimeout(fn) { timeouts.set(++seq, fn); return seq; }, clearTimeout(id) { timeouts.delete(id); },
        setInterval(fn, ms) { assert.equal(ms, 15000); intervals.set(++seq, fn); return seq; }, clearInterval(id) { intervals.delete(id); },
        addEventListener(name, fn) { listeners.set(name, fn); }, removeEventListener(name) { listeners.delete(name); }, dispatchEvent(event) { events.push(event); }
    };
    const doc = { visibilityState: 'visible', addEventListener(name, fn) { docListeners.set(name, fn); }, removeEventListener(name) { docListeners.delete(name); } };
    const client = { channel() { if (fail) throw new Error('Unavailable'); return channel; }, removeChannel() { removed++; return Promise.resolve(); } };
    const stop = context.startOrganizerLiveUpdates('org-a', { client, target, doc, online: () => isOnline });
    const flush = () => { const callbacks = [...timeouts.values()]; timeouts.clear(); callbacks.forEach(fn => fn()); };
    return { subscriptions, listeners, docListeners, intervals, timeouts, events, doc, stop, flush, status: s => status(s), setOnline: v => { isOnline = v; }, removed: () => removed };
}
const env = environment();
assert.equal(env.subscriptions.length, 2);
assert.deepEqual(Array.from(env.subscriptions, s => s.config.table), ['enquiries', 'trips']);
env.subscriptions.forEach(s => assert.equal(s.config.filter, 'organizer_id=eq.org-a'));
env.subscriptions[0].fn(); env.subscriptions[1].fn(); env.listeners.get('leads-changed')();
assert.equal(env.timeouts.size, 1, 'Burst notifications debounce');
env.flush(); assert.equal(env.events.length, 1); assert.equal(env.events[0].detail.organizerId, 'org-a');
env.doc.visibilityState = 'hidden'; env.subscriptions[0].fn(); [...env.intervals.values()][0](); env.flush(); assert.equal(env.events.length, 1);
env.doc.visibilityState = 'visible'; env.docListeners.get('visibilitychange')(); env.flush(); assert.equal(env.events.length, 2);
env.setOnline(false); env.subscriptions[0].fn(); env.flush(); assert.equal(env.events.length, 2);
env.setOnline(true); env.listeners.get('online')(); env.flush(); assert.equal(env.events.length, 3);
env.status('SUBSCRIBED'); env.flush(); assert.equal(env.events.length, 4);
env.subscriptions[0].fn(); env.stop(); env.flush(); assert.equal(env.events.length, 4);
assert.equal(env.intervals.size, 0); assert.equal(env.listeners.size, 0); assert.equal(env.docListeners.size, 0); assert.equal(env.removed(), 1);
env.subscriptions[0].fn(); assert.equal(env.timeouts.size, 0, 'Late events ignored');
const fallback = environment(true); [...fallback.intervals.values()][0](); fallback.flush(); assert.equal(fallback.events.length, 1); fallback.stop();
const mapping = vm.createContext({ window: {} });
vm.runInContext(fs.readFileSync(path.join(root, 'src/backend/services/organizer.service.js'), 'utf8'), mapping);
const early = mapping.dbToEnquiry({ created_at: '2026-10-23T08:00:00Z', status: 'new' });
const latest = mapping.dbToEnquiry({ created_at: '2026-10-23T09:00:00Z', status: 'new' });
assert.ok(new Date(latest.createdAtTimestamp) > new Date(early.createdAtTimestamp), 'Same-day enquiries retain chronological ordering');
assert.match(latest.createdAt, /^\d{4}-\d{2}-\d{2}$/, 'Display dates retain the existing date-only contract');
console.log('PASS: scoped subscriptions, debounce, fallback polling, visibility/offline handling, reconnect, cleanup and timestamp ordering.');
