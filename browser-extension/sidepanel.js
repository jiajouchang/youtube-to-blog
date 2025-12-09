/**
 * Side Panel Script (sidepanel.js)
 * 
 * 職責:
 * - 初始化 Side Panel
 * - 管理 UI 狀態切換
 * - 處理影片資訊接收
 * - 執行轉換流程（支援多 AI 供應商）
 * - 處理結果操作（複製、下載）
 * - 錯誤處理
 */

import { AI_PROVIDERS, generateContent } from './ai-providers.js';
import { getMessage, setLanguage, getLanguage } from './i18n.js';

// ============================================================================
// State Management
// ============================================================================

const state = {
    videoId: null,
    videoUrl: null,
    selectedProvider: 'gemini',
    selectedModel: 'gemini-2.5-flash',
    apiKeys: {}, // { providerId: apiKey }
    transcript: null,
    blogPost: null,
    outputLanguage: 'English', // Default output language
    uiLanguage: 'en' // Default UI language
};

// DOM Elements
const elements = {
    // Sections
    formSection: null,
    loadingSection: null,
    resultSection: null,
    errorSection: null,

    // Form elements
    videoUrlInput: null,
    urlHint: null,
    providerSelect: null,
    modelSelect: null,
    outputLanguageSelect: null,
    uiLanguageSelect: null,
    apiKeyInput: null,
    apiKeyLink: null,
    convertBtn: null,

    // Loading elements
    loadingStatus: null,
    progressFill: null,

    // Result elements
    resultContent: null,
    copyBtn: null,
    downloadBtn: null,
    newConversionBtn: null,

    // Error elements
    errorMessage: null,
    retryBtn: null
};

// ============================================================================
// Initialization
// ============================================================================

/**
 * Initialize the Side Panel
 */
async function initSidePanel() {
    // Get DOM elements first
    getDOMElements();

    // Load saved settings from Chrome Storage (including uiLanguage)
    await loadSettings();

    // Localize HTML based on saved/default language
    localizeHtml();

    // Populate provider select and model select
    populateProviderOptions();

    // Set up event listeners
    setupEventListeners();

    // Request current video info from background script
    await requestVideoInfo();

    // Listen for video info updates
    listenForVideoUpdates();

    console.log('[SidePanel] Initialized with multi-provider support');
}

/**
 * Localize HTML elements
 */
function localizeHtml() {
    // Apply current language
    setLanguage(state.uiLanguage);

    const i18nElements = document.querySelectorAll('[data-i18n]');
    i18nElements.forEach(element => {
        const key = element.getAttribute('data-i18n');
        const message = getMessage(key);
        if (message) {
            element.textContent = message;
        }
    });

    const placeholders = document.querySelectorAll('[data-i18n-placeholder]');
    placeholders.forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        const message = getMessage(key);
        if (message) {
            element.placeholder = message;
        }
    });

    // Update document lang attribute
    document.documentElement.lang = state.uiLanguage === 'zh_TW' ? 'zh-TW' : 'en';
}

/**
 * Get all DOM elements
 */
function getDOMElements() {
    // Sections
    elements.formSection = document.getElementById('form-section');
    elements.loadingSection = document.getElementById('loading-section');
    elements.resultSection = document.getElementById('result-section');
    elements.errorSection = document.getElementById('error-section');

    // Form elements
    elements.videoUrlInput = document.getElementById('video-url');
    elements.urlHint = document.getElementById('url-hint');
    elements.providerSelect = document.getElementById('provider-select');
    elements.modelSelect = document.getElementById('model-select');
    elements.outputLanguageSelect = document.getElementById('output-language-select');
    elements.uiLanguageSelect = document.getElementById('ui-language-select');
    elements.apiKeyInput = document.getElementById('api-key');
    elements.apiKeyLink = document.getElementById('api-key-link');
    elements.convertBtn = document.getElementById('convert-btn');

    // Loading elements
    elements.loadingStatus = document.getElementById('loading-status');
    elements.progressFill = document.getElementById('progress-fill');

    // Result elements
    elements.resultContent = document.getElementById('result-content');
    elements.copyBtn = document.getElementById('copy-btn');
    elements.downloadBtn = document.getElementById('download-btn');
    elements.newConversionBtn = document.getElementById('new-conversion-btn');

    // Error elements
    elements.errorMessage = document.getElementById('error-message');
    elements.retryBtn = document.getElementById('retry-btn');
}

/**
 * Populate provider dropdown options
 */
function populateProviderOptions() {
    // Provider options are already in HTML, just update models
    updateModelOptions(state.selectedProvider);
}

/**
 * Update model dropdown based on selected provider
 */
