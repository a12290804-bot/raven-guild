'use strict';

const sharedAssets = (() => {
 const sources = {
  guild: ['raven-guild', 'main'],
  tactics: ['Yuyan-tactics', 'main'],
  lumen: ['lumen', 'main'],
  test: ['raven-guild-test', 'main']
 };
 function url(source, path) {
  if (!Object.hasOwn(sources, source)) throw new Error('未知的公開素材倉庫。');
  const segments = path.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) {
   throw new Error('素材必須使用倉庫內的完整路徑。');
  }
  const [repo, branch] = sources[source];
  const encodedPath = segments.map(encodeURIComponent).join('/');
  if (source === 'guild' && location.hostname === 'a12290804-bot.github.io' && location.pathname.startsWith('/raven-guild/')) {
   return '/raven-guild/' + encodedPath;
  }
  return 'https://raw.githubusercontent.com/a12290804-bot/' + repo + '/' + branch + '/' + encodedPath;
 }
 const art = key => url('guild', 'art/game-assets/' + key + '.webp');
 const mapArt = entries => Object.freeze(Object.fromEntries(
  Object.entries(entries).map(([key, filename]) => [key, art(filename)])
 ));
 return Object.freeze({
  url, encounter:art,
  portraits: mapArt({frost:'h_shieldF',jin:'h_spear',yuan:'h_archerH',yun:'h_herb',he:'h_knightW',qu:'h_horn'}),
  buildings: mapArt({hall:'bg_guild',shop:'bg_appraise',forge:'bg_sort',inn:'bg_inn',yard:'bg_village',
   watch:'bg_stele',depot:'bg_houses',route:'bg_station',wall:'bg_ch2_door'}),
  scenes: mapArt({market:'bg_appraise',heroes:'bg_inn',board:'bg_post',log:'bg_library',
   forest:'bg_fog',river:'bg_village',mine:'bg_mine',bridge:'bg_village'}),
  raids: mapArt({beast:'m_hyena',mist:'m_nameshade',taint:'m_whiteminer',unknown:'bg_fog'}),
  items: mapArt({herb:'i_moss',wax:'i_wax',salve:'i_potion',seal:'i_seal'}),
  village: url('guild', 'art/game-assets/bg_village.webp'),
  hallMusic: url('guild', 'audio/hall.mp3')
 });
})();
