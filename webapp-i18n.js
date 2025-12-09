/**
 * Web App i18n Module - Dynamic Language Switching
 * 
 * Provides runtime language switching capability for the web app.
 */

const WEBAPP_I18N = {
    en: {
        // Page
        pageTitle: "YouTube to Blog Generator - Multi AI Support",
        pageDesc: "Convert YouTube videos to SEO-optimized blog articles using various AI (Gemini, OpenAI, Claude, Groq)",

        // Header
        headerTitle: "YouTube to Blog",
        headerSubtitle: "Multi AI Provider Support • Streaming Generation • Professional SEO Optimization",

        // Form Labels
        lblYoutubeUrl: "YouTube URL",
        phYoutubeUrl: "https://www.youtube.com/watch?v=...",
        lblProvider: "AI Provider",
        lblModel: "Model",
        lblApiKey: "API Key",
        hintApiKey: "for selected provider",
        phApiKey: "Enter your API Key",
        hintApiKeySafe: "API Key is stored securely in your browser and not uploaded to server",
        lblGetApiKey: "Get API Key:",
        lblStyle: "Article Style",
        optStyleProfessional: "Professional",
        optStyleCasual: "Casual",
        optStyleTechnical: "Technical",
        optStyleNews: "News Report",
        lblLanguage: "Output Language",
        optLangZhTw: "Traditional Chinese",
        optLangZhCn: "Simplified Chinese",
        optLangEn: "English",
        optLangJa: "Japanese",
        chkStreaming: "⚡ Enable streaming generation (show progress in real-time)",
        btnGenerate: "Generate Blog Article",

        // Loading
        loadingText: "Processing...",
        step1: "Fetching video info",
        step2: "Extracting transcript",
        step3: "AI generating article",
        statusFetching: "Fetching video information...",
        statusExtracted: "Successfully extracted transcript!",
        statusGenerating: "Generating blog article with {provider}...",
        streamingIndicator: "✨ AI is generating...",

        // Result
        resultTitle: "Generated Blog Article",
        btnCopy: "Copy",
        btnDownload: "Download",
        btnNew: "Create New",
        msgCopied: "Copied!",
        msgCopyFailed: "Copy failed, please select text manually",

        // Error
        errorTitle: "Error Occurred",
        btnRetry: "Retry",
        errFillFields: "Please fill in all required fields",
        errInvalidUrl: "Invalid YouTube URL, please check your input",
        errNoTranscript: "No transcript available for this video",
        errProcessing: "An error occurred during processing",

        // Console
        consoleStarting: "🚀 YouTube to Blog application starting...",
        consoleReady: "✅ Application ready"
    },
    zh_TW: {
        // Page
        pageTitle: "YouTube 轉部落格文章生成器 - 多 AI 支援",
        pageDesc: "使用多種 AI (Gemini, OpenAI, Claude, Groq) 將 YouTube 視頻轉換為 SEO 優化的部落格文章",

        // Header
        headerTitle: "YouTube 轉部落格",
        headerSubtitle: "支援多種 AI 供應商 • 串流生成 • 專業 SEO 優化",

        // Form Labels
        lblYoutubeUrl: "YouTube URL",
        phYoutubeUrl: "https://www.youtube.com/watch?v=...",
        lblProvider: "AI 供應商",
        lblModel: "模型",
        lblApiKey: "API Key",
        hintApiKey: "為所選供應商",
        phApiKey: "輸入您的 API 密鑰",
        hintApiKeySafe: "API 密鑰會安全儲存在您的瀏覽器中，不會上傳到服務器",
        lblGetApiKey: "獲取API密鑰：",
        lblStyle: "文章風格",
        optStyleProfessional: "專業正式",
        optStyleCasual: "輕鬆口語",
        optStyleTechnical: "技術詳細",
        optStyleNews: "新聞報導",
        lblLanguage: "輸出語言",
        optLangZhTw: "繁體中文",
        optLangZhCn: "简体中文",
        optLangEn: "English",
        optLangJa: "日本語",
        chkStreaming: "⚡ 啟用串流生成（即時顯示生成過程）",
        btnGenerate: "生成部落格文章",

        // Loading
        loadingText: "正在處理中...",
        step1: "獲取視頻資訊",
        step2: "提取文字稿",
        step3: "AI 生成文章",
        statusFetching: "正在獲取視頻資訊...",
        statusExtracted: "成功提取文字稿！",
        statusGenerating: "正在使用 {provider} 生成部落格文章...",
        streamingIndicator: "✨ AI 正在生成中...",

        // Result
        resultTitle: "生成的部落格文章",
        btnCopy: "複製",
        btnDownload: "下載",
        btnNew: "建立新的",
        msgCopied: "已複製！",
        msgCopyFailed: "複製失敗，請手動選擇文字複製",

        // Error
        errorTitle: "發生錯誤",
        btnRetry: "重試",
        errFillFields: "請填寫所有必填欄位",
        errInvalidUrl: "無效的 YouTube URL，請檢查您的輸入",
        errNoTranscript: "此視頻沒有可用的文字稿",
        errProcessing: "處理過程中發生錯誤",

        // Console
        consoleStarting: "🚀 YouTube 轉部落格應用程式啟動中...",
        consoleReady: "✅ 應用程式已準備就緒"
    }
};

// Current UI language (defaults to English)
let currentWebAppLanguage = 'en';

/**
 * Get a localized message
 * @param {string} key - The message key
 * @param {Object} substitutions - Optional substitution values
 * @returns {string} The localized message
 */
function getWebAppMessage(key, substitutions = {}) {
    const messages = WEBAPP_I18N[currentWebAppLanguage] || WEBAPP_I18N['en'];
    let message = messages[key] || WEBAPP_I18N['en'][key] || key;

    // Handle substitutions like {provider}
    Object.keys(substitutions).forEach(sub => {
        message = message.replace(`{${sub}}`, substitutions[sub]);
    });

    return message;
}

/**
 * Set the current UI language
 * @param {string} lang - Language code ('en' or 'zh_TW')
 */
function setWebAppLanguage(lang) {
    if (WEBAPP_I18N[lang]) {
        currentWebAppLanguage = lang;
        localStorage.setItem('webapp_ui_language', lang);
    } else {
        currentWebAppLanguage = 'en';
    }
}

/**
 * Get the current UI language
 * @returns {string} Current language code
 */
function getWebAppLanguage() {
    return currentWebAppLanguage;
}

/**
 * Initialize language from localStorage
 */
function initWebAppLanguage() {
    const saved = localStorage.getItem('webapp_ui_language');
    if (saved && WEBAPP_I18N[saved]) {
        currentWebAppLanguage = saved;
    }
    return currentWebAppLanguage;
}

/**
 * Localize all elements with data-i18n attribute
 */
function localizeWebApp() {
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const message = getWebAppMessage(key);
        if (message) {
            element.textContent = message;
        }
    });

    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const message = getWebAppMessage(key);
        if (message) {
            element.placeholder = message;
        }
    });

    // Update page title
    document.title = getWebAppMessage('pageTitle');

    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.content = getWebAppMessage('pageDesc');
    }

    // Update html lang attribute
    document.documentElement.lang = currentWebAppLanguage === 'zh_TW' ? 'zh-TW' : 'en';
}
