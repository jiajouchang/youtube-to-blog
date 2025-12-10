/**
 * Global Error Handler Middleware
 * 統一處理錯誤，避免洩漏敏感資訊
 */

const errorHandler = (err, req, res, next) => {
    // 記錄錯誤（生產環境可發送到 Sentry）
    console.error('Error:', {
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
        url: req.url,
        method: req.method,
        ip: req.ip
    });

    // CORS 錯誤
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            error: '禁止訪問',
            message: '此來源不被允許訪問 API'
        });
    }

    // 驗證錯誤
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: '驗證失敗',
            message: err.message
        });
    }

    // 認證錯誤
    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: '未授權',
            message: '請提供有效的認證'
        });
    }

    // 預設錯誤回應
    const statusCode = err.statusCode || 500;
    const isProduction = process.env.NODE_ENV === 'production';

    res.status(statusCode).json({
        error: statusCode === 500 ? '伺服器錯誤' : '請求失敗',
        message: isProduction
            ? '處理請求時發生錯誤，請稍後再試'
            : err.message,
        // 僅在開發環境顯示詳細資訊
        ...(isProduction ? {} : { stack: err.stack })
    });
};

// 404 處理
const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: '未找到',
        message: '請求的資源不存在'
    });
};

module.exports = {
    errorHandler,
    notFoundHandler
};
