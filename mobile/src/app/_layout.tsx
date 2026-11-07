import {Head} from 'expo-router/head';
import React from 'react';
import {Stack} from 'expo-router/stack';
import {View,Text} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {ModelProvider} from '../model';
import {Confirmation} from '../confirmation';
import {Button,C,s} from '../ui';
import type {ErrorBoundaryProps} from 'expo-router';
export function ErrorBoundary({retry}:ErrorBoundaryProps){
 return <View style={[s.onboarding,{backgroundColor:C.bg}]}><Text style={s.title}>Let’s try that again.</Text><Text style={s.body}>Quietlane couldn’t open this screen. Your saved preferences are still on this device.</Text><Button label="Try again" onPress={retry}/></View>;
}
export default function RootLayout(){
 return <SafeAreaProvider><ModelProvider>
  <Head><title>Quietlane</title><meta name="description" content="Account-free tools for focused social browsing, focus sessions and sleep routines."/></Head><Stack screenOptions={{headerShown:false,contentStyle:{backgroundColor:C.bg}}}>
   <Stack.Screen name="platform/[id]" options={{presentation:'modal'}}/>
  </Stack>
  <Confirmation/>
 </ModelProvider></SafeAreaProvider>;
}
