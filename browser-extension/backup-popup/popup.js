// DOM Elements
const youtubeUrlInput = document.getElementById('youtubeUrl');
const apiKeyInput = document.getElementById('apiKey');
const modelSelect = document.getElementById('modelSelect');
const convertBtn = document.getElementById('convertBtn');

const formSection = document.getElementById('formSection');
const loadingSection = document.getElementById('loadingSection');
const loadingText = document.getElementById('loadingText');
const step1 = document.getElementById('step1');
const step2 = document.getElementById('step2');
const step3 = document.getElementById('step3');

const resultSection = document.getElementById('resultSection');
const resultContent = document.getElementById('resultContent');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const newConversionBtn = document.getElementById('newConversionBtn');

const errorSection = document.getElementById('errorSection');
const errorMessage = document.getElementById('errorMessage');
const retryBtn = document.getElementById('retryBtn');

// State
let generatedMarkdown = '';
let videoTitle = '';
let currentVideoId = '';

// Constants
const STORAGE_KEY = 'gemini_api_key';
const MODEL_KEY = 'selected_model';

// Extract video ID from YouTube URL
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}

// Get current tab URL
async function getCurrentTabUrl() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.url || '';
}

// Show/Hide sections
function showSection(section) {
    [formSection, loadingSection, resultSection, errorSection].forEach(el => {
        el.style.display = 'none';
    });
    if (section) {
        section.style.display = 'block';
    }
}

// Update loading progress
function updateProgress(stepNumber, text) {
    loadingText.textContent = text;

    // Reset all steps
    [step1, step2, step3].forEach(step => step.classList.remove('active'));

    // Activate current step
    if (stepNumber === 1) step1.classList.add('active');
    if (stepNumber === 2) step2.classList.add('active');
    if (stepNumber === 3) step3.classList.add('active');
}

// Show error
function showError(message) {
    errorMessage.textContent = message;
    showSection(errorSection);
    convertBtn.disabled = false;
}

// Fetch transcript using youtube-transcript API
async function fetchTranscript(videoId) {
    updateProgress(1, '正在獲取視頻文字稿...');

    try {
        // Use youtube-transcript API
        const response = await fetch(`https://yt-transcript-api.vercel.app/api/transcript?videoId=${videoId}`);

        if (!response.ok) {
            throw new Error('無法獲取文字稿');
        }

        const data = await response.json();

        if (!data.transcript || data.transcript.length === 0) {
            throw new Error('此視頻沒有可用的文字稿');
        }

        // Combine transcript segments
        const transcript = data.transcript.map(item => item.text).join(' ');

        updateProgress(2, '成功提取文字稿！');
        return transcript;
    } catch (error) {
        throw new Error(`獲取文字稿失敗: ${error.message}`);
    }
}

// Generate blog post using Gemini API
async function generateBlogPost(transcript, apiKey, modelName = 'gemini-1.5-flash') {
    updateProgress(3, `正在使用 ${modelName} 生成部落格文章...`);

    try {
        // Import Gemini SDK dynamically
        const { GoogleGenerativeAI } = await import('https://esm.run/@google/generative-ai@0.24.1');

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: modelName,
        });

        const prompt = `你是一位專業的部落格作家和 SEO 專家。請將以下 YouTube 視頻文字稿轉換為一篇格式完美、SEO 優化的部落格文章。

要求：
1. 創建一個吸引人的標題（使用 # 標題格式）
2. 撰寫引人入勝的開頭段落
3. 將內容組織成清晰的章節（使用 ## 和 ### 標題）
4. 使用項目符號和編號列表來提高可讀性
5. 在適當的地方添加重點強調（使用 **粗體**）
6. 撰寫一個總結段落
7. 確保語言流暢、專業且易於理解
8. 優化 SEO 關鍵字的使用
9. 使用繁體中文撰寫

原始文字稿：
${transcript}

請生成完整的 Markdown 格式部落格文章：`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (!text || text.trim().length === 0) {
            throw new Error('AI 未能生成有效的內容');
        }

        return text;
    } catch (error) {
        if (error.message.includes('API key')) {
            throw new Error('無效的 API 密鑰，請檢查您的 Gemini API Key');
        }
        throw new Error(`生成文章失敗: ${error.message}`);
    }
}

// Initialize popup
async function initPopup() {
    // Load saved API key and model
    chrome.storage.local.get([STORAGE_KEY, MODEL_KEY], (result) => {
        if (result[STORAGE_KEY]) {
            apiKeyInput.value = result[STORAGE_KEY];
        }
        if (result[MODEL_KEY]) {
            modelSelect.value = result[MODEL_KEY];
        }
    });

    // Get current tab URL and auto-detect YouTube video
    const url = await getCurrentTabUrl();

    if (url.includes('youtube.com/watch')) {
        const videoId = extractVideoId(url);
        if (videoId) {
            youtubeUrlInput.value = url;
            currentVideoId = videoId;
        }
    } else {
        youtubeUrlInput.placeholder = '請在 YouTube 影片頁面使用此擴充功能';
        convertBtn.disabled = true;
    }
}

// Handle conversion
convertBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    const selectedModel = modelSelect.value;

    if (!apiKey) {
        showError('請輸入 Gemini API Key');
        return;
    }

    if (!currentVideoId) {
        showError('請在 YouTube 影片頁面使用此擴充功能');
        return;
    }

    // Save API key and model
    chrome.storage.local.set({
        [STORAGE_KEY]: apiKey,
        [MODEL_KEY]: selectedModel
    });

    // Disable button and show loading
    convertBtn.disabled = true;
    showSection(loadingSection);

    try {
        // Fetch transcript
        const transcript = await fetchTranscript(currentVideoId);

        if (!transcript || transcript.trim().length === 0) {
            throw new Error('此視頻沒有可用的文字稿');
        }

        // Generate blog post
        const blogPost = await generateBlogPost(transcript, apiKey, selectedModel);

        // Store for download
        generatedMarkdown = blogPost;
        videoTitle = `youtube-blog-${currentVideoId}`;

        // Import marked for markdown rendering
        const { marked } = await import('https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js');
        resultContent.innerHTML = marked.parse(blogPost);

        // Show result
        showSection(resultSection);
        convertBtn.disabled = false;

    } catch (error) {
        console.error('Error:', error);
        showError(error.message || '處理過程中發生錯誤');
    }
});

// Copy to clipboard
copyBtn.addEventListener('click', async () => {
    try {
        await navigator.clipboard.writeText(generatedMarkdown);

        // Visual feedback
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = '<span class="btn-icon">✓</span>已複製！';
        copyBtn.style.background = 'rgba(79, 172, 254, 0.2)';

        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.style.background = '';
        }, 2000);
    } catch (error) {
        alert('複製失敗');
    }
});

// Download as markdown file
downloadBtn.addEventListener('click', () => {
    const blob = new Blob([generatedMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${videoTitle}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// New conversion
newConversionBtn.addEventListener('click', () => {
    showSection(formSection);
    generatedMarkdown = '';
    videoTitle = '';
});

// Retry on error
retryBtn.addEventListener('click', () => {
    showSection(formSection);
});

// Initialize
initPopup();
