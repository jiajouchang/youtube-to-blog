const Groq = require('groq-sdk');
const AIProvider = require('./base');

class GroqProvider extends AIProvider {
    constructor(apiKey, modelName = 'llama-3.3-70b-versatile') {
        super(apiKey);
        this.client = new Groq({ apiKey });
        this.modelName = modelName;
    }

    async generateBlogPost(transcript, options = {}) {
        const { language = '繁體中文', style = 'professional', onStream } = options;

        try {
            const prompt = this.buildPrompt(transcript, language, style);

            if (onStream) {
                // 串流模式
                const stream = await this.client.chat.completions.create({
                    model: this.modelName,
                    messages: [{ role: 'user', content: prompt }],
                    stream: true,
                });

                let fullText = '';
                for await (const chunk of stream) {
                    const content = chunk.choices[0]?.delta?.content || '';
                    fullText += content;
                    onStream(content);
                }

                return fullText;
            } else {
                // 一次性模式
                const completion = await this.client.chat.completions.create({
                    model: this.modelName,
                    messages: [{ role: 'user', content: prompt }],
                });

                return completion.choices[0].message.content;
            }
        } catch (error) {
            if (error.status === 401) {
                throw new Error('無效的 Groq API 密鑰');
            }
            throw new Error(`Groq 生成失敗: ${error.message}`);
        }
    }

    async validateApiKey() {
        try {
            await this.client.models.list();
            return true;
        } catch (error) {
            return false;
        }
    }

    getProviderInfo() {
        return {
            name: 'Groq',
            models: [
                // Llama 4 系列 - 最新（Preview）
                {
                    id: 'llama-4-maverick-17b-128e-instruct',
                    name: 'Llama 4 Maverick 17B',
                    speed: 'ultra-fast',
                    badge: '🆕 最新'
                },
                {
                    id: 'llama-4-scout-17b-16e-instruct',
                    name: 'Llama 4 Scout 17B',
                    speed: 'ultra-fast',
                    badge: '🆕 最新'
                },
                // Llama 3.3 系列 - 生產級
                {
                    id: 'llama-3.3-70b-versatile',
                    name: 'Llama 3.3 70B Versatile',
                    speed: 'ultra-fast',
                    badge: '🚀 推薦'
                },
                {
                    id: 'llama-3.1-70b-versatile',
                    name: 'Llama 3.1 70B Versatile',
                    speed: 'fast',
                    badge: '⭐ 高品質'
                },
                {
                    id: 'llama-3.1-8b-instant',
                    name: 'Llama 3.1 8B Instant',
                    speed: 'instant',
                    badge: '⚡ 極速'
                },
                // OpenAI GPT-OSS
                {
                    id: 'gpt-oss-120b',
                    name: 'GPT-OSS 120B',
                    speed: 'fast',
                    badge: '🔓 開源 GPT'
                },
                // Mixtral
                {
                    id: 'mixtral-8x7b-32768',
                    name: 'Mixtral 8x7B',
                    speed: 'fast',
                    badge: '🔀 MoE'
                },
                // Google Gemma
                {
                    id: 'gemma2-9b-it',
                    name: 'Gemma 2 9B',
                    speed: 'fast',
                    badge: '🔷 Google'
                },
            ],
            pricing: {
                free: true,
                note: '每分鐘 30 次請求免費額度'
            },
            apiUrl: 'https://console.groq.com/keys',
            features: ['超快速度', '免費使用', '開源模型', 'Llama 4 Preview']
        };
    }
}

module.exports = GroqProvider;

