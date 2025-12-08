const OpenAI = require('openai');
const AIProvider = require('./base');

class OpenAIProvider extends AIProvider {
    constructor(apiKey, modelName = 'gpt-4o-mini') {
        super(apiKey);
        this.client = new OpenAI({ apiKey });
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
                throw new Error('無效的 OpenAI API 密鑰');
            }
            throw new Error(`OpenAI 生成失敗: ${error.message}`);
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
            name: 'OpenAI',
            models: [
                {
                    id: 'gpt-4o',
                    name: 'GPT-4o',
                    quality: 'highest',
                    speed: 'fast',
                    badge: '🏆 推薦'
                },
                {
                    id: 'gpt-4o-mini',
                    name: 'GPT-4o Mini',
                    speed: 'fastest',
                    cost: 'low',
                    badge: '💰 經濟實惠'
                },
                {
                    id: 'o1',
                    name: 'O1',
                    quality: 'highest',
                    badge: '🧠 推理專用'
                },
                {
                    id: 'o1-mini',
                    name: 'O1 Mini',
                    speed: 'fast',
                    badge: '🧠 快速推理'
                },
                {
                    id: 'gpt-4-turbo',
                    name: 'GPT-4 Turbo',
                    quality: 'high'
                },
            ],
            pricing: {
                free: false,
                note: 'GPT-4o-mini: $0.15/1M tokens'
            },
            apiUrl: 'https://platform.openai.com/api-keys',
            features: ['高品質輸出', '串流生成', '多語言支援', '函數調用']
        };
    }
}

module.exports = OpenAIProvider;
