export type Rules = {shorts:boolean;explore:boolean;feed:boolean;ads:boolean;suggestions:boolean};
export const platforms = [
 {id:'instagram',name:'Instagram',icon:'logo-instagram',color:'#EC779F',domain:'instagram.com',home:'https://www.instagram.com/',messages:'https://www.instagram.com/direct/inbox/',note:'Reels & Explore'},
 {id:'youtube',name:'YouTube',icon:'logo-youtube',color:'#FF6D6D',domain:'youtube.com',home:'https://m.youtube.com/',messages:'https://m.youtube.com/feed/subscriptions',note:'Shorts & recommendations'},
 {id:'facebook',name:'Facebook',icon:'logo-facebook',color:'#6A9FFF',domain:'facebook.com',home:'https://m.facebook.com/',messages:'https://www.facebook.com/messages/',note:'Reels & suggested posts'},
 {id:'x',name:'X',icon:'logo-x',color:'#DDDDE4',domain:'x.com',home:'https://x.com/',messages:'https://x.com/messages',note:'Explore & trends'},
 {id:'reddit',name:'Reddit',icon:'logo-reddit',color:'#FF9569',domain:'reddit.com',home:'https://www.reddit.com/',messages:'https://www.reddit.com/message/inbox/',note:'Popular & recommendations'},
 {id:'tiktok',name:'TikTok',icon:'musical-notes',color:'#70DBDC',domain:'tiktok.com',home:'https://www.tiktok.com/messages',messages:'https://www.tiktok.com/messages',note:'For You & LIVE'},
 {id:'snapchat',name:'Snapchat',icon:'logo-snapchat',color:'#F3DE76',domain:'snapchat.com',home:'https://web.snapchat.com/',messages:'https://web.snapchat.com/',note:'Spotlight & Discover'},
 {id:'linkedin',name:'LinkedIn',icon:'logo-linkedin',color:'#77B5E7',domain:'linkedin.com',home:'https://www.linkedin.com/',messages:'https://www.linkedin.com/messaging/',note:'Feed & recommendations'},
] as const;
export type PlatformId = typeof platforms[number]['id'];
export const availableRules:Record<PlatformId,(keyof Rules)[]>={
 instagram:['shorts','explore','feed'],youtube:['shorts','feed','ads','suggestions'],
 facebook:['shorts','feed'],x:['explore','feed'],reddit:['explore','feed','ads'],
 tiktok:['shorts','explore','feed'],snapchat:['shorts','explore'],linkedin:['feed','ads'],
};
export type Sleep = {enabled:boolean;start:string;end:string;days:number[]};
export type AppConfig = {enabled:boolean;limit:number;rules:Rules};
export type State = {onboarded:boolean;apps:Record<PlatformId,AppConfig>;sleep:Sleep;focusUntil:number;postUntil:number;postApp:PlatformId|null;usage:Record<string,Partial<Record<PlatformId,number>>>;blocked:number;focusCompleted:number;autoApp:PlatformId|null;messagesFirst:boolean};
export const defaults = {rules:{shorts:true,explore:true,feed:false,ads:true,suggestions:true} as Rules};
export function dayKey(date=new Date()) { return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-'); }
export function isSafeUrl(url:string,id:PlatformId):boolean {
 try { const u=new URL(url);const p=platforms.find(p=>p.id===id); if(!p || u.protocol!=='https:' || u.username || u.password || (u.port && u.port!=='443'))return false;
 const hosts=[p.domain,...(id==='youtube'?['accounts.google.com']:id==='facebook'?['messenger.com']:id==='x'?['twitter.com']:[])];
 return hosts.some(h=>u.hostname===h||u.hostname.endsWith('.'+h)); } catch {return false;}
}
export function blockedRoute(url:string,id:PlatformId,rules:Rules,shared?:string):boolean {
 try {
 const u=new URL(url);const path=decodeURIComponent(u.pathname).replace(/\/+/g,'/').toLowerCase();
 if(shared) { const s=new URL(shared); if(u.origin===s.origin&&u.pathname===s.pathname&&(id==='youtube'?/^\/shorts\/[\w-]+\/?$/:id==='instagram'?/^\/reels?\/[\w-]+\/?$/:id==='facebook'?/^\/reel\/[\w-]+\/?$/:/a^/).test(u.pathname)) return false; }
 if(rules.shorts && (
 (id==='instagram'&&/^\/reels?(\/|$)/.test(path)) ||
 (id==='youtube'&&/^\/shorts(\/|$)/.test(path)) ||
 (id==='facebook'&&/^\/reels?(\/|$)/.test(path)) ||
 (id==='tiktok'&&(/^\/(foryou|live)(\/|$)/.test(path)||path==='/')) ||
 (id==='snapchat'&&/^\/spotlight(\/|$)/.test(path))))return true;
 if(rules.explore && (((id==='instagram'||id==='x')&&/^\/explore(\/|$)/.test(path)) || (id==='tiktok'&&/^\/(explore|discover)(\/|$)/.test(path)) || (id==='snapchat'&&/^\/discover(\/|$)/.test(path)) || (id==='reddit'&&/^\/r\/(all|popular)(\/|$)/.test(path)))) return true;
 return false;
 }catch{return true;}
}
export function sleepActive(sleep:Sleep,now=new Date()):boolean {
 if(!sleep.enabled || sleep.start===sleep.end)return false;
 const min=(s:string)=>Number(s.slice(0,2))*60+Number(s.slice(3));
 const start=min(sleep.start),end=min(sleep.end),current=now.getHours()*60+now.getMinutes();
 if(start<end)return sleep.days.includes(now.getDay())&&current>=start&&current<end;
 const day=current<end?(now.getDay()+6)%7:now.getDay();
 return sleep.days.includes(day)&&(current>=start||current<end);
}
export function accessReason(state:State,id:PlatformId,now=new Date()):string|null {
 if(!state.apps[id].enabled)return 'This platform is disabled. Enable it in Apps.';
 if(state.focusUntil>now.getTime())return 'Focus session active. Your social apps can wait.';
 if(sleepActive(state.sleep,now))return 'Sleep mode is active. Rest now, reconnect later.';
 const limit=state.apps[id].limit;
 if(limit>0 && (state.usage[dayKey(now)]?.[id]||0)>=limit*60)return 'Daily limit reached. Come back tomorrow.';
 return null;
}
const finite=(n:unknown,min=0,max=Number.MAX_SAFE_INTEGER)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
export function restore(raw:string|null):State {
 let v:any={};try{v=JSON.parse(raw||'{}')||{};}catch{}
 const object=(o:any)=>o&&typeof o==='object'&&!Array.isArray(o);
 if(!object(v))v={};
 const rules=(r:any):Rules=>Object.fromEntries(Object.entries(defaults.rules).map(([k,d])=>[k,typeof r?.[k]==='boolean'?r[k]:d])) as Rules;
 const apps=Object.fromEntries(platforms.map(p=>[p.id,{enabled:typeof v.apps?.[p.id]?.enabled==='boolean'?v.apps[p.id].enabled:true,limit:finite(v.apps?.[p.id]?.limit,0,1440)?v.apps[p.id].limit:0,rules:rules(v.apps?.[p.id]?.rules)}])) as State['apps'];
 const validTime=(s:any)=>typeof s==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(s);
 const validId=(id:any)=>platforms.some(p=>p.id===id);
 const usage:State['usage']={};
 if(object(v.usage)) for(const [date,entries] of Object.entries(v.usage).sort().slice(-90)){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!object(entries))continue;
 const values=Object.fromEntries(platforms.filter(p=>finite((entries as any)[p.id],0,86400)).map(p=>[p.id,(entries as any)[p.id]]));
 if(Object.keys(values).length)usage[date]=values;
 }
 return {onboarded:v.onboarded===true,apps,sleep:{enabled:v.sleep?.enabled===true,start:validTime(v.sleep?.start)?v.sleep.start:'22:00',end:validTime(v.sleep?.end)?v.sleep.end:'07:00',days:Array.isArray(v.sleep?.days)?[...new Set<number>(v.sleep.days.filter((d:any)=>Number.isInteger(d)&&d>=0&&d<=6))]:[0,1,2,3,4,5,6]},focusUntil:finite(v.focusUntil)?v.focusUntil:0,postUntil:finite(v.postUntil)?v.postUntil:0,postApp:validId(v.postApp)?v.postApp:null,usage,blocked:finite(v.blocked)?v.blocked:0,focusCompleted:finite(v.focusCompleted)?v.focusCompleted:0,autoApp:validId(v.autoApp)?v.autoApp:null,messagesFirst:v.messagesFirst===true};
}
// shortcut: platform DOM selectors change, refresh rules after live-device checks when sites change.
export function injection(id:PlatformId,rules:Rules,shared?:string):string {
 const selectors:string[]=[];
 if(rules.shorts)selectors.push(...({
 instagram:['a[href="/reels/"]','a[href="/reels"]'],
 youtube:['ytd-reel-shelf-renderer','ytd-rich-shelf-renderer[is-shorts]','yt-shorts','ytm-shorts-lockup-view-model','ytm-reel-shelf-renderer','a[href^="/shorts/"]','[tab-identifier="FEshorts"]'],
 facebook:['a[href="/reel/"]','a[href="/reels/"]','a[href="/reels"]'],
 x:[],reddit:[],tiktok:['a[href="/foryou"]','a[href="/live"]'],snapchat:['a[href*="/spotlight"]'],linkedin:[]
 }[id]));
 if(rules.explore)selectors.push(...({instagram:['a[href="/explore/"]'],youtube:[],facebook:[],x:['a[href="/explore"]','[data-testid="sidebarColumn"]'],reddit:['a[href="/r/popular/"]','a[href="/r/all/"]'],tiktok:['a[href="/explore"]'],snapchat:['a[href*="discover"]'],linkedin:[]}[id]));
 if(rules.feed)selectors.push(...({instagram:['main[role="main"]:has(article) article'],youtube:['ytd-browse[page-subtype="home"] #contents','ytm-browse[tab-identifier="FEwhat_to_watch"]'],facebook:['[role="feed"]'],x:['[data-testid="primaryColumn"] [aria-label^="Timeline"]'],reddit:['shreddit-feed'],tiktok:['[data-e2e="recommend-list-item-container"]'],snapchat:[],linkedin:['.scaffold-finite-scroll__content']}[id]));
 if(rules.ads)selectors.push('ytd-ad-slot-renderer','ytd-display-ad-renderer','.ytp-ad-overlay-container','shreddit-ad-post','.ad-banner-container');
 if(rules.suggestions&&id==='youtube')selectors.push('#related','ytm-watch-next-secondary-results-renderer');
 if(shared){ const index=selectors.indexOf('yt-shorts');if(index>=0)selectors.splice(index,1); }
 if(shared)selectors.push('[aria-label="Next reel"]','[aria-label="Next video"]','[aria-label="Previous reel"]','[aria-label="Previous video"]');
 return '(function(){const c='+JSON.stringify({id,rules,shared})+';const sharedFromMessages='+sharedFromMessages.toString()+';const guard='+blockedRoute.toString()+';'+
 'const host=new URL(location.href).hostname;const domain='+JSON.stringify(platforms.find(p=>p.id===id)!.domain)+';if(host!==domain&&!host.endsWith("."+domain))return;'+
 'if(typeof window.__quietlaneCleanup==="function")window.__quietlaneCleanup();'+
 'const send=(type,url)=>window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type,url}));'+
 'const safe=()=>{if(guard(location.href,c.id,c.rules,c.shared)){location.replace('+JSON.stringify(platforms.find(p=>p.id===id)!.messages)+');send("blocked");return false;}return true;};'+
 'let style=document.getElementById("quietlane-style");if(!style){style=document.createElement("style");style.id="quietlane-style";(document.head||document.documentElement).appendChild(style);}style.textContent='+JSON.stringify(selectors.length?selectors.join(',')+'{display:none!important;}':'')+';'+
 'const click=e=>{const a=e.target&&e.target.closest&&e.target.closest("a[href]");if(a&&guard(a.href,c.id,c.rules,c.shared)){e.preventDefault();e.stopImmediatePropagation();if(sharedFromMessages(location.href,a.href,c.id))send("shared",a.href);else send("blocked");}};'+
 'document.addEventListener("click",click,true);const originals={};const wrappers={};'+
 'for(const method of ["pushState","replaceState"]){originals[method]=history[method];wrappers[method]=function(...args){if(args[2]&&guard(new URL(args[2],location.href).href,c.id,c.rules,c.shared)){send("blocked");return;}const result=originals[method].apply(this,args);safe();return result;};history[method]=wrappers[method];}'+
 'window.addEventListener("popstate",safe);let pending;const observer=new MutationObserver(()=>{if(!pending)pending=setTimeout(()=>{pending=undefined;safe();},100);});observer.observe(document.documentElement,{childList:true,subtree:true});'+
 'window.__quietlaneCleanup=()=>{document.removeEventListener("click",click,true);window.removeEventListener("popstate",safe);observer.disconnect();if(pending)clearTimeout(pending);for(const method of ["pushState","replaceState"])if(history[method]===wrappers[method])history[method]=originals[method];};safe();})();true;';
}


export function recordUsage(state:State,id:PlatformId,seconds:number,now:Date):State{
 if(!Number.isFinite(seconds)||seconds<=0||accessReason(state,id,now))return state;
 const date=dayKey(now),limit=state.apps[id].limit;
 const total=Math.min((state.usage[date]?.[id]||0)+seconds,limit?limit*60:86400);
 const usage={...state.usage,[date]:{...state.usage[date],[id]:total}};
 return {...state,usage:Object.fromEntries(Object.entries(usage).sort().slice(-90))};
}

export function sharedFromMessages(current:string,target:string,id:PlatformId):boolean{
 try{
 const from=new URL(current),to=new URL(target),host=id==='instagram'?'instagram.com':id==='facebook'?'facebook.com':'';
 const valid=(u:URL)=>host&&u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&(u.hostname===host||u.hostname.endsWith('.'+host));
 return !!valid(from)&&!!valid(to)&&(id==='instagram'?/^\/direct\//:/^\/messages(\/|$)/).test(from.pathname)&&/^\/reels?\/[\w-]+\/?$/.test(to.pathname);
 }catch{return false;}
}
