import React from 'react';
import {View,Text,Pressable} from 'react-native';
import type {BrowserProps} from './browser';
export default function Browser(p:BrowserProps){return <View style={{flex:1,padding:30,justifyContent:'center',gap:20,backgroundColor:'#0D0E10'}}><Text style={{color:'white',fontSize:28}}>Open this on your phone</Text><Text style={{color:'#AAADB5',fontSize:16,lineHeight:25}}>Protected social browsing uses the native iPhone or Android WebView. The desktop preview lets you explore settings and timers, but cannot filter another website.</Text><Pressable onPress={p.onClose}><Text style={{color:'#B8E7CE',fontSize:18}}>Back to Quietlane</Text></Pressable></View>;}
