/**
 * Security Configuration
 * 安全相關配置
 */

// 允許的 CORS 來源
const getAllowedOrigins = () => {
    const envOrigins = process.env.ALLOWED_ORIGINS;
    if (envOrigins) {
        return envOrigins.split(',').map(origin => origin.trim());
    }

    // 預設允許的來源
    if (process.env.NODE_ENV === 'production') {
        return [
            process.env.CLIENT_URL || 'https://your-domain.vercel.app'
        ];
    }

    // 開發環境
    return [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5173'
    ];
};

// CORS 配置選項
const corsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = getAllowedOrigins();

        // 允許無 origin 的請求（如 Postman 或伺服器端請求）在開發環境
        if (!origin && process.env.NODE_ENV !== 'production') {
            return callback(null, true);
        }

        // 允許同源請求（無 origin）
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

// Helmet 安全標頭配置
const helmetOptions = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://generativelanguage.googleapis.com",
                "https://api.openai.com", "https://api.anthropic.com",
                "https://api.groq.com", "https://api.deepseek.com",
                "https://open.bigmodel.cn", "https://api.moonshot.cn",
                "https://api.mistral.ai", "https://api.cohere.ai"]
        }
    },
    crossOriginEmbedderPolicy: false, // 允許嵌入外部資源
};

module.exports = {
    getAllowedOrigins,
    corsOptions,
    helmetOptions
};
