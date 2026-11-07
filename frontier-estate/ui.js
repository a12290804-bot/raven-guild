'use strict';
const app=document.querySelector('#app'), sheet=document.querySelector('#sheet'), panel=document.querySelector('#sheet-body');
const saveKey='raven-territory-v01';
const music=document.querySelector('#shared-music');
const landscape=new Image();
landscape.onload=()=>document.documentElement.style.setProperty('--shared-village', 'url("'+sharedAssets.village+'")');
landscape.src=sharedAssets.village;
let s=null, page='land', showCover=true, modal=null, noticeTimer;
const freshGame=()=>newGame(Math.floor(Math.random()*4294967296));
try{const value=JSON.parse(localStorage.getItem(saveKey));if(value?.version===1&&Array.isArray(value.plots))s=value;}catch{}
function persist(){try{localStorage.setItem(saveKey,JSON.stringify(s));}catch{toast('此瀏覽器目前無法寫入本機存檔。');}}
function toast(message){
 if(!message)return;
 if(sheet.open){const box=panel.querySelector('.sheet-alert');if(box){box.textContent=message;box.hidden=false;}}
 const node=document.querySelector('#notice');node.textContent=message;node.classList.add('on');
 clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>node.classList.remove('on'),3600);
}
const disabled=(yes)=>yes?' disabled':'';
const button=(text,cmd,a='',b='',style='',off=false)=>`<button class="${style}" data-cmd="${cmd}" data-a="${a}" data-b="${b}"${disabled(off)}>${text}</button>`;
const action=(text,cmd,a='',b='',style='',off=false)=>button(text,'act',cmd,a+':'+b,style,off);
const selects=(list,selected)=>list.map(([id,label])=>`<option value="${id}"${id===selected?' selected':''}>${label}</option>`).join('');
const heading=(small,title,desc='')=>`<div class="section-title"><span>${small}</span><h2>${title}</h2>${desc?`<p>${desc}</p>`:''}</div>`;
const status=(h)=>h.job?'委託外出':h.wound?'負傷 '+h.wound:h.resident?'長住':'在領地';
const heroBadge=(id)=>`<span class="hero-mark hero-${id}"><span class="hero-fallback"><small>${HERO[id][1]}</small>${HERO[id][2]}</span><img src="${sharedAssets.portraits[id]}" width="64" height="78" alt="" hidden></span>`;
const count=(k)=>s.inv[k]||0;
const ready=(h)=>freeHero(h)&&h.wound<3;
function cover(){
 app.innerHTML=`<section class="cover"><div class="cover-inner"><div class="cover-kicker"><span></span> 渡鴉公會外派名冊 <span></span></div>
 <div class="cover-title"><small>RAVEN GUILD</small><h1>渡鴉公會<i></i><b>邊境領地</b></h1><p>霧還沒散。先把前哨的燈點起來。</p></div>
 <div class="cover-actions">${button(s?'返回領地':'接管領地','start','','','primary large')}${s?button('另開新局','new','','','cover-link'):''}${button(music.paused?'開啟背景音樂':'關閉背景音樂','music','','','cover-link')}<small>手機經營試玩版　V0.1</small></div></div></section>`;
}
const tabs=[['land','▥','領地'],['market','⚖','交易'],['heroes','♜','英雄'],['board','⚑','委託'],['log','▤','簿冊']];
function shell(){
 const rating=score(s), tab=tabs.find(t=>t[0]===page);
 app.innerHTML=`<div class="shell"><header class="top"><div class="brand">${button('✦','cover','','','emblem')}<div><span>渡鴉公會 ／ 邊境領地</span><strong>${LEVELS[s.level-1][0]}</strong></div><div class="day"><small>${s.weather}</small><b>第 ${s.day} 日</b></div></div>
 <div class="resources"><div><small>渡鴉幣</small><b>◈ ${s.coin}</b></div><div><small>評鑑</small><b>${rating.total} <em>／ Lv.${s.level}</em></b></div><div><small>領地</small><b>${s.plots.filter(Boolean).length}<em> / ${s.plots.length}</em></b></div></div></header>
 ${s.raid?`<button class="alert" data-cmd="tab" data-a="board"><b>⚑　襲擊預警</b><span>第 ${s.raid.day} 日夜間　›</span></button>`:''}
 <section id="screen" aria-label="${tab[2]}">${({land,market,heroes,board,log:journal})[page]()}</section>
 <footer><div class="endrow"><span><b>第 ${s.day} 日</b><small>結算製作、交易與外派行動</small></span>${button('結束今日　→','end','','','primary')}</div>
 <nav aria-label="領地選單">${tabs.map(([id,icon,label])=>`<button class="${page===id?'selected':''}" ${page===id?'aria-current="page"':''} data-cmd="tab" data-a="${id}"><i>${icon}</i>${label}</button>`).join('')}</nav></footer></div>`;
}
function land(){
 const sc=score(s), next=LEVELS[s.level];
 return `<div class="land-banner"><small>GUILD ESTATE  /  THE FIRST OUTPOST</small><h2>你的邊境領地</h2><p>${s.lands.length?s.lands.map(k=>LAND[k][0]).join(' · '):'灰松坡下，一座仍亮著燈的小站。'}</p></div>
 <div class="split goal"><div><small>公會首週要求</small><b>${s.bridge?'✓ 商路暢通':'修復霧渡橋或另闢便道'}</b></div>${button(s.report?'查看七日評鑑':'查看領地評鑑','rating','','','quiet')}</div>
 ${s.day===1?`<div class="firststeps"><b>今日建議</b><span>點空地蓋採集場，再到委託板請英雄偵查舊礦坑。冷鐵能用來修橋或打造短刃。</span></div>`:''}
 <div class="ratingline"><span>評分 ${sc.total}${next?' ／ 下級 '+next[1]:''}</span><span>${next?'開拓後 '+next[2]+' 塊地':'已達最高等級'}</span></div>
 <div class="meter"><i style="width:${Math.min(100,sc.total/(next?.[1]||104)*100)}%"></i></div>
 <div class="plots">${s.plots.map((p,i)=>p?`<button class="plot type-${p.type} ${p.damage?'broken':''}" data-cmd="plot" data-a="${i}"><small>${String(i+1).padStart(2,'0')}</small><i>${BUILD[p.type][1]}</i><b>${BUILD[p.type][0]}</b><em>${p.damage?'停工 '+p.damage+' 日':'Lv. '+p.lv}</em></button>`:`<button class="plot empty" data-cmd="plot" data-a="${i}"><small>${String(i+1).padStart(2,'0')}</small><i>＋</i><b>空地</b><em>選擇建築</em></button>`).join('')}</div>
 <div class="card split"><div><b>霧渡橋與商路</b><p>${s.bridge?'商隊已能來訪。':s.day===1?'河水正在上漲。':'修橋需 3 冷鐵、2 舊松木、16 渡鴉幣。'}</p></div>${action('修橋','bridge','','','quiet',s.bridge||s.day<2)}</div>`;
}
function inventory(){
 return `<div class="stock">${Object.entries(ITEMS).map(([k,[label,,icon]])=>`<div class="${count(k)?'':'dim'}"><i>${icon}</i><span>${label}</span><b>${count(k)}</b></div>`).join('')}</div>`;
}
function market(){
 const shop=levelOf(s,'shop'), forge=levelOf(s,'forge');
 return `${heading('02 / MERCANTILE','交易與工坊','收下冒險者的戰利品，再讓工坊把它們變成有價值的貨物。')}
 <div class="card"><div class="split"><h3>庫存</h3>${button('買英雄素材','tab','heroes','','quiet')}</div>${inventory()}</div>
 <div class="card"><div class="split"><h3>工坊配方</h3><span class="tag">Lv.${forge} · 待辦 ${s.queue.length}/8</span></div>
 ${s.specialty?`<p>專精 ${s.specialty} · 同類配方每單產出兩件</p>`:''}
 ${Object.entries(RECIPES).map(([k,r])=>`<div class="row"><div><b>${ITEMS[k][2]}　${ITEMS[k][0]}</b><p>${r.desc}</p><small>${names(r.cost)}${forge<r.lv?' · 工坊 Lv.'+r.lv:''}</small></div>${action('製作','craft',k,'','quiet',forge<r.lv)}</div>`).join('')}
 ${s.queue.length?`<p class="queue">排程中　${s.queue.map((k,i)=>action(ITEMS[k][0]+' ×','uncraft',i,'','mini')).join('')}</p>`:''}</div>
 <div class="card"><div class="split"><h3>商鋪貨架</h3><span class="tag">每夜最多 ${shop*(1+Number(onDuty(s,'clerk')))} 件</span></div><p>英雄有各自的預算，售價太高可能賣不動。</p>
 <div class="inline"><label>商品<select id="sale-item">${selects(Object.entries(ITEMS).filter(([k])=>count(k)>0).map(([k,v])=>[k,v[0]+' ×'+count(k)]),'')}</select></label><label class="price">單價<input id="sale-price" type="number" min="1" max="75" value="20" inputmode="numeric"></label>${button('上架','list','','','primary',!shop)}</div>
 ${s.trade.map((o,i)=>`<div class="row"><b>${ITEMS[o.key][0]} · ${o.price} 幣</b>${action('下架','unlist',i,'','mini')}</div>`).join('')}
 <div class="split order-head"><h3>英雄素材收購單</h3><span class="tag">商鋪 Lv.2</span></div>
 <div class="inline"><label>向到訪英雄收購<select id="order-item">${selects(Object.values(HERO).map(v=>[v[4],ITEMS[v[4]][0]+' · '+(ITEMS[v[4]][1]+2)+' 幣']),'')}</select></label>${button('掛單','order','','','quiet',shop<2)}</div>
 ${s.orders.map((o,i)=>`<div class="row"><b>${ITEMS[o.key][0]} · 已保留 ${o.price} 幣</b>${action('撤回','unorder',i,'','mini')}</div>`).join('')}</div>`;
}
function heroes(){
 return `${heading('03 / RESIDENTS','英雄與居民','英雄會賣自己的戰利品，也會依照身手、傷勢與報酬決定是否接任務。')}
 <div class="hero-list">${present(s).map(h=>{const [name,job,,,key]=HERO[h.id];return `<div class="card hero-card">${heroBadge(h.id)}<div><div class="split"><h3>${name} <small>${job}</small></h3><span class="tag">${status(h)}</span></div><p>Lv.${h.level} · 戰力 ${heroPower(h)} · 信任 ${h.trust} · 經驗 ${h.xp}/${h.level*4}${h.blade?' · 裝有短刃':''}</p><p>持有 ${h.purse} 幣 · ${ITEMS[key][0]} ×${h.stock}</p>
 <div class="actions">${action('買素材 '+tradePrice(s,h.id,key)+' 幣','buy',h.id,'','quiet',!freeHero(h)||!h.stock)}${button('詳情','hero',h.id,'','mini')}</div></div></div>`;}).join('')}</div>
 <div class="card"><h3>領地招募</h3><p>員工加入後，每日結算自動上工。</p>
 ${Object.entries(STAFF).map(([id,[name,job,desc,cost,building]])=>`<div class="row"><div><b>${name} · ${job}</b><p>${desc}</p><small>${s.staff[id]?.sick?'病休 '+s.staff[id].sick+' 日':s.staff[id]?'已入職':'需要'+BUILD[building][0]}</small></div>${s.staff[id]?.sick?action('用藥照護','staffcare',id,'','quiet',!count('salve')):s.staff[id]?'<span class="tag">已招募</span>':action('招募 '+cost+' 幣','staff',id,'','quiet',!levelOf(s,building))}</div>`).join('')}</div>`;
}
function board(){
 const r=s.raid,c=s.board,q=QUEST[c.type];
 const pick=nextQuest(s,c).filter(x=>x.power>=x.target-3);
 return `${heading('04 / CONTRACTS','委託與守備','把工作交給合適的人。派出的人手，今晚就無法留在領地。')}
 ${r?`<div class="card raid"><div class="split"><h3>霧中的動靜</h3><span class="tag">第 ${r.day} 日夜間</span></div>
 <p>${levelOf(s,'watch')>=2?RAIDS[r.type][0]+' · 威脅 '+r.power+'。'+RAIDS[r.type][1]:'巡夜人懷疑牠們會從'+ZONES[r.target]+'附近接近。二級瞭望塔可辨識怪物。'}</p>
 <div class="inline"><label>守備位置<select data-raid="protect">${selects(Object.entries(ZONES),r.protect)}</select></label><label>守備補給<select data-raid="gear">${selects([['none','不攜帶'],['kit','守門套件 ×'+count('kit')],['seal','黑鹽護符 ×'+count('seal')]],r.gear)}</select></label></div>
 <p class="quiet-text">挑選守備英雄　${r.heroes.length}/${s.level>=4?4:2}</p><div class="chips">${present(s).map(h=>action((r.heroes.includes(h.id)?'✓ ':'')+HERO[h.id][0]+' · '+heroPower(h),'guard',h.id,'',r.heroes.includes(h.id)?'chosen':'quiet',!ready(h)&&!r.heroes.includes(h.id))).join('')}</div>
 <div class="row"><span>鳶可用一份污礦引開怪物。</span>${action(r.lure?'✓ 已準備誘餌':'準備誘餌','lure','','','mini',!r.heroes.includes('yuan')||!count('taint'))}</div></div>`:''}
 ${s.raidReport?`<div class="card result"><div class="split"><h3>${s.raidReport.won?'守備成功':'局部失守'}</h3><span class="tag">第 ${s.raidReport.day} 日</span></div><p>${s.raidReport.type} · ${s.raidReport.target} · 防守 ${s.raidReport.strength}／威脅 ${s.raidReport.threat}</p><p>${s.raidReport.outcome}</p></div>`:''}
 <div class="card"><div class="split"><h3>張貼委託</h3><span class="tag">${s.posted?'等待接單':'公會布告板'}</span></div>
 ${s.posted?`<div class="row"><div><b>${QUEST[s.posted.type].name}</b><p>已保留 ${s.posted.reward} 幣 · ${s.posted.mode==='hunt'?'討伐':'偵查'}</p></div>${action('撤回','unpost','','','quiet')}</div>`:`
 <label>委託目標<select data-board="type">${selects(Object.entries(QUEST).filter(([k])=>k!=='trail'||s.day>=2&&!s.bridge||c.type==='trail').map(([k,v])=>[k,v.name]),c.type)}</select></label><p>${q.desc}</p>
 <div class="inline"><label>執行方式<select data-board="mode">${selects([['scout','偵查 · 快速'],['hunt','討伐 · 多帶回一份主要素材']],c.mode)}</select></label><label class="price">報酬<input data-board="reward" type="number" min="4" max="60" value="${c.reward}" inputmode="numeric"></label></div>
 <div class="inline"><label>指派意向<select data-board="hero">${selects([['auto','任何願意的英雄'],...present(s).map(h=>[h.id,HERO[h.id][0]+' · '+status(h)])],c.hero)}</select></label><label class="check"><input data-board="support" type="checkbox"${c.support?' checked':''}>附止血膏</label></div>
 <p>${pick.length?'可能接單　'+pick.map(x=>HERO[x.h.id][0]+' ≥ '+x.need+' 幣').join('、'):'目前沒有適任人選。'}</p><p>預估 ${q.days+Number(c.mode==='hunt')} 日 · 基礎回收 ${names(q.loot)}</p>
 ${action('發佈委託','post','','','primary')}`}</div>
 <div class="card"><h3>外派紀錄</h3>${s.contracts.length?s.contracts.map(c=>`<div class="row"><div><b>${HERO[c.hero][0]} · ${QUEST[c.type].name}</b><p>預計還要 ${c.remaining} 日</p></div>${action('召回','recall',c.hero,'','quiet')}</div>`).join(''):'<p>目前沒有英雄在外執行任務。</p>'}</div>`;
}
function journal(){
 return `${heading('05 / LEDGER','公會簿冊','每天的收支、來客與事件都會寫進這本簿冊。')}
 <div class="card split"><div><h3>七日評鑑</h3><p>${s.report?'第一週的評鑑已結算。':'第八日清晨送達，可繼續遊玩。'}</p></div>${button('查看評鑑','rating','','','quiet')}</div>
 <div class="card split"><div><h3>背景音樂</h3><p>渡鴉公會 · 大廳配樂</p></div>${button(music.paused?'播放':'暫停','music','','','quiet')}</div>
 <div class="card diary">${s.log.map(x=>`<div><time>第 ${x.day} 日</time><p>${x.text}</p></div>`).join('')}</div>`;
}
function sheetContent(){
 const [kind,key]=modal;
 if(kind==='new')return `<h2 id="sheet-title">另開新局</h2><p>確認後，這個瀏覽器的領地進度會從第一天重新開始。</p>${button('確認重新開始','restart','','','danger')}`;
 if(kind==='end'){
  const r=s.raid, due=r&&r.day<=s.day;
  return `<h2 id="sheet-title">第 ${s.day} 日 · 入夜</h2><p>${due?'今晚會遭遇怪物襲擊。':'會依序結算採集、製作、委託與交易。'}</p>${due?`<p class="warn">守備英雄 ${r.heroes.map(id=>s.heroes[id]).filter(ready).map(h=>HERO[h.id][0]).join('、')||'尚未安排'}。${r.gear!=='none'?'預備補給 '+ITEMS[r.gear][0]+'。':''}</p>${button('返回安排守備','go','board','','quiet')}`:''}${button('確認結算　→','advance','','','primary')}`;
 }
 if(kind==='rating'){
  const v=score(s), n=LEVELS[s.level], report=s.report;
  return `<h2 id="sheet-title">公會領地評鑑</h2><p>目前 ${v.total} 分 · Lv.${s.level} ${LEVELS[s.level-1][0]} · ${s.plots.length} 塊地</p>
 <div class="rating-parts">${[['建設',v.build,28],['繁榮',v.commerce,26],['聲望',v.renown,26],['防備',v.defense,24]].map(([t,x,m])=>`<div><b>${t}</b><strong>${x} <small>/ ${m}</small></strong></div>`).join('')}</div>
 ${n?`<h3>下一級 · ${n[0]}</h3><p>需要 ${n[1]} 分與 ${12+s.level*4} 幣。核准後共有 ${n[2]} 塊地。${s.level===1?'開放瞭望塔、儲備倉與木柵。':s.level===2?'開放三級建築與商隊站。':'開放四人守備。'}</p>
 ${Object.entries(LAND).filter(([k])=>!s.lands.includes(k)).map(([k,l])=>`<div class="row"><div><b>${l[0]}</b><p>${l[1]}</p></div>${action('開拓','expand',k,'','quiet',v.total<n[1])}</div>`).join('')}`:'<p>已完成公會核准的全部開拓。</p>'}
 ${report?`<div class="report"><h3>首週結案</h3><p>${report.bridge?'✓ 已恢復商路':'○ 商路待恢復'}　${report.level>=2?'✓ 已擴張':'○ 領地待擴張'}　${report.defended?'✓ 已擊退襲擊':'○ 待成功守備'}</p><p>這是首週快照，領地可持續經營。</p></div>`:''}`;
 }
 if(kind==='plot'){
  const p=s.plots[key];
  if(!p)return `<h2 id="sheet-title">地塊 ${Number(key)+1} · 建設</h2><p>為這塊土地選一個用途。</p>
 ${Object.entries(BUILD).filter(([k])=>k!=='hall'&&(['yard','inn','wall','depot'].includes(k)||!s.plots.some(p=>p?.type===k))).map(([k,b])=>`<div class="row"><div><b>${b[1]}　${b[0]}</b><p>${b[2]}</p><small>${names(b[3])}${s.level<b[4]?' · 領地 Lv.'+b[4]:''}</small></div>${action('建造','build',key,k,'quiet',s.level<b[4])}</div>`).join('')}`;
  const b=BUILD[p.type];
  return `<h2 id="sheet-title">${b[1]}　${b[0]} · Lv.${p.lv}</h2><p>${b[2]}</p>${p.damage?`<p class="warn">停工還有 ${p.damage} 日。可支付 8 幣和 1 木料立即修好。</p>${action('修繕','repair',key,'','primary')}`:''}
 ${p.type==='hall'?button('查看公會評鑑','rating','','','primary'):p.lv<maxBuilding(s)&&!p.damage?`<p>升級費用　${names(buildCost(p.type,p.lv+1))}</p>${action('升級到 Lv.'+(p.lv+1),'upgrade',key,'','primary')}`:p.lv<3&&!p.damage?'<p>擴張領地可提高建築等級上限。</p>':''}
 ${p.type==='yard'&&!p.damage?`<h3>每日採集</h3><div class="chips">${validGather(s).map(k=>action(ITEMS[k][0],'gather',k,'',s.gather===k?'chosen':'quiet')).join('')}</div>`:''}
 ${p.type==='forge'&&!p.damage?`<div class="chips">${button('前往工坊','go','market','','quiet')}${p.lv>=3?['鍛造','藥劑'].map(k=>action(k+'專精','specialty',k,'',s.specialty===k?'chosen':'quiet')).join(''):''}</div>`:''}
 ${p.type==='shop'?button('前往交易','go','market','','quiet'):''}
 ${p.type==='inn'?`<p>運作床位 ${beds(s)} · 休息能逐日恢復英雄傷勢。</p>${button('查看英雄','go','heroes','','quiet')}`:''}
 ${p.type==='watch'?button('查看守備','go','board','','quiet'):''}`;
 }
 if(kind==='hero'){
  const h=s.heroes[key], hero=HERO[key];
  return `<h2 id="sheet-title">${hero[0]} · ${hero[1]}</h2>${heroBadge(key)}<p>Lv.${h.level} · 戰力 ${heroPower(h)} · 信任 ${h.trust} · ${status(h)}</p><p>回報委託與參與守備可獲得經驗，升級提高戰力。交易與照護可增加信任。</p>
 <div class="row"><div><b>長住合約</b><p>三級旅舍、空床、信任至少 4，費用 22 幣。</p></div>${h.resident?'<span class="tag">已長住</span>':action('邀請','reside',key,'','quiet',levelOf(s,'inn')<3||!freeHero(h)||h.trust<4)}</div>
 <div class="row"><b>止血膏 ×${count('salve')}</b>${action('照護','heal',key,'','quiet',!h.wound||!freeHero(h)||!count('salve'))}</div>
 <div class="row"><b>冷鐵短刃 ×${count('blade')}</b>${action('裝備','equip',key,'','quiet',h.blade||!freeHero(h)||!count('blade'))}</div>`;
 }
 if(kind==='recap'){
  const list=s.log.filter(x=>x.day>=s.day-1).slice().reverse();
  return `<h2 id="sheet-title">第 ${s.day-1} 日結算</h2><div class="diary recap">${list.map(x=>`<div><time>第 ${x.day} 日</time><p>${x.text}</p></div>`).join('')}</div>${button('開始新的一日','close','','','primary')}`;
 }
}
function render(){
 if(showCover)cover();else shell();
 if(modal){
  panel.innerHTML=`<div class="sheet-top"><small>渡鴉公會 / 辦事處</small>${button('關閉 ×','close','','','mini')}</div>`+ '<p role="status" class="sheet-alert warn" hidden></p>' +sheetContent();
  if(!sheet.open)sheet.showModal();
 }else if(sheet.open)sheet.close();
}
function navigate(next){page=next;modal=null;render();window.scrollTo(0,0);}
function dispatch(cmd,a,b){
 try{
  const box=panel.querySelector('.sheet-alert');if(box)box.hidden=true;
  switch(cmd){
   case 'music':
    if(!music.paused){music.pause();render();return;}
    if(!music.getAttribute('src')){music.src=sharedAssets.hallMusic;music.volume=.35;}
    music.play().then(render).catch(()=>toast('暫時無法播放公會配樂。'));return;
   case 'start':if(!s){s=freshGame();persist();}showCover=false;navigate('land');return;
   case 'restart':s=freshGame();showCover=false;persist();navigate('land');return;
   case 'cover':showCover=true;render();window.scrollTo(0,0);return;
   case 'tab':case 'go':navigate(a);return;
   case 'close':modal=null;render();return;
   case 'rating':case 'plot':case 'hero':case 'end':case 'new':modal=[cmd,a];render();return;
   case 'advance':advance(s);persist();modal=['recap'];render();panel.scrollTop=0;return;
   case 'list':{
    const item=document.querySelector('#sale-item').value, price=document.querySelector('#sale-price').value;
    toast(act(s,'list',item,price));break;
   }
   case 'order':toast(act(s,'order',document.querySelector('#order-item').value));break;
   case 'act':{
    const [key,value]=b.split(':');const msg=act(s,a,key,value);
    if(['build','expand','bridge','staff'].includes(a))log(s,msg);
    toast(msg);break;
   }
  }
  persist();render();
 }catch(e){toast(e.message);}
}
document.addEventListener('click',e=>{
 const target=e.target.closest('button[data-cmd]');
 if(target&&!target.disabled)dispatch(target.dataset.cmd,target.dataset.a||'',target.dataset.b||'');
 if(e.target===sheet){const rect=sheet.getBoundingClientRect();if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)dispatch('close','','');}
});
document.addEventListener('input',e=>{
 if(e.target.id==='sale-item'){const k=e.target.value;if(k)document.querySelector('#sale-price').value=ITEMS[k][1];}
 if(e.target.dataset.board==='reward'){s.board.reward=Number(e.target.value);persist();}
});
document.addEventListener('change',e=>{
 const node=e.target;
 if(node.dataset.board&&node.dataset.board!=='reward'){
  s.board[node.dataset.board]=node.type==='checkbox'?node.checked:node.value;
  persist();render();
 }else if(node.dataset.raid){toast(act(s,node.dataset.raid,node.value));persist();render();}
});
document.addEventListener('load',e=>{
 const img=e.target;
 if(img instanceof HTMLImageElement&&img.matches('.hero-mark img'))img.hidden=false;
},true);
sheet.addEventListener('cancel',e=>{e.preventDefault();dispatch('close','','');});
render();
