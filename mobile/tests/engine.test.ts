import {browserGuardSources} from '../src/browser-guards.generated.ts';
import vm from 'node:vm';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isSafeUrl, blockedRoute, sleepActive, accessReason, restore, defaults, injection, recordUsage, sharedFromMessages } from '../src/engine.ts';

test('navigation accepts platform hosts and subdomains only, without credentials', () => {
 assert.equal(isSafeUrl('https://www.instagram.com/direct/inbox/', 'instagram'), true);
 for (const url of ['http://instagram.com', 'https://instagram.com.evil.test', 'javascript:alert(1)', 'https://user:pass@instagram.com', 'https://evilinstagram.com']) assert.equal(isSafeUrl(url,'instagram'),false);
 assert.equal(isSafeUrl('https://accounts.google.com/signin','youtube'),true);
});
test('short feeds blocked but messages and regular videos stay accessible', () => {
 const rules = { ...defaults.rules };
 assert.equal(blockedRoute('https://www.youtube.com/shorts/abc','youtube',rules),true);
 assert.equal(blockedRoute('https://www.youtube.com/watch?v=abc','youtube',rules),false);
 assert.equal(blockedRoute('https://www.instagram.com/reels/','instagram',rules),true);
 assert.equal(blockedRoute('https://www.instagram.com/direct/inbox/','instagram',rules),false);
 assert.equal(blockedRoute('https://www.instagram.com/explore/','instagram',rules),true);
 assert.equal(blockedRoute('https://www.instagram.com/explore/','instagram',{...rules,explore:false}),false);
});
test('single shared reel allows exactly that video, not another or the feed', () => {
 const link='https://www.instagram.com/reel/abc/';
 assert.equal(blockedRoute(link,'instagram',defaults.rules,link),false);
 assert.equal(blockedRoute('https://www.instagram.com/reel/xyz/','instagram',defaults.rules,link),true);
 assert.equal(blockedRoute('https://www.instagram.com/reels/','instagram',defaults.rules,link),true);
});
test('overnight schedule uses the day the sleep window began', () => {
 const sleep={enabled:true,start:'22:00',end:'07:00',days:[1]};
 assert.equal(sleepActive(sleep,new Date(2026,10,9,23,0)),true);
 assert.equal(sleepActive(sleep,new Date(2026,10,10,6,59)),true);
 assert.equal(sleepActive(sleep,new Date(2026,10,10,7,0)),false);
 assert.equal(sleepActive(sleep,new Date(2026,10,10,23,0)),false);
 assert.equal(sleepActive({...sleep,start:'09:00',end:'17:00'},new Date(2026,10,9,12)),true);
 assert.equal(sleepActive({...sleep,start:'22:00',end:'22:00'},new Date(2026,10,9,23)),false);
});
test('focus and daily limit guard browsers; expired focus does not', () => {
 const now=new Date(2026,10,9,12);
 const state=restore(null);
 state.focusUntil=now.getTime()+1000;
 assert.match(accessReason(state,'instagram',now)!,/focus/i);
 state.focusUntil=now.getTime()-1;
 assert.equal(accessReason(state,'instagram',now),null);
 state.apps.instagram.limit=5;
 state.usage={'2026-11-09':{instagram:300}};
 assert.match(accessReason(state,'instagram',now)!,/limit/i);
});
test('stored data is validated and prototype keys are ignored', () => {
 assert.deepEqual(restore('{bad'),restore(null));
 const state=restore(JSON.stringify({apps:{instagram:{enabled:true,limit:-10}},focusUntil:'forever',sleep:{enabled:true,start:'99:99',end:'bad'},usage:{bad:{instagram:-100}}}));
 assert.equal(state.apps.instagram.limit,0);
 assert.equal(state.focusUntil,0);
 assert.equal(state.sleep.start,'22:00');
 assert.deepEqual(state.usage,{});
});
test('injection includes SPA guards and does not read credentials or cookies', () => {
 const js=injection('youtube',defaults.rules);
 assert.ok(js.includes('MutationObserver'));
 assert.ok(js.includes('pushState'));
 assert.ok(js.includes('yt-shorts'));
 assert.ok(!js.includes('document.cookie'));
 assert.ok(!js.includes('input[type=password]'));
 assert.doesNotThrow(()=>new Function(js));
});


