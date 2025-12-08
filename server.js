const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { YoutubeTranscript } = require('youtube-transcript-plus');
const { createProvider, getAllProviders, isValidProvider } = require(path.join(__dirname, 'server', 'services', 'ai-providers'));

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Extract video ID from YouTube URL
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

// === API Routes ===

// Get all available AI providers
app.get('/api/providers', (req, res) => {
  try {
    const providers = getAllProviders();
    res.json({ providers });
  } catch (error) {
    console.error('取得供應商列表錯誤:', error);
    res.status(500).json({ error: '無法取得供應商列表' });
  }
});

// Get YouTube transcript
app.get('/api/transcript', async (req, res) => {
  try {
    const { videoId, language } = req.query;

    if (!videoId) {
      return res.status(400).json({
        error: '缺少視頻 ID',
        message: '請提供有效的 YouTube 視頻 ID 或 URL'
      });
    }

    const extractedId = extractVideoId(videoId);

    if (!extractedId) {
      return res.status(400).json({
        error: '無效的 YouTube URL',
        message: '無法從提供的 URL 中提取視頻 ID'
      });
    }

    console.log(`正在獲取視頻文字稿: ${extractedId}${language ? ` (${language})` : ''}`);

    // Fetch transcript with optional language
    const options = language ? { lang: language } : {};
    const transcript = await YoutubeTranscript.fetchTranscript(extractedId, options);

    if (!transcript || transcript.length === 0) {
      return res.status(404).json({
        error: '未找到文字稿',
        message: '此視頻沒有可用的文字稿'
      });
    }

    // Combine transcript segments into full text
    const fullText = transcript.map(item => item.text).join(' ');

    res.json({
      videoId: extractedId,
      transcript: fullText,
      segments: transcript,
      duration: transcript.length > 0 ? transcript[transcript.length - 1].offset : 0
    });

  } catch (error) {
    console.error('獲取文字稿時發生錯誤:', error);

    if (error.message.includes('disabled')) {
      return res.status(403).json({
        error: '文字稿已停用',
        message: '此視頻的文字稿功能已被停用'
      });
    }

    res.status(500).json({
      error: '服務器錯誤',
      message: error.message || '獲取文字稿時發生未知錯誤'
    });
  }
});

// Generate blog post using selected AI provider
app.post('/api/generate', async (req, res) => {
  try {
    const {
      transcript,
      provider = 'gemini',
      apiKey,
      modelName,
      language = '繁體中文',
      style = 'professional',
      stream = false
    } = req.body;

    // Validation
    if (!transcript) {
      return res.status(400).json({ error: '缺少文字稿內容' });
    }

    if (!apiKey) {
      return res.status(400).json({ error: '缺少 API 密鑰' });
    }

    if (!isValidProvider(provider)) {
      return res.status(400).json({ error: `不支援的 AI 供應商: ${provider}` });
    }

    console.log(`使用 ${provider} 生成文章...`);

    // Create AI provider instance
    const aiProvider = createProvider(provider, apiKey, modelName);

    if (stream) {
      // Server-Sent Events for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const result = await aiProvider.generateBlogPost(transcript, {
        language,
        style,
        onStream: (chunk) => {
          res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        }
      });

      res.write(`data: ${JSON.stringify({ done: true, result })}\n\n`);
      res.end();
    } else {
      // Regular response
      const result = await aiProvider.generateBlogPost(transcript, {
        language,
        style
      });

      res.json({
        success: true,
        article: result,
        provider,
        model: modelName || aiProvider.modelName
      });
    }

  } catch (error) {
    console.error('生成文章錯誤:', error);

    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    } else {
      res.status(500).json({
        error: '生成失敗',
        message: error.message
      });
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 YouTube 轉部落格服務器運行中`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`🤖 支援的 AI 供應商: Gemini, OpenAI, Anthropic, Groq`);
  console.log(`⚙️  環境: ${process.env.NODE_ENV || 'development'}\n`);
});
