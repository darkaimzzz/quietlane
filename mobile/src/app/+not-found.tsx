import React from 'react';
import {View,Text} from 'react-native';
import {Link} from 'expo-router';
import {C,s} from '../ui';
export default function Missing(){return <View style={[s.onboarding,{backgroundColor:C.bg}]}><Text style={s.title}>This page isn’t here.</Text><Link href="/" style={{color:C.green,fontSize:18}}>Go to Quietlane</Link></View>;}