function updateModelOptions(providerId) {
    const provider = AI_PROVIDERS[providerId];
    if (!provider) return;

    elements.modelSelect.innerHTML = '';

    provider.models.forEach((model, index) => {
        const option = document.createElement('option');
        option.value = model.id;
        option.textContent = model.badge ? `${model.name} ${model.badge}` : model.name;
        elements.modelSelect.appendChild(option);

        // Select first model by default
        if (index === 0) {
            state.selectedModel = model.id;
        }
    });

    // Update API key link
    if (elements.apiKeyLink) {
        elements.apiKeyLink.href = provider.apiUrl;
        elements.apiKeyLink.textContent = getMessage('linkGetProviderApiKey', [provider.name]);
    }
}

/**
 * Load settings from Chrome Storage
 */
async function loadSettings() {
    try {
        const data = await chrome.storage.local.get([
            'selectedProvider',
            'selectedModel',
            'apiKeys',
            'outputLanguage',
            'uiLanguage'
        ]);

        // UI Language must be loaded first before localizeHtml is called
        if (data.uiLanguage) {
            state.uiLanguage = data.uiLanguage;
            if (elements.uiLanguageSelect) {
                elements.uiLanguageSelect.value = data.uiLanguage;
            }
        }

        if (data.selectedProvider) {
            state.selectedProvider = data.selectedProvider;
            elements.providerSelect.value = data.selectedProvider;
            updateModelOptions(data.selectedProvider);
        }

        if (data.selectedModel) {
            state.selectedModel = data.selectedModel;
            elements.modelSelect.value = data.selectedModel;
        }

        if (data.outputLanguage) {
            state.outputLanguage = data.outputLanguage;
            elements.outputLanguageSelect.value = data.outputLanguage;
        }

        if (data.apiKeys) {
            state.apiKeys = data.apiKeys;
            // Load API key for current provider
            const currentApiKey = state.apiKeys[state.selectedProvider];
            if (currentApiKey) {
                elements.apiKeyInput.value = currentApiKey;
            }
        }

        updateConvertButtonState();
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Provider select
    elements.providerSelect.addEventListener('change', handleProviderChange);

    // Model select
    elements.modelSelect.addEventListener('change', handleModelChange);

    // Output Language select
    elements.outputLanguageSelect.addEventListener('change', handleOutputLanguageChange);

    // UI Language select
    if (elements.uiLanguageSelect) {
        elements.uiLanguageSelect.addEventListener('change', handleUILanguageChange);
    }

    // API Key input
    elements.apiKeyInput.addEventListener('input', handleApiKeyInput);

    // Convert button
    elements.convertBtn.addEventListener('click', handleConvert);

    // Result buttons
    elements.copyBtn.addEventListener('click', handleCopy);
    elements.downloadBtn.addEventListener('click', handleDownload);
    elements.newConversionBtn.addEventListener('click', handleNewConversion);

    // Retry button
    elements.retryBtn.addEventListener('click', handleRetry);
}

// ============================================================================
// Video Info Management
// ============================================================================

/**
 * Request current video info from background script
 */
async function requestVideoInfo() {
    try {
        const response = await chrome.runtime.sendMessage({
            type: 'GET_VIDEO_INFO'
        });

        if (response && response.videoId) {
            updateVideoInfo(response.videoId, response.videoUrl);
        } else {
            updateVideoInfo(null, null);
        }
    } catch (error) {
        console.error('Failed to get video info:', error);
        updateVideoInfo(null, null);
    }
}

/**
 * Listen for video info updates from background script
 */
function listenForVideoUpdates() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'VIDEO_INFO') {
            const { videoId, videoUrl } = message.payload;
            updateVideoInfo(videoId, videoUrl);
        }
    });
}

/**
 * Update video info in UI
 */
function updateVideoInfo(videoId, videoUrl) {
    state.videoId = videoId;
    state.videoUrl = videoUrl;

    if (videoId) {
        elements.videoUrlInput.value = videoUrl;
        elements.urlHint.textContent = getMessage('hintVideoId', [videoId]);
        elements.urlHint.style.color = '#1e8e3e';
    } else {
        elements.videoUrlInput.value = '';
        elements.urlHint.textContent = getMessage('hintVideoUrl');
        elements.urlHint.style.color = '#5f6368';
    }

    updateConvertButtonState();
}

// ============================================================================
// Form Handlers
// ============================================================================

/**
 * Handle provider selection change
 */
