// API Service - Modern fetch wrapper with error handling

const API_BASE_URL = window.location.origin;

class APIError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = 'APIError';
        this.status = status;
        this.data = data;
    }
}

async function fetchJSON(url, options = {}) {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            const rawMsg = data.message || data.error || 'Request failed';
            throw new APIError(
                getFriendlyErrorMessage(rawMsg),
                response.status,
                data
            );
        }

        return data;
    } catch (error) {
        if (error instanceof APIError) {
            throw error;
        }
        throw new APIError(getFriendlyErrorMessage(error.message), 0, null);
    }
}

/**
 * Helper to format raw API errors into friendly messages
 */
function getFriendlyErrorMessage(rawMessage) {
    if (!rawMessage) return '發生未知錯誤';

    const lowerMsg = rawMessage.toString().toLowerCase();

    // 1. Quota / Rate Limits
    if (lowerMsg.includes('429') ||
        lowerMsg.includes('quota') ||
        lowerMsg.includes('rate limit') ||
        lowerMsg.includes('resource has been exhausted')) {
        return `❌ AI 服務配額已達上限 (429)\n\n原因可能是：\n1. 免費版額度已用完\n2. 請求過於頻繁\n\n建議：\n• 稍等幾分鐘後再試\n• 切換到其他 AI 供應商`;
    }

    // 2. Auth Errors
    if (lowerMsg.includes('401') ||
        lowerMsg.includes('403') ||
        (lowerMsg.includes('api key') && (lowerMsg.includes('invalid') || lowerMsg.includes('incorrect'))) ||
        lowerMsg.includes('unauthorized')) {
        return `❌ API Key 無效或權限不足\n\n請檢查您的 API Key 是否正確。`;
    }

    // 3. Model Not Found
    if (lowerMsg.includes('model') && lowerMsg.includes('not found')) {
        return `❌ 找不到指定的模型\n\n該模型可能已下架或您的帳號無權使用。\n請嘗試切換其他模型。`;
    }

    // 4. Overloaded
    if (lowerMsg.includes('overloaded') || lowerMsg.includes('503')) {
        return `❌ AI 服務系統繁忙\n\n伺服器負載過高，暫時無法回應。\n請稍後重試。`;
    }

    // 5. Safety / Content Filter
    if (lowerMsg.includes('safety') || lowerMsg.includes('harmful') || lowerMsg.includes('blocked')) {
        return `❌ 內容被安全機制攔截\n\nAI 判定內容可能涉及敏感議題，拒絕生成。`;
    }

    // 6. Network
    if (lowerMsg.includes('fetch') || lowerMsg.includes('network') || lowerMsg.includes('connection')) {
        return `❌ 網路連線錯誤\n\n無法連接到伺服器。`;
    }

    // 7. Simplify long technical errors
    if (rawMessage.length > 150 || rawMessage.trim().startsWith('{')) {
        return `❌ 發生未預期的錯誤\n\n(系統錯誤: ${rawMessage.substring(0, 50)}...)`;
    }

    return rawMessage;
}

// Get all available AI providers
async function getProviders() {
    return fetchJSON(`${API_BASE_URL}/api/providers`);
}

// Get YouTube transcript
async function getTranscript(videoId, language = null) {
    const params = new URLSearchParams({ videoId });
    if (language) params.append('language', language);

    return fetchJSON(`${API_BASE_URL}/api/transcript?${params}`);
}

// Generate blog post
async function generateBlogPost({
    transcript,
    provider,
    apiKey,
    modelName,
    language = '繁體中文',
    style = 'professional',
    stream = false,
    onStream = null,
}) {
    if (stream && onStream) {
        // Streaming mode using EventSource
        return new Promise((resolve, reject) => {
            const eventSource = new EventSource(
                `${API_BASE_URL}/api/generate?` + new URLSearchParams({
                    transcript,
                    provider,
                    apiKey,
                    modelName: modelName || '',
                    language,
                    style,
                    stream: 'true',
                })
            );

            let fullResult = '';

            eventSource.addEventListener('message', (event) => {
                const data = JSON.parse(event.data);

                if (data.error) {
                    eventSource.close();
                    reject(new APIError(getFriendlyErrorMessage(data.error), 500, data));
                } else if (data.done) {
                    eventSource.close();
                    resolve(data.result);
                } else if (data.chunk) {
                    fullResult += data.chunk;
                    onStream(data.chunk, fullResult);
                }
            });

            eventSource.onerror = (error) => {
                eventSource.close();
                reject(new APIError('Stream connection failed', 0, error));
            };
        });
    } else {
        // Regular POST request
        return fetchJSON(`${API_BASE_URL}/api/generate`, {
            method: 'POST',
            body: JSON.stringify({
                transcript,
                provider,
                apiKey,
                modelName,
                language,
                style,
                stream: false,
            }),
        });
    }
}

// Health check
async function healthCheck() {
    return fetchJSON(`${API_BASE_URL}/api/health`);
}

// Export API service
window.API = {
    getProviders,
    getTranscript,
    generateBlogPost,
    healthCheck,
    APIError,
};
