/**
 * AI Providers Module for Browser Extension
 * 
 * 支援多個 AI 供應商的統一接口
 * 使用原生 fetch API 直接呼叫各供應商的 REST API
 */

// ============================================================================
// Provider Configurations
// ============================================================================

const AI_PROVIDERS = {
    gemini: {
        id: 'gemini',
        name: 'Google Gemini',
        free: true,
        apiUrl: 'https://aistudio.google.com/app/apikey',
        models: [
            { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', badge: '⚡ 推薦' },
            { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', badge: '🧠 深度思考' },
            { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', badge: '' },
            { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', badge: '' },
            { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', badge: '' },
        ],
        features: ['免費使用', '多模態', '長文本']
    },
    groq: {
        id: 'groq',
        name: 'Groq',
        free: true,
        apiUrl: 'https://console.groq.com/keys',
        models: [
            { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', badge: '🚀 推薦' },
            { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', badge: '⭐ 高品質' },
            { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', badge: '⚡ 極速' },
            { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', badge: '🔀 MoE' },
            { id: 'gemma2-9b-it', name: 'Gemma 2 9B', badge: '🔷 Google' },
        ],
        features: ['免費使用', '超快速度', '開源模型']
    },
    openai: {
        id: 'openai',
        name: 'OpenAI',
        free: false,
        apiUrl: 'https://platform.openai.com/api-keys',
        models: [
            { id: 'gpt-4o', name: 'GPT-4o', badge: '🏆 推薦' },
            { id: 'gpt-4o-mini', name: 'GPT-4o Mini', badge: '💰 經濟' },
            { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', badge: '' },
            { id: 'o1-mini', name: 'O1 Mini', badge: '🧠 推理' },
        ],
        features: ['高品質', '多語言', '函數調用']
    },
    anthropic: {
        id: 'anthropic',
        name: 'Anthropic Claude',
        free: false,
        apiUrl: 'https://console.anthropic.com',
        models: [
            { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', badge: '⚡ 推薦' },
            { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', badge: '🎯 穩定' },
            { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku', badge: '💨 快速' },
            { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', badge: '🧠 最強' },
        ],
        features: ['長文本', '精確理解', '程式碼']
    },
    deepseek: {
        id: 'deepseek',
        name: 'DeepSeek',
        free: false,
        apiUrl: 'https://platform.deepseek.com',
        models: [
            { id: 'deepseek-chat', name: 'DeepSeek Chat', badge: '💰 超低價' },
            { id: 'deepseek-coder', name: 'DeepSeek Coder', badge: '💻 程式碼' },
        ],
        features: ['極致性價比', 'GPT-4級別', '中英文優秀']
    }
};

// ============================================================================
// API Call Functions
// ============================================================================

/**
 * 建立標準化的 prompt
 */
function buildPrompt(transcript, language = '繁體中文', style = 'professional') {
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

/**
 * Gemini API 調用
 */
async function callGeminiAPI(apiKey, model, prompt) {
    const { GoogleGenerativeAI } = await import('./google-generative-ai.js');

    const genAI = new GoogleGenerativeAI(apiKey);
    const geminiModel = genAI.getGenerativeModel({ model });

    const result = await geminiModel.generateContent(prompt);
    const response = await result.response;
    return response.text();
}

/**
 * Groq API 調用 (OpenAI 相容格式)
 */
async function callGroqAPI(apiKey, model, prompt) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
            max_tokens: 4096,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(error.error?.message || `Groq API 錯誤: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * OpenAI API 調用
 */
async function callOpenAIAPI(apiKey, model, prompt) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(error.error?.message || `OpenAI API 錯誤: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

/**
 * Anthropic Claude API 調用
 */
async function callAnthropicAPI(apiKey, model, prompt) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
            model: model,
            max_tokens: 4096,
            messages: [{ role: 'user', content: prompt }],
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(error.error?.message || `Claude API 錯誤: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
}

/**
 * DeepSeek API 調用 (OpenAI 相容格式)
 */
async function callDeepSeekAPI(apiKey, model, prompt) {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: model,
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
        throw new Error(error.error?.message || `DeepSeek API 錯誤: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
}

// ============================================================================
// Main Export Functions
// ============================================================================

/**
 * 取得所有供應商配置
 */
function getProviders() {
    return AI_PROVIDERS;
}

/**
 * 取得指定供應商的資訊
 */
function getProviderInfo(providerId) {
    return AI_PROVIDERS[providerId] || null;
}

/**
 * 統一的內容生成函數
 */
async function generateContent(providerId, apiKey, model, transcript, options = {}) {
    const { language = '繁體中文', style = 'professional' } = options;
    const prompt = buildPrompt(transcript, language, style);

    console.log(`[AI Providers] Calling ${providerId} API with model: ${model}`);

    try {
        let result;

        switch (providerId) {
            case 'gemini':
                result = await callGeminiAPI(apiKey, model, prompt);
                break;
            case 'groq':
                result = await callGroqAPI(apiKey, model, prompt);
                break;
            case 'openai':
                result = await callOpenAIAPI(apiKey, model, prompt);
                break;
            case 'anthropic':
                result = await callAnthropicAPI(apiKey, model, prompt);
                break;
            case 'deepseek':
                result = await callDeepSeekAPI(apiKey, model, prompt);
                break;
            default:
                throw new Error(`不支援的 AI 供應商: ${providerId}`);
        }

        if (!result || result.trim().length === 0) {
            throw new Error('AI 未能生成有效的內容');
        }

        console.log(`[AI Providers] Success! Generated ${result.length} characters`);
        return result;

    } catch (error) {
        console.error(`[AI Providers] Error:`, error);
        throw new Error(getFriendlyErrorMessage(error, providerId));
    }
}

/**
 * 產生友善的錯誤訊息
 */
function getFriendlyErrorMessage(error, providerId) {
    const rawMessage = error.message || error.toString();
    const providerName = AI_PROVIDERS[providerId]?.name || providerId;
    const lowerMsg = rawMessage.toLowerCase();

    // 1. 配額/速率限制 (Quota/Rate Limit)
    // 包含: 429, quota exceeded, rate limit, resource exhausted
    if (rawMessage.includes('429') ||
        lowerMsg.includes('quota') ||
        lowerMsg.includes('rate limit') ||
        lowerMsg.includes('resource has been exhausted')) {
        return `❌ ${providerName} 配額已達上限 (429)\n\n原因可能是：\n1. 免費版 API 使用次數/速度已達限制\n2. 帳戶額度不足\n\n建議採取行動：\n• 稍等幾分鐘後再試 (通常每分鐘限制會重置)\n• 切換到其他 AI 供應商 (如 Groq 或 Gemini)`;
    }

    // 2. 認證錯誤 (Auth)
    // 包含: 401, 403, api key, unauthorized, invalid
    if (rawMessage.includes('401') ||
        rawMessage.includes('403') ||
        (lowerMsg.includes('api key') && (lowerMsg.includes('invalid') || lowerMsg.includes('incorrect'))) ||
        lowerMsg.includes('unauthorized')) {
        return `❌ API Key 無效或權限不足\n\n請檢查您輸入的 ${providerName} API Key 是否正確。\n\n• 確認沒有多餘的空白\n• 確認 Key 是否已過期\n• 您可以點擊「取得 API Key」連結重新申請`;
    }

    // 3. 模型錯誤 (Model)
    if (lowerMsg.includes('model') && lowerMsg.includes('not found')) {
        return `❌ 找不到模型或無權限\n\n您選擇的模型可能不支援您的帳號類別，或已停用。\n請嘗試切換該供應商底下的其他模型 (例如從 Pro 切換為 Flash)。`;
    }

    // 4. 服務過載 (Overloaded)
    if (lowerMsg.includes('overloaded') || rawMessage.includes('503')) {
        return `❌ ${providerName} 系統繁忙\n\nAI 服務器目前負載過高，暫時無法回應。\n請稍等片刻再試。`;
    }

    // 5. 網路/安全性錯誤
    if (lowerMsg.includes('fetch') || lowerMsg.includes('network') || lowerMsg.includes('security')) {
        return `❌ 網路連線錯誤\n\n無法連接到 ${providerName} 伺服器。\n請檢查網路狀態，或確認防火牆/VPN 設定。`;
    }

    // 6. 內容過濾/安全設定 (Safety)
    if (lowerMsg.includes('safety') || lowerMsg.includes('harmful') || lowerMsg.includes('blocked')) {
        return `❌ 內容被 AI 安全機制攔截\n\n影片內容可能包含 ${providerName} 判定為敏感或不安全的議題，因此拒絕生成。`;
    }

    // 7. 過濾掉過長的技術性錯誤訊息
    if (rawMessage.length > 150 || rawMessage.trim().startsWith('{') || rawMessage.includes('Error:')) {
        // 嘗試提取簡短描述
        return `❌ 發生未預期的錯誤\n\n請重試或切換其他供應商。\n(系統錯誤: ${rawMessage.substring(0, 50)}...)`;
    }

    return `❌ 發生錯誤: ${rawMessage}`;
}

// Export for use in sidepanel.js
export { AI_PROVIDERS, getProviders, getProviderInfo, generateContent, buildPrompt };
