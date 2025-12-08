const AIProvider = require('./base');

class ZhipuProvider extends AIProvider {
    constructor(apiKey, modelName = 'glm-4-flash') {
        super(apiKey);
        this.modelName = modelName;
        this.baseURL = 'https://open.bigmodel.cn/api/paas/v4';
    }

    async generateBlogPost(transcript, options = {}) {
        const { language = '繁體中文', style = 'professional', onStream } = options;

        try {
            const prompt = this.buildPrompt(transcript, language, style);

            const requestBody = {
                model: this.modelName,
                messages: [{ role: 'user', content: prompt }],
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
                throw new Error(`Zhipu API 錯誤: ${error}`);
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
                throw new Error('無效的 Zhipu AI API 密鑰');
            }
            throw new Error(`Zhipu AI 生成失敗: ${error.message}`);
        }
    }

    async validateApiKey() {
        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.modelName,
                    messages: [{ role: 'user', content: 'test' }],
                }),
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    getProviderInfo() {
        return {
            name: 'Zhipu AI (智譜)',
            models: [
                {
                    id: 'glm-4-plus',
                    name: 'GLM-4 Plus',
                    quality: 'highest',
                    speed: 'medium',
                    badge: '🏆 旗艦版'
                },
                {
                    id: 'glm-4-flash',
                    name: 'GLM-4 Flash',
                    quality: 'high',
                    speed: 'fastest',
                    badge: '⚡ 推薦'
                },
                {
                    id: 'glm-4',
                    name: 'GLM-4',
                    quality: 'high',
                    speed: 'fast'
                },
                {
                    id: 'glm-3-turbo',
                    name: 'GLM-3 Turbo',
                    quality: 'medium',
                    speed: 'fastest',
                    badge: '💰 經濟'
                },
            ],
            pricing: {
                free: false,
                note: 'GLM-4-Flash: $0.07/1M tokens'
            },
            apiUrl: 'https://open.bigmodel.cn',
            features: ['清華背景', '中文優秀', '高性價比', '快速響應']
        };
    }
}

module.exports = ZhipuProvider;
