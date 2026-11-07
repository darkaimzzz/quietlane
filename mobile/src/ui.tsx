import React from 'react';
import {Pressable,StyleSheet,Text,View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';

import {platforms,PlatformId} from './engine';
export {default as Toggle} from './toggle';
export const C={bg:'#0D0E10',card:'#191B1F',line:'#2A2D32',white:'#F7F7F5',muted:'#969BA5',green:'#B8E7CE'};
export type IconName=React.ComponentProps<typeof Ionicons>['name'];
export function Icon({name,color=C.white,size=22}:{name:IconName;color?:string;size?:number}){return <Ionicons name={name} color={color} size={size}/>;}
export function Button({label,onPress,secondary=false}:{label:string;onPress:()=>void;secondary?:boolean}){return <Pressable accessibilityRole="button" onPress={onPress} style={({pressed})=>[s.button,{backgroundColor:secondary?C.card:C.green,opacity:pressed?.75:1}]}><Text style={{color:secondary?C.white:C.bg,fontSize:15,fontWeight:'700'}}>{label}</Text></Pressable>;}
export function Row({title,description,right}:{title:string;description?:string;right:React.ReactNode}){return <View style={s.row}><View style={{flex:1,gap:5}}><Text style={s.rowTitle}>{title}</Text>{description&&<Text style={s.small}>{description}</Text>}</View>{right}</View>;}
export function Section({label,children}:{label:string;children:React.ReactNode}){return <View style={{gap:12}}><Text style={s.label}>{label}</Text>{children}</View>;}
export function AppIcon({id,size=48}:{id:PlatformId;size?:number}){const p=platforms.find(p=>p.id===id)!;return <View style={{width:size,height:size,borderRadius:size*.3,backgroundColor:p.color+'16',alignItems:'center',justifyContent:'center'}}><Icon name={p.icon as IconName} size={size*.5} color={p.color}/></View>;}
export const s=StyleSheet.create({
 content:{padding:24,gap:24,paddingBottom:40,width:'100%',maxWidth:650,alignSelf:'center'},
 topbar:{paddingHorizontal:24,paddingVertical:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderBottomWidth:1,borderColor:'#202227'},
 eyebrow:{color:C.muted,fontSize:10,fontWeight:'600',letterSpacing:2},
 hero:{color:C.white,fontSize:42,lineHeight:48,fontWeight:'600',letterSpacing:-1.8},
 title:{color:C.white,fontSize:32,lineHeight:38,fontWeight:'600',letterSpacing:-1},
 body:{color:C.muted,fontSize:15,lineHeight:24},small:{color:C.muted,fontSize:12,lineHeight:18},
 label:{color:C.muted,fontSize:10,fontWeight:'600',letterSpacing:1.7},
 card:{backgroundColor:C.card,borderRadius:20,padding:20,borderWidth:1,borderColor:'#24272C'},
 row:{flexDirection:'row',alignItems:'center',gap:12,paddingVertical:13},
 rowTitle:{color:C.white,fontSize:15,fontWeight:'500',lineHeight:20},
 button:{paddingHorizontal:20,paddingVertical:17,borderRadius:14,alignItems:'center',justifyContent:'center',minHeight:50},
 protection:{flexDirection:'row',alignItems:'center',gap:14,padding:18,borderRadius:18,backgroundColor:'#1B2721',borderWidth:1,borderColor:'#2C4034'},
 stat:{color:C.white,fontSize:34,fontWeight:'500',letterSpacing:-1,fontVariant:['tabular-nums']},
 appRow:{flexDirection:'row',gap:14,alignItems:'center',paddingVertical:14},
 input:{backgroundColor:'#141619',color:C.white,borderWidth:1,borderColor:C.line,borderRadius:12,padding:15,fontSize:16,minHeight:50},
 tabs:{flexDirection:'row',borderTopWidth:1,borderColor:C.line,paddingTop:13,paddingBottom:8,backgroundColor:C.bg},
 tab:{flex:1,alignItems:'center',gap:6,minHeight:53,paddingVertical:2},
 chips:{flexDirection:'row',flexWrap:'wrap',gap:9},
 chip:{paddingHorizontal:15,paddingVertical:12,borderRadius:12,backgroundColor:C.card,borderWidth:1,borderColor:C.line},
 chipActive:{backgroundColor:C.green,borderColor:C.green},
 onboarding:{flex:1,padding:30,justifyContent:'space-evenly',gap:24,maxWidth:600,width:'100%',alignSelf:'center'},
});
