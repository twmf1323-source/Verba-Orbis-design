# Verba Athanor · 詞的煉金爐

把一個法語或英語詞投入爐中。它會結晶成最小語素；點語素可以：

- **蒸餾** — 回推更早的詞根（古法語、拉丁、希臘、PIE）
- **派生** — 看共用這枚語素的法語詞
- **複合** — 看合劑與複合構詞

這不是 Verba Radix 的換皮。Radix 是多語言詞根**筆記**；Athanor 是詞源的**煉金術桌台**（同一爐、多個語言專案）。頂部可切 **Français / English / 日本語 / 한국어**。日語是仙氣丹房；韓語是書院月下與月白瓷。兩者背景圖不同，音樂同為《Beneath the Sacred Peak》。

## 怎麼開

雙擊 `index.html`，或：

```powershell
cd C:\Users\Gary\verba-athanor
python -m http.server 8765
```

然後開 http://127.0.0.1:8765

雲端資料夾要這個本機網址，並且用 Chrome 或 Edge。直接雙擊 `index.html` 不能記住資料夾。若 8765 已被佔用，改別的埠即可，例如 `python -m http.server 8766`。

## 不放金鑰也能玩

內建示範配方（不呼叫 API）：

- 法語：`incroyable` · `parapluie` · `souvenir` · `bibliothèque` · `défaire` · `aujourd'hui`
- 英語：`unbelievable` · `sunflower` · `remember` · `bookshelf` · `undo` · `today`
- 日語：`信じられない` · `雨傘` · `思い出` · `図書館` · `取り消す` · `今日`
- 韓語：`불가능` · `우산` · `추억` · `도서관` · `취소하다` · `오늘`

點底部封印，或自己輸入這些詞。

## 任意詞（依法／英語專案）

爐房設定可選三家，金鑰分開保存：

| 供應商 | 金鑰 | 預設模型 | Base URL |
|---|---|---|---|
| **Grok**（xAI） | [console.x.ai](https://console.x.ai) | `grok-4.6` | `https://api.x.ai/v1` |
| **DeepSeek** | [platform.deepseek.com](https://platform.deepseek.com/api_keys) | `deepseek-v4-flash` | `https://api.deepseek.com` |
| **Google** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | `gemini-3.8-flash` | Gemini OpenAI 相容端點 |

貼上金鑰時會依前綴自動判斷（`xai-` / `sk-` / `AIza`）。也可「從 Radix Multi 複製 Grok 金鑰」。推理強度建議 **低**。金鑰只在 `localStorage`（`athanor.keys`），不會進 repo。

語源是模型知識，畫面上標「僅供參考」。若某家從瀏覽器被 CORS 擋住，換一家，或用本機靜態伺服器開啟。

## 操作

| 動作 | 效果 |
|---|---|
| 投入爐中 | 新的一爐，重置爐台 |
| 點詞／語素／派生 | 朗讀（瀏覽器法語聲線，可改 Grok TTS） |
| 爐樂／音效 | 背景曲 *The Alchemist's Dawn*（循環）＋投入／結晶／蒸餾等音效（可關） |
| 點語素後的羊皮紙操作 | 蒸餾／派生／複合 |
| 點析出的詞 → 投入爐中 | 把該詞當下一爐 |
| 拖曳節點／滾輪 | 移動、縮放星圖 |
| 藥櫃 | 收集過的語素。點選＝投入新的一爐；拖到爐上的詞／語素（或點「合」）＝看兩枚有無複合詞 |
| 魔典 | 本機煉成紀錄 |
| 雲端資料夾 | 爐房設定 → 魔典。選 Google 雲端硬碟裡的資料夾，讀寫 `athanor-backup.json`（全部語言的魔典與藥櫃）。金鑰與爐房設定不上傳。取消連結只忘記資料夾，不刪檔 |

## 與 Verba 系列

| | Radix Multi | Orbis | **Athanor** |
|---|---|---|---|
| 問題 | 這個詞怎麼拆？ | 這個意思在八語裡是什麼？ | 這枚語素還能煉出什麼、從哪來？ |
| 範圍 | 多語言專案 | 八語對照 | 法語／英語專案（同一站） |
| 金鑰 | `radix-multi.apiKey` | `orbis.apiKey` | `athanor.apiKey` |

## 結構

```
verba-athanor/
├── index.html
├── config.js
├── css/styles.css
├── img/           # 煉金爐、變陣、實驗室
└── js/            # schema · prompts · demo · ai · graph · fx · ui · app
```

零建置。MIT。
