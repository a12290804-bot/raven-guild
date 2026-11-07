# 渡鴉公會・邊境領地

手機直式經營遊戲。入口為本資料夾的 `index.html`，在 GitHub Pages 的 `/raven-guild/frontier-estate/` 遊玩。進度存在遊玩所用瀏覽器的本機儲存。

## 共用 GitHub 圖片與音樂

遊戲已使用《渡鴉公會》的村莊圖、六名英雄立繪及大廳配樂。標題畫面或簿冊可開啟背景音樂。共享圖片載入失敗時，領地畫面使用包內封面，英雄顯示職業圖示。

`shared-assets.js` 的 `sharedAssets.url(來源代號, 倉庫內路徑)` 會組成公開原始檔網址。圖片可用於 `img.src`，音樂可用於 `audio.src`。其他遊戲可以按相同方式引用。原圖和音樂維持在各自的倉庫。

| 代號 | GitHub 倉庫 |
| --- | --- |
| guild | `a12290804-bot/raven-guild` |
| tactics | `a12290804-bot/Yuyan-tactics` |
| lumen | `a12290804-bot/lumen` |
| test | `a12290804-bot/raven-guild-test` |

`shared-catalog.json` 是上述四個公開倉庫在 2026-11-08 的圖片與音訊路徑索引。新增檔案後可直接用新路徑，不必等待索引更新。inbox 中的圖保留原檔名，實際接入時依角色或用途挑選。
