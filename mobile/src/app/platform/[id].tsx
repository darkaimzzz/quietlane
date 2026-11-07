import React from 'react';
import App from '../../../App';
import {platforms} from '../../engine';
export function generateStaticParams(){return platforms.map(({id})=>({id}));}
export default function Screen(){return <App page="Controls"/>;}
