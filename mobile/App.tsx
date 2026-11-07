import React from 'react';
import {ActivityIndicator,Image,KeyboardAvoidingView,Platform,Pressable,ScrollView,Text,View} from 'react-native';
import {StatusBar} from 'expo-status-bar';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAppModel,Tab} from './src/model';
import {Home,Apps,Controls} from './src/social-screens';
import {Focus,Sleep} from './src/time-screens';
import {Settings} from './src/settings';
import Browser from './src/browser';
import {accessReason,platforms} from './src/engine';
import {C,s,Icon,IconName,Button} from './src/ui';
const tabs:[Tab,IconName][]=[['Home','grid-outline'],['Apps','apps-outline'],['Focus','scan-outline'],['Sleep','moon-outline'],['Settings','options-outline']];
type Page=Tab|'Browser'|'Controls';

export default function App({page='Home'}:{page?:Page}){
 const m=useAppModel(),insets=useSafeAreaInsets();
 const frame={flex:1,backgroundColor:C.bg,paddingTop:insets.top,paddingBottom:insets.bottom};
 if(!m.ready)return <View style={[s.onboarding,frame]}><StatusBar style="light"/><ActivityIndicator color={C.green}/><Text style={s.small}>{m.saveError||'Opening your quiet corner…'}</Text>{!!m.saveError&&<Button label="Retry" onPress={m.load}/>}</View>;
 const reason=m.browser?accessReason(m.state,m.browser.id,new Date(m.now)):null;
 const screen=page==='Home'?<Home m={m}/>:page==='Apps'?<Apps m={m}/>:page==='Focus'?<Focus m={m}/>:page==='Sleep'?<Sleep m={m}/>:<Settings m={m}/>;
 return <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={frame}>
  <StatusBar style="light"/>
  {!!m.saveError&&<Pressable accessibilityRole="button" accessibilityLabel="Retry saving settings" onPress={()=>m.setState(v=>({...v}))}><Text style={{color:'#FF9B9B',padding:12}}>{m.saveError}</Text></Pressable>}
  {!m.state.onboarded?<ScrollView contentContainerStyle={[s.onboarding,{flexGrow:1,flex:undefined}]}>
   <View style={{gap:24}}>
    <Image accessibilityLabel="Quietlane" source={require('./assets/icon.png')} style={{width:74,height:74,borderRadius:22}}/>
    <Text style={s.eyebrow}>QUIETLANE · LESS SCROLL. MORE LIFE.</Text>
    <Text style={s.hero}>Keep your{'\n'}attention.</Text>
    <Text style={s.body}>Stay connected to what matters.{'\n'}Leave the endless feed behind.</Text>
   </View>
   <View style={{gap:20}}>
    {([['shield-checkmark-outline','Filter distracting feeds'],['timer-outline','Focus and rest on your terms'],['lock-closed-outline','No Quietlane account required']] as [IconName,string][]).map(([icon,label])=><View key={label} style={{flexDirection:'row',gap:14,alignItems:'center'}}><Icon name={icon} color={C.green}/><Text style={[s.rowTitle,{flex:1}]}>{label}</Text></View>)}
    <Text style={s.small}>All local tools work without registration. Social websites may require their own sign-in. Filtering applies only inside Quietlane.</Text>
    <Button label="Get started" onPress={()=>m.patch({onboarded:true})}/>
   </View>
  </ScrollView>
  :page==='Browser'?m.browser?reason?<View style={s.onboarding}><Icon name="moon-outline" color={C.green} size={56}/><Text style={s.title}>Take a breath.</Text><Text style={s.body}>{reason}</Text><Button label="Back to Quietlane" onPress={m.closeBrowser}/></View>:<Browser {...m.browser} rules={m.state.apps[m.browser.id].rules} post={m.state.postApp===m.browser.id&&m.state.postUntil>m.now} remaining={m.clock(m.state.postUntil)} onClose={m.closeBrowser} onBlock={m.onBlock}/>:<View style={s.onboarding}><Text style={s.title}>Choose a platform</Text><Text style={s.body}>Open a platform from your social space to start browsing.</Text><Button label="Browse platforms" onPress={()=>m.setTab('Apps')}/></View>
  :page==='Controls'?<><View style={s.topbar}><Text style={s.rowTitle}>{platforms.find(p=>p.id===m.detail)?.name||'Platform'} controls</Text><Pressable accessibilityRole="button" accessibilityLabel="Close platform controls" onPress={()=>m.setDetail(null)} style={{padding:10}}><Icon name="close"/></Pressable></View><ScrollView contentContainerStyle={s.content}>{m.detail?<Controls m={m}/>:<><Text style={s.body}>This platform is unavailable.</Text><Button label="Browse platforms" onPress={()=>m.setTab('Apps')}/></>}</ScrollView></>
  :<>
   <View style={s.topbar}>
    <View style={{flexDirection:'row',gap:10,alignItems:'center'}}><Image source={require('./assets/icon.png')} style={{width:28,height:28,borderRadius:9}}/><Text style={{color:C.white,fontSize:21,fontWeight:'600',letterSpacing:-.6}}>Quietlane</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Help and information" onPress={()=>m.setTab('Settings')} style={{padding:10}}><Icon name="help-circle-outline" color={C.muted}/></Pressable>
   </View>
   <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">{screen}</ScrollView>
   <View style={s.tabs}>{tabs.map(([name,icon])=><Pressable accessibilityRole="tab" accessibilityState={{selected:page===name}} accessibilityLabel={name} key={name} onPress={()=>m.setTab(name)} style={s.tab}><Icon name={icon} color={page===name?C.green:'#8A909C'} size={22}/><Text style={{color:page===name?C.green:'#8A909C',fontSize:11,fontWeight:'500'}}>{name}</Text>{page===name&&<View style={{width:4,height:4,borderRadius:2,backgroundColor:C.green}}/>}</Pressable>)}</View>
  </>}
 </KeyboardAvoidingView>;
}
