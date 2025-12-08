// Modern YouTube to Blog Application
// Multi AI Provider Support with Streaming

// ===== STATE MANAGEMENT =====
const state = {
    providers: [],
    selectedProvider: 'gemini',
    selectedModel: null,
    apiKeys: {}, // { provider: apiKey }
    generatedMarkdown: '',
    videoTitle: '',
    isStreaming: false,
};

// ===== DOM ELEMENTS =====
const elements = {
    form: document.getElementById('convertForm'),
    youtubeUrlInput: document.getElementById('youtubeUrl'),
    providerSelect: document.getElementById('providerSelect'),
    modelSelect: document.getElementById('modelSelect'),
    apiKeyInput: document.getElementById('apiKey'),
    styleSelect: document.getElementById('styleSelect'),
    languageSelect: document.getElementById('languageSelect'),
    streamToggle: document.getElementById('streamToggle'),
    submitBtn: document.getElementById('submitBtn'),
    apiLinkContainer: document.getElementById('apiLinkContainer'),
    apiLink: document.getElementById('apiLink'),

    loadingSection: document.getElementById('loadingSection'),
    loadingText: document.getElementById('loadingText'),
    progressSteps: {
        step1: document.getElementById('step1'),
        step2: document.getElementById('step2'),
        step3: document.getElementById('step3'),
    },

    resultSection: document.getElementById('resultSection'),
    resultContent: document.getElementById('resultContent'),
    copyBtn: document.getElementById('copyBtn'),
    downloadBtn: document.getElementById('downloadBtn'),
    newConversionBtn: document.getElementById('newConversionBtn'),

    errorSection: document.getElementById('errorSection'),
    errorMessage: document.getElementById('errorMessage'),
    retryBtn: document.getElementById('retryBtn'),
};

// ===== UTILITY FUNCTIONS =====

function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^\&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}

function showSection(section) {
    [elements.loadingSection, elements.resultSection, elements.errorSection].forEach(el => {
        if (el) el.style.display = 'none';
    });
    if (section) {
        section.style.display = 'block';
    }
}

function updateProgress(stepNumber, text) {
    if (elements.loadingText) {
        elements.loadingText.textContent = text;
    }

    // Reset all steps
    Object.values(elements.progressSteps).forEach(step => {
        if (step) step.classList.remove('active');
    });

    // Activate current step
    const currentStep = elements.progressSteps[`step${stepNumber}`];
    if (currentStep) {
        currentStep.classList.add('active');
    }
}

function showError(message) {
    if (elements.errorMessage) {
        elements.errorMessage.textContent = message;
    }
    showSection(elements.errorSection);
    if (elements.submitBtn) {
        elements.submitBtn.disabled = false;
    }
}

// ===== API KEY MANAGEMENT =====

const STORAGE_PREFIX = 'yt_blog_api_key_';

function saveApiKey(provider, apiKey) {
    if (apiKey && apiKey.trim()) {
        localStorage.setItem(`${STORAGE_PREFIX}${provider}`, apiKey);
        state.apiKeys[provider] = apiKey;
    }
}

function loadApiKey(provider) {
    const saved = localStorage.getItem(`${STORAGE_PREFIX}${provider}`);
    if (saved) {
        state.apiKeys[provider] = saved;
        return saved;
    }
    return '';
}

function loadAllApiKeys() {
    state.providers.forEach(provider => {
        const saved = loadApiKey(provider.id);
        if (saved && elements.apiKeyInput) {
            elements.apiKeyInput.value = saved;
        }
    });
}

// ===== PROVIDER MANAGEMENT =====

async function loadProviders() {
    try {
        const data = await API.getProviders();
        state.providers = data.providers;

        // Populate provider select
        if (elements.providerSelect) {
            elements.providerSelect.innerHTML = '';
            data.providers.forEach(provider => {
                const option = document.createElement('option');
                option.value = provider.id;
                option.textContent = `${provider.name}${provider.pricing.free ? ' 🆓' : ''}`;
                elements.providerSelect.appendChild(option);
            });

            // Set default
            state.selectedProvider = 'gemini';
            updateModelOptions(state.selectedProvider);
        }
    } catch (error) {
        console.error('載入供應商失敗:', error);
    }
}

function updateModelOptions(providerId) {
    const provider = state.providers.find(p => p.id === providerId);
    if (!provider || !elements.modelSelect) return;

    elements.modelSelect.innerHTML = '';
    provider.models.forEach(model => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = `${model.name}${model.badge ? ' ' + model.badge : ''}`;
        elements.modelSelect.appendChild(option);
    });

    state.selectedModel = provider.models[0]?.id;

    // Load saved API key for this provider
    const savedKey = loadApiKey(providerId);
    if (savedKey && elements.apiKeyInput) {
        elements.apiKeyInput.value = savedKey;
    } else if (elements.apiKeyInput) {
        elements.apiKeyInput.value = '';
    }

    // Update API link display
    if (provider.apiUrl && elements.apiLinkContainer && elements.apiLink) {
        elements.apiLink.href = provider.apiUrl;
        elements.apiLink.textContent = provider.name + ' API 密鑰申請';
        elements.apiLinkContainer.style.display = 'flex';
    } else if (elements.apiLinkContainer) {
        elements.apiLinkContainer.style.display = 'none';
    }
}

