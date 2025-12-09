/**
 * i18n Module - Dynamic Language Switching
 * 
 * This module provides runtime language switching capability.
 * Chrome's chrome.i18n API only supports browser locale, so we implement
 * our own dynamic switching with the same message keys.
 */

const I18N_MESSAGES = {
    en: {
        headerTitle: "🎬 YouTube to Blog",
        headerSubtitle: "Convert videos to SEO-optimized articles using AI",
        lblVideoUrl: "YouTube Video URL",
        phVideoUrl: "Automatically detecting video from current page...",
        hintVideoUrl: "Please open a YouTube video page",
        hintVideoId: "Video ID: $1",
        lblProvider: "🤖 AI Provider",
        lblModel: "⚙️ AI Model",
        lblOutputLanguage: "🌐 Output Language",
        lblApiKey: "🔑 API Key",
        linkGetApiKey: "(Get API Key)",
        linkGetProviderApiKey: "(Get $1 API Key)",
        phApiKey: "Enter your API Key",
        hintApiKey: "Your API Key will be stored securely locally",
        btnConvert: "🚀 Start Conversion",
        lblProcessing: "Processing...",
        statusPreparing: "Preparing...",
        statusExtracting: "Extracting video captions...",
        statusExtractingRetry: "Retrying transcript extraction ($1/$2)...",
        statusGenerating: "Generating blog post with $1...",
        statusComplete: "Complete!",
        statusSuccessTranscript: "Successfully extracted transcript!",
        headerResult: "✅ Conversion Complete!",
        btnCopy: "📋 Copy Content",
        btnDownload: "💾 Download .md",
        btnNew: "🔄 New Conversion",
        headerError: "❌ Error Occurred",
        btnRetry: "🔄 Retry",
        msgCopySuccess: "✅ Copied!",
        msgCopyFail: "Copy failed, please select and copy manually",
        errNoVideo: "Please ensure video is selected and API Key is entered",
        errNoPage: "Could not find YouTube page",
        errWrongUrl: "Please ensure you are on a YouTube video page",
        errTranscriptFailed: "Failed to extract transcript",
        errTranscriptMaxRetries: "Failed to get captions after multiple attempts.\n\nPossible reasons:\n• Video has no captions or auto-captions\n• Page loading issues\n• Video is private or region-restricted\n\nPlease refresh the page and try again.",
        errConversionFailed: "Conversion failed, please try again",
        errAiNoContent: "AI failed to generate valid content",
        optLangEnglish: "English",
        optLangChinese: "Traditional Chinese",
        errApiQuota: "❌ $1 Quota Exceeded (429)\n\nPossible reasons:\n1. Free API usage limit reached\n2. Insufficient account credits\n\nSuggestions:\n• Wait a few minutes and try again\n• Switch to another AI provider (e.g., Groq or Gemini)",
        errApiAuth: "❌ Invalid API Key or Insufficient Permissions\n\nPlease check your API Key.\n\n• Ensure no extra spaces\n• Confirm the key hasn't expired\n• Click 'Get API Key' to apply for a new one",
        errApiModel: "❌ Model Not Found or No Permission\n\nThe selected model may not be available for your account type.\nTry switching to a different model.",
        errApiOverloaded: "❌ $1 System Busy\n\nThe AI server is currently overloaded.\nPlease wait a moment and try again.",
        errApiNetwork: "❌ Network Connection Error\n\nUnable to connect to the server.\nPlease check your network or firewall/VPN settings.",
        errApiSafety: "❌ Content Blocked by AI Safety Filter\n\nThe video content may contain sensitive topics that the AI refuses to process.",
        errUnexpected: "❌ Unexpected Error\n\nPlease retry or switch to another provider."
    },
    zh_TW: {
        headerTitle: "🎬 YouTube 轉部落格",
        headerSubtitle: "使用 AI 將影片轉換為 SEO 優化文章",
        lblVideoUrl: "YouTube 影片網址",
        phVideoUrl: "自動偵測目前頁面的影片...",
        hintVideoUrl: "請開啟 YouTube 影片頁面",
        hintVideoId: "影片 ID: $1",
        lblProvider: "🤖 AI 供應商",
        lblModel: "⚙️ AI 模型",
        lblOutputLanguage: "🌐 輸出語言",
        lblApiKey: "🔑 API Key",
        linkGetApiKey: "(取得 API Key)",
        linkGetProviderApiKey: "(取得 $1 API Key)",
        phApiKey: "輸入您的 API Key",
        hintApiKey: "您的 API Key 會安全儲存在本地",
        btnConvert: "🚀 開始轉換",
        lblProcessing: "正在處理中...",
        statusPreparing: "準備中...",
        statusExtracting: "正在獲取影片字幕...",
        statusExtractingRetry: "正在重試提取字幕 ($1/$2)...",
        statusGenerating: "正在使用 $1 生成部落格文章...",
        statusComplete: "完成！",
        statusSuccessTranscript: "成功獲取字幕！",
        headerResult: "✅ 轉換完成！",
        btnCopy: "📋 複製內容",
        btnDownload: "💾 下載 .md",
        btnNew: "🔄 新轉換",
        headerError: "❌ 發生錯誤",
        btnRetry: "🔄 重試",
        msgCopySuccess: "✅ 已複製！",
        msgCopyFail: "複製失敗，請手動選取內容複製",
        errNoVideo: "請確認已選擇影片並輸入 API Key",
        errNoPage: "無法找到 YouTube 頁面",
        errWrongUrl: "請確認您在 YouTube 影片頁面",
        errTranscriptFailed: "無法提取字幕",
        errTranscriptMaxRetries: "嘗試多次後仍無法獲取字幕。\n\n可能原因：\n• 影片沒有字幕或自動字幕\n• 頁面載入問題\n• 影片設定為私人或有地區限制\n\n請重新整理頁面後重試",
        errConversionFailed: "轉換失敗，請重試",
        errAiNoContent: "AI 未能生成有效的內容",
        optLangEnglish: "英文",
        optLangChinese: "繁體中文",
        errApiQuota: "❌ $1 配額已達上限 (429)\n\n原因可能是：\n1. 免費版 API 使用次數/速度已達限制\n2. 帳戶額度不足\n\n建議採取行動：\n• 稍等幾分鐘後再試\n• 切換到其他 AI 供應商 (如 Groq 或 Gemini)",
        errApiAuth: "❌ API Key 無效或權限不足\n\n請檢查您輸入的 API Key 是否正確。\n\n• 確認沒有多餘的空白\n• 確認 Key 是否已過期\n• 您可以點擊「取得 API Key」連結重新申請",
        errApiModel: "❌ 找不到模型或無權限\n\n您選擇的模型可能不支援您的帳號類別，或已停用。\n請嘗試切換該供應商底下的其他模型。",
        errApiOverloaded: "❌ $1 系統繁忙\n\nAI 服務器目前負載過高，暫時無法回應。\n請稍等片刻再試。",
        errApiNetwork: "❌ 網路連線錯誤\n\n無法連接到伺服器。\n請檢查網路狀態，或確認防火牆/VPN 設定。",
        errApiSafety: "❌ 內容被 AI 安全機制攔截\n\n影片內容可能包含敏感或不安全的議題，因此拒絕生成。",
        errUnexpected: "❌ 發生未預期的錯誤\n\n請重試或切換其他供應商。"
    }
};

