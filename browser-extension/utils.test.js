/**
 * Property-based tests for utils.js
 * Using fast-check for property-based testing
 */

const fc = require('fast-check');
const { extractVideoId, validateApiKey, generateFilename } = require('./utils');

// Helper: Generate valid YouTube video ID (11 characters, alphanumeric + _ and -)
const videoIdArbitrary = fc.stringOf(
    fc.constantFrom(...'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-'.split('')),
    { minLength: 11, maxLength: 11 }
);

// Helper: Generate valid YouTube URLs with embedded video ID
const youtubeWatchUrlArbitrary = videoIdArbitrary.map(id => `https://www.youtube.com/watch?v=${id}`);
const youtubeShortUrlArbitrary = videoIdArbitrary.map(id => `https://youtu.be/${id}`);
const youtubeEmbedUrlArbitrary = videoIdArbitrary.map(id => `https://www.youtube.com/embed/${id}`);

// Combined arbitrary for all valid YouTube URL formats
const validYoutubeUrlArbitrary = fc.oneof(
    youtubeWatchUrlArbitrary,
    youtubeShortUrlArbitrary,
    youtubeEmbedUrlArbitrary,
    videoIdArbitrary // Direct video ID
);

describe('Utils - Property-Based Tests', () => {
    /**
     * **Feature: sidepanel-conversion, Property 1: YouTube URL Video ID Extraction**
     * 
     * *For any* valid YouTube video URL (including youtube.com/watch?v=, youtu.be/, 
     * and youtube.com/embed/ formats), the extractVideoId function SHALL return 
     * a valid 11-character video ID string.
     * 
     * **Validates: Requirements 2.1, 2.2**
     */
    describe('Property 1: YouTube URL Video ID Extraction', () => {
        it('should extract valid 11-character video ID from youtube.com/watch?v= URLs', () => {
            fc.assert(
                fc.property(videoIdArbitrary, (videoId) => {
                    const url = `https://www.youtube.com/watch?v=${videoId}`;
                    const result = extractVideoId(url);
                    
                    // Result should be the original video ID
                    expect(result).toBe(videoId);
                    // Result should be exactly 11 characters
                    expect(result).toHaveLength(11);
                }),
                { numRuns: 100 }
            );
        });

        it('should extract valid 11-character video ID from youtu.be/ URLs', () => {
            fc.assert(
                fc.property(videoIdArbitrary, (videoId) => {
                    const url = `https://youtu.be/${videoId}`;
                    const result = extractVideoId(url);
                    
                    expect(result).toBe(videoId);
                    expect(result).toHaveLength(11);
                }),
                { numRuns: 100 }
            );
        });

        it('should extract valid 11-character video ID from youtube.com/embed/ URLs', () => {
            fc.assert(
                fc.property(videoIdArbitrary, (videoId) => {
                    const url = `https://www.youtube.com/embed/${videoId}`;
                    const result = extractVideoId(url);
                    
                    expect(result).toBe(videoId);
                    expect(result).toHaveLength(11);
                }),
                { numRuns: 100 }
            );
        });

        it('should extract valid 11-character video ID from direct video ID input', () => {
            fc.assert(
                fc.property(videoIdArbitrary, (videoId) => {
                    const result = extractVideoId(videoId);
                    
                    expect(result).toBe(videoId);
                    expect(result).toHaveLength(11);
                }),
                { numRuns: 100 }
            );
        });

        it('should handle URLs with additional query parameters', () => {
            fc.assert(
                fc.property(videoIdArbitrary, (videoId) => {
                    const url = `https://www.youtube.com/watch?v=${videoId}&t=120`;
                    const result = extractVideoId(url);
                    
                    expect(result).toBe(videoId);
                    expect(result).toHaveLength(11);
                }),
                { numRuns: 100 }
            );
        });
    });


    /**
     * **Feature: sidepanel-conversion, Property 2: Non-YouTube URL Rejection**
     * 
     * *For any* URL that does not match YouTube video URL patterns, 
     * the extractVideoId function SHALL return null.
     * 
     * **Validates: Requirements 2.3**
     */
    describe('Property 2: Non-YouTube URL Rejection', () => {
        // Generate non-YouTube URLs
        const nonYoutubeUrlArbitrary = fc.oneof(
            // Other video platforms
            fc.constant('https://vimeo.com/123456789'),
            fc.constant('https://www.dailymotion.com/video/x7tgad0'),
            fc.constant('https://www.twitch.tv/videos/123456789'),
            // Generic websites
            fc.webUrl().filter(url => 
                !url.includes('youtube.com') && 
                !url.includes('youtu.be')
            ),
            // Random strings that are not valid video IDs (not 11 chars)
            fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.length !== 11),
            fc.string({ minLength: 12, maxLength: 50 }).filter(s => !s.includes('youtube') && !s.includes('youtu.be')),
            // Empty and whitespace
            fc.constant(''),
            fc.constant('   ')
        );

        it('should return null for non-YouTube URLs', () => {
            fc.assert(
                fc.property(nonYoutubeUrlArbitrary, (url) => {
                    const result = extractVideoId(url);
                    expect(result).toBeNull();
                }),
                { numRuns: 100 }
            );
        });

        it('should return null for null or undefined input', () => {
            expect(extractVideoId(null)).toBeNull();
            expect(extractVideoId(undefined)).toBeNull();
        });

        it('should return null for non-string input', () => {
            expect(extractVideoId(123)).toBeNull();
            expect(extractVideoId({})).toBeNull();
            expect(extractVideoId([])).toBeNull();
        });
    });

    /**
     * **Feature: sidepanel-conversion, Property 3: Empty API Key Validation**
     * 
     * *For any* string that is empty or contains only whitespace characters, 
     * the API key validation function SHALL return false (invalid).
     * 
     * **Validates: Requirements 3.3**
     */
    describe('Property 3: Empty API Key Validation', () => {
        // Generate empty or whitespace-only strings
        const emptyOrWhitespaceArbitrary = fc.oneof(
            fc.constant(''),
            fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 })
        );

        it('should return false for empty or whitespace-only API keys', () => {
            fc.assert(
                fc.property(emptyOrWhitespaceArbitrary, (key) => {
                    const result = validateApiKey(key);
                    expect(result).toBe(false);
                }),
                { numRuns: 100 }
            );
        });

        it('should return true for non-empty, non-whitespace API keys', () => {
            // Generate valid API keys (non-empty strings with at least one non-whitespace char)
            const validApiKeyArbitrary = fc.string({ minLength: 1, maxLength: 100 })
                .filter(s => s.trim().length > 0);

            fc.assert(
                fc.property(validApiKeyArbitrary, (key) => {
                    const result = validateApiKey(key);
                    expect(result).toBe(true);
                }),
                { numRuns: 100 }
            );
        });

        it('should return false for null or undefined input', () => {
            expect(validateApiKey(null)).toBe(false);
            expect(validateApiKey(undefined)).toBe(false);
        });

        it('should return false for non-string input', () => {
            expect(validateApiKey(123)).toBe(false);
            expect(validateApiKey({})).toBe(false);
        });
    });

    /**
     * **Feature: sidepanel-conversion, Property 4: Download Filename Generation**
     * 
     * *For any* video ID string, the generated download filename SHALL contain 
     * the video ID and end with the ".md" extension.
     * 
     * **Validates: Requirements 7.4**
     */
    describe('Property 4: Download Filename Generation', () => {
        it('should generate filename containing video ID and ending with .md', () => {
            fc.assert(
                fc.property(videoIdArbitrary, (videoId) => {
                    const result = generateFilename(videoId);
                    
                    // Filename should contain the video ID
                    expect(result).toContain(videoId);
                    // Filename should end with .md
                    expect(result).toMatch(/\.md$/);
                }),
                { numRuns: 100 }
            );
        });

        it('should handle any non-empty string as video ID', () => {
            const anyStringArbitrary = fc.string({ minLength: 1, maxLength: 50 })
                .filter(s => s.trim().length > 0);

            fc.assert(
                fc.property(anyStringArbitrary, (videoId) => {
                    const result = generateFilename(videoId);
                    
                    // Filename should contain the trimmed video ID
                    expect(result).toContain(videoId.trim());
                    // Filename should end with .md
                    expect(result).toMatch(/\.md$/);
                }),
                { numRuns: 100 }
            );
        });

        it('should return default filename for null/undefined/empty input', () => {
            expect(generateFilename(null)).toBe('youtube-blog-unknown.md');
            expect(generateFilename(undefined)).toBe('youtube-blog-unknown.md');
            expect(generateFilename('')).toBe('youtube-blog-unknown.md');
            expect(generateFilename('   ')).toBe('youtube-blog-unknown.md');
        });
    });
});
