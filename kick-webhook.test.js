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