async function handleProviderChange(event) {
    const providerId = event.target.value;
    state.selectedProvider = providerId;

    // Update model options
    updateModelOptions(providerId);

    // Load saved API key for this provider
    const savedApiKey = state.apiKeys[providerId] || '';
    elements.apiKeyInput.value = savedApiKey;

    // Save selection
    try {
        await chrome.storage.local.set({ selectedProvider: providerId });
    } catch (error) {
        console.error('Failed to save provider selection:', error);
    }

    updateConvertButtonState();
}

/**
 * Handle model selection change
 */
async function handleModelChange(event) {
    const model = event.target.value;
    state.selectedModel = model;

    // Save to Chrome Storage
    try {
        await chrome.storage.local.set({ selectedModel: model });
    } catch (error) {
        console.error('Failed to save model selection:', error);
    }
}

/**
 * Handle output language selection change
 */
async function handleOutputLanguageChange(event) {
    const language = event.target.value;
    state.outputLanguage = language;

    // Save to Chrome Storage
    try {
        await chrome.storage.local.set({ outputLanguage: language });
    } catch (error) {
        console.error('Failed to save output language:', error);
    }
}

/**
 * Handle UI language selection change
 */
async function handleUILanguageChange(event) {
    const language = event.target.value;
    state.uiLanguage = language;

    // Save to Chrome Storage
    try {
        await chrome.storage.local.set({ uiLanguage: language });
    } catch (error) {
        console.error('Failed to save UI language:', error);
    }

    // Re-localize the UI
    localizeHtml();

    // Update dynamic elements that may have been set programmatically
    if (state.videoId) {
        elements.urlHint.textContent = getMessage('hintVideoId', [state.videoId]);
    } else {
        elements.urlHint.textContent = getMessage('hintVideoUrl');
    }

    // Update API key link
    const provider = AI_PROVIDERS[state.selectedProvider];
    if (provider && elements.apiKeyLink) {
        elements.apiKeyLink.textContent = getMessage('linkGetProviderApiKey', [provider.name]);
    }
}

/**
 * Handle API Key input
 */
async function handleApiKeyInput(event) {
    const apiKey = event.target.value.trim();

    // Save to state for current provider
    state.apiKeys[state.selectedProvider] = apiKey;

    // Save to Chrome Storage
    if (apiKey) {
        try {
            await chrome.storage.local.set({ apiKeys: state.apiKeys });
        } catch (error) {
            console.error('Failed to save API key:', error);
        }
    }

    updateConvertButtonState();
}

/**
 * Update convert button state
 * Enable only if video ID and API key are available
 */
function updateConvertButtonState() {
    const currentApiKey = state.apiKeys[state.selectedProvider] || elements.apiKeyInput.value.trim();
    const isValid = state.videoId && currentApiKey;
    elements.convertBtn.disabled = !isValid;
}

// ============================================================================
// UI State Management
// ============================================================================

/**
 * Show specific section and hide others
 */
function showSection(sectionName) {
    const sections = ['form', 'loading', 'result', 'error'];

    sections.forEach(name => {
        const element = elements[`${name}Section`];
        if (name === sectionName) {
            element.classList.remove('hidden');
        } else {
            element.classList.add('hidden');
        }
    });
}

/**
 * Update loading progress
 */
function updateProgress(percentage, status) {
    elements.progressFill.style.width = `${percentage}%`;
    elements.loadingStatus.textContent = status;
}

// ============================================================================
// Conversion Flow
// ============================================================================

/**
 * Handle convert button click
 */
async function handleConvert() {
    const apiKey = state.apiKeys[state.selectedProvider] || elements.apiKeyInput.value.trim();

    if (!state.videoId || !apiKey) {
        showError(getMessage('errNoVideo'));
        return;
    }

    // Show loading section
    showSection('loading');
    updateProgress(0, getMessage('statusPreparing'));

    try {
        // Step 1: Fetch transcript
        updateProgress(10, getMessage('statusExtracting'));
        const transcript = await fetchTranscript(state.videoId);
        state.transcript = transcript;

        // Step 2: Generate blog post
        const providerName = AI_PROVIDERS[state.selectedProvider]?.name || state.selectedProvider;
        updateProgress(50, getMessage('statusGenerating', [providerName]));

        const blogPost = await generateContent(
            state.selectedProvider,
            apiKey,
            state.selectedModel,
            transcript,
            { language: state.outputLanguage } // Pass selected output language
        );
        state.blogPost = blogPost;

        // Step 3: Show result
        updateProgress(100, getMessage('statusComplete'));
        setTimeout(() => {
            showResult(blogPost);
        }, 500);

    } catch (error) {
        console.error('Conversion failed:', error);
        showError(error.message || getMessage('errConversionFailed'));
    }
}

