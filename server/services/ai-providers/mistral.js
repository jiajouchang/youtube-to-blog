const AIProvider = require('./base');

class MistralProvider extends AIProvider {
    constructor(apiKey, modelName = 'mistral-small-latest') {
        super(apiKey);
        this.modelName = modelName;
        this.baseURL = 'https://api.mistral.ai/v1';
    }

    async generateBlogPost(transcript, options = {}) {
        const { language = '繁體中文', style = 'professional', onStream } = options;

        try {
            const prompt = this.buildPrompt(transcript, language, style);

            const requestBody = {
                model: this.modelName,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                stream: !!onStream,
            };

            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Mistral API 錯誤: ${error}`);
            }

            if (onStream) {
                // 串流模式
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullText = '';

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));

                    for (const line of lines) {
                        const data = line.replace('data: ', '');
                        if (data === '[DONE]') continue;

                        try {
                            const parsed = JSON.parse(data);
                            const content = parsed.choices[0]?.delta?.content || '';
                            fullText += content;
                            onStream(content);
                        } catch (e) {
                            // 忽略解析錯誤
                        }
                    }
                }

                return fullText;
            } else {
                // 一次性模式
                const data = await response.json();
                return data.choices[0].message.content;
            }
        } catch (error) {
            if (error.message.includes('401')) {
                throw new Error('無效的 Mistral AI API 密鑰');
            }
            throw new Error(`Mistral AI 生成失敗: ${error.message}`);
        }
    }

    async validateApiKey() {
        try {
            const response = await fetch(`${this.baseURL}/models`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    getProviderInfo() {
        return {
            name: 'Mistral AI',
            models: [
                {
                    id: 'mistral-large-latest',
                    name: 'Mistral Large',
                    quality: 'highest',
                    speed: 'medium',
                    badge: '🏆 旗艦版'
                },
                {
                    id: 'mistral-medium-latest',
                    name: 'Mistral Medium',
                    quality: 'high',
                    speed: 'fast',
                    badge: '⚖️ 平衡'
                },
                {
                    id: 'mistral-small-latest',
                    name: 'Mistral Small',
                    quality: 'good',
                    speed: 'fastest',
                    badge: '💰 經濟實惠'
                },
                {
                    id: 'open-mistral-7b',
                    name: 'Open Mistral 7B',
                    quality: 'medium',
                    speed: 'fastest',
                    badge: '🆓 開源'
                },
                {
                    id: 'open-mixtral-8x7b',
                    name: 'Open Mixtral 8x7B',
                    quality: 'high',
                    speed: 'fast',
                    badge: '🔥 MoE開源'
                },
            ],
            pricing: {
                free: false,
                note: 'Small: $2/1M tokens | Large: $8/1M tokens'
            },
            apiUrl: 'https://console.mistral.ai',
            features: ['歐盟合規', '開源模型', '企業級', '多語言支持']
        };
    }
}

module.exports = MistralProvider;