// Current UI language (defaults to English)
let currentUILanguage = 'en';

/**
 * Get a localized message
 * @param {string} key - The message key
 * @param {Array<string>} substitutions - Optional substitution values
 * @returns {string} The localized message
 */
function getMessage(key, substitutions = []) {
    const messages = I18N_MESSAGES[currentUILanguage] || I18N_MESSAGES['en'];
    let message = messages[key] || I18N_MESSAGES['en'][key] || key;

    // Handle substitutions ($1, $2, etc.)
    if (substitutions && substitutions.length > 0) {
        substitutions.forEach((sub, index) => {
            message = message.replace(`$${index + 1}`, sub);
        });
    }

    return message;
}

/**
 * Set the current UI language
 * @param {string} lang - Language code ('en' or 'zh_TW')
 */
function setLanguage(lang) {
    if (I18N_MESSAGES[lang]) {
        currentUILanguage = lang;
    } else {
        currentUILanguage = 'en';
    }
}

/**
 * Get the current UI language
 * @returns {string} Current language code
 */
function getLanguage() {
    return currentUILanguage;
}

/**
 * Get list of supported languages
 * @returns {Array<{code: string, name: string}>}
 */
function getSupportedLanguages() {
    return [
        { code: 'en', name: 'English' },
        { code: 'zh_TW', name: '繁體中文' }
    ];
}

export { getMessage, setLanguage, getLanguage, getSupportedLanguages, I18N_MESSAGES };
