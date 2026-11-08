import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import * as JSX from 'react/jsx-runtime';
import {act,create} from 'react-test-renderer';
import * as engine from '../src/engine.ts';
(globalThis as any).IS_REACT_ACT_ENVIRONMENT=true;
function loadBrowser(injections:string[]=[]){
 const output=ts.transpileModule(fs.readFileSync(new URL('../src/browser.tsx',import.meta.url),'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const exports:any={};
 const WebView=React.forwardRef((props:any,ref)=>{React.useImperativeHandle(ref,()=>({stopLoading(){},goBack(){},reload(){},injectJavaScript(script:string){injections.push(script);}}));return React.createElement('WebView',props);});
 const modules:Record<string,unknown>={'react':React,'react/jsx-runtime':JSX,'react-native':{View:'View',Text:'Text',Pressable:'Pressable',ActivityIndicator:'ActivityIndicator',BackHandler:{addEventListener:()=>({remove(){}})},Alert:{alert(){}},Linking:{openURL:async()=>{}},Share:{share:async()=>{}}},'react-native-webview':{WebView},'@expo/vector-icons':{Ionicons:'Icon'},'./engine':engine};
 vm.runInNewContext(output,{exports,require:(id:string)=>{assert.ok(id in modules,'Unexpected module '+id);return modules[id];},URL,setTimeout,clearTimeout,console});
 return exports.default;
}
function readyMessage(script:string){
 const messages:string[]=[];
 const style={textContent:''};
 vm.runInNewContext(script,{
  window:{addEventListener(){},ReactNativeWebView:{postMessage(data:string){messages.push(data);}}},
  document:{getElementById:()=>style,addEventListener(){},documentElement:{}},
  location:{href:'https://www.instagram.com/accounts/login/',replace(){}},
  history:{pushState(){},replaceState(){}},URL,MutationObserver:class{observe(){}},setTimeout,
 });
 const ready=messages.find(data=>JSON.parse(data).type==='ready');
 assert.ok(ready);return ready;
}
const props={id:'instagram',url:'https://www.instagram.com/direct/inbox/',rules:engine.defaults.rules,post:false,remaining:'',onClose(){},onBlock(){}};
test('transient about:blank never replaces the requested Instagram document',async()=>{
 const Browser=loadBrowser();let tree:any;
 await act(async()=>{tree=create(React.createElement(Browser,props));});
 try{await act(async()=>tree.root.findByType('WebView').props.onNavigationStateChange({url:'about:blank',canGoBack:false,loading:true}));
 assert.equal(tree.root.findByType('WebView').props.source.uri,props.url);
 }finally{await act(async()=>tree.unmount());}
});
test('a login redirect updates the browser location without re-requesting the document',async()=>{
 const Browser=loadBrowser();let tree:any;
 await act(async()=>{tree=create(React.createElement(Browser,props));});
 try{await act(async()=>tree.root.findByType('WebView').props.onNavigationStateChange({url:'https://www.instagram.com/accounts/login/?next=%2Fdirect%2Finbox%2F',canGoBack:false,loading:true}));
 assert.equal(tree.root.findByType('WebView').props.source.uri,props.url);
 }finally{await act(async()=>tree.unmount());}
});


test('a stalled Instagram load provides a working sign-in recovery action',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const Browser=loadBrowser();let tree:any;
 await act(async()=>{tree=create(React.createElement(Browser,props));});
 try{
 await act(async()=>t.mock.timers.tick(25000));
 assert.ok(JSON.stringify(tree.toJSON()).includes('taking too long'));
 const login=tree.root.findAllByType('Pressable').find((n:any)=>n.props.accessibilityLabel==='Open Instagram sign-in');
 assert.ok(login);
 await act(async()=>login.props.onPress());
 assert.equal(tree.root.findByType('WebView').props.source.uri,'https://www.instagram.com/accounts/login/?next=%2Fdirect%2Finbox%2F');
 }finally{await act(async()=>tree.unmount());}
});


test('live camera and microphone capture are denied in the embedded browser',async()=>{
 const Browser=loadBrowser();let tree:any;
 await act(async()=>{tree=create(React.createElement(Browser,props));});
 try{assert.equal(tree.root.findByType('WebView').props.mediaCapturePermissionGrantType,'deny');}
 finally{await act(async()=>tree.unmount());}
});


test('HTTPS child frames do not get mistaken for external top-level navigation',async()=>{
 const Browser=loadBrowser();let tree:any;
 await act(async()=>{tree=create(React.createElement(Browser,props));});
 try{
 const request=tree.root.findByType('WebView').props.onShouldStartLoadWithRequest;
 assert.equal(request({url:'https://www.google.com/recaptcha/frame',isTopFrame:false}),true);
 assert.equal(request({url:'file:///private/file',isTopFrame:false}),false);
 assert.equal(request({url:'https://www.google.com/recaptcha/frame',isTopFrame:true}),false);
 }finally{await act(async()=>tree.unmount());}
});
test('blank-document load callbacks cannot cancel the stalled-page timeout',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});const Browser=loadBrowser();let tree:any;
 await act(async()=>{tree=create(React.createElement(Browser,props));});
 try{
 await act(async()=>tree.root.findByType('WebView').props.onLoadEnd({nativeEvent:{url:'about:blank'}}));
 await act(async()=>t.mock.timers.tick(25000));
 assert.ok(JSON.stringify(tree.toJSON()).includes('taking too long'));
 }finally{await act(async()=>tree.unmount());}
});

