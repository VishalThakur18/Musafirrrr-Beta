const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname, '../src/main.js'),'utf8');
(async()=>{
 for(const scenario of ['guest','google','profile','failure']) {
  const calls=[]; let release;
  const user=scenario==='guest'?null:{id:'u',role:'TRAVELLER'};
  const values=new Map(scenario==='google'?[['oauthRole','traveller'],['postLoginPath','/explore']]:[]);
  const location={hash:scenario==='profile'?'#/traveller/profile':'',pathname:'/index.html',search:''};
  const context={console:{error(){}},location,history:{replaceState(a,b,url){calls.push(url);location.hash=url.slice(url.indexOf('#'));}},sessionStorage:{getItem:k=>values.get(k),removeItem:k=>values.delete(k)},authState:{user:null},authService:{async init(){}},async refreshAuth(value){context.authState.user=value===null?null:user;},async finishGoogleLogin(){calls.push('oauth');},dataService:{loadIntoStore:()=>new Promise((resolve,reject)=>{release=scenario==='failure'?()=>reject(Error('offline')):resolve;})},document:{getElementById:()=>({})},React:{createElement:()=>({})},ReactDOM:{createRoot:()=>({render(){calls.push('render');}})},App(){}};
  context.window={sbClient:{auth:{getSession:async()=>({data:{session:user?{user}:null}})}}};
  vm.createContext(context);vm.runInContext(source,context);
  while(!release) await new Promise(resolve=>setImmediate(resolve));
  assert.ok(!calls.includes('render'),'must not mount while initial data is pending');
  release();await new Promise(resolve=>setImmediate(resolve));
  assert.equal(calls.at(-1),'render');assert.equal(context.window.authBooting,false);
  if(scenario==='google')assert.equal(location.hash,'#/explore');
  if(scenario==='profile')assert.equal(location.hash,'#/traveller/profile');
 }
 console.log('PASS: startup waits for data, guest startup, OAuth destination before mount, profile reload preserved, data failure recovery');
})().catch(error=>{console.error(error);process.exitCode=1;});
