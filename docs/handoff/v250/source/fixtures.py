from pathlib import Path
p=Path(__file__).parent
s=(p/'preview/dist/index.html').read_text().replace("const KEY='RAVEN_GUILD_V4'","const KEY='RAVEN_TEST250'").replace('let hadSave=load();','let hadSave=false;').replace("localStorage.getItem('RAVEN_GUILD_V3')","null").replace("localStorage.getItem('RAVEN_GUILD_V2')","null")
(p/'preview/dist/qa.html').write_text(s.replace('</script>',(p/'qa.js').read_text()+'</script>'))
defs=(p/'legacy/base.txt').read_text()
for name,setup in [('chapter','reset();chapterMenu250();'),('visual','reset();await loadCostumes240();costumeMenu240(S.heroes.find(h=>h.key===\'spear\').id);'),('battle','reset();S.chapter250.step=4;chapterFight250();clearTimeout(TIMER230);'),('gear','reset();archiveGear250();')]:
 j='setTimeout(async()=>{annSeen=()=>true;'+defs+setup+'},800);'
 (p/f'preview/dist/{name}.html').write_text(s.replace('</script>',j+'</script>'))
# Retain typed branch coverage from previous release as a separate regression suite.
j=(p/'legacy/qa241.js').read_text().replace("VER==='v2.4.1'","VER==='v2.5.0'")
(p/'preview/dist/regression.html').write_text(s.replace('</script>',j+'</script>'))
