// 《語嫣・永生戰棋》戰鬥核心（P1-A：兵隊、七職業技能、軍陣）
// 規則：純函式、不碰畫面、不呼叫 Math.random 或系統時間；所有隨機都來自 seed + rngIndex。
(function(root){
'use strict';
const SCHEMA=2;

// ---------- 小工具 ----------
const clone=o=>JSON.parse(JSON.stringify(o));
const key=(x,y)=>x+','+y;
const manhattan=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const DIRS=[[0,-1],[1,0],[0,1],[-1,0]];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function rngAt(seed,idx){let z=(seed>>>0)^Math.imul(idx+1,0x9E3779B1);z=Math.imul(z^(z>>>16),0x85EBCA6B);z=Math.imul(z^(z>>>13),0xC2B2AE35);z^=z>>>16;return (z>>>0)/4294967296;}
function roll(st){const v=rngAt(st.seed,st.rngIndex);st.rngIndex++;return v;}
function hash(st){const s=JSON.stringify([st.round,st.phase,st.rngIndex,st.gate,st.units.map(u=>[u.id,u.x,u.y,u.hp,u.sol,u.usedAct,u.guard,u.form,u.st,u.cd]),st.zones,st.tiles.join(''),st.result]);let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193);}return ('00000000'+(h>>>0).toString(16)).slice(-8);}

// ---------- 建立戰鬥 ----------
function makeUnit(D,def,id,faction,x,y){const b=D.units[def];if(!b)throw new Error('unknown unit '+def);const n=b.soldiers||0,hp1=b.hpPer||10;
 return {id,def,name:b.name,glyph:b.glyph,troop:b.troop,faction,x,y,hp:b.hp,maxHp:b.hp,atk:b.atk,def:b.def,mag:b.mag,res:b.res,move:b.move,rmin:b.rmin,rmax:b.rmax,dmg:b.dmg,hit:b.hit||0,eva:b.eva||0,crit:5,commander:!!b.commander,
  sol:n*hp1,solMax:n*hp1,hpPer:hp1,skill:b.skill||null,cd:{},form:'NONE',st:{root:0,mark:0,gs:0},usedAct:false,guard:false};}
function createBattle(D,missionId,seed,opts){opts=opts||{};const M=D.missions[missionId];if(!M)throw new Error('unknown mission');
 const team=(opts.team&&opts.team.length?opts.team:D.defaultTeam).slice(0,D.deploySlots.length);for(const t of team)if(!D.units[t]||t[0]!=='P')throw new Error('bad team '+t);
 const tiles=[];for(let y=0;y<M.h;y++)for(let x=0;x<M.w;x++)tiles.push(M.legend[M.map[y][x]]);
 const st={schemaVersion:SCHEMA,rulesetVersion:D.rulesetVersion,missionId,battleInstanceId:missionId+'_'+(seed>>>0).toString(16),seed:seed>>>0,rngIndex:0,round:1,phase:'PLAYER',w:M.w,h:M.h,tiles,team:team.slice(),
  gate:{...M.gate,maxHp:M.gate.hp},units:[],zones:[],warn:[],pressure:false,result:null,eventLog:[],nextId:1};
 team.forEach((d,i)=>{const [x,y]=D.deploySlots[i];st.units.push(makeUnit(D,d,'P'+(i+1),'P',x,y));});
 M.enemy.forEach(([d,x,y],i)=>st.units.push(makeUnit(D,d,'E'+(i+1),'E',x,y)));
 st.nextId=M.enemy.length+1;
 st.eventLog.push(...roundStart(D,st).map(e=>({...e,round:1})));return st;}

// ---------- 地圖查詢 ----------
const inside=(st,x,y)=>x>=0&&y>=0&&x<st.w&&y<st.h;
const tileAt=(st,x,y)=>st.tiles[y*st.w+x];
const T=(D,st,x,y)=>D.terrain[tileAt(st,x,y)];
const unitAt=(st,x,y)=>st.units.find(u=>u.hp>0&&u.x===x&&u.y===y)||null;
const alive=(st,f)=>st.units.filter(u=>u.hp>0&&(!f||u.faction===f));
const soldiers=u=>Math.ceil(Math.max(0,u.sol)/u.hpPer);
const solMaxN=u=>Math.round(u.solMax/u.hpPer);
function heightAt(D,st,x,y){return T(D,st,x,y).height||0;}
function inZone(st,x,y,faction){return st.zones.some(z=>z.faction===faction&&Math.abs(z.x-x)<=1&&Math.abs(z.y-y)<=1);}

