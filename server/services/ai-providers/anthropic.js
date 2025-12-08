const Anthropic = require('@anthropic-ai/sdk');
const AIProvider = require('./base');

class AnthropicProvider extends AIProvider {
    constructor(apiKey, modelName = 'claude-sonnet-4-5-latest') {
        super(apiKey);
        this.client = new Anthropic({ apiKey });
        this.modelName = modelName;
    }

    async generateBlogPost(transcript, options = {}) {
        const { language = '繁體中文', style = 'professional', onStream } = options;

        try {
            const prompt = this.buildPrompt(transcript, language, style);

            if (onStream) {
                // 串流模式
                const stream = await this.client.messages.stream({
                    model: this.modelName,
                    max_tokens: 4096,
                    messages: [{ role: 'user', content: prompt }],
                });

                let fullText = '';
                for await (const chunk of stream) {
                    if (chunk.type === 'content_block_delta' && chunk.delta.text) {
                        const content = chunk.delta.text;
                        fullText += content;
                        onStream(content);
                    }
                }

                return fullText;
            } else {
                // 一次性模式
                const message = await this.client.messages.create({
                    model: this.modelName,
                    max_tokens: 4096,
                    messages: [{ role: 'user', content: prompt }],
                });

                return message.content[0].text;
            }
        } catch (error) {
            if (error.status === 401) {
                throw new Error('無效的 Anthropic API 密鑰');
            }
            throw new Error(`Claude 生成失敗: ${error.message}`);
        }
    }

    async validateApiKey() {
        try {
            await this.client.messages.create({
                model: this.modelName,
                max_tokens: 1,
                messages: [{ role: 'user', content: 'test' }],
            });
            return true;
        } catch (error) {
            return false;
        }
    }

    getProviderInfo() {
        return {
            name: 'Anthropic Claude',
            models: [
                // Claude 4.5 系列 - 最新
                {
                    id: 'claude-opus-4-5-latest',
                    name: 'Claude Opus 4.5',
                    quality: 'highest',
                    badge: '🌟 最新最強'
                },
                {
                    id: 'claude-sonnet-4-5-latest',
                    name: 'Claude Sonnet 4.5',
                    quality: 'high',
                    speed: 'fast',
                    badge: '⚡ 推薦'
                },
                {
                    id: 'claude-haiku-4-5-latest',
                    name: 'Claude Haiku 4.5',
                    speed: 'fastest',
                    badge: '💨 超快速'
                },
                // Claude 3.5 系列 - 穩定
                {
                    id: 'claude-3-5-sonnet-latest',
                    name: 'Claude 3.5 Sonnet',
                    quality: 'high',
                    badge: '🎯 穩定'
                },
                {
                    id: 'claude-3-5-haiku-latest',
                    name: 'Claude 3.5 Haiku',
                    speed: 'fastest'
                },
                {
                    id: 'claude-3-opus-latest',
                    name: 'Claude 3 Opus',
                    quality: 'highest'
                },
            ],
            pricing: {
                free: false,
                note: 'Haiku: $0.25/1M tokens, Sonnet: $3/1M tokens'
            },
            apiUrl: 'https://console.anthropic.com',
            features: ['長文本處理', '精確理解', '串流生成', '程式碼生成']
        };
    }
}

module.exports = AnthropicProvider;
