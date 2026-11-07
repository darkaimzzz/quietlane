import React from 'react';
import {Modal,View,Text} from 'react-native';
import {useAppModel} from './model';
import {s,Button} from './ui';
export function Confirmation(){
 const m=useAppModel();
 return <Modal visible={!!m.confirm} transparent animationType="fade" onRequestClose={()=>m.setConfirm(null)}>
  <View accessibilityViewIsModal style={{flex:1,backgroundColor:'#000B',justifyContent:'center',padding:28}}>
   <View style={[s.card,{gap:20}]}>
    <Text accessibilityRole="header" style={[s.title,{fontSize:24}]}>{m.confirm?.title}</Text>
    <Text style={s.body}>{m.confirm?.body}</Text>
    <Button label="Continue" onPress={()=>{const action=m.confirm?.action;m.setConfirm(null);action?.();}}/>
    <Button label="Cancel" secondary onPress={()=>m.setConfirm(null)}/>
   </View>
  </View>
 </Modal>;
}
