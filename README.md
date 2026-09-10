# Verba Orbis · 詞的世界

同一個意思，在八種語言裡怎麼切。

輸入單字、漢字詞或概念 → **先鎖定一個義項** → 依固定順序寫筆記：

**中文 → 韓語 → 日語**（漢字圈 + 三角對照）  
**英語 → 德語 → 西班牙語 → 法語 → 義大利語**（歐語圈 + 同源網）

這不是詞源拆解。形態／漢字拆解請用姐妹站 [Verba Radix Multi](../verba-radix-multi/)。

[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](LICENSE)

---

## 和 Radix Multi 的差別

| | Radix Multi | Orbis |
|---|---|---|
| 問題 | 這個**詞形**怎麼拆？ | 這個**意義**在八語怎麼坐？ |
| 單位 | 一種語言專案裡的一個詞 | 一個鎖定義，橫跨八語 |
| 存檔 | `radix-multi.*` | `orbis.*` |
| 金鑰 | `radix-multi.apiKey` | `orbis.apiKey`（設定裡可一鍵複製） |

兩個站互不覆寫對方的 localStorage。

---

## 快速開始

1. 雙擊 `index.html`（或用本機靜態伺服器）
2. 設定 → 填入 [xAI](https://console.x.ai) API Key
3. 輸入「鄉愁」或「愛」→ 比較 → 選定一個義項

`/` 聚焦搜尋框；Escape 關閉設定。

> API Key 只存在瀏覽器 `orbis.apiKey`，不會進 repo。

若瀏覽器擋 `file://` 對 `api.x.ai` 的 CORS，改用本機伺服器開啟即可（和 Radix 一樣）。

---

## 模型

| 設定 | 預設 |
|---|---|
| Base URL | `https://api.x.ai/v1` |
| Model | `grok-4.6`（可改 `grok-4.5`） |
| 推理強度 | **低**（API 預設是高，本站刻意壓低以免又慢又貴） |

每次查詢三次呼叫：列義項 → 漢字圈 → 歐語圈。漢字圈會先上畫面。

約略費用（低推理）：一次完整查詢 **$0.08–0.13**，漢字圈約 20–40 秒出現。

---

## 本機資料

| Key | 內容 |
|---|---|
| `orbis.settings` | 模型、推理、Radix 網址 |
| `orbis.apiKey` | 金鑰 |
| `orbis.history` | 依「詞 + 義項」存的筆記，不設上限 |
| `orbis.meta` | 雜項 |

歷史主鍵是客戶端算的 `senseKey`（詞性 + 中文義），不是模型回傳的 `s1`。

匯出預設**不含**金鑰。匯入會拒絕 `verba-radix-multi` 備份。

同一個查詢若歷史裡只有一筆，會直接打開上次筆記；仍可「更換義項」。

---

## 筆記密度（範例：鄉愁）

鎖定「對故鄉的思念之情」時，預期大約是：

- **中** 鄉愁 `xiāngchóu`（書面）／口語「想家」
- **韓** 향수（鄕愁，한자어）；고유어 그리움 較寬；另有「香水」一形
- **日** 郷愁（漢語・音讀）偏書面；日常 懐かしい／ホームシック
- **英** homesickness 較窄、nostalgia 較寬 → `split`
- **德** Heimweh ≈；Nostalgie 較寬
- **西** añoranza / morriña / nostalgia
- **法** mal du pays；nostalgie 較寬
- **義** nostalgia 較寬；smania di casa 近似

拼音只用調號（`xiāngchóu`），不用 `xiang1chou2`。

---

## 專案結構

```
verba-orbis/
├── index.html
├── config.js / config.example.js
├── css/styles.css
├── js/
│   ├── i18n.js
│   ├── schema.js      # 正規化、來源語、senseKey
│   ├── storage.js     # orbis.*
│   ├── prompts.js
│   ├── ai.js          # 三次呼叫 + JSON 修復
│   ├── ui.js
│   └── app.js
├── LICENSE
└── README.md
```

零建置。腳本順序寫死在 `index.html`。

---

## 隱私

- 瀏覽器直接呼叫 xAI；金鑰只在本機。
- 沒有雲端、沒有帳號、沒有遙測。
- 筆記標「AI 產生 · 僅供參考」——語源可能有誤。

---

Made for language learners · Verba series · Orbis
