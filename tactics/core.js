// 《語嫣・永生戰棋》P0 戰鬥核心
// 規則：純函式、不碰畫面、不呼叫 Math.random 或系統時間；所有隨機都來自 seed + rngIndex。
(function(root){
'use strict';
const SCHEMA=1;

// ---------- 小工具 ----------
const clone=o=>JSON.parse(JSON.stringify(o));
const key=(x,y)=>x+','+y;
const manhattan=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];

// 可重現亂數：同一個 seed 與 index 永遠得到同一個數
function rngAt(seed,idx){let z=(seed>>>0)^Math.imul(idx+1,0x9E3779B1);z=Math.imul(z^(z>>>16),0x85EBCA6B);z=Math.imul(z^(z>>>13),0xC2B2AE35);z^=z>>>16;return (z>>>0)/4294967296;}
function roll(st){const v=rngAt(st.seed,st.rngIndex);st.rngIndex++;return v;}

// 狀態雜湊（FNV-1a，順序固定）
function hash(st){const s=JSON.stringify([st.round,st.phase,st.rngIndex,st.gate,st.units.map(u=>[u.id,u.x,u.y,u.hp,u.usedAct,u.guard]),st.tiles.join(''),st.result]);let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193);}return ('00000000'+(h>>>0).toString(16)).slice(-8);}

// ---------- 建立戰鬥 ----------
function makeUnit(D,def,id,faction,x,y){const b=D.units[def];if(!b)throw new Error('unknown unit '+def);return {id,def,name:b.name,glyph:b.glyph,troop:b.troop,faction,x,y,hp:b.hp,maxHp:b.hp,atk:b.atk,def:b.def,mag:b.mag,res:b.res,move:b.move,rmin:b.rmin,rmax:b.rmax,dmg:b.dmg,hit:b.hit||0,eva:b.eva||0,crit:5,commander:!!b.commander,usedAct:false,guard:false};}
function createBattle(D,missionId,seed){const M=D.missions[missionId];if(!M)throw new Error('unknown mission');
 const tiles=[];for(let y=0;y<M.h;y++)for(let x=0;x<M.w;x++)tiles.push(M.legend[M.map[y][x]]);
 const st={schemaVersion:SCHEMA,rulesetVersion:D.rulesetVersion,missionId,battleInstanceId:missionId+'_'+(seed>>>0).toString(16),seed:seed>>>0,rngIndex:0,round:1,phase:'PLAYER',w:M.w,h:M.h,tiles,
  gate:{...M.gate,maxHp:M.gate.hp},units:[],warn:[],pressure:false,result:null,eventLog:[],nextId:1};
 M.player.forEach(([d,x,y],i)=>st.units.push(makeUnit(D,d,'P'+(i+1),'P',x,y)));
 M.enemy.forEach(([d,x,y],i)=>st.units.push(makeUnit(D,d,'E'+(i+1),'E',x,y)));
 st.nextId=M.enemy.length+1;
 st.eventLog.push(...roundStart(D,st).map(e=>({...e,round:1})));return st;}

// ---------- 地圖查詢 ----------
const inside=(st,x,y)=>x>=0&&y>=0&&x<st.w&&y<st.h;
const tileAt=(st,x,y)=>st.tiles[y*st.w+x];
const T=(D,st,x,y)=>D.terrain[tileAt(st,x,y)];
const unitAt=(st,x,y)=>st.units.find(u=>u.hp>0&&u.x===x&&u.y===y)||null;
const alive=(st,f)=>st.units.filter(u=>u.hp>0&&(!f||u.faction===f));
const isGate=(st,x,y)=>st.gate&&st.gate.hp>0&&st.gate.x===x&&st.gate.y===y;
function heightAt(D,st,x,y){return T(D,st,x,y).height||0;}

