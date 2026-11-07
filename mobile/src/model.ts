import {createElement,createContext,use,useCallback,useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {AppState} from 'react-native';
import {useGlobalSearchParams,usePathname,useRootNavigationState,useRouter} from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {accessReason,blockedRoute,recordUsage,platforms,restore} from './engine';
import type {State,PlatformId} from './engine';
export type Tab='Home'|'Apps'|'Focus'|'Sleep'|'Settings';
// Preserve existing preferences when upgrading from the prototype.
const KEY='sociallite-state-v1';
const paths={Home:'/',Apps:'/apps',Focus:'/focus',Sleep:'/sleep',Settings:'/settings'} as const;
const usageNow=()=>typeof performance==='undefined'?Date.now():performance.now();

export function useModel(){
 const router=useRouter(),pathname=usePathname(),params=useGlobalSearchParams<{id?:string}>();
 const navigation=useRootNavigationState();
 const tab=(Object.keys(paths) as Tab[]).find(key=>paths[key]===pathname)||'Home';
 const detail=pathname.startsWith('/platform/')&&platforms.some(p=>p.id===params.id)?params.id as PlatformId:null;
 const [state,setState]=useState<State>(()=>restore(null)),[ready,setReady]=useState(false),[saveError,setSaveError]=useState('');
 const [now,setNow]=useState(Date.now),[browser,setBrowser]=useState<{id:PlatformId;url:string;shared?:string}|null>(null);
 const [confirm,setConfirm]=useState<{title:string;body:string;action:()=>void}|null>(null);
 const current=useRef(state),activeBrowser=useRef(browser),activity=useRef(AppState.currentState);
 const lastTick=useRef(0),writes=useRef(Promise.resolve()),autoOpened=useRef(false);
 useLayoutEffect(()=>{current.current=state;activeBrowser.current=browser;},[state,browser]);
 const load=useCallback(()=>AsyncStorage.getItem(KEY).then(raw=>{setState(restore(raw));setReady(true);setSaveError('');})
  .catch(()=>setSaveError('Could not read saved settings. Tap to retry.')),[]);
 useEffect(()=>{void load();},[load]);
 useEffect(()=>{
  if(!ready)return;
  const json=JSON.stringify(state);
  writes.current=writes.current.then(()=>AsyncStorage.setItem(KEY,json))
   .then(()=>setSaveError('')).catch(()=>setSaveError('Could not save. Free device storage, then tap to retry.'));
 },[state,ready]);
 useEffect(()=>{
  const tick=(flush=false)=>{
   const time=Date.now(),clock=usageNow(),delta=clock-lastTick.current;
   setNow(time);
   const count=flush||delta>=5000||delta<0;
   if(count)lastTick.current=clock;
   const id=activeBrowser.current?.id,tracking=activity.current==='active';
   setState(prev=>{
    let next=prev;
    if(prev.focusUntil&&prev.focusUntil<=time)next={...next,focusUntil:0,focusCompleted:next.focusCompleted+1};
    if(prev.postUntil&&prev.postUntil<=time)next={...next,postUntil:0,postApp:null};
    if(count&&tracking&&id)next=recordUsage(next,id,Math.max(0,delta/1000),new Date(time));
    return next;
   });
  };
  lastTick.current=usageNow();
  const timer=setInterval(()=>tick(),1000);
  const sub=AppState.addEventListener('change',value=>{tick(true);activity.current=value;lastTick.current=usageNow();});
  return()=>{clearInterval(timer);sub.remove();};
 },[]);
 const patch=(changes:Partial<State>)=>setState(v=>({...v,...changes}));
 const appPatch=(id:PlatformId,changes:Partial<State['apps'][PlatformId]>)=>
  setState(v=>({...v,apps:{...v.apps,[id]:{...v.apps[id],...changes}}}));
 const ask=useCallback((title:string,body:string,action:()=>void=()=>{})=>setConfirm({title,body,action}),[]);
 const flushUsage=useCallback(()=>{
  const clock=usageNow(),id=activeBrowser.current?.id,tracking=activity.current==='active';
  const elapsed=Math.max(0,(clock-lastTick.current)/1000);lastTick.current=clock;
  if(id&&tracking)setState(v=>recordUsage(v,id,elapsed,new Date()));
 },[]);
 const setTab=(next:Tab)=>router.replace(paths[next]);
 const setDetail=(id:PlatformId|null)=>{
  if(id)router.push({pathname:'/platform/[id]',params:{id}});
  else if(router.canGoBack())router.back();else router.replace('/apps');
 };
 const open=useCallback((id:PlatformId,url?:string,shared?:string)=>{
  flushUsage();
  const reason=accessReason(current.current,id);
  if(reason){ask('A little space to breathe',reason);return;}
  const p=platforms.find(p=>p.id===id)!;
  const initial=url||(current.current.messagesFirst?p.messages:p.home);
  const destination=blockedRoute(initial,id,current.current.apps[id].rules,shared)?p.messages:initial;
  lastTick.current=usageNow();setBrowser({id,url:destination,shared});
  router.push('/browser');
 },[flushUsage,ask,router]);
 useEffect(()=>{
  if(ready&&navigation?.key&&state.onboarded&&!autoOpened.current){
   autoOpened.current=true;if(state.autoApp&&pathname==='/')open(state.autoApp);
  }
 },[ready,navigation?.key,state.onboarded,state.autoApp,pathname,open]);
 useEffect(()=>{
  if(pathname!=='/browser'&&activeBrowser.current){flushUsage();activeBrowser.current=null;setBrowser(null);}
 },[pathname,flushUsage]);
 const clock=(until:number)=>{
  const sec=Math.max(0,Math.ceil((until-now)/1000));
  return String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');
 };
 const closeBrowser=()=>{
  flushUsage();activeBrowser.current=null;setBrowser(null);
  if(router.canGoBack())router.back();else router.replace('/apps');
 };
 const onBlock=()=>setState(v=>({...v,blocked:v.blocked+1}));
 return {state,setState,ready,saveError,setSaveError,tab,setTab,now,detail,setDetail,browser,confirm,setConfirm,patch,appPatch,ask,open,clock,closeBrowser,onBlock,load};
}
export type Model=ReturnType<typeof useModel>;
const ModelContext=createContext<Model|null>(null);
export function ModelProvider({children}:{children:ReactNode}){
 const model=useModel();
 return createElement(ModelContext.Provider,{value:model},children);
}
export function useAppModel(){
 const model=use(ModelContext);
 if(!model)throw new Error('Quietlane model is unavailable.');
 return model;
}