// 可到達的格子（Dijkstra；不能穿過任何單位；進入敵方相鄰格就停下＝控制區）
function moveOf(D,u,opts){let m=u.move+((opts&&opts.extra)||0);const F=D.forms[u.form]||{};if(F.move)m+=F.move;return Math.max(0,m);}
function reachable(D,st,u,opts){opts=opts||{};const start=key(u.x,u.y);const out=new Map([[start,0]]);if(u.st&&u.st.root>0)return out;
 const mv=moveOf(D,u,opts);const dist=new Map([[start,0]]);const q=[[0,u.x,u.y]];
 const enemyAdj=(x,y)=>DIRS.some(([dx,dy])=>{const v=unitAt(st,x+dx,y+dy);return v&&v.faction!==u.faction;});
 while(q.length){q.sort((a,b)=>a[0]-b[0]||a[2]-b[2]||a[1]-b[1]);const [c,x,y]=q.shift();if(c>(dist.get(key(x,y))??Infinity))continue;
  if(!opts.ignoreZoc&&!(x===u.x&&y===u.y)&&enemyAdj(x,y))continue;
  for(const [dx,dy] of DIRS){const nx=x+dx,ny=y+dy;if(!inside(st,nx,ny))continue;const t=T(D,st,nx,ny);if(!t.pass)continue;if(unitAt(st,nx,ny))continue;
   const nc=c+t.cost;if(nc>mv)continue;const k=key(nx,ny);if(nc<(dist.get(k)??Infinity)){dist.set(k,nc);out.set(k,nc);q.push([nc,nx,ny]);}}}
 return out;}

function los(D,st,a,b){let x0=a.x,y0=a.y;const x1=b.x,y1=b.y;const dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1;let err=dx+dy;
 while(true){if(x0===x1&&y0===y1)return true;const e2=2*err;if(e2>=dy){err+=dy;x0+=sx;}if(e2<=dx){err+=dx;y0+=sy;}if(x0===x1&&y0===y1)return true;if(T(D,st,x0,y0).blockLos)return false;}}
function losToGate(D,st,a,g){let x0=a.x,y0=a.y;const dx=Math.abs(g.x-x0),dy=-Math.abs(g.y-y0),sx=x0<g.x?1:-1,sy=y0<g.y?1:-1;let err=dx+dy;while(true){const e2=2*err;if(e2>=dy){err+=dy;x0+=sx;}if(e2<=dx){err+=dx;y0+=sy;}if(x0===g.x&&y0===g.y)return true;if(T(D,st,x0,y0).blockLos)return false;}}

function rangeOf(D,st,u,from,rng){let [a,b]=rng||[u.rmin,u.rmax];if(b>=2&&heightAt(D,st,from.x,from.y)>=1)b+=1;return [a,b];}
function targetsFrom(D,st,u,from,rng,noGate){const [a,b]=rangeOf(D,st,u,from,rng);const out=[];
 for(const v of alive(st)){if(v.faction===u.faction)continue;const d=manhattan(from,v);if(d<a||d>b)continue;if(d>1&&!los(D,st,from,v))continue;out.push(v.id);}
 if(!noGate&&u.faction==='E'&&st.gate.hp>0){const g=st.gate;const d=manhattan(from,g);if(d>=a&&d<=b){if(d===1||losToGate(D,st,from,g))out.push('GATE');}}
 return out;}
function withPos(u,p,fn){const sx=u.x,sy=u.y;u.x=p.x;u.y=p.y;try{return fn();}finally{u.x=sx;u.y=sy;}}

