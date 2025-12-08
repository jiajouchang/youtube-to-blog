const AIProvider = require('./base');

class CohereProvider extends AIProvider {
    constructor(apiKey, modelName = 'command-r') {
        super(apiKey);
        this.modelName = modelName;
        this.baseURL = 'https://api.cohere.ai/v1';
    }

    async generateBlogPost(transcript, options = {}) {
        const { language = '繁體中文', style = 'professional', onStream } = options;

        try {
            const prompt = this.buildPrompt(transcript, language, style);

            const requestBody = {
                model: this.modelName,
                message: prompt,
                temperature: 0.7,
                stream: !!onStream,
            };

            const response = await fetch(`${this.baseURL}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Cohere API 錯誤: ${error}`);
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
                    const lines = chunk.split('\n').filter(line => line.trim());

                    for (const line of lines) {
                        try {
                            const parsed = JSON.parse(line);
                            if (parsed.event_type === 'text-generation') {
                                const content = parsed.text || '';
                                fullText += content;
                                onStream(content);
                            }
                        } catch (e) {
                            // 忽略解析錯誤
                        }
                    }
                }

                return fullText;
            } else {
                // 一次性模式
                const data = await response.json();
                return data.text;
            }
        } catch (error) {
            if (error.message.includes('401') || error.message.includes('invalid_api_key')) {
                throw new Error('無效的 Cohere API 密鑰');
            }
            throw new Error(`Cohere 生成失敗: ${error.message}`);
        }
    }

    async validateApiKey() {
        try {
            const response = await fetch(`${this.baseURL}/check-api-key`, {
                method: 'POST',
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
            name: 'Cohere',
            models: [
                {
                    id: 'command-r-plus',
                    name: 'Command R+',
                    quality: 'highest',
                    speed: 'medium',
                    badge: '🏆 旗艦版'
                },
                {
                    id: 'command-r',
                    name: 'Command R',
                    quality: 'high',
                    speed: 'fast',
                    badge: '⚡ 推薦'
                },
                {
                    id: 'command',
                    name: 'Command',
                    quality: 'high',
                    speed: 'fast'
                },
                {
                    id: 'command-light',
                    name: 'Command Light',
                    quality: 'medium',
                    speed: 'fastest',
                    badge: '💰 經濟'
                },
            ],
            pricing: {
                free: false,
                note: 'Command R: $0.50/1M tokens | R+: $3/1M tokens'
            },
            apiUrl: 'https://dashboard.cohere.com',
            features: ['企業級', 'RAG專用', '多語言支持', '高準確度']
        };
    }
}

module.exports = CohereProvider;
