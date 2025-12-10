/**
 * Rate Limiting Middleware
 * 保護 API 免受濫用和 DDoS 攻擊
 */

const rateLimit = require('express-rate-limit');

// 一般 API 速率限制
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 100, // 每個 IP 最多 100 次請求
  message: {
    error: '請求過於頻繁',
    message: '請稍後再試，您已達到請求限制'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 生成 API 嚴格速率限制（消耗 AI tokens）
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: parseInt(process.env.RATE_LIMIT_GENERATE_MAX) || 10, // 每個 IP 最多 10 次生成
  message: {
    error: '生成請求過於頻繁',
    message: '請稍後再試，您已達到生成限制（每15分鐘10次）'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // 使用預設的 keyGenerator，它會正確處理 IPv6
});

// 文字稿 API 速率限制
const transcriptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分鐘
  max: 30, // 每個 IP 最多 30 次請求
  message: {
    error: '請求過於頻繁',
    message: '請稍後再試，您已達到文字稿請求限制'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  generateLimiter,
  transcriptLimiter
};