// ---------- 傷害 ----------
function counterMult(D,att,defTroop){if(!defTroop)return 1;if((D.counters[att.troop]||[]).includes(defTroop))return 1.2;if((D.counters[defTroop]||[]).includes(att.troop))return .85;return 1;}
function terrainDef(D,st,x,y){return clamp(T(D,st,x,y).def||0,-.5,.5);}
function solBonus(D,u){return 1+(D.soldierBonus||0)*(u.solMax?u.sol/u.solMax:0);}
// o: {mult, counter(是反擊), charge(移動消耗), flank, area}
function calc(D,st,att,from,tid,o){o=o||{};const tgt=tid==='GATE'?null:st.units.find(v=>v.id===tid);const isMag=att.dmg==='MAGICAL';const notes=[];
 const cm=counterMult(D,att,tgt&&tgt.troop);let situ=0;const AF=D.forms[att.form]||{};const TF=tgt?(D.forms[tgt.form]||{}):{};
 if(inZone(st,from.x,from.y,att.faction)){situ+=.1;notes.push('燈界 +10%');}
 if(!o.counter&&AF.atkOut){situ+=AF.atkOut;notes.push('突擊陣 +15%');}
 if(o.counter&&AF.counterVsCav&&tgt&&tgt.troop==='CAVALRY'){situ+=AF.counterVsCav;notes.push('長槍陣反擊騎兵 +20%');}
 if(!o.counter&&att.troop==='CAVALRY'&&(o.charge||0)>=D.charge.minCost&&tileAt(st,from.x,from.y)!=='SHALLOW_WATER'&&tgt&&!TF.noCharge){situ+=D.charge.bonus;notes.push('衝鋒 +20%');}
 if(tgt&&tgt.st.mark>0){situ+=D.skills.markShot.markAmp;notes.push('弱點標記 +20%');}
 if(o.flank&&tgt&&alive(st,att.faction).some(v=>v.id!==att.id&&manhattan(v,tgt)===1)){situ+=o.flank;notes.push('背襲 +20%');}
 const raw=Math.floor((isMag?att.mag:att.atk)*solBonus(D,att)*cm*(o.mult||1)*(1+situ));
 let guard;if(tgt){let db=terrainDef(D,st,tgt.x,tgt.y)+(tgt.guard?.3:0)+(inZone(st,tgt.x,tgt.y,tgt.faction)?.1:0)+(tgt.st.gs>0?D.skills.guardStance.defUp:0);db=clamp(db,-.5,.5);
  guard=Math.floor((isMag?tgt.res:tgt.def)*solBonus(D,tgt)*(1+db)*.5);}else guard=Math.floor((isMag?st.gate.res:st.gate.def)*.5);
 let dmg=Math.max(1,raw-guard);let inMod=0;
 if(tgt){if(!isMag&&TF.physIn)inMod+=TF.physIn;if(o.area&&TF.areaIn)inMod+=TF.areaIn;if(o.counter&&TF.counterIn)inMod+=TF.counterIn;}
 if(inMod)dmg=Math.max(1,Math.floor(dmg*(1+inMod)));
 const hit=tgt?clamp(.9+(att.hit-tgt.eva)/100,.2,1):1;
 return {dmg,hit,crit:.05,cm,notes,tgt};}
// 攻擊預估（含反擊）
function preview(D,st,att,from,tid,o){o=o||{};const p=withPos(att,from,()=>calc(D,st,att,from,tid,o));const tgt=p.tgt;let counter=null;
 if(tgt&&!o.noCounter){const [a,b]=rangeOf(D,st,tgt,tgt);const d=manhattan(from,tgt);if(d>=a&&d<=b&&(d===1||los(D,st,tgt,from))){const c=withPos(att,from,()=>calc(D,st,tgt,{x:tgt.x,y:tgt.y},att.id,{counter:true}));counter={possible:true,dmg:c.dmg,hit:c.hit,notes:c.notes};}}
 return {dmg:p.dmg,hit:p.hit,crit:p.crit,cm:p.cm,notes:p.notes,counter,kill:tgt?killCheck(tgt,p.dmg):p.dmg>=st.gate.hp};}
function killCheck(t,d){return splitPreview(t,d).hp<=0;}
function splitPreview(t,d){let s=0,h=d;if(t.sol>0){s=Math.floor(d*.7);h=d-s;if(s>t.sol){h+=Math.floor((s-t.sol)*.5);s=t.sol;}}return {sol:t.sol-s,hp:t.hp-h,s,h};}

// 套用傷害：先處理守護分攤，再分士兵與英雄
function dealTo(D,st,tgt,d,ev,src){if(tgt.hp<=0)return;
 const guardian=alive(st,tgt.faction).find(g=>g.id!==tgt.id&&g.st.gs>0&&manhattan(g,tgt)===1);
 if(guardian&&!src.noShare){const share=D.skills.guardStance.share*((D.forms[guardian.form]||{}).guardShare||1);const r=Math.floor(d*share);if(r>0){d-=r;ev.push({t:'share',a:guardian.id,d:tgt.id,dmg:r,txt:guardian.name+' 替 '+tgt.name+' 擋下 '+r});applySplit(D,st,guardian,r,ev);}}
 applySplit(D,st,tgt,d,ev);}
function applySplit(D,st,t,d,ev){const p=splitPreview(t,d);const n0=soldiers(t);t.sol=Math.max(0,p.sol);t.hp=Math.max(0,p.hp);const lost=n0-soldiers(t);
 if(lost>0)ev.push({t:'soldier',d:t.id,n:lost,txt:t.name+' 損失士兵 '+lost+' 名（剩 '+soldiers(t)+'）'});
 if(t.hp<=0){t.sol=0;ev.push({t:'down',d:t.id,txt:t.name+' 倒下了，兵隊潰散'});}}

