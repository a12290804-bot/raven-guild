# 《渡鴉公會》v2.5.0 接手入口

交接日：2026-10-31。給接手的妹妹／Claude。

請依序閱讀：

1. [姐姐給妹妹的交接信](TO_CLAUDE.md)：先掌握使用者偏好、目前版本與優先問題。
2. [完整交接狀況](HANDOFF_FULL.md)：架構、劇情、數值、素材、存檔、測試與交付邊界。
3. [已知問題與驗收清單](KNOWN_ISSUES.md)：包含本次交接才查出的缺口，不代表已修正。
4. [全項目狀態表](STATUS_MATRIX.csv)：涵蓋本次對話中一路提出的需求；「程式存在」與「本次驗收」分開。
5. [技術入口索引](SOURCE_MAP.json)、[交付版測試紀錄](QA_RESULT.json)、[檔案雜湊](MANIFEST.json)。

**目前狀況：**交付版為 v2.5.0，index.html 為24,336,789 bytes，SHA-256 為 `48affa41e0241ed3bdf536a7fc31ff3d0d126d9aca4022b576f3077aa3c9f029`。本次交接已確認 GitHub main 在 `78d4771135e1cf461619f2bcaf1fd713992de496` 的 index.html 與交付版 Git blob 相同；「尚未上傳」是上一份發佈說明的歷史狀態，不是現在的狀態。

公開網站的實際 Pages 發佈、手機快取與玩家長期存檔，本次未完成線上實機驗證。素材 PR #1 仍開啟、為草稿、尚未合併；新版使用固定原圖版本備援，因此未合併也可連網讀圖。

本次交接沒有修改遊戲內容或合併素材 PR。不要因看到交接文件便把未核定內容、舊版設定或其他《語嫣》專案合進正式遊戲。

## 下載包與 GitHub 文件的差別

完整 ZIP 含交付 index、原圖素材、v2.4.1 建置輸入、v2.5.0 補丁／樣式／測試、Gemini v3 PDF與文字、交接文件。可直接轉交給妹妹，不依賴上一位助理的暫存路徑。

GitHub `docs/handoff/v250/` 是可直接讀取的交接與原始碼說明；大檔交付 index 在 repository 根目錄。為避免25MB內嵌媒體影響審查，另附 `source/game.readable.js`，其 ASSETS/MUS 被換為空物件，**只供閱讀，不能當遊戲首頁或拿去覆蓋 index**。

## 重建

完整 ZIP 解壓後，從 package 根目錄執行：

```bash
python3 source/rebuild_offline.py
```

此命令在 `source/preview/dist/` 產生遊戲與測試頁，不覆蓋 package 根目錄交付 index。以靜態網頁伺服器開啟；測試頁為 `qa.html`、`regression.html`，結果分別位於 `#qa250`、`#qa241`。

若只有 GitHub checkout，先讀 `source/RESTORE_FROM_GIT.md`。`build.py` 的輸入必須是指定 v2.4.1 基底，不能把 v2.5.0 再丟入同一補丁流程。
