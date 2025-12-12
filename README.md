# YouTube 轉部落格文章生成器 - 多 AI 供應商版本

> 🚀 使用9種AI供應商（Gemini, OpenAI, Claude, Groq, DeepSeek, Zhipu AI, Moonshot AI, Mistral AI, Cohere）將 YouTube 視頻轉換為 SEO 優化的部落格文章

## ✨ 主要特色

### 🤖 多 AI 供應商支援（9個）

#### 🇺🇸 美國供應商
- **Google Gemini** - 快速穩定，免費使用 ⚡
- **OpenAI GPT-4o** - 最高品質輸出 🏆
- **Anthropic Claude** - 精確理解，長文本處理 🎯
- **Groq** - 超高速度，免費使用 🚀

#### 🇨🇳 中國供應商（超低價）
- **DeepSeek** - GPT-4級別性能，僅$0.14/1M tokens 💰
- **Zhipu AI (智譜)** - GLM系列，中文優秀，$0.07/1M tokens 🇨🇳
- **Moonshot AI (月之暗面)** - Kimi品牌，超長上下文200K+ 📚

#### 🇪🇺 歐洲供應商
- **Mistral AI** - 法國開源友好，歐盟合規 🇫🇷
- **Cohere** - 企業級RAG專用，多語言支持 🏢

### 💫 進階功能
- ✅ **串流生成** - 即時顯示 AI 生成過程
- ✅ **多語言支援** - 繁體中文、简體中文、English、日本語
- ✅ **文章風格** - 專業、輕鬆、技術、新聞四種風格
- ✅ **API Key 管理** - 每個供應商獨立儲存
- ✅ **智能API連結** - 切換供應商時自動顯示API申請連結
- ✅ **現代化 UI** - Glassmorphism 設計，響應式佈局

## 🚀 快速開始

### 1. 安裝依賴
```bash
npm install
```

### 2. 啟動服務器
```bash
npm run dev    # 開發模式（自動重啟）
# 或
npm start      # 生產模式
```

### 3. 訪問應用
打開瀏覽器訪問：**http://localhost:3000**

## 📖 使用指南

### 基本流程
1. **選擇 AI 供應商** - 從9個供應商中選擇
2. **選擇模型** - 根據供應商自動更新可用模型
3. **輸入 API Key** - 為所選供應商輸入密鑰
4. **貼上 YouTube URL** - 任何 YouTube 視頻連結
5. **設定選項** - 選擇文章風格和輸出語言
6. **啟用串流**（可選）- 即時顯示生成過程
7. **生成文章** - 點擊按鈕開始轉換
8. **複製或下載** - 獲取 Markdown 格式文章

### 取得 API Keys