function strike(D,st,att,from,tid,ev,o){o=o||{};const p=withPos(att,from,()=>calc(D,st,att,from,tid,o));const r1=roll(st),r2=roll(st);const tgt=p.tgt;const tname=tgt?tgt.name:'城門';const verb=o.label||(o.counter?'反擊':'攻擊');
 if(r1>=p.hit){ev.push({t:'miss',a:att.id,d:tid,counter:!!o.counter,txt:att.name+' '+verb+' '+tname+'：落空'});return {hit:false};}
 let d=p.dmg;const crit=r2<p.crit;if(crit)d=Math.floor(d*1.5);
 ev.push({t:'hit',a:att.id,d:tid,dmg:d,crit,counter:!!o.counter,cm:p.cm,txt:att.name+' '+verb+' '+tname+'：'+(crit?'暴擊 ':'')+d+(p.cm>1?'（克制）':p.cm<1?'（被克）':'')+(p.notes.length?'〔'+p.notes.join('、')+'〕':'')});
 if(tgt)dealTo(D,st,tgt,d,ev,o);else{st.gate.hp=Math.max(0,st.gate.hp-d);if(st.gate.hp<=0)ev.push({t:'gate',txt:'城門被打破了'});}
 return {hit:true,dmg:d};}

// ---------- 行動驗證 ----------
const ACTS=['ATTACK','WAIT','GUARD','SKILL','FORM'];
function moveOpts(D,u,a){if(a.act==='SKILL'&&u.skill==='shadowStep'){const S=D.skills.shadowStep;return {extra:S.extraMove,ignoreZoc:true};}return {};}
function skillTargets(D,st,u,to){const S=D.skills[u.skill];if(!S)return [];
 return withPos(u,to,()=>{
  if(S.kind==='attack')return targetsFrom(D,st,u,to,S.range,true);
  if(S.kind==='dash')return targetsFrom(D,st,u,to,null,true);
  if(S.kind==='ally')return alive(st,u.faction).filter(v=>{const d=manhattan(to,v);return d>=S.range[0]&&d<=S.range[1];}).map(v=>v.id);
  if(S.kind==='zone'){const out=[];for(let y=0;y<st.h;y++)for(let x=0;x<st.w;x++){const d=Math.abs(x-to.x)+Math.abs(y-to.y);if(d>=S.range[0]&&d<=S.range[1])out.push(key(x,y));}return out;}
  return [];});}
function validate(D,st,a){if(st.result)return 'battle_over';
 if(a.type==='END_PHASE')return st.phase==='PLAYER'?null:'not_player_phase';
 if(a.type!=='ACT')return 'bad_type';const u=st.units.find(v=>v.id===a.actorId);if(!u||u.hp<=0)return 'no_actor';
 const want=st.phase==='PLAYER'?'P':'E';if(u.faction!==want)return 'not_your_unit';if(u.usedAct)return 'already_acted';
 if(!ACTS.includes(a.act))return 'bad_act';
 const to=a.to||{x:u.x,y:u.y};if(!inside(st,to.x,to.y))return 'out_of_map';const R=reachable(D,st,u,moveOpts(D,u,a));if(!R.has(key(to.x,to.y)))return 'unreachable';
 if(a.act==='ATTACK'){const ts=withPos(u,to,()=>targetsFrom(D,st,u,to));if(!ts.includes(a.target))return 'bad_target';}
 if(a.act==='FORM'){if(!D.forms[a.form])return 'bad_form';if(a.form===u.form)return 'same_form';}
 if(a.act==='SKILL'){if(!u.skill||a.skill!==u.skill)return 'no_skill';if((u.cd[u.skill]||0)>0)return 'cooldown';const S=D.skills[u.skill];
  if(S.kind==='attack'||S.kind==='ally'){if(!skillTargets(D,st,u,to).includes(a.target))return 'bad_target';}
  if(S.kind==='dash'&&a.target!=null){if(!skillTargets(D,st,u,to).includes(a.target))return 'bad_target';}
  if(S.kind==='zone'){if(!a.at||!skillTargets(D,st,u,to).includes(key(a.at.x,a.at.y)))return 'bad_target';}}
 return null;}

