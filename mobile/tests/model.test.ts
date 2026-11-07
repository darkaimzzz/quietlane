import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {act,create} from 'react-test-renderer';
import * as engine from '../src/engine.ts';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
function loadModel(){
 let onInterval=()=>{},onActivity=(value:string)=>{};
 const writes:string[]=[];let failNext=false;
 const stored=JSON.stringify({...engine.restore(null),onboarded:true});
 const storage={getItem:async()=>stored,setItem:async(_key:string,value:string)=>{if(failNext){failNext=false;throw new Error('Full disk');}writes.push(value);}};
 const nav={path:'/',push(path:any){this.path=typeof path==='string'?path:path.pathname;},replace(path:string){this.path=path;},back(){this.path='/';},canGoBack(){return this.path!=='/';}};
 const modules:Record<string,unknown>={'react':React,'react-native':{AppState:{currentState:'active',addEventListener:(_name:string,fn:(s:string)=>void)=>{onActivity=fn;return{remove(){}};}}},'@react-native-async-storage/async-storage':storage,'./engine':engine,'expo-router':{useRouter:()=>nav,usePathname:()=>nav.path,useGlobalSearchParams:()=>({}),useRootNavigationState:()=>({key:'test'})}};
 const code=ts.transpileModule(fs.readFileSync(new URL('../src/model.ts',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText;
 const exports:any={};vm.runInNewContext(code,{exports,require:(id:string)=>{assert.ok(id in modules,id);return modules[id];},Date,console,setInterval:(fn:()=>void)=>{onInterval=fn;return 1;},clearInterval(){}});
 let model:any;
 function Harness(){model=exports.useModel();return null;}
 return {Harness,get model(){return model;},writes,tick:()=>onInterval(),activity:(s:string)=>onActivity(s),failWrite:()=>{failNext=true;}};
}
test('foreground stalls count actual elapsed time and background time is excluded',async(t)=>{
 t.mock.timers.enable({apis:['Date'],now:new Date(2026,10,8,12).getTime()});
 const initial=Date.now(),h=loadModel();let tree:any;
 await act(async()=>{tree=create(React.createElement(h.Harness));});
 try{
 await act(async()=>h.model.open('youtube'));
 t.mock.timers.setTime(initial+20000);await act(async()=>h.tick());
 const total=()=>Object.values(h.model.state.usage).reduce((sum:number,day:any)=>sum+(day.youtube||0),0);
 assert.equal(total(),20);
 t.mock.timers.setTime(initial+23000);await act(async()=>h.activity('background'));
 t.mock.timers.setTime(initial+53000);await act(async()=>h.activity('active'));
 t.mock.timers.setTime(initial+58000);await act(async()=>h.tick());
 assert.equal(total(),28);
 }finally{await act(async()=>tree.unmount());}
});
test('failed preference saves recover and reset is the final stored value',async()=>{
 const h=loadModel();let tree:any;
 await act(async()=>{tree=create(React.createElement(h.Harness));});
 try{
 h.failWrite();await act(async()=>h.model.patch({blocked:7}));
 assert.ok(h.model.saveError);
 await act(async()=>h.model.patch({blocked:8}));
 assert.equal(h.model.saveError,'');assert.equal(JSON.parse(h.writes.at(-1)!).blocked,8);
 await act(async()=>h.model.setState(engine.restore(null)));
 assert.equal(JSON.parse(h.writes.at(-1)!).blocked,0);
 assert.equal(JSON.parse(h.writes.at(-1)!).onboarded,false);
 }finally{await act(async()=>tree.unmount());}
});
