// Shared constants for project

// AI Provider IDs
const AI_PROVIDERS = {
    GEMINI: 'gemini',
    OPENAI: 'openai',
    ANTHROPIC: 'anthropic',
    GROQ: 'groq',
    DEEPSEEK: 'deepseek',
    ZHIPU: 'zhipu',
    MOONSHOT: 'moonshot',
    MISTRAL: 'mistral',
    COHERE: 'cohere',
};

// Article Styles
const ARTICLE_STYLES = {
    PROFESSIONAL: 'professional',
    CASUAL: 'casual',
    TECHNICAL: 'technical',
    NEWS: 'news',
};

// Supported Languages
const LANGUAGES = {
    ZH_TW: '繁體中文',
    ZH_CN: '简体中文',
    EN: 'English',
    JA: '日本語',
    KO: '한국어',
};

// Subscription Plans
const PLANS = {
    FREE: {
        id: 'free',
        name: '免費版',
        dailyLimit: 3,
        features: ['基本轉換', '單一文章生成'],
    },
    PRO: {
        id: 'pro',
        name: 'Pro 版',
        monthlyPrice: 9.99,
        yearlyPrice: 99,
        features: ['無限轉換', '批次處理', '自訂模板', 'SEO 工具', '優先支援'],
    },
};

module.exports = {
    AI_PROVIDERS,
    ARTICLE_STYLES,
    LANGUAGES,
    PLANS,
};