function apply(D,st0,a){const err=validate(D,st0,a);if(err)return {ok:false,error:err,state:st0,events:[]};const st=clone(st0);const ev=[];
 if(a.type==='END_PHASE'){phaseEnd(st,'P');runEnemyPhase(D,st,ev);}else doAct(D,st,a,ev);
 st.eventLog.push(...ev.map(e=>({...e,round:st.round})));if(st.eventLog.length>500)st.eventLog=st.eventLog.slice(-500);
 return {ok:true,state:st,events:ev};}

// ---------- 結算 ----------
function doAct(D,st,a,ev){const u=st.units.find(v=>v.id===a.actorId);const to=a.to||{x:u.x,y:u.y};const cost=reachable(D,st,u,moveOpts(D,u,a)).get(key(to.x,to.y))||0;
 if(to.x!==u.x||to.y!==u.y){ev.push({t:'move',a:u.id,from:{x:u.x,y:u.y},to:{...to},txt:u.name+' 移動到 ('+to.x+','+to.y+')'+(a.act==='SKILL'&&u.skill==='shadowStep'?'〔影徑〕':'')});u.x=to.x;u.y=to.y;}
 const attackWithCounter=(tid,o)=>{const r=strike(D,st,u,to,tid,ev,o);const tgt=tid==='GATE'?null:st.units.find(v=>v.id===tid);
  if(!o.noCounter&&tgt&&tgt.hp>0&&u.hp>0){const [ra,rb]=rangeOf(D,st,tgt,tgt);const d=manhattan(to,tgt);if(d>=ra&&d<=rb&&(d===1||los(D,st,tgt,to))&&!(tgt.st&&tgt.st.stun))strike(D,st,tgt,{x:tgt.x,y:tgt.y},u.id,ev,{counter:true});}return r;};
 if(a.act==='ATTACK'){attackWithCounter(a.target,{charge:cost});}
 else if(a.act==='GUARD'){u.guard=true;ev.push({t:'guard',a:u.id,txt:u.name+' 守備（防禦 +30%，到下次行動前）'});}
 else if(a.act==='FORM'){u.form=a.form;ev.push({t:'form',a:u.id,txt:u.name+' 改成'+D.forms[a.form].name+'：'+D.forms[a.form].desc});}
 else if(a.act==='SKILL'){const S=D.skills[u.skill];u.cd[u.skill]=S.cd;
  if(u.skill==='guardStance'){u.st.gs=S.dur;ev.push({t:'skill',a:u.id,txt:u.name+'「'+S.name+'」：相鄰隊友的傷害 40% 由它承受，持續 '+S.dur+' 回合'});}
  else if(u.skill==='pierce'){const t=st.units.find(v=>v.id===a.target);const dx=t.x-to.x,dy=t.y-to.y;const behind=unitAt(st,t.x+dx,t.y+dy);
   ev.push({t:'skill',a:u.id,txt:u.name+'「'+S.name+'」'});strike(D,st,u,to,t.id,ev,{mult:S.mult,noCounter:true,area:true,label:'突刺'});
   if(behind&&behind.faction!==u.faction&&behind.hp>0)strike(D,st,u,to,behind.id,ev,{mult:S.mult,noCounter:true,area:true,label:'貫穿'});}
  else if(u.skill==='markShot'){ev.push({t:'skill',a:u.id,txt:u.name+'「'+S.name+'」'});const r=strike(D,st,u,to,a.target,ev,{mult:S.mult,label:'標記射擊'});const t=st.units.find(v=>v.id===a.target);
   if(r.hit&&t.hp>0){t.st.mark=Math.max(t.st.mark,S.mark);ev.push({t:'status',d:t.id,txt:t.name+' 被標記 '+S.mark+' 回合（受到傷害 +20%）'});}
   if(t.hp>0&&u.hp>0){const [ra,rb]=rangeOf(D,st,t,t);const d=manhattan(to,t);if(d>=ra&&d<=rb&&(d===1||los(D,st,t,to)))strike(D,st,t,{x:t.x,y:t.y},u.id,ev,{counter:true});}}
  else if(u.skill==='bind'){ev.push({t:'skill',a:u.id,txt:u.name+'「'+S.name+'」'});const r=strike(D,st,u,to,a.target,ev,{mult:S.mult,noCounter:true,label:'束縛'});const t=st.units.find(v=>v.id===a.target);
   if(r.hit&&t.hp>0){t.st.root=Math.max(t.st.root,S.root);ev.push({t:'status',d:t.id,txt:t.name+' 被束縛：下一個回合不能移動'});}}
  else if(u.skill==='mend'){const t=st.units.find(v=>v.id===a.target);const h=Math.min(t.maxHp-t.hp,Math.round(t.maxHp*S.heal));const s0=soldiers(t);t.hp+=h;t.sol=Math.min(t.solMax,t.sol+Math.round(t.solMax*S.solHeal));const cl=t.st.root>0||t.st.mark>0;t.st.root=0;t.st.mark=0;
   ev.push({t:'heal',a:u.id,d:t.id,txt:u.name+'「'+S.name+'」：'+t.name+' 回復 '+h+'，士兵 '+s0+'→'+soldiers(t)+(cl?'，解除束縛與標記':'')});}
  else if(u.skill==='lampZone'){st.zones=st.zones.filter(z=>z.owner!==u.id);st.zones.push({x:a.at.x,y:a.at.y,faction:u.faction,owner:u.id,until:st.round+S.dur-1});ev.push({t:'zone',a:u.id,txt:u.name+'「'+S.name+'」：以 ('+a.at.x+','+a.at.y+') 為中心 3×3，持續 '+S.dur+' 回合'});}
  else if(u.skill==='shadowStep'){ev.push({t:'skill',a:u.id,txt:u.name+'「'+S.name+'」'});if(a.target!=null)attackWithCounter(a.target,{flank:S.flank});}}
 else ev.push({t:'wait',a:u.id,txt:u.name+' 待機'});
 u.usedAct=true;checkEnd(D,st,ev);}

