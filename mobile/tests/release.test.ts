import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=(path:string)=>fs.readFileSync(new URL(path,import.meta.url));
const app=JSON.parse(read('../app.json').toString()).expo;
const pkg=JSON.parse(read('../package.json').toString());
const listing=JSON.parse(read('../../release/store-listing.json').toString());

test('release identities and versions agree across native config and listing',()=>{
 assert.equal(app.name,'Quietlane');
 assert.equal(app.ios.bundleIdentifier,app.android.package);
 assert.equal(app.version,pkg.version);
 assert.equal(app.version,listing.version);
 assert.ok(Number(app.ios.buildNumber)>0);
 assert.ok(app.android.versionCode>0);
 assert.equal(pkg.main,'expo-router/entry');
});
test('the iOS app icon is a 1024px opaque RGB PNG',()=>{
 const png=read('../assets/icon.png');
 assert.equal(png.subarray(1,4).toString(),'PNG');
 assert.equal(png.readUInt32BE(16),1024);
 assert.equal(png.readUInt32BE(20),1024);
 assert.equal(png[25],2);
});
test('store copy fits title limits and transport/media defaults remain restricted',()=>{
 assert.ok(listing.ios.title.length<=30);
 assert.ok(listing.ios.subtitle.length<=30);
 assert.ok(listing.ios.keywords.length<=100);
 assert.ok(listing.android.title.length<=30);
 assert.ok(listing.android.shortDescription.length<=80);
 assert.match(listing.supportEmail,/^[^@\s]+@[^@\s]+\.[^@\s]+$/);
 assert.equal(app.ios.infoPlist.NSAppTransportSecurity.NSAllowsArbitraryLoads,false);
 for(const permission of ['CAMERA','RECORD_AUDIO','SYSTEM_ALERT_WINDOW'])assert.ok(app.android.blockedPermissions.includes('android.permission.'+permission));
 assert.equal(app.android.allowBackup,false);
});


test('public support and privacy files do not collide with app routes',()=>{
 for(const path of Object.values(listing.publicPaths) as string[]){
  assert.match(path,/^\/[a-z-]+\.html$/);
  assert.ok(fs.existsSync(new URL('../public'+path,import.meta.url)));
  const route='../src/app'+path.replace(/\.html$/,'.tsx');
  assert.equal(fs.existsSync(new URL(route,import.meta.url)),false,'Public HTML must not shadow a Router screen');
 }
});