// 可到達的格子（Dijkstra；不能穿過任何單位；進入敵方相鄰格就停下＝控制區）
function reachable(D,st,u){const dist=new Map();const start=key(u.x,u.y);dist.set(start,0);const q=[[0,u.x,u.y]];const out=new Map([[start,0]]);
 const enemyAdj=(x,y)=>DIRS.some(([dx,dy])=>{const v=unitAt(st,x+dx,y+dy);return v&&v.faction!==u.faction;});
 while(q.length){q.sort((a,b)=>a[0]-b[0]||a[2]-b[2]||a[1]-b[1]);const [c,x,y]=q.shift();if(c>(dist.get(key(x,y))??Infinity))continue;
  if(!(x===u.x&&y===u.y)&&enemyAdj(x,y))continue; // 控制區：進來就停
  for(const [dx,dy] of DIRS){const nx=x+dx,ny=y+dy;if(!inside(st,nx,ny))continue;const t=T(D,st,nx,ny);if(!t.pass)continue;if(unitAt(st,nx,ny))continue;
   const nc=c+t.cost;if(nc>u.move)continue;const k=key(nx,ny);if(nc<(dist.get(k)??Infinity)){dist.set(k,nc);out.set(k,nc);q.push([nc,nx,ny]);}}}
 return out;}

// 視線：Bresenham，中間經過城牆／城門就擋住
function los(D,st,a,b){let x0=a.x,y0=a.y;const x1=b.x,y1=b.y;const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let err=dx+dy;
 while(true){if(x0===x1&&y0===y1)return true;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx;}if(e2<=dx){err+=dx;y0+=sy;}if(x0===x1&&y0===y1)return true;if(T(D,st,x0,y0).blockLos)return false;}}

function rangeOf(D,st,u,from){let rmax=u.rmax;if(u.rmax>=2&&heightAt(D,st,from.x,from.y)>=1)rmax+=1;return [u.rmin,rmax];}
// 從某格可以打到的目標
function targetsFrom(D,st,u,from){const [a,b]=rangeOf(D,st,u,from);const out=[];
 for(const v of alive(st)){if(v.faction===u.faction)continue;const d=manhattan(from,v);if(d<a||d>b)continue;if(d>1&&!los(D,st,from,v))continue;out.push(v.id);}
 if(u.faction==='E'&&st.gate.hp>0){const g=st.gate;const d=manhattan(from,g);if(d>=a&&d<=b){if(d===1||losToGate(D,st,from,g))out.push('GATE');}}
 return out;}
function losToGate(D,st,a,g){// 城門本身擋視線，所以只檢查到門之前
 let x0=a.x,y0=a.y;const dx=Math.abs(g.x-x0),dy=-Math.abs(g.y-y0),sx=x0<g.x?1:-1,sy=y0<g.y?1:-1;let err=dx+dy;while(true){const e2=2*err;if(e2>=dy){err+=dy;x0+=sx;}if(e2<=dx){err+=dx;y0+=sy;}if(x0===g.x&&y0===g.y)return true;if(T(D,st,x0,y0).blockLos)return false;}}

// ---------- 傷害 ----------
function counterMult(D,att,defTroop){if(!defTroop)return 1;if((D.counters[att.troop]||[]).includes(defTroop))return 1.2;if((D.counters[defTroop]||[]).includes(att.troop))return .85;return 1;}
function terrainDef(D,st,x,y){return Math.max(-.5,Math.min(.5,T(D,st,x,y).def||0));}
function preview(D,st,att,attFrom,tid){const tgt=tid==='GATE'?null:st.units.find(v=>v.id===tid);const isMag=att.dmg==='MAGICAL';
 const cm=counterMult(D,att,tgt&&tgt.troop);const raw=Math.floor((isMag?att.mag:att.atk)*cm);let guard;
 if(tgt){const base=isMag?tgt.res:tgt.def;guard=Math.floor(base*(1+terrainDef(D,st,tgt.x,tgt.y)+(tgt.guard?.3:0))*.5);}else guard=Math.floor((isMag?st.gate.res:st.gate.def)*.5);
 const dmg=Math.max(1,raw-guard);const hit=tgt?Math.max(.2,Math.min(1,.9+(att.hit-tgt.eva)/100)):1;
 let counter=null;if(tgt){const tgtHpAfter=tgt.hp-dmg;const [a,b]=rangeOf(D,st,tgt,tgt);const d=manhattan(attFrom,tgt);if(d>=a&&d<=b&&(d===1||los(D,st,tgt,attFrom))){counter={possible:true,ifSurvives:tgtHpAfter>0};
  const tm=tgt.dmg==='MAGICAL';const cm2=counterMult(D,tgt,att.troop);const raw2=Math.floor((tm?tgt.mag:tgt.atk)*cm2);const g2=Math.floor((tm?att.res:att.def)*(1+terrainDef(D,st,attFrom.x,attFrom.y)+(att.guard?.3:0))*.5);counter.dmg=Math.max(1,raw2-g2);counter.hit=Math.max(.2,Math.min(1,.9+(tgt.hit-att.eva)/100));}}
 return {dmg,hit,crit:.05,cm,counter,kill:tgt?dmg>=tgt.hp:dmg>=st.gate.hp};}

