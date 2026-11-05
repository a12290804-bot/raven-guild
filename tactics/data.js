// 《語嫣・永生戰棋》P0 資料（全部是測試提案數值，不是正史）
(function(root){
const DATA={
 rulesetVersion:'p1a.1',
 terrain:{
  PLAIN:{name:'平原',cost:1,def:0,pass:true,glyph:''},
  FOREST:{name:'森林',cost:2,def:.15,pass:true,glyph:'林'},
  HILL:{name:'高地',cost:2,def:.10,pass:true,height:1,glyph:'丘'},
  SWAMP:{name:'沼澤',cost:3,def:0,pass:true,glyph:'沼'},
  WALL:{name:'城牆',cost:99,def:.25,pass:false,blockLos:true,glyph:'牆'},
  SHALLOW_WATER:{name:'淺水',cost:2,def:-.10,pass:true,glyph:'水'},
  DEEP_WATER:{name:'深水',cost:99,def:0,pass:false,glyph:'淵'},
  FLESH:{name:'血肉地',cost:2,def:-.10,pass:true,glyph:'肉'},
  GATE:{name:'城門',cost:99,def:0,pass:false,blockLos:true,glyph:'門'}
 },
 // 兵種克制：攻方 → 被克方
 counters:{INFANTRY:['SPEAR'],SPEAR:['CAVALRY'],CAVALRY:['ARCHER','MAGE'],ARCHER:['FLYING'],MAGE:['INFANTRY'],FLYING:[],CLERIC:['BEAST'],BEAST:[]},
 troopName:{INFANTRY:'步兵',SPEAR:'槍兵',CAVALRY:'騎兵',ARCHER:'弓兵',FLYING:'飛行兵',MAGE:'法術兵',CLERIC:'聖職兵',BEAST:'妖物兵'},
 units:{
  // 我方：先用「兵種隊伍」代替角色（全部是測試提案數值）
  P_SHIELD:{name:'盾衛隊',glyph:'盾',cls:'shield',troop:'INFANTRY',hp:150,atk:24,def:24,mag:0,res:10,move:3,rmin:1,rmax:1,dmg:'PHYSICAL',hit:0,eva:0,soldiers:5,hpPer:16,skill:'guardStance'},
  P_SPEAR:{name:'長槍隊',glyph:'槍',cls:'spear',troop:'SPEAR',hp:122,atk:32,def:15,mag:0,res:8,move:3,rmin:1,rmax:1,dmg:'PHYSICAL',hit:5,eva:5,soldiers:5,hpPer:14,skill:'pierce'},
  P_LANTERN:{name:'提燈術士隊',glyph:'燈',cls:'lantern',troop:'MAGE',hp:92,atk:9,def:7,mag:32,res:18,move:3,rmin:1,rmax:2,dmg:'MAGICAL',hit:5,eva:5,soldiers:5,hpPer:10,skill:'lampZone'},
  P_ARCHER:{name:'弓手隊',glyph:'弓',cls:'archer',troop:'ARCHER',hp:106,atk:30,def:9,mag:0,res:10,move:3,rmin:2,rmax:3,dmg:'PHYSICAL',hit:10,eva:10,soldiers:5,hpPer:11,skill:'markShot'},
  P_HEALER:{name:'治療師隊',glyph:'醫',cls:'healer',troop:'CLERIC',hp:92,atk:8,def:9,mag:18,res:20,move:3,rmin:1,rmax:2,dmg:'MAGICAL',hit:0,eva:5,soldiers:5,hpPer:10,skill:'mend'},
  P_WEAVER:{name:'織者隊',glyph:'織',cls:'weaver',troop:'MAGE',hp:94,atk:10,def:9,mag:27,res:16,move:3,rmin:1,rmax:2,dmg:'MAGICAL',hit:5,eva:10,soldiers:5,hpPer:10,skill:'bind'},
  P_SCOUT:{name:'斥候隊',glyph:'斥',cls:'scout',troop:'INFANTRY',hp:104,atk:28,def:11,mag:0,res:10,move:4,rmin:1,rmax:1,dmg:'PHYSICAL',hit:10,eva:20,soldiers:5,hpPer:12,skill:'shadowStep'},
  E_INF:{name:'叛軍步兵',glyph:'步',troop:'INFANTRY',hp:92,atk:25,def:15,mag:0,res:6,move:3,rmin:1,rmax:1,dmg:'PHYSICAL',hit:0,eva:0,soldiers:5,hpPer:14},
  E_CAV:{name:'叛軍騎兵',glyph:'騎',troop:'CAVALRY',hp:86,atk:28,def:11,mag:0,res:6,move:5,rmin:1,rmax:1,dmg:'PHYSICAL',hit:0,eva:5,soldiers:5,hpPer:14},
  E_ARC:{name:'叛軍弓兵',glyph:'弓',troop:'ARCHER',hp:70,atk:24,def:7,mag:0,res:8,move:3,rmin:2,rmax:3,dmg:'PHYSICAL',hit:5,eva:5,soldiers:5,hpPer:10},
  E_MAG:{name:'灰袍術士',glyph:'術',troop:'MAGE',hp:66,atk:6,def:6,mag:26,res:14,move:3,rmin:1,rmax:2,dmg:'MAGICAL',hit:5,eva:0,soldiers:5,hpPer:9},
  E_CMD:{name:'敵軍指揮官',glyph:'將',troop:'CAVALRY',hp:170,atk:33,def:17,mag:0,res:12,move:5,rmin:1,rmax:1,dmg:'PHYSICAL',hit:10,eva:5,commander:true,soldiers:5,hpPer:18}
 },
 // 七職業測試技能（不是正史技能名）
 skills:{
  guardStance:{name:'守護姿態',cd:3,kind:'self',dur:2,share:.4,defUp:.1,desc:'2 回合：相鄰隊友受到的傷害，40% 改由盾衛承受；自己防禦 +10%。'},
  pierce:{name:'貫穿突刺',cd:2,kind:'attack',range:[1,1],mult:1.1,line:true,noCounter:true,area:true,desc:'刺向相鄰敵人並穿到後面一格，兩個都吃 1.1 倍傷害，不會被反擊。'},
  lampZone:{name:'燈界',cd:3,kind:'zone',range:[0,2],dur:2,buff:.1,desc:'在 2 格內放一個 3×3 燈界，2 回合：我方在裡面攻擊與防禦 +10%；燈界裡的格子不會被異變改寫。'},
  markShot:{name:'弱點標記',cd:2,kind:'attack',mult:.9,mark:2,markAmp:.2,desc:'0.9 倍傷害並標記 2 回合：被標記的敵人受到的傷害 +20%。'},
  mend:{name:'光縫修復',cd:2,kind:'ally',range:[0,2],heal:.3,solHeal:.35,desc:'2 格內隊友（含自己）回復 30% 生命、補回 35% 士兵，並解除束縛與標記。'},
  bind:{name:'束縛之線',cd:3,kind:'attack',range:[1,3],mult:.6,root:1,noCounter:true,desc:'3 格內，0.6 倍傷害，目標下一個回合不能移動（還能攻擊）。不會被反擊。'},
  shadowStep:{name:'影徑',cd:2,kind:'dash',extraMove:1,ignoreZoc:true,flank:.2,desc:'這次移動 +1 而且無視控制區；之後可以攻擊，目標旁邊有我方隊友時傷害 +20%（背襲）。'}
 },
 // 軍陣：一次只能一種；換陣要用掉主要行動（可以先移動）
 forms:{
  NONE:{name:'無陣',desc:'沒有效果。'},
  SHIELD_WALL:{name:'堅盾陣',physIn:-.15,move:-1,desc:'受到的物理傷害 −15%，移動 −1。'},
  PIKE:{name:'長槍陣',counterVsCav:.2,noCharge:true,desc:'反擊騎兵時傷害 +20%，騎兵衝鋒對你無效。'},
  SKIRMISH:{name:'散兵陣',areaIn:-.1,guardShare:.5,desc:'受到範圍傷害 −10%；守護姿態能分攤的比例減半。'},
  ASSAULT:{name:'突擊陣',atkOut:.15,counterIn:.1,desc:'主動攻擊 +15%，但受到反擊 +10%。'}
 },
 soldierBonus:.2, // 士兵滿編時攻防 +20%，人數越少越低
 charge:{minCost:3,bonus:.2},
 deploySlots:[[5,9],[6,8],[3,8],[4,9]],
 defaultTeam:['P_SHIELD','P_SPEAR','P_ARCHER','P_LANTERN'],
 missions:{
  MISSION_BC_001:{
   name:'黑鐘城・第一次圍攻（原型關卡）',w:12,h:12,roundLimit:8,
   map:[
    '...F....F...',
    '.F........F.',
    '....H.......',
    'DDw.....FF..',
    'Dw..F..SS...',
    'w...F..S..H.',
    '............',
    '.H.F....F...',
    '...H....H...',
    '............',
    'WWWWWGWWWWWW',
    '............'],
   legend:{'.':'PLAIN',F:'FOREST',H:'HILL',S:'SWAMP',W:'WALL',w:'SHALLOW_WATER',D:'DEEP_WATER',G:'GATE',X:'FLESH'},
   gate:{x:5,y:10,hp:300,def:10,res:0},
   enemy:[['E_MAG',5,0],['E_ARC',6,0],['E_CAV',5,1],['E_CAV',6,1],['E_INF',3,2],['E_INF',8,2]],
   events:[
    {round:1,say:'斥候回報：北方通道有馬蹄聲，敵方騎兵會從中路衝鋒。'},
    {round:2,say:'東北的森林開始發出微光——下一回合開始時，(8,3)、(9,3) 會變成血肉地。',warn:[[8,3],[9,3]]},
    {round:3,terrain:[[8,3,'FLESH'],[9,3,'FLESH']],say:'東北兩格森林塌成了血肉地（移動 2、防禦 −10%）。'},
    {round:5,spawn:[['E_CMD',6,0]],say:'敵軍指揮官自北方進場：「把門給我撞開。」擊倒他且城門還在，就能提前獲勝。'},
    {round:6,pressure:true,say:'城門壓力提高：敵人開始不顧一切地攻門。'}
   ],
   win:'守住城門到第 8 回合結束；或擊倒敵軍指揮官且城門還在。',
   lose:'城門被打破，或我方英雄全滅。',
   outcomes:[
    {id:'HOLD_CLEAN',when:'守城成功、城門生命 ≥ 200',world:'民眾信任 +10、安定 +5',next:'下一場友軍補給與支援'},
    {id:'BROKEN_WALL',when:'勝利但城門生命 < 150',world:'安定 −10，記錄「破牆」',next:'城門出現破洞入口'},
    {id:'DEFEAT',when:'失敗後接受戰敗',world:'勢力掌控轉為危險、補給 −10',next:'觸發奪回城門的支線'}
   ]
  }
 }
};
if(typeof module!=='undefined'&&module.exports)module.exports=DATA;else root.TACTICS_DATA=DATA;
})(this);
