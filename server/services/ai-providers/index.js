const GeminiProvider = require('./gemini');
const OpenAIProvider = require('./openai');
const AnthropicProvider = require('./anthropic');
const GroqProvider = require('./groq');
const DeepSeekProvider = require('./deepseek');
const ZhipuProvider = require('./zhipu');
const MoonshotProvider = require('./moonshot');
const MistralProvider = require('./mistral');
const CohereProvider = require('./cohere');

const PROVIDERS = {
    gemini: GeminiProvider,
    openai: OpenAIProvider,
    anthropic: AnthropicProvider,
    groq: GroqProvider,
    deepseek: DeepSeekProvider,
    zhipu: ZhipuProvider,
    moonshot: MoonshotProvider,
    mistral: MistralProvider,
    cohere: CohereProvider,
};

/**
 * 建立 AI 供應商實例
 * @param {string} provider - 供應商名稱 (gemini/openai/anthropic/groq)
 * @param {string} apiKey - API 金鑰
 * @param {string} modelName - 模型名稱（可選）
 * @returns {AIProvider}
 */
function createProvider(provider, apiKey, modelName) {
    const ProviderClass = PROVIDERS[provider.toLowerCase()];

    if (!ProviderClass) {
        throw new Error(`不支援的 AI 供應商: ${provider}`);
    }

    return new ProviderClass(apiKey, modelName);
}

/**
 * 取得所有可用供應商資訊
 * @returns {Array}
 */
function getAllProviders() {
    return Object.entries(PROVIDERS).map(([key, ProviderClass]) => {
        const instance = new ProviderClass('dummy_key');
        return {
            id: key,
            ...instance.getProviderInfo(),
        };
    });
}

/**
 * 驗證供應商是否存在
 * @param {string} provider - 供應商名稱
 * @returns {boolean}
 */
function isValidProvider(provider) {
    return provider.toLowerCase() in PROVIDERS;
}

module.exports = {
    createProvider,
    getAllProviders,
    isValidProvider,
    PROVIDERS,
};