/**
 * Fetch transcript from YouTube
 * Uses content script to extract captions from the page
 */
async function fetchTranscript(videoId, retryCount = 0) {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second

    try {
        updateProgress(15 + (retryCount * 5), '正在從YouTube頁面提取字幕...');

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        if (!tab || !tab.id) {
            throw new Error('無法找到 YouTube 頁面');
        }

        if (!tab.url || !tab.url.includes('youtube.com/watch')) {
            throw new Error('請確認您在 YouTube 影片頁面');
        }

        // Use content script message passing to extract captions
        const statusMsg = retryCount > 0
            ? getMessage('statusExtractingRetry', [retryCount, MAX_RETRIES])
            : getMessage('statusExtracting');
        updateProgress(20 + (retryCount * 5), statusMsg);

        const response = await chrome.tabs.sendMessage(tab.id, {
            type: 'EXTRACT_CAPTIONS',
            videoId: videoId
        });

        if (response && response.transcript) {
            updateProgress(30, getMessage('statusSuccessTranscript'));
            console.log('Successfully extracted transcript:', response.transcript.length, 'chars');
            return response.transcript;
        }

        if (response && response.error) {
            // If error is about page not loaded and we haven't exceeded retries, retry
            if (response.error.includes('please wait') && retryCount < MAX_RETRIES) {
                console.log(`Retrying transcript extraction (${retryCount + 1}/${MAX_RETRIES})...`);
                await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
                return fetchTranscript(videoId, retryCount + 1);
            }
            throw new Error(response.error);
        }

        throw new Error('無法提取字幕');

    } catch (error) {
        // If it's a connection error and we haven't exceeded retries, retry
        if (error.message.includes('Receiving end does not exist') && retryCount < MAX_RETRIES) {
            console.log(`Content script not ready, retrying (${retryCount + 1}/${MAX_RETRIES})...`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return fetchTranscript(videoId, retryCount + 1);
        }

        console.error('Transcript extraction failed:', error);

        // Provide user-friendly error message
        const errorMsg = retryCount >= MAX_RETRIES
            ? getMessage('errTranscriptMaxRetries')
            : getMessage('errTranscriptFailed');

        throw new Error(errorMsg);
    }
}

// ============================================================================
// Result Display and Operations
// ============================================================================

/**
 * Show result section with generated blog post
 */
async function showResult(blogPost) {
    showSection('result');
    await renderMarkdown(blogPost);
}

/**
 * Render Markdown content
 */
async function renderMarkdown(markdown) {
    try {
        // Import marked for markdown rendering
        const { marked } = await import('https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js');
        elements.resultContent.innerHTML = marked.parse(markdown);
    } catch (error) {
        // Fallback to simple rendering if marked fails to load
        console.warn('Failed to load marked.js, using simple rendering');

        let html = markdown;

        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

        // Bold
        html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

        // Italic
        html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

        // Code blocks
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');

        // Inline code
        html = html.replace(/`([^`]+?)`/g, '<code>$1</code>');

        // Lists
        html = html.replace(/^\* (.+)$/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');

        // Line breaks
        html = html.replace(/\n\n/g, '</p><p>');
        html = '<p>' + html + '</p>';

        elements.resultContent.innerHTML = html;
    }
}

/**
 * Handle copy to clipboard
 */
async function handleCopy() {
    if (!state.blogPost) return;

    try {
        await navigator.clipboard.writeText(state.blogPost);

        // Visual feedback
        const originalText = elements.copyBtn.textContent;
        elements.copyBtn.textContent = getMessage('msgCopySuccess');
        setTimeout(() => {
            elements.copyBtn.textContent = originalText;
        }, 2000);

    } catch (error) {
        console.error('Failed to copy:', error);
        alert(getMessage('msgCopyFail'));
    }
}

/**
 * Handle download as .md file
 */
function handleDownload() {
    if (!state.blogPost) return;

    // Generate filename using video ID
    const filename = `youtube-blog-${state.videoId}.md`;

    // Create blob and download
    const blob = new Blob([state.blogPost], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Handle new conversion button
 */
function handleNewConversion() {
    // Reset state
    state.transcript = null;
    state.blogPost = null;

    // Show form section
    showSection('form');

    // Request fresh video info
    requestVideoInfo();
}

// ============================================================================
// Error Handling
// ============================================================================

/**
 * Show error section with message
 */
function showError(message) {
    showSection('error');
    elements.errorMessage.textContent = message;
}

/**
 * Handle retry button
 */
function handleRetry() {
    showSection('form');
}

// ============================================================================
// Initialize on page load
// ============================================================================

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidePanel);
} else {
    initSidePanel();
}
