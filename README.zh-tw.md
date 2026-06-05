<div align="center">

# 🪁 Kroki Editor

**把圖表寫成程式碼、即時預覽，再複製一個圖片 URL 嵌進任何文件——輕快、可自架的 [Kroki](https://kroki.io) 網頁編輯器。**

[English](./README.md) · **繁體中文**

[![CI](https://github.com/yoyoys/kroki-editor/actions/workflows/ci.yml/badge.svg)](https://github.com/yoyoys/kroki-editor/actions/workflows/ci.yml)
[![License: Apache 2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)

![Kroki Editor](docs/images/editor.png)

</div>

## 為什麼做這個？

我工作上會畫大量圖表，並嵌入到公司的文件系統裡。多數文件平台只原生支援 **Mermaid**——而 Mermaid 雖然方便，卻不足以涵蓋我的需求：更多圖型、更細的版面控制、針對不同情境用對的工具。

[Kroki](https://kroki.io) 解決了「渲染」這一塊：它把文字轉成約 25 種圖表語言（PlantUML、GraphViz、D2、BPMN⋯⋯），並把每張圖以**單純的圖片 URL** 提供。那個 URL 能嵌入到*任何*接受圖片的文件系統——不管平台本身懂不懂那種圖表語言。

**Kroki Editor 就是這套流程的編寫前端。** 寫原始碼、即時預覽、複製可直接嵌入的圖片 URL 或 Markdown。指向你自己的 Kroki，就成了一個輕量、可自架、給文件用的圖表工作室。

## 功能特色

- ✍️ **即時預覽** —— 左邊編輯圖表原始碼，右邊即時渲染（含 debounce）。
- 🧩 **支援所有 Kroki 圖型** —— PlantUML、Mermaid、GraphViz、D2、BPMN 等等，型別選單可由設定控制。
- 🎨 **語法高亮** —— Mermaid、JSON（Vega/Vega-Lite/Excalidraw/WaveDrom）、XML（BPMN）、YAML（WireViz）、LaTeX（TikZ）、SQL（DBML），另外內建 PlantUML、D2、GraphViz 與 blockdiag 家族的輕量 tokenizer。
- 📱 **手機友善** —— 小螢幕用單窗格的 編輯/預覽 切換；桌面則是可拖曳的分割版面。
- 🔍 **講究的縮放/平移** —— `+`/`−`/符合畫面/1:1 按鈕與拖曳平移（不會誤觸滾輪縮放）；觸控可雙指 pinch；另有含 minimap 的全螢幕模式。
- 🔗 **分享** —— 圖片直連、Embed Markdown、可編輯連結；一鍵複製並顯示「已複製」回饋，工具列還有快速「複製圖片連結」按鈕。
- 🖼️ **範例畫廊** —— 可搜尋的卡片 + 即時縮圖。
- 🌗 **明亮 / 深色主題**，以及可切換的預覽背景（近白 / 近黑）。
- 🌐 **多語系** —— 英文與繁體中文，依瀏覽器自動偵測，並可手動切換。
- ⚡ **可選的 client-side Mermaid** —— 在瀏覽器直接渲染 Mermaid（不需 companion 服務）。
- 📦 **純前端容器** —— nginx 提供靜態檔，啟動時用環境變數注入設定，可部署在任意子路徑下。

## 快速開始（Docker）

從 GitHub Container Registry 拉取映像，指向你的 Kroki：

```sh
docker run --rm -p 8080:80 \
  -e KROKI_ENDPOINT=https://kroki.io \
  ghcr.io/yoyoys/kroki-editor:latest
```

打開 <http://localhost:8080> 就完成了——免建置，設定在容器啟動時注入。

## 設定

設定的解析優先序：**`window.__KROKI_CONFIG__`**（容器啟動時注入）→ **`import.meta.env.VITE_*`**（build/dev）→ **內建預設值**。

### Runtime 環境變數（Docker）

容器啟動時透過 `envsubst` 注入到 `config.js`，不需重新 build。

| 變數 | 預設 | 說明 |
|---|---|---|
| `PAGE_TITLE` | `Kroki Editor` | 瀏覽器分頁標題與畫面上的 header 標題。 |
| `KROKI_ENDPOINT` | `https://kroki.io` | 用來渲染編輯器預覽的 Kroki 實例。 |
| `EXAMPLE_KROKI_ENDPOINT` | *(未設則沿用 `KROKI_ENDPOINT`)* | 範例畫廊縮圖的 endpoint。範例涵蓋所有型別，若主 endpoint 缺某些 companion 服務，可指向功能完整的實例。 |
| `ENABLED_DIAGRAMS` | *(全部型別)* | 型別選單的允許清單，逗號分隔，例如 `plantuml,mermaid,d2`。空 = 全部。 |
| `DEFAULT_DIAGRAM` | `plantuml` | 首次載入時選取的圖型。 |
| `MERMAID_CLIENT_SIDE` | `false` | 在瀏覽器渲染 Mermaid（動態載入），不經 Kroki——當你的 Kroki 沒裝 Mermaid companion 時很方便。 |
| `EXAMPLE_PLANTUML`、`EXAMPLE_MERMAID`、`EXAMPLE_GRAPHVIZ`、`EXAMPLE_D2` | *(內建)* | 覆蓋該型別的預設範例原始碼。值為**已編碼**的圖表原始碼（見下）。 |

範例：

```sh
docker run --rm -p 8080:80 \
  -e KROKI_ENDPOINT=https://kroki.internal.example \
  -e EXAMPLE_KROKI_ENDPOINT=https://kroki.io \
  -e ENABLED_DIAGRAMS=plantuml,mermaid,graphviz,d2 \
  -e DEFAULT_DIAGRAM=plantuml \
  -e MERMAID_CLIENT_SIDE=true \
  ghcr.io/yoyoys/kroki-editor:latest
```

### 產生 `EXAMPLE_<TYPE>` 的值

編碼值是把圖表原始碼用 zlib **deflate** 壓縮後再 **base64url** —— 跟 Kroki 在 URL 用的編碼一致。幾種簡單取得方式：

- 在編輯器打開該圖，從 Share 對話框的**可編輯網址**複製 `#<type>/` 後面那段。
- 在本 repo：`pnpm encode < diagram.puml`。
- 或不下載原始碼、直接在 shell：

  ```sh
  python3 -c "import sys,zlib,base64;print(base64.urlsafe_b64encode(zlib.compress(sys.stdin.buffer.read(),9)).decode().rstrip('='))" < diagram.puml
  ```

## 語法高亮

CodeMirror 6，配主題感知的色盤（明暗用 CSS 變數切換）。涵蓋範圍：

| 原始語言 | 圖型 |
|---|---|
| Mermaid | `mermaid` |
| JSON | `vega`、`vegalite`、`excalidraw`、`wavedrom` |
| XML | `bpmn` |
| YAML | `wireviz` |
| LaTeX | `tikz` |
| SQL（鬆散） | `dbml` |
| 內建 tokenizer | `plantuml`、`c4plantuml`、`d2`、`graphviz`、`blockdiag`/`seqdiag`/`actdiag`/`nwdiag`/`packetdiag`/`rackdiag` |

沒有 grammar 的型別（例如 ditaa、svgbob）以純文字顯示。

## Client-side Mermaid

設 `MERMAID_CLIENT_SIDE=true` 後，Mermaid 圖會用 [`mermaid`](https://mermaid.js.org/) 函式庫直接在瀏覽器渲染（動態載入——不會撐大預設 bundle）。其餘型別仍走 Kroki。當你的自架 Kroki 沒跑 Mermaid companion 容器時特別有用。

## 範例畫廊

可搜尋的現成圖表畫廊。點卡片即載入編輯器；若你有未儲存的編輯，會先詢問。

![範例畫廊](docs/images/examples.png)

## 部署在子路徑下

build 使用 Vite `base: './'`，所有資源都用相對路徑，因此容器可掛在反向代理的任意路徑下（例如 `https://tools.example.com/kroki-editor/`）。

## 開發

本機開發設定、開發用環境變數、可用的 script，以及映像如何建置與發佈，都整理在 **[DEVELOPMENT.md](./DEVELOPMENT.md)**。

## 意見回饋

有功能需求、使用上的問題，或遇到 bug 嗎？歡迎[開一個 Issue](https://github.com/yoyoys/kroki-editor/issues)。

## 致謝與授權

靈感來自 webgiss 的 [niolesk](https://github.com/webgiss/niolesk)。圖表渲染由 [Kroki](https://kroki.io) 提供。範例圖表來自 niolesk。

採用 [Apache License 2.0](./LICENSE) 授權。