// ---------- 回合流程 ----------
function M_(D,st){return D.missions[st.missionId];}
function phaseStart(st,f){for(const u of alive(st,f)){u.usedAct=false;u.guard=false;for(const k in u.cd)if(u.cd[k]>0)u.cd[k]--;}}
function phaseEnd(st,f){for(const u of alive(st,f))if(u.st.root>0)u.st.root--;}
function roundStart(D,st,ev=[]){const M=M_(D,st);st.warn=[];
 for(const e of M.events.filter(e=>e.round===st.round)){
  if(e.terrain)for(const [x,y,t] of e.terrain){if(inZone(st,x,y,'P')){ev.push({t:'stabilize',txt:'燈界穩住了 ('+x+','+y+')：這一格沒有被異變改寫。'});continue;}st.tiles[y*st.w+x]=t;}
  if(e.spawn)for(const [d,x,y] of e.spawn){const p=freeNear(D,st,x,y);if(p){const u=makeUnit(D,d,'E'+(st.nextId++),'E',p.x,p.y);st.units.push(u);ev.push({t:'spawn',a:u.id,txt:u.name+' 進場'});}}
  if(e.warn)st.warn=e.warn.map(([x,y])=>({x,y}));if(e.pressure)st.pressure=true;
  if(e.say)ev.push({t:'say',txt:'【第 '+st.round+' 回合】'+e.say});}
 phaseStart(st,'P');st.phase='PLAYER';return ev;}
function freeNear(D,st,x,y){for(let r=0;r<6;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.abs(dx)+Math.abs(dy)!==r)continue;const nx=x+dx,ny=y+dy;if(inside(st,nx,ny)&&T(D,st,nx,ny).pass&&!unitAt(st,nx,ny))return {x:nx,y:ny};}return null;}
function runEnemyPhase(D,st,ev){st.phase='ENEMY';phaseStart(st,'E');
 const order=alive(st,'E').map(u=>u.id);st.frames=[];
 for(const id of order){if(st.result)break;const u=st.units.find(v=>v.id===id);if(!u||u.hp<=0)continue;const a=plan(D,st,u);const err=validate(D,st,a);
  if(err){ev.push({t:'ai_error',a:id,txt:'AI 行動不合法：'+err});u.usedAct=true;continue;}const sub=[];doAct(D,st,a,sub);ev.push(...sub);
  st.frames.push({actor:id,units:st.units.map(v=>[v.id,v.x,v.y,v.hp,v.sol]),gate:st.gate.hp,events:sub});}
 phaseEnd(st,'E');if(!st.result)roundEnd(D,st,ev);}
function roundEnd(D,st,ev){const M=M_(D,st);
 for(const u of st.units){if(u.st.mark>0)u.st.mark--;if(u.st.gs>0)u.st.gs--;}
 st.zones=st.zones.filter(z=>z.until>st.round);
 if(st.round>=M.roundLimit&&st.gate.hp>0&&alive(st,'P').length){st.result={win:true,reason:'守住城門到第 '+M.roundLimit+' 回合結束'};ev.push({t:'end',txt:'勝利：'+st.result.reason});st.phase='RESULT';return;}
 st.round++;roundStart(D,st,ev);checkEnd(D,st,ev);}