// ===== MAIN CONVERSION LOGIC =====

async function handleConversion(e) {
    e.preventDefault();

    const youtubeUrl = elements.youtubeUrlInput?.value.trim();
    const apiKey = elements.apiKeyInput?.value.trim();
    const provider = elements.providerSelect?.value || 'gemini';
    const model = elements.modelSelect?.value;
    const style = elements.styleSelect?.value || 'professional';
    const language = elements.languageSelect?.value || '繁體中文';
    const useStreaming = elements.streamToggle?.checked || false;

    // Validation
    if (!youtubeUrl || !apiKey) {
        showError('請填寫所有必填欄位');
        return;
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
        showError('無效的 YouTube URL，請檢查您的輸入');
        return;
    }

    // Save API key
    saveApiKey(provider, apiKey);

    // Disable submit and show loading
    if (elements.submitBtn) {
        elements.submitBtn.disabled = true;
    }
    showSection(elements.loadingSection);

    try {
        // Step 1: Fetch transcript
        updateProgress(1, '正在獲取視頻資訊...');
        const transcriptData = await API.getTranscript(videoId);

        if (!transcriptData.transcript || transcriptData.transcript.trim().length === 0) {
            throw new Error('此視頻沒有可用的文字稿');
        }

        updateProgress(2, '成功提取文字稿！');

        // Step 3: Generate blog post
        updateProgress(3, `正在使用 ${provider} 生成部落格文章...`);

        let blogPost;

        if (useStreaming) {
            // Streaming mode
            state.isStreaming = true;
            let streamedContent = '';

            // Show result section early for streaming
            if (elements.resultContent) {
                elements.resultContent.innerHTML = '<p class="streaming-indicator">✨ AI 正在生成中...</p>';
            }
            showSection(elements.resultSection);

            blogPost = await API.generateBlogPost({
                transcript: transcriptData.transcript,
                provider,
                apiKey,
                modelName: model,
                language,
                style,
                stream: true,
                onStream: (chunk, fullText) => {
                    streamedContent = fullText;
                    if (elements.resultContent) {
                        elements.resultContent.innerHTML = marked.parse(fullText);
                    }
                }
            });

            state.isStreaming = false;
        } else {
            // Regular mode
            const result = await API.generateBlogPost({
                transcript: transcriptData.transcript,
                provider,
                apiKey,
                modelName: model,
                language,
                style,
                stream: false,
            });

            blogPost = result.article;
        }

        // Store for download
        state.generatedMarkdown = blogPost;
        state.videoTitle = `youtube-blog-${videoId}`;

        // Render markdown
        if (elements.resultContent) {
            elements.resultContent.innerHTML = marked.parse(blogPost);
        }

        // Show result
        showSection(elements.resultSection);

    } catch (error) {
        console.error('轉換錯誤:', error);
        showError(error.message || '處理過程中發生錯誤');
    } finally {
        if (elements.submitBtn) {
            elements.submitBtn.disabled = false;
        }
        state.isStreaming = false;
    }
}

// ===== UI EVENT HANDLERS =====

function setupEventListeners() {
    // Form submission
    if (elements.form) {
        elements.form.addEventListener('submit', handleConversion);
    }

    // Provider changed
    if (elements.providerSelect) {
        elements.providerSelect.addEventListener('change', (e) => {
            state.selectedProvider = e.target.value;
            updateModelOptions(state.selectedProvider);
        });
    }

    // Copy to clipboard
    if (elements.copyBtn) {
        elements.copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(state.generatedMarkdown);

                const originalText = elements.copyBtn.innerHTML;
                elements.copyBtn.innerHTML = '<span class="btn-icon">✓</span>已複製！';
                elements.copyBtn.style.background = 'rgba(16, 185, 129, 0.2)';

                setTimeout(() => {
                    elements.copyBtn.innerHTML = originalText;
                    elements.copyBtn.style.background = '';
                }, 2000);
            } catch (error) {
                alert('複製失敗，請手動選擇文字複製');
            }
        });
    }

    // Download as markdown
    if (elements.downloadBtn) {
        elements.downloadBtn.addEventListener('click', () => {
            const blob = new Blob([state.generatedMarkdown], {
                type: 'text/markdown;charset=utf-8'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${state.videoTitle}.md`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    }

    // New conversion
    if (elements.newConversionBtn) {
        elements.newConversionBtn.addEventListener('click', () => {
            showSection(null);
            if (elements.form) {
                elements.form.reset();
            }
            state.generatedMarkdown = '';
            state.videoTitle = '';

            // Restore provider selection
            if (elements.providerSelect) {
                elements.providerSelect.value = state.selectedProvider;
                updateModelOptions(state.selectedProvider);
            }
        });
    }

    // Retry on error
    if (elements.retryBtn) {
        elements.retryBtn.addEventListener('click', () => {
            showSection(null);
        });
    }
}

// ===== INITIALIZATION =====

async function init() {
    console.log('🚀 YouTube 轉部落格應用程式啟動中...');

    // Load providers from API
    await loadProviders();

    // Load saved API keys
    loadAllApiKeys();

    // Setup event listeners
    setupEventListeners();

    console.log('✅ 應用程式已準備就緒');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
