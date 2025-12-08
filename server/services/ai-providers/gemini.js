const { GoogleGenerativeAI } = require('@google/generative-ai');
const AIProvider = require('./base');

class GeminiProvider extends AIProvider {
    constructor(apiKey, modelName = 'gemini-2.5-flash') {
        super(apiKey);
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.modelName = modelName;
    }

    async generateBlogPost(transcript, options = {}) {
        const { language = '繁體中文', style = 'professional', onStream } = options;

        try {
            const model = this.genAI.getGenerativeModel({
                model: this.modelName,
            });

            const prompt = this.buildPrompt(transcript, language, style);

            if (onStream) {
                // 串流模式
                const result = await model.generateContentStream(prompt);
                let fullText = '';

                for await (const chunk of result.stream) {
                    const chunkText = chunk.text();
                    fullText += chunkText;
                    onStream(chunkText);
                }

                return fullText;
            } else {
                // 一次性模式
                const result = await model.generateContent(prompt);
                return result.response.text();
            }
        } catch (error) {
            if (error.message.includes('API key')) {
                throw new Error('無效的 Gemini API 密鑰');
            }
            throw new Error(`Gemini 生成失敗: ${error.message}`);
        }
    }

    async validateApiKey() {
        try {
            const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
            await model.generateContent('test');
            return true;
        } catch (error) {
            return false;
        }
    }

    getProviderInfo() {
        return {
            name: 'Google Gemini',
            models: [
                // Gemini 3.0 系列 - 最新最強大的模型
                {
                    id: 'gemini-3-pro-preview',
                    name: 'Gemini 3 Pro Preview',
                    speed: 'medium',
                    quality: 'highest',
                    badge: '🌟 最新',
                    description: '最先進的多模態理解和程式碼能力'
                },
                // Gemini 2.5 系列 - 穩定版本
                {
                    id: 'gemini-2.5-pro',
                    name: 'Gemini 2.5 Pro',
                    speed: 'medium',
                    quality: 'high',
                    badge: '🧠 深度思考',
                    description: '適合複雜推理、程式碼和長文本分析'
                },
                {
                    id: 'gemini-2.5-flash',
                    name: 'Gemini 2.5 Flash',
                    speed: 'fast',
                    quality: 'high',
                    badge: '⚡ 推薦',
                    description: '最佳性價比，適合大規模處理'
                },
                // Gemini 2.0 系列 - 舊版穩定
                {
                    id: 'gemini-2.0-flash',
                    name: 'Gemini 2.0 Flash',
                    speed: 'fast',
                    description: '快速且可靠的選擇'
                },
                {
                    id: 'gemini-2.0-flash-exp',
                    name: 'Gemini 2.0 Flash Experimental',
                    speed: 'fast',
                    badge: '🧪 實驗性'
                },
                // Gemini 1.5 系列 - 向後兼容
                {
                    id: 'gemini-1.5-flash',
                    name: 'Gemini 1.5 Flash',
                    speed: 'fast'
                },
                {
                    id: 'gemini-1.5-pro',
                    name: 'Gemini 1.5 Pro',
                    speed: 'medium',
                    quality: 'high'
                },
            ],
            pricing: {
                free: true,
                note: '每分鐘 15 次請求免費額度'
            },
            apiUrl: 'https://aistudio.google.com/app/apikey',
            features: ['串流生成', '長文本支援', '免費使用', '多模態理解', '程式碼生成']
        };
    }
}

module.exports = GeminiProvider;
