const AIProvider = require('./base');

class MoonshotProvider extends AIProvider {
    constructor(apiKey, modelName = 'moonshot-v1-8k') {
        super(apiKey);
        this.modelName = modelName;
        this.baseURL = 'https://api.moonshot.cn/v1';
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
                throw new Error(`Moonshot API 錯誤: ${error}`);
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
                throw new Error('無效的 Moonshot AI API 密鑰');
            }
            throw new Error(`Moonshot AI 生成失敗: ${error.message}`);
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
            name: 'Moonshot AI (月之暗面)',
            models: [
                {
                    id: 'moonshot-v1-8k',
                    name: 'Moonshot V1 8K',
                    quality: 'high',
                    speed: 'fast',
                    badge: '⚡ 推薦'
                },
                {
                    id: 'moonshot-v1-32k',
                    name: 'Moonshot V1 32K',
                    quality: 'high',
                    speed: 'medium',
                    badge: '📚 長文本'
                },
                {
                    id: 'moonshot-v1-128k',
                    name: 'Moonshot V1 128K',
                    quality: 'high',
                    speed: 'medium',
                    badge: '📖 超長上下文'
                },
            ],
            pricing: {
                free: false,
                note: '8K: $1.00/1M tokens | 128K: $5.06/1M tokens'
            },
            apiUrl: 'https://platform.moonshot.cn',
            features: ['Kimi品牌', '超長上下文', '中文優秀', '穩定可靠']
        };
    }
}

module.exports = MoonshotProvider;
