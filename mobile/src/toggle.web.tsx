import React from 'react';
import {Switch} from 'react-native';
import type {ToggleProps} from './toggle';
export default function Toggle({label,value,onChange}:ToggleProps){
 return <Switch accessibilityLabel={label} value={value} onValueChange={onChange}
  thumbColor="#FFFFFF" trackColor={{true:'#527D68',false:'#666C77'}}/>;
}
