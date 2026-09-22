import express from "express";
import crypto from "crypto";
import {WebSocketServer} from "ws";
import http from "http";
const app=express(), server=http.createServer(app), wss=new WebSocketServer({server,path:"/live"});
const PORT=process.env.PORT||10000, CLIENT_ID=process.env.KICK_CLIENT_ID||"", CLIENT_SECRET=process.env.KICK_CLIENT_SECRET||"", BASE=(process.env.PUBLIC_URL||"").replace(/\/$/,""), OWNER=(process.env.KICK_CHANNEL||"lestarwolf").toLowerCase().replace(/[^a-z0-9]/g,"");
const clients=new Set(); wss.on("connection",w=>{clients.add(w);w.on("close",()=>clients.delete(w))});
const send=o=>{const s=JSON.stringify(o);for(const w of clients)if(w.readyState===1)w.send(s)};
const BOSS_WINDOW=30*60*1000,BOSS_DURATION=90*1000;let streamLive=false,bossTimers=[],bossWindowTimer=0,bossActiveUntil=0;
const clearBossSchedule=()=>{for(const timer of bossTimers)clearTimeout(timer);bossTimers=[];clearTimeout(bossWindowTimer);bossWindowTimer=0};
function launchBoss(){if(!streamLive||Date.now()<bossActiveUntil)return;bossActiveUntil=Date.now()+BOSS_DURATION;send({type:"boss",hp:500,duration:BOSS_DURATION})}
function scheduleBossWindow(){clearBossSchedule();if(!streamLive)return;const first=(4+Math.random()*9)*60*1000,second=(17+Math.random()*9)*60*1000;bossTimers=[setTimeout(launchBoss,first),setTimeout(launchBoss,second)];bossWindowTimer=setTimeout(scheduleBossWindow,BOSS_WINDOW)}
function setStreamLive(live){live=!!live;if(live===streamLive)return;streamLive=live;if(live)scheduleBossWindow();else{clearBossSchedule();bossActiveUntil=0;send({type:"bossStop"})}}
app.use("/overlay",express.static("public",{etag:true,maxAge:"1h"}));
app.get("/",(_,r)=>r.send('<h2>LESTARWOLF Live Pack V3</h2><p><a href="/setup">Connect Kick</a> | <a href="/test">Test wolf</a> | <a href="/overlay/?demo=1&v3test=1">V3 demo</a> | <a href="/overlay/?bosstest=1">Boss demo</a></p>'));
app.get("/test",(_,r)=>{send({type:"chat",username:"TestWolf"+Math.floor(Math.random()*99)});r.send("V3 test wolf sent. Check the overlay.")});
let pkce={};
const b64=b=>b.toString("base64url");
app.get("/setup",(req,res)=>{if(!CLIENT_ID||!CLIENT_SECRET||!BASE)return res.status(500).send("Host variables are not configured yet.");
 const verifier=b64(crypto.randomBytes(48)),challenge=b64(crypto.createHash("sha256").update(verifier).digest()),state=b64(crypto.randomBytes(18));pkce={verifier,state};
 const q=new URLSearchParams({response_type:"code",client_id:CLIENT_ID,redirect_uri:BASE+"/callback",scope:"events:subscribe user:read channel:read kicks:read",code_challenge:challenge,code_challenge_method:"S256",state});
 res.redirect("https://id.kick.com/oauth/authorize?"+q)});
app.get("/callback",async(req,res)=>{try{if(req.query.state!==pkce.state)throw Error("OAuth state mismatch");
 const body=new URLSearchParams({grant_type:"authorization_code",client_id:CLIENT_ID,client_secret:CLIENT_SECRET,code:String(req.query.code||""),redirect_uri:BASE+"/callback",code_verifier:pkce.verifier});
 const tr=await fetch("https://id.kick.com/oauth/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body});const tok=await tr.json();if(!tr.ok)throw Error(JSON.stringify(tok));
 const sr=await fetch("https://api.kick.com/public/v1/events/subscriptions",{method:"POST",headers:{Authorization:"Bearer "+tok.access_token,"Content-Type":"application/json"},body:JSON.stringify({method:"webhook",events:[{name:"chat.message.sent",version:1},{name:"channel.subscription.gifts",version:1},{name:"channel.subscription.new",version:1},{name:"channel.subscription.renewal",version:1},{name:"kicks.gifted",version:1},{name:"livestream.status.updated",version:1}]})});
 res.send("<h2>Kick connected.</h2><p>OBS URL: <b>"+BASE+"/overlay/</b></p><pre>"+(await sr.text()).replace(/[<>&]/g,"")+"</pre>")}catch(e){res.status(500).send("Setup failed: "+e.message)}});
app.post("/webhook",express.raw({type:"*/*"}),(req,res)=>{try{const type=req.get("Kick-Event-Type"),d=JSON.parse(req.body.toString()),avatarOf=u=>{const p=u?.profile_picture||u?.profile_picture_url||"";return typeof p==="string"?p:typeof p?.url==="string"?p.url:""};if(type==="livestream.status.updated"){setStreamLive(d.is_live)}else if(type==="chat.message.sent"){setStreamLive(true);const s=d.sender||{},message=d.content||"",command=String(message).trim().toLowerCase().split(/\s+/)[0],senderKey=String(s.username||"").toLowerCase().replace(/[^a-z0-9]/g,"");if(senderKey===OWNER&&(command==="!testboss"||command==="!boss")){bossActiveUntil=Date.now()+60*1000;send({type:"boss",hp:180,duration:60000,test:true})}if(s.username)send({type:"chat",username:s.username,avatar:avatarOf(s),message})}else if(type==="kicks.gifted"&&Number(d.gift?.amount||0)>=10){send({type:"moon",username:d.sender?.username||"PACK MEMBER",avatar:avatarOf(d.sender),detail:`${Number(d.gift.amount)} KICKS GIFTED`})}else if(type==="channel.subscription.gifts"){const count=Array.isArray(d.giftees)?d.giftees.length:1;send({type:"moon",username:d.gifter?.username||"ANONYMOUS PACK MEMBER",avatar:avatarOf(d.gifter),detail:`${count} GIFTED SUB${count===1?"":"S"}`})}else if(type==="channel.subscription.new"||type==="channel.subscription.renewal"){const who=d.subscriber||{};send({type:"moon",username:who.username||"PACK MEMBER",avatar:avatarOf(who),detail:type==="channel.subscription.new"?"NEW SUB":"SUB RENEWAL"})}res.sendStatus(200)}catch{res.sendStatus(400)}});
server.listen(PORT,"0.0.0.0",()=>console.log("Live Pack V3 running on 0.0.0.0:"+PORT));