function strike(D,st,att,attFrom,tid,ev,isCounter){const p=preview(D,st,att,attFrom,tid);const r1=roll(st),r2=roll(st);
 const tgt=tid==='GATE'?null:st.units.find(v=>v.id===tid);const tname=tgt?tgt.name:'城門';
 if(r1>=p.hit){ev.push({t:'miss',a:att.id,d:tid,counter:!!isCounter,txt:att.name+(isCounter?' 反擊':' 攻擊')+' '+tname+'：落空'});return {hit:false};}
 let d=p.dmg;const crit=r2<p.crit;if(crit)d=Math.floor(d*1.5);
 if(tgt){tgt.hp=Math.max(0,tgt.hp-d);}else{st.gate.hp=Math.max(0,st.gate.hp-d);}
 ev.push({t:'hit',a:att.id,d:tid,dmg:d,crit,counter:!!isCounter,cm:p.cm,txt:att.name+(isCounter?' 反擊':' 攻擊')+' '+tname+'：'+(crit?'暴擊 ':'')+d+(p.cm>1?'（克制）':p.cm<1?'（被克）':'')});
 if(tgt&&tgt.hp<=0)ev.push({t:'down',d:tid,txt:tgt.name+' 倒下了'});if(!tgt&&st.gate.hp<=0)ev.push({t:'gate',txt:'城門被打破了'});
 return {hit:true,dmg:d};}

// ---------- 行動驗證與結算 ----------
function validate(D,st,a){if(st.result)return 'battle_over';
 if(a.type==='END_PHASE')return st.phase==='PLAYER'?null:'not_player_phase';
 if(a.type!=='ACT')return 'bad_type';const u=st.units.find(v=>v.id===a.actorId);if(!u||u.hp<=0)return 'no_actor';
 const want=st.phase==='PLAYER'?'P':'E';if(u.faction!==want)return 'not_your_unit';if(u.usedAct)return 'already_acted';
 const to=a.to||{x:u.x,y:u.y};if(!inside(st,to.x,to.y))return 'out_of_map';const R=reachable(D,st,u);if(!R.has(key(to.x,to.y)))return 'unreachable';
 if(!['ATTACK','WAIT','GUARD'].includes(a.act))return 'bad_act';
 if(a.act==='ATTACK'){const save={x:u.x,y:u.y};u.x=to.x;u.y=to.y;const ts=targetsFrom(D,st,u,to);u.x=save.x;u.y=save.y;if(!ts.includes(a.target))return 'bad_target';}
 return null;}

function apply(D,st0,a){const err=validate(D,st0,a);if(err)return {ok:false,error:err,state:st0,events:[]};const st=clone(st0);const ev=[];
 if(a.type==='END_PHASE'){runEnemyPhase(D,st,ev);}
 else doAct(D,st,a,ev);
 st.eventLog.push(...ev.map(e=>({...e,round:st.round})));if(st.eventLog.length>400)st.eventLog=st.eventLog.slice(-400);
 return {ok:true,state:st,events:ev};}