#### 🇨🇳 中國供應商（推薦！超低價）
| 供應商 | API申請頁面 | 價格 |
|--------|------------|------|
| **DeepSeek** | [platform.deepseek.com](https://platform.deepseek.com) | $0.14/1M tokens |
| **Zhipu AI** | [open.bigmodel.cn](https://open.bigmodel.cn) | $0.07/1M tokens |
| **Moonshot AI** | [platform.moonshot.cn](https://platform.moonshot.cn) | $1.00/1M tokens |

#### 🇪🇺 歐洲供應商
| 供應商 | API申請頁面 | 價格 |
|--------|------------|------|
| **Mistral AI** | [console.mistral.ai](https://console.mistral.ai) | $2.00/1M tokens |
| **Cohere** | [dashboard.cohere.com](https://dashboard.cohere.com) | $0.50/1M tokens |

#### 🇺🇸 美國供應商
| 供應商 | API申請頁面 | 免費額度 |
|--------|------------|----------|
| **Google Gemini** | [aistudio.google.com](https://aistudio.google.com/app/apikey) | ✅ 15次/分鐘 |
| **OpenAI** | [platform.openai.com](https://platform.openai.com/api-keys) | ❌ 付費 |
| **Anthropic** | [console.anthropic.com](https://console.anthropic.com/) | ❌ 付費 |
| **Groq** | [console.groq.com](https://console.groq.com/keys) | ✅ 30次/分鐘 |

## 🎯 AI 供應商比較

### 💰 價格排名（從低到高）
```
1. Zhipu GLM-4-Flash    $0.07/1M  🏆 最便宜
2. DeepSeek Chat        $0.14/1M  🥈 極致性價比
3. OpenAI GPT-4o-mini   $0.15/1M
4. Anthropic Haiku      $0.25/1M
5. Cohere Command R     $0.50/1M
6. Moonshot 8K          $1.00/1M
7. Mistral Small        $2.00/1M
8. Gemini               免費 ✨
9. Groq                 免費 ✨
```

### ⚡ 速度
```
Groq        🚀🚀🚀🚀🚀 超快
DeepSeek    ⚡⚡⚡⚡   快
Gemini      ⚡⚡⚡⚡   快
Zhipu       ⚡⚡⚡⚡   快
Mistral     ⚡⚡⚡     中等
GPT-4o      ⚡⚡      較慢
```

### 🎯 品質
```
GPT-4o      ⭐⭐⭐⭐⭐ 頂級
Claude      ⭐⭐⭐⭐⭐ 頂級
DeepSeek    ⭐⭐⭐⭐   優秀
Mistral     ⭐⭐⭐⭐   優秀
Gemini      ⭐⭐⭐⭐   優秀
Zhipu       ⭐⭐⭐⭐   優秀（中文）
Cohere      ⭐⭐⭐⭐   優秀
```

### 📊 推薦場景
| 場景 | 推薦供應商 | 理由 |
|------|-----------|------|
| 🆓 測試/學習 | Gemini, Groq | 免費額度充足 |
| 💰 成本最低 | Zhipu AI, DeepSeek | $0.07-0.14/1M |
| 🇨🇳 中文優先 | Zhipu AI, DeepSeek, Moonshot | 中文能力強 |
| 📚 超長文本 | Moonshot 128K | 200K+上下文 |
| 🏢 企業級 | Mistral, Cohere | 歐盟合規/RAG |
| 🏆 最高品質 | GPT-4o, Claude | 頂級輸出 |

## 🔧 技術棧

### 後端
- Node.js + Express
- YouTube Transcript API
- Google Gemini SDK
- OpenAI SDK
- Anthropic SDK
- Groq SDK

### 前端
- Vanilla JavaScript (模組化)
- Glassmorphism CSS 設計
- Marked.js (Markdown 渲染)
- Server-Sent Events (串流)

## 📁 專案結構

```
youtubetoblog/
├── server/
│   ├── services/
│   │   └── ai-providers/        # AI 供應商適配器（9個）
│   │       ├── base.js          # 基礎類別
│   │       ├── gemini.js        # Google Gemini
│   │       ├── openai.js        # OpenAI
│   │       ├── anthropic.js     # Anthropic
│   │       ├── groq.js          # Groq
│   │       ├── deepseek.js      # DeepSeek (新)
│   │       ├── zhipu.js         # Zhipu AI (新)
│   │       ├── moonshot.js      # Moonshot AI (新)
│   │       ├── mistral.js       # Mistral AI (新)
│   │       ├── cohere.js        # Cohere (新)
│   │       └── index.js         # 供應商工廠
│   └── (待擴充: routes, middleware, config)
├── shared/
│   └── constants.js             # 常數定義
├── api-service.js               # 前端 API 層
├── app.js                       # 主前端邏輯
├── index.html                   # UI 介面
├── styles.css                   # 樣式
├── server.js                    # 主服務器
├── .env.example                 # 環境變數範本
└── package.json                 # 依賴配置
```

## 🌟 API 端點

### `GET /api/providers`
取得所有可用 AI 供應商和模型資訊

### `GET /api/transcript?videoId={id}&language={lang}`
獲取 YouTube 視頻文字稿

### `POST /api/generate`
生成部落格文章
```json
{
  "transcript": "...",
  "provider": "gemini",
  "apiKey": "YOUR_KEY",
  "modelName": "gemini-2.0-flash",
  "language": "繁體中文",
  "style": "professional",
  "stream": false
}
```

### `GET /api/health`
健康檢查端點

## 🔐 隱私與安全

- ✅ API 密鑰僅儲存在您的瀏覽器本地
- ✅ 不會上傳 API 密鑰到服務器
- ✅ 文字稿不會被儲存
- ✅ 所有處理即時完成

## 📝 授權

MIT License

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

---

**享受將 YouTube 內容轉換為專業部落格文章！** 🎉