test('shared video IDs remain case-sensitive and allowed clip is not hidden',()=>{
 const link='https://m.youtube.com/shorts/AbC';
 assert.equal(blockedRoute('https://m.youtube.com/shorts/abc','youtube',defaults.rules,link),true);
 const js=injection('youtube',defaults.rules,link);
 const style={textContent:''}; const location={href:link,replace:()=>{}}; const document={getElementById:()=>style,addEventListener:()=>{},documentElement:{}}; const history={pushState:()=>{},replaceState:()=>{}}; vm.runInNewContext(js,{window:{addEventListener:()=>{}},document,location,history,URL,MutationObserver:class {observe(){}},setTimeout}); assert.ok(!style.textContent.includes('yt-shorts'));
});




test('a shared feed URL never grants a single-video exception',()=>{
 for(const [id,url] of [['youtube','https://m.youtube.com/shorts/'],['instagram','https://www.instagram.com/reel/']] as const) assert.equal(blockedRoute(url,id,defaults.rules,url),true);
});
test('brief visits accumulate and stop at the daily budget',()=>{
 let state=restore(null);const now=new Date(2026,10,9,12);
 state.apps.instagram.limit=5;
 state=recordUsage(state,'instagram',1.2,now);
 state=recordUsage(state,'instagram',1.4,now);
 assert.ok(Math.abs(state.usage['2026-11-09'].instagram!-2.6)<1e-9);
 state=recordUsage(state,'instagram',400,now);
 assert.equal(state.usage['2026-11-09'].instagram,300);
});
test('only a specific reel from a messages page can open as shared',()=>{
 assert.equal(sharedFromMessages('https://www.instagram.com/direct/t/123/','https://www.instagram.com/reel/AbC/','instagram'),true);
 assert.equal(sharedFromMessages('https://www.instagram.com/','https://www.instagram.com/reel/AbC/','instagram'),false);
 assert.equal(sharedFromMessages('https://www.instagram.com/direct/t/123/','https://www.instagram.com/reels/','instagram'),false);
 assert.equal(sharedFromMessages('https://www.instagram.com/direct/t/123/','https://instagram.com.evil.test/reel/AbC/','instagram'),false);
});



