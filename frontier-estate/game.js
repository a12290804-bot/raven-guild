'use strict';
const ITEMS={
 wood:['舊松木',5,'♠'],stone:['灰石',5,'◆'],herb:['霧草',7,'❧'],ore:['冷鐵',11,'⬟'],hide:['灰獸皮',9,'◈'],
 salt:['黑鹽',10,'✦'],wax:['燭蠟',8,'♦'],taint:['污礦',15,'✶'],salve:['止血膏',20,'✚'],
 kit:['守門套件',38,'⚒'],blade:['冷鐵短刃',44,'⚔'],seal:['黑鹽護符',48,'✵']
};
const BUILD={
 hall:['公會辦事處','✥','評鑑、公告、擴張與委託。',{},1],shop:['商鋪','⚖','上架成品，二級可向英雄預約收購。',{coin:21,wood:2},1],
 forge:['工坊','⚒','製作道具，擴建後增加製作額與開放專精。',{coin:26,wood:3,stone:2},1],
 inn:['旅舍','♜','床位與休養，三級可簽英雄長住約。',{coin:24,wood:3,stone:1},1],
 yard:['採集場','♠','選擇本地採集物，結算時採收。',{coin:18,wood:2},1],
 watch:['瞭望塔','⌂','提早預警，二級辨識怪物與襲擊強度。',{coin:27,wood:3,stone:2},2],
 depot:['儲備倉','▣','保護庫存。升級後能攔下更多損失。',{coin:20,wood:3,stone:2},2],
 route:['商隊站','⛬','修橋後，為領地帶來交易收入。',{coin:32,wood:3,stone:3},3],
 wall:['木柵防線','⛨','提高自動防守強度。',{coin:24,wood:4,stone:2},2]
};
const HERO={
 frost:['霜綾','盾衛','盾',8,'ore'],jin:['槿','長槍手','槍',7,'hide'],yuan:['鳶','斥候','羽',6,'salt'],
 yun:['芸','治療師','燈',5,'herb'],he:['伊恪','術士','火',7,'wax'],qu:['瞿山','織者','絲',6,'taint']
};
const RECIPES={
 salve:{cost:{herb:2,wax:1},lv:1,tag:'藥劑',desc:'作為委託補給、治療英雄，或照顧生病工匠。'},
 kit:{cost:{wood:2,stone:1,hide:1},lv:1,tag:'鍛造',desc:'給守備隊提高防守強度，也可販售。'},
 blade:{cost:{ore:2,wood:1},lv:2,tag:'鍛造',desc:'可裝給英雄永久提高戰力。'},
 seal:{cost:{salt:2,wax:1,taint:1},lv:3,tag:'藥劑',desc:'襲擊時抵抗污染，減輕敵人強度。'}
};
const STAFF={
 gather:['棠石','採集員','採集場每日額外產出 1 份。',20,'yard'],
 smith:['槐燼','工匠','工坊每日多 1 個製作名額。',25,'forge'],
 clerk:['蘆禾','店員','每級商鋪多賣 1 件貨。',18,'shop']
};
const QUEST={
 scout:{name:'探查舊礦坑',desc:'偵查路線，帶回冷鐵。斥候特別合適。',days:1,power:7,reward:9,loot:{ore:2,stone:1},roles:['yuan']},
 hunt:{name:'清剿林間獸群',desc:'討伐獸群，帶回灰獸皮。長槍手與盾衛合適。',days:2,power:12,reward:15,loot:{hide:3,herb:2},roles:['jin','frost']},
 deep:{name:'回收封印礦箱',desc:'討伐礦坑深處的污染獸。術士與盾衛合適。',days:2,power:17,reward:23,loot:{taint:2,salt:2,ore:2},roles:['he','frost']},
 trail:{name:'勘查北岸便道',desc:'替代商路也可引回商隊。斥候與織者合適。',days:2,power:12,reward:18,loot:{wood:2,ore:1},roles:['yuan','qu']}
};
const LEVELS=[['公會前哨',0,6],['邊境據點',30,9],['渡鴉聚落',60,13],['邊境重鎮',85,18]];
const LAND={river:['霧渡河岸','開放霧草採集與河岸商路。','herb'],forest:['灰松林','增加木料，獸群可能循林地靠近。','wood'],mine:['舊礦坡','開放冷鐵採集，容易出現礦區怪物。','ore']};
const RAIDS={
 beast:['灰松獸群','林地獸群會衝擊柵欄，長槍與盾衛擅長阻擋。',14,['jin','frost']],
 mist:['霧門行者','霧中的人影忌憚火與燈，術士與治療師更有效。',15,['he','yun']],
 taint:['拾礦的無面者','污染物吸引了牠。術士與織者懂得對付牠。',16,['he','qu']]
};
const cap=(n,max=100)=>Math.max(0,Math.min(max,n));
const names=(cost)=>Object.entries(cost).map(([k,v])=> (k==='coin'?'渡鴉幣':ITEMS[k][0])+' '+v).join(' · ');
function newGame(seed=77351){
 return ensureWorld({version:1,day:1,seed,coin:108,level:1,lands:[],plots:[
  {type:'hall',lv:1},{type:'shop',lv:1},{type:'forge',lv:1},{type:'inn',lv:1}
 ],inv:{wood:7,stone:5,herb:4,ore:1,hide:1,salt:0,wax:3,taint:0,salve:1,kit:1,blade:0,seal:0},
 heroes:Object.fromEntries(Object.keys(HERO).map((id,i)=>[id,{id,available:i<3,trust:i===0?3:1,wound:0,level:1,xp:0,stock:2,purse:24,job:null,resident:false,blade:false}])),
 staff:{},queue:[],trade:[],orders:[],contracts:[],posted:null,board:{type:'scout',mode:'scout',reward:12,support:false,hero:'auto'},
 gather:'wood',specialty:'',renown:0,sales:[0],log:[{day:1,text:'你接管了渡鴉公會的邊境前哨。旅舍外已有人在等。'}],
 raid:null,raidSeen:false,defended:0,bridge:false,report:null,raidReport:null,weather:'陰',visitors:0,daysPassed:0,caravan:false,opened:false});
}
const HEX_RADIUS=8;
const HEX_STEPS=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
const HEX_TYPES={
 home:['公會前哨','◆','你唯一的起始領地。',{},0],
 plain:['荒草平原','╱','地勢平坦，適合設下新的建築。',{herb:2},3],
 forest:['灰松林','♠','可帶回舊松木，採集場的木料產量也會增加。',{wood:3},5],
 river:['霧渡河岸','≈','可取得霧草。佔領後，採集場可選擇霧草。',{herb:3},6],
 mine:['舊礦坡','⛰','可取得冷鐵。佔領後，採集場可選擇冷鐵。',{ore:2,stone:1},8],
 ruins:['荒廢遺跡','⌂','封門後仍有東西在走動。開拓可帶回舊日遺物。',{wax:2,salt:1,coin:6},11],
 wild:['獸群巢穴','✦','腳印交疊在舊路上。需要強力英雄清出道路。',{hide:3,taint:1},12]
};
const HEX_COMMANDS={
 scout:['派遣偵察',{coin:6,herb:1},'一日後揭開地形。偵察不會佔領土地。'],
 expedition:['強行開拓',{coin:15,wood:2,herb:1},'派英雄踏入未知地格。達到地形門檻即可佔領；失敗會負傷，仍可揭開地形。'],
 secure:['立碑佔領',null,'派英雄清理已偵察地格。達到門檻後新增一個建築位置。']
};
const hexKey=(q,r)=>q+','+r;
const hexParts=key=>key.split(',').map(Number);
const hexRange=(q,r)=>Math.max(Math.abs(q),Math.abs(r),Math.abs(q+r));
const hexAdjacent=key=>{const [q,r]=hexParts(key);return HEX_STEPS.map(([a,b])=>hexKey(q+a,r+b));};
const HEX_COORDS=[];
for(let q=-HEX_RADIUS;q<=HEX_RADIUS;q++)for(let r=-HEX_RADIUS;r<=HEX_RADIUS;r++)if(hexRange(q,r)<=HEX_RADIUS)HEX_COORDS.push(hexKey(q,r));
const HEX_KEYS=new Set(HEX_COORDS);
function hexType(s,key){
 const i=HEX_STEPS.findIndex(([q,r])=>hexKey(q,r)===key);
 if(i>=0)return ['forest','plain','river','mine','plain','ruins'][(i+s.world.seed%6)%6];
 const [q,r]=hexParts(key);
 const hash=Math.imul((s.world.seed^Math.imul(q,73856093)^Math.imul(r,19349663))>>>0,2654435761)>>>0;
 return ['plain','forest','forest','river','mine','ruins','wild'][hash%7];
}
function ensureWorld(s){
 if(s.world)return s;
 s.world={seed:s.seed>>>0,tiles:{'0,0':{type:'home',owned:true}},orders:[],last:[]};
 const legacyPlots=s.plots.length-4;
 if(legacyPlots>0){
  const ordered=[...HEX_COORDS].filter(k=>k!=='0,0').sort((a,b)=>hexRange(...hexParts(a))-hexRange(...hexParts(b)));
  for(let i=0;i<legacyPlots&&i<ordered.length;i++){
   const key=ordered[i];
   s.world.tiles[key]={type:s.lands[i]||hexType(s,key),owned:true,plot:i+4};
  }
 }
 return s;
}
const hexOwned=s=>Object.values(s.world.tiles).filter(t=>t.owned).length;
function hexOrderInfo(s,key){
 if(!HEX_KEYS.has(key))throw Error('地格超出疆界。');
 const tile=s.world.tiles[key], order=s.world.orders.find(o=>o.key===key);
 const border=hexAdjacent(key).some(k=>s.world.tiles[k]?.owned);
 const distance=hexRange(...hexParts(key));
 return {tile,order,border,distance,
  secureCost:{coin:8+distance*2,wood:1+Math.floor(distance/3)},
  threshold:tile?HEX_TYPES[tile.type][4]+Math.max(0,distance-1):null};
}
function queueHex(s,key,mode,heroId){
 const info=hexOrderInfo(s,key), h=s.heroes[heroId];
 if(!info.border||info.tile?.owned||info.order)throw Error('只能對接壤且未受令的地格下達指令。');
 if(s.world.orders.length>=2)throw Error('最多同時出動兩支小隊。');
 if(!Object.hasOwn(HEX_COMMANDS,mode)||(info.tile?mode!=='secure':mode==='secure'))throw Error('請選擇適合該地格的指令。');
 if(!h||!freeHero(h)||h.wound>=2||s.raid?.heroes.includes(heroId))throw Error('請選擇能出發且未安排守備的英雄。');
 const cost=mode==='secure'?info.secureCost:HEX_COMMANDS[mode][1];
 if(!have(s,cost))throw Error('需要 '+names(cost)+'。');
 pay(s,cost);
 h.job='hex';
 s.world.orders.push({key,mode,heroId,day:s.day,power:heroPower(h)+(heroId==='yuan'&&mode==='expedition'?1:0)});
 const message=HERO[heroId][0]+'已出發：'+HEX_COMMANDS[mode][0]+'。';
 log(s,message);
 return message;
}
function resolveHex(s){
 if(!s.world.orders.length){s.world.last=[];return;}
 s.world.last=[];
 for(const order of s.world.orders){
  const {key,mode,heroId,power}=order,h=s.heroes[heroId];
  const tile=s.world.tiles[key]??{type:hexType(s,key),owned:false};
  const [name,,,loot,threat]=HEX_TYPES[tile.type];
  const captured=mode!=='scout'&&power>=threat+Math.max(0,hexRange(...hexParts(key))-1);
  let message;
  s.world.tiles[key]=tile;
  h.job=null;
  if(captured){
   tile.owned=true;tile.plot=s.plots.length;s.plots.push(null);
   if(Object.hasOwn(LAND,tile.type)&&!s.lands.includes(tile.type))s.lands.push(tile.type);
   receive(s,loot);s.renown+=3;gainHero(h,2);
   message='佔領'+name+'，開放一處建築地。取得 '+names(loot)+'。';
  }else if(mode==='scout'){
   s.renown++;gainHero(h,1);message='偵察揭開'+name+'。你現在可以評估佔領代價。';
  }else{
   h.wound=cap(h.wound+1,3);
   message=HERO[heroId][0]+'負傷撤回。已揭開'+name+'，可改派更強的英雄。';
  }
  s.world.last.push({key,message});
  log(s,message);
 }
 s.world.orders=[];
}
function random(s){s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;}
function log(s,t){s.log.unshift({day:s.day,text:t});s.log=s.log.slice(0,80);}
function have(s,c){return Object.entries(c).every(([k,v])=>(k==='coin'?s.coin:s.inv[k]||0)>=v);}
function pay(s,c){for(const [k,v] of Object.entries(c))if(k==='coin')s.coin-=v;else s.inv[k]-=v;}
function receive(s,c){for(const [k,v] of Object.entries(c))if(k==='coin')s.coin+=v;else s.inv[k]=(s.inv[k]||0)+v;}
function active(s,k){return s.plots.filter(p=>p?.type===k&&!p.damage);}
function levelOf(s,k){return Math.max(0,...active(s,k).map(p=>p.lv));}
function onDuty(s,id){const w=s.staff[id];return !!w&&!w.sick&&!!levelOf(s,STAFF[id][4]);}
function heroPower(h){return HERO[h.id][3]+(h.level-1)*2+(h.blade?3:0)-h.wound*2;}
function freeHero(h){return h.available&&!h.job;}
function beds(s){return active(s,'inn').reduce((n,p)=>n+p.lv+1,0);}
function present(s){return Object.values(s.heroes).filter(h=>h.available);}
function maxBuilding(s){return Math.min(3,s.level);}
function score(s){
 const build=cap(s.plots.reduce((n,p)=>n+(p&&!p.damage?(p.type==='hall'?2:3+3*(p.lv-1)):0),0),28);
 const commerce=cap(3+Math.floor(s.sales.slice(-4).reduce((a,b)=>a+b,0)/7)+Math.floor(present(s).length/2)+4*Number(s.bridge)+3*levelOf(s,'route')+levelOf(s,'shop'),26);
 const renown=cap(s.renown+Math.floor(Object.values(s.heroes).reduce((n,h)=>n+h.trust,0)/3),26);
 const defense=cap(3*levelOf(s,'watch')+3*levelOf(s,'wall')+3*Object.values(s.heroes).filter(h=>h.resident).length+Math.min(4,(s.inv.kit||0)*2)+2*s.defended,24);
 return {build,commerce,renown,defense,total:build+commerce+renown+defense};
}
function buildCost(key,lv){return lv===1?BUILD[key][3]:{coin:lv*11,wood:lv+1,stone:lv};}
function validGather(s){return ['wood','stone',...new Set(s.lands.map(k=>LAND[k][2]).filter(k=>k!=='wood'))];}
function nextQuest(s,c,reserved=s.raid?.day===s.day?s.raid.heroes:[]){
 const q=QUEST[c.type];if(!q)return [];
 return Object.values(s.heroes).filter(h=>freeHero(h)&&h.wound<2&&!reserved.includes(h.id)&&(c.hero==='auto'||c.hero===h.id)).map(h=>{
  const role=q.roles.includes(h.id)?3:0, power=heroPower(h)+role+(c.support?3:0);
  const target=q.power+(c.mode==='scout'?0:3);
  const need=q.reward+h.wound*5+(c.mode==='hunt'?4:0)-Math.min(5,h.trust)-role+(h.resident?-2:0);
  return {h,power,target,need:Math.max(4,need)};
 }).sort((a,b)=>(b.power-b.need/4)-(a.power-a.need/4));
}
function makeRaid(s,type){
 if(s.raid)return;
 const watch=levelOf(s,'watch'), options=s.lands.includes('mine')?['mine','gate','store']:['gate','store'];
 const target=options[Math.floor(random(s)*options.length)];
 s.raid={type,target,protect:target,heroes:[],gear:'none',lure:false,day:s.day+(watch?2:1),power:RAIDS[type][2]+(s.level-1)*3};
 log(s,(watch?'瞭望塔':'巡夜人')+'發出預警。'+(watch>=2?RAIDS[type][0]+'正在接近。':'霧裡有東西正往這裡來。'));
}
const ZONES={gate:'外門',store:'倉庫',mine:'工坊區'};
function resolveRaid(s){
 const r=s.raid, guards=r.heroes.map(id=>s.heroes[id]).filter(h=>freeHero(h)&&h.wound<3);
 const bonus=RAIDS[r.type][3], lure=r.lure&&guards.some(h=>h.id==='yuan')&&s.inv.taint>0;
 const gear=r.gear!=='none'&&guards.length&&s.inv[r.gear]>0?r.gear:null;
 if(gear)pay(s,{[gear]:1});if(lure)pay(s,{taint:1});
 const correct=r.protect===r.target||lure;
 const strength=2+3*levelOf(s,'wall')+(correct?2:0)+guards.reduce((n,h)=>n+heroPower(h)+(bonus.includes(h.id)?3:0),0)+(gear==='kit'?5:gear==='seal'?7:0);
 const threat=r.power-(lure?4:0), won=guards.length>0&&strength>=threat;
 let outcome;
 if(won){s.defended++;s.renown+=5;receive(s,{hide:2,salt:1,coin:12});outcome='守備成功，獲得灰獸皮 ×2、黑鹽 ×1 與渡鴉幣 ×12。';}
 else{
  const p=s.plots.find(x=>x?.type===(r.target==='mine'?'forge':r.target==='store'?'shop':'inn')&&!x.damage);
  if(p)p.damage=2;
  const lost=Math.min(s.inv.wood,Math.max(0,3-levelOf(s,'depot')-(correct?1:0)));s.inv.wood-=lost;
  guards.forEach(h=>h.wound=cap(h.wound+1,3));
  outcome='局部失守。'+(p?BUILD[p.type][0]+'停工兩天。':'')+(lost?'損失舊松木 ×'+lost+'。':'儲備保住了。');
 }
 guards.forEach(h=>{h.trust=cap(h.trust+1,10);gainHero(h,2);});
 s.raidSeen=true;s.raidReport={type:RAIDS[r.type][0],threat,strength,won,outcome,day:s.day,target:ZONES[r.target]};
 log(s,RAIDS[r.type][0]+'襲擊'+ZONES[r.target]+'。'+outcome);s.raid=null;
}
function gainHero(h,xp){h.xp+=xp;while(h.xp>=h.level*4){h.xp-=h.level*4;h.level++;}}
function tradePrice(s,id,k){return ITEMS[k][1]+(s.weather==='豪雨'?2:0)-Math.floor(s.heroes[id].trust/3);}
function sales(s,n){s.sales[s.sales.length-1]+=n;}
function advance(s){
 ensureWorld(s);
 const from=s.day;
 const reserved=s.raid?.day===s.day?[...s.raid.heroes]:[];
 const oldDamage=s.plots.filter(p=>p?.damage);
 const oldWounds=present(s).filter(h=>h.wound&&freeHero(h));
 if(s.raid?.day<=s.day)resolveRaid(s);
 for(const p of oldDamage)p.damage--;
 const resting=oldWounds.slice(0,beds(s));resting.forEach(h=>h.wound=Math.max(0,h.wound-1));
 if(resting.length)log(s,'旅舍照護了 '+resting.length+' 名英雄。');
 for(const w of Object.values(s.staff))if(w.sick)w.sick--;
 const income=6+2*s.level+(s.bridge?3:0)+levelOf(s,'route')*(s.bridge?5:0);s.coin+=income;
 log(s,'收到渡鴉幣 ×'+income+'（公會津貼與商路）。');
 const plots=active(s,'yard');if(plots.length){
  const qty=plots.reduce((n,p)=>n+p.lv+1,0)+Number(onDuty(s,'gather'))+Number(s.gather==='wood'&&s.lands.includes('forest'));
  receive(s,{[s.gather]:qty});log(s,'採集場收成 '+names({[s.gather]:qty})+'。');
 }
 const craftSlots=levelOf(s,'forge')+Number(onDuty(s,'smith'));
 const made=s.queue.splice(0,craftSlots);
 for(const q of made){const qty=s.specialty===RECIPES[q].tag?2:1;receive(s,{[q]:qty});log(s,'工坊完成 '+names({[q]:qty})+'。');}
 if(s.posted){
  const c=s.posted, q=QUEST[c.type], pick=nextQuest(s,c,reserved).find(x=>c.reward>=x.need&&x.power>=x.target-3);
  if(pick){
   pick.h.job=c.type;
   s.contracts.push({...c,hero:pick.h.id,remaining:q.days+Number(c.mode==='hunt'),power:pick.power,target:pick.target});
   s.posted=null;log(s,HERO[pick.h.id][0]+'接下了「'+q.name+'」。');
  }else log(s,'目前沒有英雄接受這份委託。可調整人選、報酬或改做偵查。');
 }
 const still=[];
 for(const c of s.contracts){
  if(--c.remaining>0){still.push(c);continue;}
  const h=s.heroes[c.hero], q=QUEST[c.type];
  h.job=null;h.purse+=c.reward;h.trust=cap(h.trust+1,10);
  if(c.power+Math.floor(random(s)*4)>=c.target){
   const loot={...q.loot};
   if(c.mode==='hunt'){const first=Object.keys(loot)[0];loot[first]++;}
   gainHero(h,3);s.renown+=c.mode==='hunt'?6:4;
   receive(s,loot);if(c.type==='trail'){s.bridge=true;s.caravan=true;}
   h.stock=Math.min(6,h.stock+1);log(s,HERO[c.hero][0]+'完成「'+q.name+'」，送回 '+names(loot)+'。');
  }else{h.wound=cap(h.wound+1,3);gainHero(h,1);log(s,HERO[c.hero][0]+'帶傷撤回。「'+q.name+'」未完成，公會仍已支付報酬。');}
 }
 s.contracts=still;
 const shop=levelOf(s,'shop');
 if(shop){
  let quota=shop*(1+Number(onDuty(s,'clerk')));
  for(const entry of [...s.trade]){
   if(!quota)break;
   const buyer=present(s).filter(h=>freeHero(h)&&h.purse>=entry.price).sort((a,b)=>{
    const fit=h=>(entry.key==='salve'?h.wound*4:entry.key==='blade'?Number(!h.blade)*3:0)+h.trust;
    return fit(b)-fit(a);
   })[0];
   if(!buyer)continue;
   buyer.purse-=entry.price;s.coin+=entry.price;sales(s,entry.price);quota--;
   buyer.trust=cap(buyer.trust+1,10);
   if(entry.key==='blade')buyer.blade=true;if(entry.key==='salve'&&buyer.wound)buyer.wound--;
   s.trade.splice(s.trade.indexOf(entry),1);log(s,HERO[buyer.id][0]+'以 '+entry.price+' 渡鴉幣買下'+ITEMS[entry.key][0]+'。');
  }
  if(shop>=2){
   for(const o of [...s.orders]){
    const seller=present(s).find(h=>freeHero(h)&&HERO[h.id][4]===o.key&&h.stock);
    if(!seller)continue;
    seller.stock--;seller.purse+=o.price;receive(s,{[o.key]:1});s.orders.splice(s.orders.indexOf(o),1);
    log(s,HERO[seller.id][0]+'交付了收購單上的'+ITEMS[o.key][0]+'。');
   }
  }
 }
 resolveHex(s);
 s.day++;s.daysPassed++;s.sales.push(0);
 for(const h of present(s))if(!h.job){h.purse=Math.min(75,h.purse+5);if((s.day+HERO[h.id][3])%3===0)h.stock=Math.min(6,h.stock+1);}
 const absent=Object.values(s.heroes).filter(h=>!h.available);
 if(absent.length&&[2,3,5].includes(s.day)){
  const h=absent[0];h.available=true;s.visitors++;log(s,HERO[h.id][0]+'抵達前哨。');
 }
 if(s.day===2){s.weather='豪雨';log(s,'暴雨沖斷了霧渡橋。修橋需要 3 冷鐵、2 木料與 16 渡鴉幣。');}
 else if(s.day===3){
  s.weather='陰';const w=Object.values(s.staff)[0];if(w){w.sick=2;log(s,'領地有人病倒了。可以用止血膏照護。');}else log(s,'雨停了。旅舍外的泥路露出了陌生足印。');
 }else{
  const event=random(s);s.weather=event<.23?'濃霧':event<.45?'豪雨':'陰';
  if(event>.83){receive(s,{wood:2,wax:1});log(s,'拾荒客留下舊松木 ×2、燭蠟 ×1。');}
  else if(event<.11&&s.bridge){receive(s,{coin:13});log(s,'路過的商隊支付了額外的落腳費。');}
  else if(event>.66&&event<.74&&s.lands.length){const k=LAND[s.lands[0]][2];receive(s,{[k]:2});log(s,'新開拓地發現 '+names({[k]:2})+'。');}
 }
 if(!s.raid&&(s.day===4||s.day>6&&random(s)<(.22+s.level*.045+(s.inv.taint>1?.16:0))))
  makeRaid(s,s.inv.taint>=2?'taint':s.lands.includes('forest')?'beast':s.weather==='濃霧'?'mist':'beast');
 if(s.day===8){s.report={bridge:s.bridge,level:s.level,defended:s.defended,land:hexOwned(s)};log(s,'七日評鑑已送達，領地可以繼續經營。');}
 return {day:from};
}
function act(s,cmd,a,b){
 const p=s.plots[Number(a)], h=s.heroes[a], r=s.raid;
 const spend=c=>{if(!have(s,c))throw Error('需要 '+names(c)+'。');pay(s,c);};
 const need=(ok,msg)=>{if(!ok)throw Error(msg);};
 const item=a=>Object.hasOwn(ITEMS,a);
 switch(cmd){
 case 'build': {
  const entry=BUILD[b];
  need(p===null&&entry&&b!=='hall'&&s.level>=entry[4],'這塊地或建築還未開放。');
  need(['yard','inn','wall','depot'].includes(b)||!s.plots.some(x=>x?.type===b),'領地已有此建築。');
  spend(entry[3]);s.plots[a]={type:b,lv:1};return '已建成'+entry[0]+'。';
 }
 case 'upgrade': {
  need(p&&!p.damage&&p.type!=='hall'&&p.lv<maxBuilding(s),'需要提高領地等級，或先修好建築。');
  spend(buildCost(p.type,p.lv+1));p.lv++;return BUILD[p.type][0]+'升到 '+p.lv+' 級。';
 }
 case 'repair':
  need(p?.damage,'這裡目前不需要修理。');spend({coin:8,wood:1});p.damage=0;return '修好了'+BUILD[p.type][0]+'。';
 case 'promote': {
  const rating=LEVELS[s.level];
  need(rating&&score(s).total>=rating[1]&&hexOwned(s)>1,'需要達到評鑑門檻，並已開拓至少一格。');
  spend({coin:12+s.level*4});
  s.level++;
  return '公會核准升級。領地升到 '+s.level+' 級。';
 }
 case 'gather':
  need(validGather(s).includes(a)&&levelOf(s,'yard'),'需要可運作的採集場與可用地點。');s.gather=a;return '採集場改採'+ITEMS[a][0]+'。';
 case 'specialty':
  need(levelOf(s,'forge')>=3&&['鍛造','藥劑'].includes(a),'三級工坊才可設定專精。');s.specialty=a;return '工坊專精設為'+a+'。';
 case 'craft':{
  const recipe=RECIPES[a];
  need(recipe&&levelOf(s,'forge')>=recipe.lv,'工坊尚未解鎖這個配方。');
  need(s.queue.length<8,'工坊待辦已滿。');spend(recipe.cost);s.queue.push(a);return '已排入'+ITEMS[a][0]+'。';
 }
 case 'uncraft':{
  const [q]=s.queue.splice(Number(a),1);need(q,'找不到這筆製作。');receive(s,RECIPES[q].cost);return '撤回製作並取回素材。';
 }
 case 'staff':
  need(STAFF[a]&&!s.staff[a]&&levelOf(s,STAFF[a][4]),'需要對應建築，或此人已入職。');
  spend({coin:STAFF[a][3]});s.staff[a]={sick:0};return STAFF[a][0]+'已加入領地。';
 case 'staffcare':
  need(s.staff[a]?.sick,'這位居民目前不需照護。');spend({salve:1});s.staff[a].sick=0;return STAFF[a][0]+'恢復工作了。';
 case 'buy':{
  need(h&&freeHero(h)&&h.stock,'此英雄目前沒有可交易的貨。');const k=HERO[a][4], price=tradePrice(s,a,k);
  spend({coin:price});h.stock--;h.purse+=price;h.trust=cap(h.trust+1,10);receive(s,{[k]:1});return '從'+HERO[a][0]+'買到'+ITEMS[k][0]+'。';
 }
 case 'list':{
  const price=Number(b);
  need(item(a)&&levelOf(s,'shop')&&Number.isInteger(price)&&price>=1&&price<=75&&s.trade.length<10,'請使用可運作的商鋪與 1～75 的售價，最多上架十件。');
  spend({[a]:1});s.trade.push({key:a,price});return '已上架'+ITEMS[a][0]+'，晚間結算。';
 }
 case 'unlist':{
  const [x]=s.trade.splice(Number(a),1);need(x,'找不到商品。');receive(s,{[x.key]:1});return '已下架並取回商品。';
 }
 case 'order':{
  need(item(a)&&Object.values(HERO).some(x=>x[4]===a)&&levelOf(s,'shop')>=2&&s.orders.length<5,'需要二級商鋪，最多同時開五張收購單。');
  const price=ITEMS[a][1]+2;spend({coin:price});s.orders.push({key:a,price});return '已張貼'+ITEMS[a][0]+'的收購單。';
 }
 case 'unorder':{
  const [x]=s.orders.splice(Number(a),1);need(x,'找不到收購單。');receive(s,{coin:x.price});return '已撤掉收購單並退回預算。';
 }
 case 'reside':
  need(h&&freeHero(h)&&!h.resident&&h.trust>=4&&levelOf(s,'inn')>=3&&present(s).filter(x=>x.resident).length<beds(s),'需要三級旅舍、空床及信任 4。');
  spend({coin:22});h.resident=true;return HERO[a][0]+'簽下長住合約。';
 case 'equip':
  need(h&&freeHero(h)&&!h.blade,'英雄需在領地且未配戴短刃。');spend({blade:1});h.blade=true;h.trust=cap(h.trust+1,10);return HERO[a][0]+'裝備了冷鐵短刃。';
 case 'heal':
  need(h&&freeHero(h)&&h.wound,'這名英雄目前不需要照護。');spend({salve:1});h.wound=Math.max(0,h.wound-2);h.trust=cap(h.trust+1,10);return HERO[a][0]+'接受了照護。';
 case 'post': {
  const c=s.board;
  need(!s.posted&&QUEST[c.type]&&(c.type!=='trail'||s.day>=2&&!s.bridge)&&Number.isInteger(c.reward)&&c.reward>=4&&c.reward<=60,'只能張貼一份待接委託，報酬須為 4～60。');
  spend({coin:c.reward,...(c.support?{salve:1}:{})});s.posted={...c};return '已發佈委託，英雄會在入夜前決定是否接受。';
 }
 case 'unpost':
  need(s.posted,'沒有待接委託。');receive(s,{coin:s.posted.reward,...(s.posted.support?{salve:1}:{})});s.posted=null;return '已撤回委託，取回報酬與補給。';
 case 'recall': {
  const i=s.contracts.findIndex(x=>x.hero===a);need(i>=0,'這名英雄目前沒有外出。');
  const [c]=s.contracts.splice(i,1);h.job=null;h.purse+=c.reward;return '已召回'+HERO[a][0]+'，原任務報酬照付。';
 }
 case 'guard':
  need(r&&h&&(r.heroes.includes(a)||freeHero(h)&&h.wound<3),'這名英雄暫時不能駐防。');
  if(r.heroes.includes(a))r.heroes=r.heroes.filter(id=>id!==a);
  else{need(r.heroes.length<(s.level>=4?4:2),'守備人數已滿。');r.heroes.push(a);}
  return '';
 case 'protect':
  need(r&&Object.hasOwn(ZONES,a),'沒有可調整的守備區。');r.protect=a;return '';
 case 'gear':
  need(r&&['none','kit','seal'].includes(a),'沒有可調整的守備補給。');r.gear=a;return '';
 case 'lure':
  need(r&&s.inv.taint>0&&r.heroes.includes('yuan'),'引開怪物需要鳶加入守備與一份污礦。');r.lure=!r.lure;return '';
 case 'bridge':
  need(s.day>=2&&!s.bridge,'商路已經通行，或橋尚未損壞。');spend({coin:16,ore:3,wood:2});s.bridge=true;s.caravan=true;s.renown+=4;return '霧渡橋修復，商隊恢復通行。';
 default:throw Error('無法執行這個操作。');
 }
}
if(typeof module!=='undefined')module.exports={newGame,act,advance,score,heroPower,levelOf,ITEMS,BUILD,LEVELS,ensureWorld,queueHex,hexOrderInfo,hexOwned,HEX_COORDS};
