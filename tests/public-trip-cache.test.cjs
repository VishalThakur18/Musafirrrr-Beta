const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
let calls = 0, queue = [], now = 1000;
const state = { trips: [] };
const context = vm.createContext({
  Date: { now: () => now }, Map, Promise,
  localStorage: { setItem() {} },
  store: { state, quiet(fn) { fn(state); } },
  publicTripFromRow: row => ({ ...row, fromDb: true }),
  window: { addEventListener() {}, sbClient: { from() {
    const chain = { select(columns) { assert.doesNotMatch(columns, /\breviews\s*\(/, 'No trip reviews relationship exists in the deployed schema'); return chain; }, in() { return chain; }, order() {
      calls++; return new Promise(resolve => queue.push(resolve));
    } }; return chain;
  } } }
});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../src/backend/services/data.service.js'), 'utf8'), context);
const api = context.window.dataService;
(async () => {
  const a = api.loadPublishedTrips(), b = api.loadPublishedTrips();
  assert.equal(a,b); assert.equal(calls,1);
  queue.shift()({data:[{id:'first'}]}); await a;
  await api.loadPublishedTrips(); assert.equal(calls,1);
  now += 61000;
  const refresh = api.loadPublishedTrips(); assert.equal(calls,2);
  api.invalidate(false); // Mutation while an older request is in flight.
  queue.shift()({data:[{id:'stale'}]}); await new Promise(setImmediate);
  assert.equal(calls,3);
  queue.shift()({data:[{id:'new'}]}); await refresh;
  assert.equal(state.trips[0].id,'new');
  api.invalidate(false);
  queue.shift()({data:[]}); await api.pending;
  assert.equal(state.trips.length,0); // Unpublish/delete removes old results.
  now += 61000;
  const failed = api.loadPublishedTrips(); queue.shift()({error:Error('offline')});
  await assert.rejects(failed,/offline/); assert.equal(state.tripsLoading,false);
  const retry=api.loadPublishedTrips();queue.shift()({data:[{id:'recovered'}]});await retry;
  assert.equal(state.tripsError,null);assert.equal(state.trips[0].id,'recovered');
  let detailCalls=0;
  const loader=async()=>{detailCalls++;return {id:'detail'};};
  await Promise.all([api.cachedRead('detail',loader),api.cachedRead('detail',loader)]);
  assert.equal(detailCalls,1);
  console.log('PASS: request deduplication, TTL reuse/expiry, mutation race, removal, failure/retry, detail cache');
})().catch(error=>{console.error(error);process.exitCode=1;});