test('loaded documents explicitly receive filters and only matching acknowledgement activates them',async()=>{
 const injections:string[]=[];const Browser=loadBrowser(injections);let tree:any;
 await act(async()=>{tree=create(React.createElement(Browser,props));});
 try{
 assert.ok(JSON.stringify(tree.toJSON()).includes('Applying 2 filters'));
 const before=injections.length;
 await act(async()=>tree.root.findByType('WebView').props.onLoadEnd({nativeEvent:{url:props.url}}));
 assert.equal(injections.length,before+1);
 const oldReady=readyMessage(tree.root.findByType('WebView').props.injectedJavaScript);
 await act(async()=>tree.root.findByType('WebView').props.onMessage({nativeEvent:{data:oldReady}}));
 assert.ok(JSON.stringify(tree.toJSON()).includes('2 filters active'));
 const rules={...props.rules,feed:true};
 await act(async()=>tree.update(React.createElement(Browser,{...props,rules})));
 await act(async()=>tree.root.findByType('WebView').props.onMessage({nativeEvent:{data:oldReady}}));
 assert.ok(JSON.stringify(tree.toJSON()).includes('Applying 3 filters'));
 await act(async()=>tree.root.findByType('WebView').props.onMessage({nativeEvent:{data:readyMessage(tree.root.findByType('WebView').props.injectedJavaScript)}}));
 assert.ok(JSON.stringify(tree.toJSON()).includes('3 filters active'));
 }finally{await act(async()=>tree.unmount());}
});

test('unsupported saved rules never label Instagram filters active',async()=>{
 const Browser=loadBrowser();let tree:any;
 await act(async()=>{tree=create(React.createElement(Browser,{...props,rules:{...props.rules,shorts:false,explore:false,feed:false}}));});
 try{assert.ok(JSON.stringify(tree.toJSON()).includes('No filters enabled'));}
 finally{await act(async()=>tree.unmount());}
});

test('missing startup acknowledgement exposes retry instead of claiming active protection',async(t)=>{
 t.mock.timers.enable({apis:['setTimeout']});
 const injections:string[]=[];const Browser=loadBrowser(injections);let tree:any;
 await act(async()=>{tree=create(React.createElement(Browser,props));});
 try{
 await act(async()=>tree.root.findByType('WebView').props.onLoadEnd({nativeEvent:{url:props.url}}));
 await act(async()=>t.mock.timers.tick(5000));
 assert.ok(JSON.stringify(tree.toJSON()).includes('Filters have not started'));
 const before=injections.length;
 const retry=tree.root.findAllByType('Pressable').find((node:any)=>node.props.accessibilityLabel==='Retry content filters');
 await act(async()=>retry.props.onPress());
 assert.equal(injections.length,before+1);
 await act(async()=>tree.root.findByType('WebView').props.onMessage({nativeEvent:{data:readyMessage(tree.root.findByType('WebView').props.injectedJavaScript)}}));
 assert.ok(!JSON.stringify(tree.toJSON()).includes('Filters have not started'));
 assert.ok(JSON.stringify(tree.toJSON()).includes('2 filters active'));
 }finally{await act(async()=>tree.unmount());}
});

test('prior document and A-to-B-to-A acknowledgements cannot activate current filters',async()=>{
 const Browser=loadBrowser();let tree:any;
 await act(async()=>{tree=create(React.createElement(Browser,props));});
 try{
 const oldReceiver=tree.root.findByType('WebView').props.onMessage;
 const oldReady=readyMessage(tree.root.findByType('WebView').props.injectedJavaScript);
 await act(async()=>oldReceiver({nativeEvent:{data:oldReady}}));
 assert.ok(JSON.stringify(tree.toJSON()).includes('2 filters active'));
 await act(async()=>tree.root.findByType('WebView').props.onLoadStart({nativeEvent:{url:props.url}}));
 await act(async()=>oldReceiver({nativeEvent:{data:oldReady}}));
 assert.ok(JSON.stringify(tree.toJSON()).includes('Applying 2 filters'));
 await act(async()=>tree.update(React.createElement(Browser,{...props,rules:{...props.rules,feed:true}})));
 await act(async()=>tree.update(React.createElement(Browser,props)));
 await act(async()=>tree.root.findByType('WebView').props.onMessage({nativeEvent:{data:oldReady}}));
 assert.ok(JSON.stringify(tree.toJSON()).includes('Applying 2 filters'));
 const currentReady=readyMessage(tree.root.findByType('WebView').props.injectedJavaScript);
 await act(async()=>tree.root.findByType('WebView').props.onMessage({nativeEvent:{data:currentReady}}));
 await act(async()=>oldReceiver({nativeEvent:{data:oldReady}}));
 assert.ok(JSON.stringify(tree.toJSON()).includes('2 filters active'));
 }finally{await act(async()=>tree.unmount());}
});
