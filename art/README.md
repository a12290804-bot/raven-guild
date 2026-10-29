# 渡鴉公會｜美術資產（art）

這是《渡鴉公會》新圖片的專用存放區。**新圖只加到 `art/`，不要刪除、搬動或覆寫舊的 `assets/`（若有）**。舊版資產繼續留存作備份，已運作的遊戲讀圖路徑不要在尚未修改程式前擅自切換。

## 資料夾

| 位置 | 用途 | 代號 |
| --- | --- | --- |
| `art/inbox/` | 尚未確認名稱、角色或分類的圖片 | 暫存原檔名 |
| `art/heroes/` | 英雄立繪 | `h_` |
| `art/monsters/` | 怪物、領主 | `m_`、`b_` |
| `art/backgrounds/` | 地圖與場景背景 | `bg_` |
| `art/events/` | 劇情與事件圖 | `ev_` |
| `art/npc/` | 村民和 NPC | `n_` |
| `art/yuyan/` | 語嫣相關圖 | `y_` |
| `art/items/` | 圖示、裝備與道具 | `i_` |

## 命名、狀態與相容性

- 正常命名以 **英文小寫、數字、底線** 組成，檔名使用**遊戲內部正式代號**，不使用自動產生的 `sand-save-`、`file_`、`grok_image` 等亂碼名稱。
- **既有代號例外：大小寫不可擅自修改。** 妹妹提供的英雄 ID 包含 `shieldF`、`knightW`、`mageF` 等大寫字母，三轉後綴也明定為 **`_C`（大寫 C）**。因此請保留遊戲實際代號，如 `h_shieldF_C.png`。若要全改小寫，必須先同步修改遊戲資產對照表及程式。
- 可接受副檔名：`.png`、`.jpg`、`.webp`。同一代號不要同時放多種副檔名造成衝突；遊戲讀取程式應使用實際副檔名。
- 英雄狀態：一般無後綴（`h_tiekou.png`）；受傷 `_d`；倒下 `_f`；重傷 `_x`；三轉 `_C`。
- 領主階段：`_p2`、`_p3`；已有清單若另指定 `_d` 或 `_x`，仍依遊戲正式代號使用。
- 一時無法辨識的圖請先傳 `art/inbox/`，並在 `art/inbox/README.md` 補一行「原檔名 → 這是誰／什麼」，確認後才搬進正式分類。
- 網址和大小寫均可能影響讀取。搬動、重新命名舊檔，或切換程式路徑前請先確認引用，避免圖片失效。

## 待畫清單

### 英雄：三轉立繪（21 張）

- [ ] `h_shieldF_C.png`
- [ ] `h_shieldM_C.png`
- [ ] `h_shield0_C.png`
- [ ] `h_knightW_C.png`
- [ ] `h_bone_C.png`
- [ ] `h_tiekou_C.png`
- [ ] `h_spear_C.png`
- [ ] `h_horn_C.png`
- [ ] `h_dragon_C.png`
- [ ] `h_mageF_C.png`
- [ ] `h_mageM_C.png`
- [ ] `h_mage0_C.png`
- [ ] `h_foxgirl_C.png`
- [ ] `h_fox_C.png`
- [ ] `h_raven_C.png`
- [ ] `h_archerH_C.png`
- [ ] `h_healerF_C.png`
- [ ] `h_healer1_C.png`
- [ ] `h_herb_C.png`
- [ ] `h_snake_C.png`
- [ ] `h_spider_C.png`

### 英雄：鐵扣與藥鱗巨蟒

- [ ] `h_tiekou.png` — 鐵扣・普通
- [ ] `h_tiekou_d.png` — 鐵扣・受傷
- [ ] `h_tiekou_f.png` — 鐵扣・倒下
- [ ] `h_snake_beast.png` — 藥鱗巨蟒形態

### 白鐵礦城

- [ ] `bg_mine.png` — 場景背景
- [ ] `m_ironpick.png` — 自己挖的鐵鎬
- [ ] `m_minecart.png` — 載著人的礦車
- [ ] `m_whiteminer.png` — 白鐵礦工的影子
- [ ] `m_rustlung.png` — 鏽肺
- [ ] `b_deepdrill.png` — 領主：掘進機・深挖

### 第三章

**背景**

- [ ] `bg_station.png`
- [ ] `bg_f5.png`
- [ ] `bg_namewall.png`
- [ ] `bg_sort2.png`

**領主**

- [ ] `b_qianhao.png`
- [ ] `b_qianhao_p2.png`
- [ ] `b_qianhao_d.png`

**小首領**

- [ ] `m_courier.png`
- [ ] `m_clocktower.png`

**怪物**

- [ ] `m_rustrat.png`
- [ ] `m_sortarm.png`
- [ ] `m_leech.png`
- [ ] `m_dutyghost.png`

### 之前缺的

- [ ] `m_paper.png`
- [ ] `m_talis.png`
- [ ] `m_wgod.png`
- [ ] `m_blindoff.png`
- [ ] **各主宰的 `_x` 重傷版本**：待妹妹提供完整的主宰代號清單後逐一列名，避免自行猜測。

> 上述 `.png` 是建議交付格式；若實際採用 `.jpg` 或 `.webp`，請依一致的檔名主體加上實際副檔名。打勾僅代表有檔案且已核對，不代表僅有資料夾就算完成。

## 上傳／核對流程

1. 先查遊戲正式代號及圖像對應角色，不確定就放 `inbox/`。
2. 新圖依類別上傳，保持代號精確、不更動既有舊檔。
3. 每張圖比對內容、狀態、正式代號、後綴與副檔名後，再更新上方清單。
4. 妹妹讀圖時使用 `art/<分類>/<檔名>`；**實際切換遊戲載入路徑需另行修改程式，建立資料夾不會自動生效**。

## 公開倉庫安全

此 repo 為公開資源。**禁止上傳私人聊天、完整世界書、成人設定、金鑰／API Token、個資，或未獲授權的圖片和音樂。** 若資訊不確定是否能公開，請先不要上傳。