function doAct(D,st,a,ev){const u=st.units.find(v=>v.id===a.actorId);const to=a.to||{x:u.x,y:u.y};
 if(to.x!==u.x||to.y!==u.y){ev.push({t:'move',a:u.id,from:{x:u.x,y:u.y},to:{...to},txt:u.name+' 移動到 ('+to.x+','+to.y+')'});u.x=to.x;u.y=to.y;}
 if(a.act==='ATTACK'){const r=strike(D,st,u,to,a.target,ev,false);const tgt=a.target==='GATE'?null:st.units.find(v=>v.id===a.target);
  if(tgt&&tgt.hp>0){const p=preview(D,st,u,to,a.target);if(p.counter&&p.counter.possible){strike(D,st,tgt,{x:tgt.x,y:tgt.y},u.id,ev,true);}}}
 else if(a.act==='GUARD'){u.guard=true;ev.push({t:'guard',a:u.id,txt:u.name+' 守備（防禦 +30%，到下次行動前）'});}
 else ev.push({t:'wait',a:u.id,txt:u.name+' 待機'});
 u.usedAct=true;checkEnd(D,st,ev);}

// ---------- 回合流程 ----------
function M_(D,st){return D.missions[st.missionId];}
function roundStart(D,st,ev=[]){const M=M_(D,st);st.warn=[];
 for(const e of M.events.filter(e=>e.round===st.round)){
  if(e.terrain)for(const [x,y,t] of e.terrain)st.tiles[y*st.w+x]=t;
  if(e.spawn)for(const [d,x,y] of e.spawn){const p=freeNear(D,st,x,y);if(p){const u=makeUnit(D,d,'E'+(st.nextId++),'E',p.x,p.y);st.units.push(u);ev.push({t:'spawn',a:u.id,txt:u.name+' 進場'});}}
  if(e.warn)st.warn=e.warn.map(([x,y])=>({x,y}));if(e.pressure)st.pressure=true;
  if(e.say)ev.push({t:'say',txt:'【第 '+st.round+' 回合】'+e.say});}
 for(const u of alive(st,'P')){u.usedAct=false;u.guard=false;}
 st.phase='PLAYER';return ev;}
function freeNear(D,st,x,y){for(let r=0;r<6;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.abs(dx)+Math.abs(dy)!==r)continue;const nx=x+dx,ny=y+dy;if(inside(st,nx,ny)&&T(D,st,nx,ny).pass&&!unitAt(st,nx,ny))return {x:nx,y:ny};}return null;}

function runEnemyPhase(D,st,ev){st.phase='ENEMY';for(const u of alive(st,'E')){u.usedAct=false;u.guard=false;}
 const order=alive(st,'E').map(u=>u.id);st.frames=[];
 for(const id of order){if(st.result)break;const u=st.units.find(v=>v.id===id);if(!u||u.hp<=0)continue;const a=plan(D,st,u);const err=validate(D,st,a);
  if(err){ev.push({t:'ai_error',a:id,txt:'AI 行動不合法：'+err});u.usedAct=true;continue;}const sub=[];doAct(D,st,a,sub);ev.push(...sub);st.frames.push({actor:id,units:st.units.map(v=>[v.id,v.x,v.y,v.hp]),gate:st.gate.hp,events:sub});}
 if(!st.result)roundEnd(D,st,ev);}
function roundEnd(D,st,ev){const M=M_(D,st);
 if(st.round>=M.roundLimit&&st.gate.hp>0&&alive(st,'P').length){st.result={win:true,reason:'守住城門到第 '+M.roundLimit+' 回合結束'};ev.push({t:'end',txt:'勝利：'+st.result.reason});st.phase='RESULT';return;}
 st.round++;roundStart(D,st,ev);checkEnd(D,st,ev);}
function checkEnd(D,st,ev){if(st.result)return;const lose=st.gate.hp<=0?'城門被打破':!alive(st,'P').length?'我方英雄全滅':null;
 const cmdDown=st.units.some(u=>u.commander&&u.hp<=0);
 if(lose){st.result={win:false,reason:lose};}else if(cmdDown){st.result={win:true,reason:'擊倒敵軍指揮官，城門還在'};}
 if(st.result){st.phase='RESULT';ev.push({t:'end',txt:(st.result.win?'勝利：':'失敗：')+st.result.reason});}}