function checkEnd(D,st,ev){if(st.result)return;const lose=st.gate.hp<=0?'城門被打破':!alive(st,'P').length?'我方全滅':null;
 const cmdDown=st.units.some(u=>u.commander&&u.hp<=0);
 if(lose){st.result={win:false,reason:lose};}else if(cmdDown){st.result={win:true,reason:'擊倒敵軍指揮官，城門還在'};}
 if(st.result){st.phase='RESULT';ev.push({t:'end',txt:(st.result.win?'勝利：':'失敗：')+st.result.reason});}}

// ---------- AI（敵我共用；只送出合法行動） ----------
function distMap(D,st,targets){const dm=new Map();const q=[];for(const t of targets){dm.set(key(t.x,t.y),0);q.push([0,t.x,t.y]);}
 while(q.length){q.sort((a,b)=>a[0]-b[0]);const [c,x,y]=q.shift();if(c>dm.get(key(x,y)))continue;for(const [dx,dy] of DIRS){const nx=x+dx,ny=y+dy;if(!inside(st,nx,ny))continue;const t=T(D,st,nx,ny);if(!t.pass)continue;const nc=c+t.cost;if(nc<(dm.get(key(nx,ny))??Infinity)){dm.set(key(nx,ny),nc);q.push([nc,nx,ny]);}}}return dm;}
const effHp=t=>t.hp+t.sol;
function scoreHit(D,st,u,c,tid,p,extra){const tgt=tid==='GATE'?null:st.units.find(v=>v.id===tid);const exp=p.dmg*p.hit;
 const killV=p.kill?(tgt&&tgt.commander?14:10):0;
 const objV=tgt?(exp/Math.max(1,effHp(tgt)))*6+(tgt.troop==='MAGE'||tgt.troop==='ARCHER'||tgt.troop==='CLERIC'?1:0)+(tgt.commander?3:0):(u.faction==='E'?(st.pressure?7:4)*(exp/30):0);
 const terr=terrainDef(D,st,c.x,c.y)*10;const cnt=(p.cm-1)*10;const risk=p.counter&&!p.kill?(p.counter.dmg*p.counter.hit/Math.max(1,effHp(u)))*10:0;
 return killV*4+objV*3+terr*2+cnt*2-risk*3+(extra||0);}
