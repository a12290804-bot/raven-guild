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
 return Object.freeze({
  url,
  portraits: Object.freeze(Object.fromEntries(
   Object.entries({frost:'shieldF',jin:'spear',yuan:'archerH',yun:'herb',he:'knightW',qu:'horn'})
    .map(([hero, asset]) => [hero, url('guild', 'art/game-assets/h_' + asset + '.webp')])
  )),
  village: url('guild', 'art/game-assets/bg_village.webp'),
  hallMusic: url('guild', 'audio/hall.mp3')
 });
})();
