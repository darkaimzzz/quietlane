import React,{useRef,useState,useEffect,useMemo} from 'react';
import {View,Text,Pressable,ActivityIndicator,Alert,Linking,Share,BackHandler} from 'react-native';
import {WebView} from 'react-native-webview';
import {Ionicons} from '@expo/vector-icons';
import {platforms,PlatformId,Rules,isSafeUrl,blockedRoute,injection,sharedFromMessages,availableRules} from './engine';

export type BrowserProps={id:PlatformId;url:string;shared?:string;rules:Rules;post:boolean;remaining:string;onClose:()=>void;onBlock:()=>void};
function BrowserButton({name,onPress,label,disabled=false}:{name:React.ComponentProps<typeof Ionicons>['name'];onPress:()=>void;label:string;disabled?:boolean}){
 return <Pressable accessibilityRole="button" accessibilityLabel={label} disabled={disabled} onPress={onPress} style={{padding:12}}>
  <Ionicons name={name} color={disabled?'#555':'white'} size={22}/>
 </Pressable>;
}
export default function Browser(p:BrowserProps){
 const {onClose}=p;
 const site=platforms.find(s=>s.id===p.id)!;
 const ref=useRef<WebView<unknown>>(null);
 const [back,setBack]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const [url,setUrl]=useState(p.url);
 const [sourceUrl,setSourceUrl]=useState(p.url);
 const [shared,setShared]=useState(p.shared);
 const [attempt,setAttempt]=useState(0);
 const configKey=JSON.stringify({id:p.id,rules:p.rules,shared});
 const modeKey=String(p.post)+configKey;
 const [filterState,setFilterState]=useState({key:modeKey,revision:0,active:false});
 if(filterState.key!==modeKey)setFilterState({key:modeKey,revision:filterState.revision+1,active:false});
 const [failedKey,setFailedKey]=useState('');
 const filterKey=JSON.stringify([modeKey,filterState.revision]);
 const filterScript=p.post?'true;':injection(p.id,p.rules,shared,filterKey);
 const filterCount=availableRules[p.id].filter(key=>p.rules[key]).length;
 const filtersApplied=filterState.key===modeKey&&filterState.active;
 const filtersFailed=failedKey===filterKey&&!filtersApplied&&!loading&&!p.post;
 // Native navigation events report redirects before the new document has committed.
 const source=useMemo(()=>({uri:sourceUrl}),[sourceUrl]);
 const lastBlock=useRef(0);
 const login='https://www.instagram.com/accounts/login/?next=%2Fdirect%2Finbox%2F';
 const resetFilters=()=>{setFilterState(value=>({...value,revision:value.revision+1,active:false}));setFailedKey('');};
 const navigate=(next:string,clip?:string)=>{
  resetFilters();
  setError('');setLoading(true);setShared(clip);setUrl(next);setSourceUrl(next);setAttempt(v=>v+1);
 };
 const block=()=>{if(Date.now()-lastBlock.current>1000){lastBlock.current=Date.now();p.onBlock();}};
 useEffect(()=>{
  if(!loading)return;
  const timer=setTimeout(()=>setError(site.name+' is taking too long to load. Check your connection, retry, or open the sign-in page.'),25000);
  return()=>clearTimeout(timer);
 },[loading,sourceUrl,attempt,site.name]);
 useEffect(()=>{
  const sub=BackHandler.addEventListener('hardwareBackPress',()=>{if(back)ref.current?.goBack();else onClose();return true;});
  return()=>sub.remove();
 },[back,onClose]);
 useEffect(()=>{
  if(!p.post&&!loading)ref.current?.injectJavaScript(filterScript);
 },[filterScript,p.post,loading]);
 useEffect(()=>{
  if(p.post||!filterCount||filtersApplied||loading)return;
  const timer=setTimeout(()=>setFailedKey(filterKey),5000);
  return()=>clearTimeout(timer);
 },[p.post,filterCount,filtersApplied,loading,filterKey]);
 const external=(next:string)=>{
  try{const u=new URL(next);if(u.protocol!=='https:'||u.username||u.password)return;}catch{return;}
  Alert.alert('Leave protected browsing?','This link opens outside Quietlane. Content filtering will not apply.',[
   {text:'Stay here',style:'cancel'},
   {text:'Open link',onPress:()=>{Linking.openURL(next).catch(()=>setError('No app could open this link.'));}},
  ]);
 };
 const allow=(next:string,isTopFrame?:boolean)=>{
  if(next==='about:blank')return true;
  if(isTopFrame===false){try{const u=new URL(next);return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443');}catch{return false;}}
  if(!isSafeUrl(next,p.id)){external(next);return false;}
  if(!p.post&&blockedRoute(next,p.id,p.rules,shared)){
   if(sharedFromMessages(url,next,p.id))navigate(next,next);else block();
   return false;
  }
  return true;
 };
 return <View style={{flex:1,backgroundColor:'#0D0E10'}}>
  <View style={{padding:8,flexDirection:'row',alignItems:'center',gap:10,borderBottomWidth:1,borderColor:'#292B30'}}>
   <BrowserButton name="close" onPress={onClose} label="Close browser"/>
   <View style={{flex:1}}>
    <Text style={{color:'white',fontSize:17,fontWeight:'600'}}>{site.name}</Text>
    <Text style={{color:p.post?'#F3DE76':filtersApplied&&filterCount?'#A8D8B9':'#A0A2AC',fontSize:12}}>{p.post?'Post Mode · '+p.remaining:!filterCount?'No filters enabled':filtersApplied?filterCount+' filters active':'Applying '+filterCount+' filters…'}</Text>
   </View>
   {p.id==='instagram'&&<Pressable accessibilityRole="button" accessibilityLabel="Open Instagram sign-in" onPress={()=>navigate(login)} style={{padding:10}}>
    <Text style={{color:'#B8E7CE',fontWeight:'600'}}>Sign in</Text>
   </Pressable>}
   <BrowserButton name="share-outline" onPress={()=>{Share.share({message:url}).catch(()=>setError('Could not share this page.'));}} label="Share current page"/>
  </View>
  {filtersFailed&&!error&&<View style={{padding:12,gap:8,backgroundColor:'#332C1D'}}>
   <Text style={{color:'#F3DE76'}}>Filters have not started. This page is not filtered yet.</Text>
   <Pressable accessibilityRole="button" accessibilityLabel="Retry content filters" onPress={()=>ref.current?.injectJavaScript(filterScript)}>
    <Text style={{color:'#B8E7CE'}}>Retry filters</Text>
   </Pressable>
  </View>}
  {loading&&!error&&<View style={{padding:12,flexDirection:'row',justifyContent:'center',gap:10}}>
   <ActivityIndicator color="#B8E7CE"/><Text style={{color:'#A0A2AC'}}>Connecting to {site.name}…</Text>
  </View>}
  {error?<View style={{flex:1,justifyContent:'center',padding:32,gap:18}}>
   <Text style={{color:'white',fontSize:24}}>Couldn’t load this page</Text>
   <Text selectable style={{color:'#A0A2AC'}}>{error}</Text>
   <Pressable accessibilityRole="button" onPress={()=>navigate(url,shared)} style={{paddingVertical:12}}>
    <Text style={{color:'#B8E7CE',fontSize:18}}>Try again</Text>
   </Pressable>
  </View>:
  <WebView<unknown> key={String(p.post)+(shared||'')+attempt} ref={ref} source={source}
   style={{flex:1,backgroundColor:'#FFFFFF'}} containerStyle={{flex:1}} originWhitelist={['*']}
   onShouldStartLoadWithRequest={r=>allow(r.url,r.isTopFrame)}
   onNavigationStateChange={n=>{
    if(!n.url||n.url==='about:blank')return;
    setBack(n.canGoBack);
    if(!isSafeUrl(n.url,p.id)){ref.current?.stopLoading();setError('Navigation outside this platform was stopped.');return;}
    if(!p.post&&blockedRoute(n.url,p.id,p.rules,shared)){ref.current?.stopLoading();block();navigate(site.messages);return;}
    setUrl(n.url);
   }}
   injectedJavaScriptForMainFrameOnly injectedJavaScript={filterScript}
   onMessage={e=>{
    if(e.nativeEvent.data.length>4096)return;
    try{
     const msg=JSON.parse(e.nativeEvent.data);
     if(msg.type==='ready'&&msg.config===configKey&&msg.token===filterKey)setFilterState(value=>value.key===modeKey&&value.revision===filterState.revision?{...value,active:true}:value);
     if(msg.type==='blocked')block();
     if(msg.type==='shared'&&typeof msg.url==='string'&&sharedFromMessages(url,msg.url,p.id))navigate(msg.url,msg.url);
    }catch{}
   }}
   onLoadStart={e=>{if(e.nativeEvent.url&&e.nativeEvent.url!=='about:blank'){setLoading(true);resetFilters();}}} onLoadEnd={e=>{if(e.nativeEvent.url&&e.nativeEvent.url!=='about:blank'){setLoading(false);}}}
   onError={e=>setError(e.nativeEvent.description)}
   onHttpError={e=>{if(e.nativeEvent.statusCode>=400)setError('The platform returned an error ('+e.nativeEvent.statusCode+'). Try again or use the sign-in page.');}}
   javaScriptEnabled domStorageEnabled sharedCookiesEnabled thirdPartyCookiesEnabled allowsInlineMediaPlayback allowsPictureInPictureMediaPlayback
   mediaPlaybackRequiresUserAction javaScriptCanOpenWindowsAutomatically={false} setSupportMultipleWindows={false}
   mediaCapturePermissionGrantType="deny" mixedContentMode="never" allowFileAccess={false} allowsBackForwardNavigationGestures
   onContentProcessDidTerminate={()=>ref.current?.reload()}/>}
  <View style={{flexDirection:'row',justifyContent:'space-around',padding:6,borderTopWidth:1,borderColor:'#292B30'}}>
   <BrowserButton name="arrow-back" onPress={()=>ref.current?.goBack()} label="Go back" disabled={!back}/>
   <BrowserButton name="chatbubble-outline" onPress={()=>navigate(site.messages)} label="Open messages or subscriptions"/>
   <BrowserButton name="reload" onPress={()=>{if(error)navigate(url,shared);else ref.current?.reload();}} label="Reload page"/>
  </View>
 </View>;
}
