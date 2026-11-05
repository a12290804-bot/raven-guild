// 《語嫣・永生戰棋》P0 資料（全部是測試提案數值，不是正史）
(function(root){
const DATA={
 rulesetVersion:'p0.1',
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
  P_SHIELD:{name:'盾衛',glyph:'盾',cls:'shield',troop:'INFANTRY',hp:169,atk:26,def:24,mag:0,res:10,move:3,rmin:1,rmax:1,dmg:'PHYSICAL',hit:0,eva:0},
  P_SPEAR:{name:'長槍手',glyph:'槍',cls:'spear',troop:'SPEAR',hp:137,atk:34,def:15,mag:0,res:8,move:3,rmin:1,rmax:1,dmg:'PHYSICAL',hit:5,eva:5},
  P_ARCHER:{name:'弓手',glyph:'弓',cls:'archer',troop:'ARCHER',hp:107,atk:32,def:9,mag:0,res:10,move:3,rmin:2,rmax:3,dmg:'PHYSICAL',hit:10,eva:10},
  P_LANTERN:{name:'提燈術士',glyph:'燈',cls:'lantern',troop:'MAGE',hp:101,atk:9,def:7,mag:34,res:18,move:3,rmin:1,rmax:2,dmg:'MAGICAL',hit:5,eva:5},
  E_INF:{name:'叛軍步兵',glyph:'步',troop:'INFANTRY',hp:92,atk:25,def:15,mag:0,res:6,move:3,rmin:1,rmax:1,dmg:'PHYSICAL',hit:0,eva:0},
  E_CAV:{name:'叛軍騎兵',glyph:'騎',troop:'CAVALRY',hp:86,atk:28,def:11,mag:0,res:6,move:5,rmin:1,rmax:1,dmg:'PHYSICAL',hit:0,eva:5},
  E_ARC:{name:'叛軍弓兵',glyph:'弓',troop:'ARCHER',hp:70,atk:24,def:7,mag:0,res:8,move:3,rmin:2,rmax:3,dmg:'PHYSICAL',hit:5,eva:5},
  E_MAG:{name:'灰袍術士',glyph:'術',troop:'MAGE',hp:66,atk:6,def:6,mag:26,res:14,move:3,rmin:1,rmax:2,dmg:'MAGICAL',hit:5,eva:0},
  E_CMD:{name:'敵軍指揮官',glyph:'將',troop:'CAVALRY',hp:170,atk:33,def:17,mag:0,res:12,move:5,rmin:1,rmax:1,dmg:'PHYSICAL',hit:10,eva:5,commander:true}
 },
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
   player:[['P_SHIELD',5,9],['P_SPEAR',6,8],['P_ARCHER',3,8],['P_LANTERN',4,9]],
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
