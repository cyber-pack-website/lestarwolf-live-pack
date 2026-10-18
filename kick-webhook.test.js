import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {createKickWebhookVerifier} from "./kick-webhook.js";

const pair=()=>crypto.generateKeyPairSync("rsa",{modulusLength:2048});
function delivery(privateKey,raw=Buffer.from('{"content":"!howl 🐺"}')){
  const id="message-id",timestamp="2026-10-03T22:00:00Z";
  const signature=crypto.sign("RSA-SHA256",Buffer.concat([Buffer.from(`${id}.${timestamp}.`),raw]),privateKey).toString("base64");
  return{id,timestamp,signature,raw};
}
const response=key=>({ok:true,json:async()=>({data:{public_key:key.export({type:"spki",format:"pem"})}})});

test("accepts signed raw UTF-8 chat and rejects altered or unsigned deliveries",async()=>{
  const keys=pair();let calls=0;
  const verifier=createKickWebhookVerifier({fetchImpl:async url=>{assert.equal(url,"https://api.kick.com/public/v1/public-key");calls++;return response(keys.publicKey)}});
  const event=delivery(keys.privateKey);
  assert.equal(await verifier.verify(event),true);
  assert.equal(await verifier.verify({...event,raw:Buffer.from('{"content":"forged"}')}),false);
  assert.equal(await verifier.verify({...event,id:"altered"}),false);
  assert.equal(await verifier.verify({...event,signature:""}),false);
  assert.equal(calls,1);
});

test("refreshes a rotated key after signature failure and coalesces concurrent requests",async()=>{
  const first=pair(),second=pair();let current=first,time=0,calls=0;
  const verifier=createKickWebhookVerifier({now:()=>time,fetchImpl:async()=>{calls++;return response(current.publicKey)}});
  assert.equal(await verifier.verify(delivery(first.privateKey)),true);
  current=second;time=61000;
  assert.deepEqual(await Promise.all([verifier.verify(delivery(second.privateKey)),verifier.verify(delivery(second.privateKey))]),[true,true]);
  assert.equal(calls,2);
  assert.equal(await verifier.verify(delivery(first.privateKey)),false);
});

test("keeps validating with cached key during outages and fails closed without a trusted key",async()=>{
  const keys=pair();let time=0,down=false;
  const fetchImpl=async()=>{if(down)return{ok:false,status:503};return response(keys.publicKey)};
  const verifier=createKickWebhookVerifier({now:()=>time,fetchImpl});
  assert.equal(await verifier.verify(delivery(keys.privateKey)),true);
  down=true;time=7*60*60*1000;
  assert.equal(await verifier.verify(delivery(keys.privateKey)),true);
  const empty=createKickWebhookVerifier({fetchImpl});
  await assert.rejects(empty.verify(delivery(keys.privateKey)),/key unavailable/);
});

// Exercise the actual scheduler with a controlled clock and captured deliveries.
const {readFile}=await import('node:fs/promises');
const {runInNewContext}=await import('node:vm');
const serverSource=await readFile(new URL('./server.js',import.meta.url),'utf8');
function bossHarness(){
  let now=1_000_000;
  const timers=[],events=[];
  const context={runtimes:new Map(),normalize:s=>String(s||'').toLowerCase().replace(/[^a-z0-9]/g,''),
    Date:{now:()=>now},Math,send:(key,event)=>events.push({key,...event}),
    setTimeout:(fn,delay)=>{const timer={fn,delay};timers.push(timer);return timer},clearTimeout:()=>{}};
  runInNewContext(serverSource.match(/^const CHAT_ACTIVITY_WINDOW=.*$/m)[0]+'\n'+serverSource.match(/^const BOSS_WINDOW=.*$/m)[0]+'\n'+serverSource.slice(serverSource.indexOf('function runtime('),serverSource.indexOf('async function exchangeCode(')),context);
  return {...context,events,timers,advance:ms=>{now+=ms},launch:key=>{context.runtime(key).live=true;context.scheduleBoss(key);timers.at(-3).fn()}};
}
test('automatic bear requires two distinct active people in its channel',()=>{
  const h=bossHarness();
  h.launch('a');assert.equal(h.events.length,0);
  h.recordChatter('a',{user_id:1,username:'Streamer'});
  h.recordChatter('a',{user_id:1,username:'Streamer'});
  h.launch('a');assert.equal(h.events.length,0);
  h.recordChatter('a',{user_id:2,username:'Viewer'});
  h.launch('a');assert.equal(h.events.length,1);assert.equal(h.events[0].type,'boss');
  h.launch('b');assert.equal(h.events.length,1);
});
test('bots and stale chatters cannot unlock a bear; fresh chat restores eligibility',()=>{
  const h=bossHarness();
  h.recordChatter('a',{user_id:1,username:'Streamer'});
  for(const username of ['LumiaStream','KickBot','KickLit','Kicklet'])h.recordChatter('a',{username});
  h.launch('a');assert.equal(h.events.length,0);
  h.advance(15*60*1000);
  h.recordChatter('a',{user_id:2,username:'Viewer'});
  h.launch('a');assert.equal(h.events.length,0);
  h.recordChatter('a',{user_id:1,username:'Streamer'});
  h.launch('a');assert.equal(h.events.length,1);
});
test('bear eligibility expires at spawn time and clears when the stream ends',()=>{
  const h=bossHarness();
  for(const user_id of [1,2])h.recordChatter('a',{user_id,username:'Viewer'+user_id});
  h.advance(15*60*1000);h.launch('a');assert.equal(h.events.length,0);
  for(const user_id of [1,2])h.recordChatter('a',{user_id,username:'Viewer'+user_id});
  h.setLive('a',false);assert.equal(h.activeChatterCount('a'),0);
  h.events.length=0;h.launch('a');assert.equal(h.events.length,0);
});
test('two people do not bypass live status or overlapping event guards',()=>{
  const h=bossHarness();
  for(const user_id of [1,2])h.recordChatter('a',{user_id,username:'Viewer'+user_id});
  h.runtime('a').live=true;h.scheduleBoss('a');const launch=h.timers.at(-3).fn;
  h.runtime('a').live=false;launch();assert.equal(h.events.length,0);
  h.runtime('a').live=true;h.runtime('a').squirrelUntil=2_000_000;
  launch();assert.equal(h.events.length,0);
  h.runtime('a').squirrelUntil=0;launch();assert.equal(h.events.length,1);
});
