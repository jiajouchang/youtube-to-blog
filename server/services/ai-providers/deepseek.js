const AIProvider = require('./base');

class DeepSeekProvider extends AIProvider {
    constructor(apiKey, modelName = 'deepseek-chat') {
        super(apiKey);
        this.modelName = modelName;
        this.baseURL = 'https://api.deepseek.com/v1';
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
                throw new Error(`DeepSeek API 錯誤: ${error}`);
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
                throw new Error('無效的 DeepSeek API 密鑰');
            }
            throw new Error(`DeepSeek 生成失敗: ${error.message}`);
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
            name: 'DeepSeek',
            models: [
                {
                    id: 'deepseek-chat',
                    name: 'DeepSeek Chat',
                    quality: 'high',
                    speed: 'fast',
                    badge: '💰 超低價'
                },
                {
                    id: 'deepseek-coder',
                    name: 'DeepSeek Coder',
                    quality: 'high',
                    badge: '💻 程式碼專用'
                },
            ],
            pricing: {
                free: false,
                note: '僅 $0.14/1M tokens - 極致性價比'
            },
            apiUrl: 'https://platform.deepseek.com',
            features: ['超低價格', 'GPT-4級別性能', '中英文優秀', '快速響應']
        };
    }
}

module.exports = DeepSeekProvider;