test('filter injection executes after production-style function minification',async()=>{
 const fs=await import('node:fs');const ts=await import('typescript');const {minify}=await import('terser');
 const compiled=ts.transpileModule(fs.readFileSync(new URL('../src/engine.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
 const result=await minify(compiled,{mangle:{toplevel:true},compress:false});
 const exports:any={};vm.runInNewContext(result.code!,{exports,URL,require:(id:string)=>{assert.equal(id,'./browser-guards.generated.ts');return {browserGuardSources};}});let redirected=false;
 const link='https://m.youtube.com/shorts/AbC';
 const style={textContent:''};const document={getElementById:()=>style,addEventListener:()=>{},documentElement:{}};
 assert.doesNotThrow(()=>vm.runInNewContext(exports.injection('youtube',defaults.rules,link),{window:{addEventListener:()=>{}},document,location:{href:link,replace:()=>{redirected=true;}},history:{pushState:()=>{},replaceState:()=>{}},URL,MutationObserver:class{observe(){}},setTimeout}));assert.equal(redirected,false);
});



test('first launch is account-free and starts with public pages',()=>{
 assert.equal(restore(null).messagesFirst,false);
 assert.equal(restore(null).autoApp,null);
});
test('encoded short-feed paths cannot bypass the route guard',()=>{
 assert.equal(blockedRoute('https://www.youtube.com/%73horts/AbC','youtube',defaults.rules),true);
 assert.equal(blockedRoute('https://www.instagram.com/%72eels/','instagram',defaults.rules),true);
});
test('Explore toggles act independently on Snapchat and TikTok',()=>{
 assert.equal(blockedRoute('https://www.snapchat.com/discover/','snapchat',{...defaults.rules,shorts:false,explore:true}),true);
 assert.equal(blockedRoute('https://www.snapchat.com/discover/','snapchat',{...defaults.rules,shorts:true,explore:false}),false);
 assert.equal(blockedRoute('https://www.tiktok.com/explore','tiktok',defaults.rules),true);
});
test('Facebook ad filtering never targets ordinary post message containers',()=>{
 assert.ok(!injection('facebook',defaults.rules).includes('[data-ad-preview='));
});


test('re-injecting filters removes old listeners so disabled rules stay disabled',()=>{
 const events:Record<string,Function[]>={};const style={textContent:''};let prevented=false;
 const document={getElementById:()=>style,addEventListener:(name:string,fn:Function)=>{(events[name]??=[]).push(fn);},removeEventListener:(name:string,fn:Function)=>{events[name]=(events[name]||[]).filter(v=>v!==fn);},documentElement:{}};
 const context=vm.createContext({window:{addEventListener(){},removeEventListener(){}},document,location:{href:'https://m.youtube.com/watch?v=abc',replace(){}},history:{pushState(){},replaceState(){}},URL,MutationObserver:class{observe(){}disconnect(){}},setTimeout});
 vm.runInContext(injection('youtube',defaults.rules),context);
 vm.runInContext(injection('youtube',{...defaults.rules,shorts:false}),context);
 for(const fn of events.click)fn({target:{closest:()=>({href:'https://m.youtube.com/shorts/xyz'})},preventDefault(){prevented=true;},stopImmediatePropagation(){}});
 assert.equal(prevented,false);assert.equal(events.click.length,1);
});

test('filter generation works when Hermes hides function source as bytecode',()=>{
 const guardString=blockedRoute.toString,sharedString=sharedFromMessages.toString;
 try{
 blockedRoute.toString=()=> 'function blockedRoute(a0, a1, a2, a3) { [bytecode] }';
 sharedFromMessages.toString=()=> 'function sharedFromMessages(a0, a1, a2) { [bytecode] }';
 const js=injection('instagram',defaults.rules);
 const style={textContent:''},location={href:'https://www.instagram.com/accounts/login/',replace(){}};
 const document={getElementById:()=>style,addEventListener(){},documentElement:{}};
 const history={pushState(){},replaceState(){}};
 assert.doesNotThrow(()=>vm.runInNewContext(js,{window:{addEventListener(){}},document,location,history,URL,MutationObserver:class{observe(){}},setTimeout}));
 }finally{blockedRoute.toString=guardString;sharedFromMessages.toString=sharedString;}
});

test('Instagram home-feed guard blocks home without blocking sign-in, profiles or messages',()=>{
 const rules={...defaults.rules,feed:true};
 assert.equal(blockedRoute('https://www.instagram.com/','instagram',rules),true);
 for(const path of ['/accounts/login/','/direct/inbox/','/some_profile/','/p/AbC/']){
  assert.equal(blockedRoute('https://www.instagram.com'+path,'instagram',rules),false);
 }
 assert.equal(blockedRoute('https://www.instagram.com/','instagram',{...rules,feed:false}),false);
});

test('injected filter acknowledges its exact configuration only after successful startup',()=>{
 const messages:any[]=[];
 const style={textContent:''},location={href:'https://www.instagram.com/accounts/login/',replace(){}};
 const document={getElementById:()=>style,addEventListener(){},documentElement:{}};
 const history={pushState(){},replaceState(){}};
 vm.runInNewContext(injection('instagram',defaults.rules),{
  window:{addEventListener(){},ReactNativeWebView:{postMessage(data:string){messages.push(JSON.parse(data));}}},
  document,location,history,URL,MutationObserver:class{observe(){}},setTimeout,
 });
 const ready=messages.find(message=>message.type==='ready');
 assert.ok(ready);
 assert.equal(ready.config,JSON.stringify({id:'instagram',rules:defaults.rules}));
});
