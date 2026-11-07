import React from 'react';
import {View} from 'react-native';
import {Host,Switch} from '@expo/ui';
export type ToggleProps={label:string;value:boolean;onChange:(value:boolean)=>void};
export default function Toggle({label,value,onChange}:ToggleProps){
 return <View accessible accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{checked:value}}
  onAccessibilityTap={()=>onChange(!value)} accessibilityActions={[{name:'activate',label:'Toggle'}]}
  onAccessibilityAction={event=>{if(event.nativeEvent.actionName==='activate')onChange(!value);}}
  style={{minWidth:54,minHeight:44,justifyContent:'center'}}>
  <Host colorScheme="dark" seedColor="#B8E7CE" matchContents><Switch value={value} onValueChange={onChange}/></Host>
 </View>;
}