function plan(D,st,u,style){const opts=[];const add=(s,a)=>opts.push({s,a});
 const R=reachable(D,st,u);const cand=[...R.keys()].map(k=>{const [x,y]=k.split(',').map(Number);return {x,y,c:R.get(k)};}).sort((a,b)=>a.y-b.y||a.x-b.x);
 const foes=alive(st).filter(v=>v.faction!==u.faction);const allies=alive(st,u.faction);
 const near=foes.length?Math.min(...foes.map(f=>manhattan(f,u))):99;
 const hold=style==='hold'&&u.faction==='P';
 const posPen=c=>hold&&c.y<6?-(6-c.y)*1.5:0;
 const S=u.skill&&!(u.cd[u.skill]>0)?D.skills[u.skill]:null;
 for(const c of cand){const pos={x:c.x,y:c.y};
  for(const tid of withPos(u,pos,()=>targetsFrom(D,st,u,pos))){const p=preview(D,st,u,pos,tid,{charge:c.c});add(scoreHit(D,st,u,pos,tid,p)+posPen(c),{type:'ACT',actorId:u.id,to:pos,act:'ATTACK',target:tid});}
  if(S){
   if(S.kind==='attack'){for(const tid of skillTargets(D,st,u,pos)){const tgt=st.units.find(v=>v.id===tid);const p=preview(D,st,u,pos,tid,{mult:S.mult,noCounter:!!S.noCounter,area:!!S.area});let extra=1;
     if(u.skill==='pierce'){const b=unitAt(st,tgt.x+(tgt.x-pos.x),tgt.y+(tgt.y-pos.y));if(b&&b.faction!==u.faction)extra+=6;}
     if(u.skill==='markShot'&&!p.kill)extra+=tgt.st.mark>0?-2:3;
     if(u.skill==='bind'&&!p.kill)extra+=(tgt.st.root>0?-3:(tgt.move>=4?6:3)+(manhattan(tgt,st.gate)<=4?3:0));
     add(scoreHit(D,st,u,pos,tid,p,extra)+posPen(c),{type:'ACT',actorId:u.id,to:pos,act:'SKILL',skill:u.skill,target:tid});}}
   if(S.kind==='self'&&near<=5){const adj=allies.filter(v=>v.id!==u.id&&manhattan(v,pos)===1).length;if(adj)add(adj*3+(near<=2?2:0)+posPen(c),{type:'ACT',actorId:u.id,to:pos,act:'SKILL',skill:u.skill});}
   if(S.kind==='ally'){for(const tid of skillTargets(D,st,u,pos)){const t=st.units.find(v=>v.id===tid);const miss=(t.maxHp-t.hp)/t.maxHp,ms=(t.solMax-t.sol)/Math.max(1,t.solMax);const v=miss*14+ms*5+(t.st.root>0||t.st.mark>0?3:0);if(v>2.5)add(v+posPen(c),{type:'ACT',actorId:u.id,to:pos,act:'SKILL',skill:u.skill,target:tid});}}
   if(S.kind==='zone'&&near<=6&&c.x===u.x&&c.y===u.y){let best=null;for(const k of skillTargets(D,st,u,pos)){const [x,y]=k.split(',').map(Number);if(!inside(st,x,y))continue;const al=allies.filter(v=>Math.abs(v.x-x)<=1&&Math.abs(v.y-y)<=1).length;const wv=(st.warn||[]).filter(w=>Math.abs(w.x-x)<=1&&Math.abs(w.y-y)<=1).length;const v=al*2.2+wv*4;if(!best||v>best.v)best={v,x,y};}
    if(best&&best.v>=4)add(best.v,{type:'ACT',actorId:u.id,to:pos,act:'SKILL',skill:u.skill,at:{x:best.x,y:best.y}});}}
 }
 if(S&&S.kind==='dash'){const R2=reachable(D,st,u,{extra:S.extraMove,ignoreZoc:true});for(const k of R2.keys()){const [x,y]=k.split(',').map(Number);const pos={x,y};
   for(const tid of withPos(u,pos,()=>targetsFrom(D,st,u,pos,null,true))){const p=preview(D,st,u,pos,tid,{flank:S.flank});add(scoreHit(D,st,u,pos,tid,p,R.has(k)?0:2)+posPen({y}),{type:'ACT',actorId:u.id,to:pos,act:'SKILL',skill:u.skill,target:tid});}}}
 // 軍陣
 if(u.faction==='P'&&u.form==='NONE'){if(u.troop==='SPEAR'&&foes.some(f=>f.troop==='CAVALRY'&&manhattan(f,u)<=7))add(4.5,{type:'ACT',actorId:u.id,to:{x:u.x,y:u.y},act:'FORM',form:'PIKE'});
  if(u.troop==='INFANTRY'&&u.skill==='guardStance'&&near<=6)add(4,{type:'ACT',actorId:u.id,to:{x:u.x,y:u.y},act:'FORM',form:'SHIELD_WALL'});}
 opts.sort((a,b)=>b.s-a.s);const best=opts[0];
 if(best&&best.s>(hold?-2:-6))return best.a;
 // 沒有好的選擇：往目標靠近（守門打法：留在門前）
 let goals;if(u.faction==='E'&&(u.troop!=='ARCHER'&&u.troop!=='MAGE'||st.pressure)){const g=st.gate;goals=[{x:g.x,y:g.y-1},...foes];}else if(hold){goals=[{x:st.gate.x,y:st.gate.y-1},{x:st.gate.x-1,y:st.gate.y-1},{x:st.gate.x+1,y:st.gate.y-1},{x:st.gate.x,y:st.gate.y-2}];}else goals=foes;
 if(!goals.length)return {type:'ACT',actorId:u.id,to:{x:u.x,y:u.y},act:'WAIT'};
 const dm=distMap(D,st,goals);let pick=null;
 for(const c of cand){const d=dm.get(key(c.x,c.y))??999;const s=-d+terrainDef(D,st,c.x,c.y)*2;if(!pick||s>pick.s+1e-9)pick={s,c:{x:c.x,y:c.y}};}
 return {type:'ACT',actorId:u.id,to:pick.c,act:(hold||near<=3)?'GUARD':'WAIT'};}

// ---------- 重播 ----------
function replay(D,missionId,seed,actions,opts){let st=createBattle(D,missionId,seed,opts);for(const a of actions){const r=apply(D,st,a);if(!r.ok)throw new Error('replay failed at '+JSON.stringify(a)+': '+r.error);st=r.state;}return st;}

const API={SCHEMA,createBattle,apply,validate,reachable,targetsFrom,skillTargets,preview,calc,plan,replay,hash,rngAt,los,key,manhattan,unitAt,tileAt,alive,rangeOf,counterMult,clone,soldiers,solMaxN,splitPreview,inZone,moveOpts,withPos};
if(typeof module!=='undefined'&&module.exports)module.exports=API;else root.TACTICS=API;
})(this);
