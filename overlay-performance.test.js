import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext,Script} from 'node:vm';
const html=await readFile(new URL('./public/index.html',import.meta.url),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const line=name=>script.match(new RegExp('    function '+name+'\\(.*','m'))[0];
function wolf(key,extra={}){return {key,x:10,y:20,joined:true,moving:true,until:0,el:{style:{setProperty(){}}},...extra}}
test('overlay compiles and movement uses a transform without changing layout positions',()=>{
  new Script(script);
  const h={};runInNewContext(line('renderWolfPosition'),h);
  const w=wolf('a',{x:123.456,y:45.678});h.renderWolfPosition(w);
  assert.equal(w.el.style.transform,'translate3d(123.46px,-45.68px,0) scale(var(--scale))');
  assert.equal(w.el.style.left,undefined);assert.equal(w.el.style.bottom,undefined);
  assert.match(html,/left:0;bottom:0;opacity:0;will-change:transform,opacity/);
});
test('unchanged nameplate lanes produce no extra style writes',()=>{
  let writes=0;const wolves=new Map([['a',wolf('a')],['b',wolf('b',{x:600})]]);
  for(const w of wolves.values())w.el.style.setProperty=()=>writes++;
  const h={wolves};runInNewContext(line('layoutNameplates'),h);
  h.layoutNameplates();assert.equal(writes,2);
  h.layoutNameplates();assert.equal(writes,2);
  wolves.get('b').x=20;h.layoutNameplates();assert.equal(writes,3);
});
test('join howls preserve entering wolves and busy fighters and coalesce arrivals',()=>{
  const entering=wolf('entering',{joined:false}),fighter=wolf('fighter',{duelMatch:'duel'}),idle=wolf('idle');
  const wolves=new Map([entering,fighter,idle].map(w=>[w.key,w]));
  let sounds=0,announcements=0,now=1000;const timers=[];
  const h={wolves,performance:{now:()=>now},playHowl:()=>sounds++,announcement:()=>announcements++,setTimeout:fn=>timers.push(fn),setState:(w,state)=>w.state=state,rand:()=>0};
  runInNewContext(script.slice(script.indexOf('    let lastPackHowl='),script.indexOf('    function interactionTarget(')),h);
  h.packHowl(idle);for(const fn of timers.splice(0))fn();
  assert.equal(entering.moving,true);assert.equal(fighter.moving,true);assert.equal(idle.state,'howl');
  now+=100;h.packHowl(entering);assert.equal(sounds,1);assert.equal(announcements,2);
  now+=3400;idle.until=0;h.packHowl(idle);idle.duelMatch='started-during-delay';
  idle.moving=true;for(const fn of timers.splice(0))fn();assert.equal(idle.moving,true);
});
test('rank rendering skips unchanged visuals and updates when XP or equipment changes',()=>{
  let writes=0;
  const p={xp:100,lastDig:0,cosmetic:'',cosmeticName:'',hunterSkin:-1,shopOwned:[],shopEffects:[],equippedPlate:'',equippedEffect:''};
  const h={profileFor:()=>p,profileStats:()=>({rank:0,level:3,color:'#f00',title:'Pup'}),cleanMoonLoot:()=>[],cleanShopEffects:()=>{},levelXp:l=>(l-1)**2*25,clamp:(x,a,b)=>Math.max(a,Math.min(b,x)),palettes:['none'],hash:()=>0};
  runInNewContext(line('updateWolfRank'),h);
  const w=wolf('a');w.el={style:{setProperty:()=>writes++},dataset:{},classList:{remove(){},add(){}},querySelector:()=>null};
  h.updateWolfRank(w);const initial=writes;assert.ok(initial>0);
  h.updateWolfRank(w);assert.equal(writes,initial);
  p.xp+=5;h.updateWolfRank(w);assert.equal(writes,initial*2);
  p.shopOwned=['frost'];p.equippedPlate='frost';h.updateWolfRank(w);assert.equal(writes,initial*3);
});
