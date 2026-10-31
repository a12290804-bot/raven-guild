# 只有 GitHub checkout 時重建

完整下載ZIP已含輸入，不必做這節。GitHub文件目錄不再重複存25MB首頁或24MB舊基底。

1. 保留根目錄當前index。將整個 `docs/handoff/v250` 目錄複製到另一個工作目錄，例如 `/tmp/raven-v250`，保留其source子目錄。
2. 在遊戲repository讀歷史基底：`git show d434f48d1576a745bc9c3378000b9d28bab15d71:index.html`，寫入複製目錄的 `source/input/index.html`。這是v2.4.1，SHA-256必須為`70c67195ced9633eea4aed993743c1d1f9f83f7a820855e9978661edadd4a3fb`。
3. 本地art如尚未含新素材，讀取素材分支固定commit `a3761e78e2c729faea8bf44aeb9652c74f04825a`。`asset_entries.json`逐項列出路徑與Git blob，可用 `git show <commit>:<path>` 恢復；恢復到 `/tmp/raven-v250/art/` 的對應位置。先取得該分支後再讀，不重生圖片。
4. 從複製目錄執行 `python3 source/rebuild_offline.py`。輸出在該目錄的 `source/preview/dist`，不能把current v2.5再當輸入。
5. 腳本會比對最終SHA-256；不符就停止，不以只改VER字串解決。

若只需閱讀，`game.readable.js`已附所有邏輯與資料表，但移除了ASSETS/MUS大型媒體資料；不能直接當遊戲首頁。

建置只需Python標準函式庫；Node若存在則加做語法檢查。瀏覽器測試仍需真正開啟靜態頁面，不能把成功產生QA頁當成測試通過。
