from pathlib import Path
import re,json,hashlib
p=Path(__file__).resolve().parent
s=(p/'input/index.html').read_text()
# One ordinary equipment roll. Guaranteed first dominator epic occupies that battle's roll.
s=s.replace("const pDrop=Math.min(1,RUN.party.reduce", "const pDrop=Math.min(1,RUN.party.reduce",1)
a=s.index(' const pDrop=Math.min(1,RUN.party.reduce',s.index('function finishBattle(win,fled)'))
b=s.index(' materialsReward156(kind,elite,chief);',a)
s=s[:a]+" const loot250=ordinaryLoot250(kind,elite,chief,got.some(t=>t.includes('史詩')));if(loot250)got.push(loot250);\n"+s[b:]
# Remove chief's second equipment roll, leave currencies/relics untouched.
a=s.index('if(specialRoll156(.08,rewardRules154)){const pool=LEG_IDS.filter')
b=s.index('\n const loot250=',a)
chunk=s[a:b]
# This portion ends with chief's closing brace; preserve it.
s=s[:a]+'}'+s[b:]
# Random later dominator epics now belong to consolidated pool; first clear remains guaranteed.
s=s.replace('if(first||specialRoll156(.2,rewardRules154)){','if(first){',1)
# Mutation skill chance also scales, does not become guaranteed immunity or stun.
s=s.replace('+(DF().ch||0));','+(DF().ch||0)+Math.min(.15,(RUN.difficulty210||0)*.025));',1)
# Refresh older explanatory text to actual full difficulty model.
s=s.replace('敵方生命另×1.32ⁿ、攻擊另×1.22ⁿ；原難度特殊規則仍生效。','敵方生命另×1.32ⁿ、攻擊另×1.22ⁿ；另有本版體質壓力（首領生命與攻擊×1.30，普通×1.12／1.15；每階段再加生命×1.12ⁿ、攻擊×1.10ⁿ）。原難度特殊規則仍生效。')
s=s.replace('普通回憶有 2% 基礎史詩直掉；主宰首次必得隨機史詩，重複挑戰基礎 20%；可重複取得。','主宰首次必得隨機史詩；後續成品統一抽取，高難度提高機率與傳說／史詩比重。')
s=s.replace('勝利有 2.5% 基礎史詩直掉，受本場難度與掉寶加成。','房間結算統一抽取一次成品；高難度提高傳說／史詩比重，並保留血脈套裝來源。')
s=s.replace('難度只提高特色以上裝備機率。','難度會提高特色以上成品機率、傳說／史詩比重與新裝備能力。')
s=s.replace('第四章故事尚在準備，不會預先解鎖。','第四章完成候驗登記後開放領取；後續外傳仍待補齊。')
# Canonical lore only: preserve current slots and mechanics.
t=(p/'review/Gemini_v3.txt').read_text();t=t[t.index('陸、六件具名裝備'):]
lores=[]
for m in re.finditer(r'已通過潤色正文（實際字數：(\d+) 字）：\s*(.*?)\s*\(驗',t,re.S):
 text=re.sub(r'\s+','',m.group(2));count=len(re.sub(r'[^\u3400-\u9fffA-Za-z0-9]','',text));assert count==int(m.group(1)),(count,m.group(1));lores.append(text)
assert len(lores)==6,len(lores)
updates='\n'+''.join('UQ['+json.dumps(k)+'].lore='+json.dumps(l,ensure_ascii=False)+';\n' for k,l in zip(['st_banner','ft_watch','lg_lastpost','lg_lamp','ep_candle','ep_courier'],lores))
s=s.replace('let hadSave=load();',updates+(p/'update.js').read_text()+'\nlet hadSave=load();')
s=s.replace("const VER='v2.4.1'","const VER='v2.5.0'")
s=s.replace('im.onerror=()=>{resolve(null);};im.src=path;',"let retried=false;im.onerror=()=>{if(!retried&&path.startsWith('art/')){retried=true;im.src=MATERIAL_ROOT250+path;}else resolve(null);};im.src=path;")
s=s.replace('</style>',(p/'style.css').read_text()+'\n</style>')
(p/'preview/dist/index.html').write_text(s)
j=re.search(r'<script>(.*?)</script>',s,re.S).group(1);(p/'game.js').write_text(j)
for name in ['ASSETS','MUS']:j=re.sub(r'const '+name+r'=(\{.*?\});','const '+name+'={};',j,count=1,flags=re.S)
(p/'readable.js').write_text(j)
print(json.dumps({'version':'v2.5.0','bytes':len(s.encode()),'sha256':hashlib.sha256(s.encode()).hexdigest(),'lore_counts':[len(re.sub(r'[^\u3400-\u9fffA-Za-z0-9]','',x)) for x in lores]}))
