/**
 * AI 供應商基礎類別
 * 所有 AI 供應商必須實作此介面
 */
class AIProvider {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('API Key 是必要的');
    }
    this.apiKey = apiKey;
  }
  
  /**
   * 生成部落格文章
   * @param {string} transcript - YouTube 字幕文字
   * @param {object} options - 生成選項
   * @param {string} options.language - 輸出語言（預設：繁體中文）
   * @param {string} options.style - 文章風格（professional/casual/technical/news）
   * @param {function} options.onStream - 串流回調函數（可選）
   * @returns {Promise<string>} 生成的文章
   */
  async generateBlogPost(transcript, options = {}) {
    throw new Error('必須實作 generateBlogPost 方法');
  }
  
  /**
   * 驗證 API Key
   * @returns {Promise<boolean>}
   */
  async validateApiKey() {
    throw new Error('必須實作 validateApiKey 方法');
  }
  
  /**
   * 取得供應商資訊
   * @returns {object}
   */
  getProviderInfo() {
    return {
      name: this.constructor.name,
      models: [],
      pricing: {},
    };
  }

  /**
   * 建立標準化的 prompt
   * @param {string} transcript - YouTube 字幕
   * @param {string} language - 輸出語言
   * @param {string} style - 文章風格
   * @returns {string}
   */
  buildPrompt(transcript, language = '繁體中文', style = 'professional') {
    const styleDescriptions = {
      professional: '專業且正式',
      casual: '輕鬆且口語化',
      technical: '技術性且詳細',
      news: '新聞報導風格',
    };
    
    const styleDesc = styleDescriptions[style] || styleDescriptions.professional;
    
    return `你是一位專業的部落格作家和 SEO 專家。請將以下 YouTube 視頻文字稿轉換為一篇格式完美、SEO 優化的部落格文章。

文章風格：${styleDesc}
輸出語言：${language}

要求：
1. 創建一個吸引人的標題（使用 # 標題格式）
2. 撰寫引人入勝的開頭段落
3. 將內容組織成清晰的章節（使用 ## 和 ### 標題）
4. 使用項目符號和編號列表來提高可讀性
5. 在適當的地方添加重點強調（使用 **粗體**）
6. 撰寫一個總結段落
7. 確保語言流暢、專業且易於理解
8. 優化 SEO 關鍵字的使用

原始文字稿：
${transcript}

請生成完整的 Markdown 格式部落格文章：`;
  }
}

module.exports = AIProvider;
