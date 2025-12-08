/**
 * Utility functions for YouTube to Blog Chrome Extension
 * @module utils
 */

/**
 * Extract video ID from various YouTube URL formats
 * Supports:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 * - Direct 11-character video ID
 * 
 * @param {string} url - YouTube URL or video ID
 * @returns {string|null} - 11-character video ID or null if invalid
 * 
 * Requirements: 2.1, 2.2, 2.3
 */
function extractVideoId(url) {
    if (!url || typeof url !== 'string') {
        return null;
    }

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
        return null;
    }

    // Patterns for various YouTube URL formats
    const patterns = [
        // youtube.com/watch?v=VIDEO_ID (with optional additional params)
        /(?:youtube\.com\/watch\?(?:[^&]*&)*v=)([a-zA-Z0-9_-]{11})(?:&|$|#)/,
        // youtube.com/watch?v=VIDEO_ID (simple case)
        /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})(?:[&?#]|$)/,
        // youtu.be/VIDEO_ID
        /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[?#]|$)/,
        // youtube.com/embed/VIDEO_ID
        /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(?:[?#]|$)/,
        // Direct 11-character video ID
        /^([a-zA-Z0-9_-]{11})$/
    ];

    for (const pattern of patterns) {
        const match = trimmedUrl.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

/**
 * Validate API key format
 * Returns false for empty strings or strings containing only whitespace
 * 
 * @param {string} key - API key to validate
 * @returns {boolean} - true if valid (non-empty, non-whitespace), false otherwise
 * 
 * Requirements: 3.3
 */
function validateApiKey(key) {
    if (!key || typeof key !== 'string') {
        return false;
    }

    // Check if the key is empty or contains only whitespace
    return key.trim().length > 0;
}

/**
 * Generate download filename from video ID
 * 
 * @param {string} videoId - YouTube video ID
 * @returns {string} - Filename in format "youtube-blog-{videoId}.md"
 * 
 * Requirements: 7.4
 */
function generateFilename(videoId) {
    if (!videoId || typeof videoId !== 'string') {
        return 'youtube-blog-unknown.md';
    }

    const sanitizedId = videoId.trim() || 'unknown';
    return `youtube-blog-${sanitizedId}.md`;
}

// Export for Node.js (testing) and browser environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        extractVideoId,
        validateApiKey,
        generateFilename
    };
}