// 同一個結算點同時勝敗：先檢查失敗，所以失敗優先。

// ---------- AI（敵我共用規則，只能送出合法行動） ----------
function distMap(D,st,targets){const dm=new Map();const q=[];for(const t of targets){dm.set(key(t.x,t.y),0);q.push([0,t.x,t.y]);}
 while(q.length){q.sort((a,b)=>a[0]-b[0]);const [c,x,y]=q.shift();if(c>dm.get(key(x,y)))continue;for(const [dx,dy] of DIRS){const nx=x+dx,ny=y+dy;if(!inside(st,nx,ny))continue;const t=T(D,st,nx,ny);if(!t.pass)continue;const nc=c+t.cost;if(nc<(dm.get(key(nx,ny))??Infinity)){dm.set(key(nx,ny),nc);q.push([nc,nx,ny]);}}}return dm;}
function plan(D,st,u){const R=reachable(D,st,u);const cand=[...R.keys()].map(k=>{const [x,y]=k.split(',').map(Number);return {x,y};}).sort((a,b)=>a.y-b.y||a.x-b.x);
 let best=null;const consider=(s,a)=>{if(!best||s>best.s+1e-9)best={s,a};};
 for(const c of cand){const sx=u.x,sy=u.y;u.x=c.x;u.y=c.y;const ts=targetsFrom(D,st,u,c);
  for(const tid of ts){const p=preview(D,st,u,c,tid);const tgt=tid==='GATE'?null:st.units.find(v=>v.id===tid);const exp=p.dmg*p.hit;
   const killV=p.kill?(tgt&&tgt.commander?14:10):0;const objV=tgt?(exp/tgt.maxHp)*6+(tgt.troop==='MAGE'||tgt.troop==='ARCHER'?1:0)+(tgt.commander?3:0):(u.faction==='E'?(st.pressure?7:4)*(exp/30):0);
   const terr=terrainDef(D,st,c.x,c.y)*10;const cnt=(p.cm-1)*10;const risk=p.counter&&!p.kill?(p.counter.dmg*p.counter.hit/Math.max(1,u.hp))*10:0;
   consider(killV*4+objV*3+terr*2+cnt*2-risk*3,{type:'ACT',actorId:u.id,to:c,act:'ATTACK',target:tid});}
  u.x=sx;u.y=sy;}
 if(best&&best.s>-6)return best.a;
 // 沒有好的攻擊：往目標靠近
 const foes=alive(st).filter(v=>v.faction!==u.faction);let goals;
 if(u.faction==='E'&&(u.troop!=='ARCHER'&&u.troop!=='MAGE'||st.pressure)){const g=st.gate;goals=[{x:g.x,y:g.y-1},...foes];}else goals=foes;
 if(!goals.length)return {type:'ACT',actorId:u.id,to:{x:u.x,y:u.y},act:'WAIT'};
 const dm=distMap(D,st,goals);let pick=null;
 for(const c of cand){const d=dm.get(key(c.x,c.y))??999;const s=-d+terrainDef(D,st,c.x,c.y)*2;if(!pick||s>pick.s+1e-9)pick={s,c};}
 return {type:'ACT',actorId:u.id,to:pick.c,act:'WAIT'};}

// ---------- 重播 ----------
function replay(D,missionId,seed,actions){let st=createBattle(D,missionId,seed);for(const a of actions){const r=apply(D,st,a);if(!r.ok)throw new Error('replay failed at '+JSON.stringify(a)+': '+r.error);st=r.state;}return st;}

const API={SCHEMA,createBattle,apply,validate,reachable,targetsFrom,preview,plan,replay,hash,rngAt,los,key,manhattan,unitAt,tileAt,alive,rangeOf,counterMult,clone};
if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.TACTICS=API;
})(this);
