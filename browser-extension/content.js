/**
 * Content Script (content.js)
 * 
 * 職責:
 * - 偵測 YouTube 頁面上的影片 URL
 * - 提取影片 ID
 * - 監聽 URL 變化（YouTube 是 SPA，需要監聽導航事件）
 * - 向 Service Worker 發送影片資訊
 * 
 * Requirements: 2.1, 2.2, 2.4
 */

/**
 * Extract video ID from current page URL
 * Uses the same logic as utils.js but implemented here for content script
 * Requirements: 2.1, 2.2
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
 * Currently detected video information
 */
let currentVideoId = null;
let cachedCaptionData = null; // Cache extracted caption data

/**
 * Detect and send video information to background script
 * Requirements: 2.1, 2.2, 2.4
 */
function detectAndSendVideoInfo() {
    const url = window.location.href;
    const videoId = extractVideoId(url);

    // Only send if video ID changed or is newly detected
    if (videoId && videoId !== currentVideoId) {
        currentVideoId = videoId;

        // Note: Caption extraction is now handled by the injected script interceptor
        // No need to manually extract from ytInitialPlayerResponse

        // Send video info to background script
        chrome.runtime.sendMessage({
            type: 'VIDEO_DETECTED',
            payload: {
                videoId: videoId,
                videoUrl: url
            }
        }).catch(error => {
            console.error('Failed to send video info to background:', error);
        });

        console.log('Video detected:', videoId);
    } else if (!videoId && currentVideoId) {
        // Navigated away from video page
        currentVideoId = null;
        cachedCaptionData = null;

        chrome.runtime.sendMessage({
            type: 'VIDEO_DETECTED',
            payload: {
                videoId: null,
                videoUrl: url
            }
        }).catch(error => {
            console.error('Failed to send clear video info to background:', error);
        });
    }
}

/**
 * Try to extract caption data from the page
 * Uses DOM inspection to find ytInitialPlayerResponse
 */
function tryCaptionExtraction(videoId) {
    try {
        // Method 1: Try window.ytInitialPlayerResponse first
        let playerResponse = window.ytInitialPlayerResponse;

        // Method 2: Try to find it in the page's script tags
        if (!playerResponse || !playerResponse.captions) {
            console.log('[YouTubeToBlog] Searching for ytInitialPlayerResponse in script tags...');

            const scripts = document.querySelectorAll('script');
            for (const script of scripts) {
                const content = script.textContent || '';

                // Look for ytInitialPlayerResponse in script content
                if (content.includes('var ytInitialPlayerResponse =')) {
                    try {
                        // Extract the JSON data
                        const match = content.match(/var ytInitialPlayerResponse\s*=\s*({.+?});/s);
                        if (match && match[1]) {
                            playerResponse = JSON.parse(match[1]);
                            console.log('[YouTubeToBlog] Found ytInitialPlayerResponse in script tag');
                            break;
                        }
                    } catch (e) {
                        console.warn('[YouTubeToBlog] Failed to parse ytInitialPlayerResponse from script:', e);
                    }
                }
            }
        }

        // Method 3: Try ytInitialData as fallback
        if (!playerResponse || !playerResponse.captions) {
            console.log('[YouTubeToBlog] Trying ytInitialData...');
            const ytInitialData = window.ytInitialData;

            // Sometimes captions are in ytInitialData
            if (ytInitialData) {
                try {
                    // Search for playerCaptionsTracklistRenderer in the data structure
                    const findCaptions = (obj) => {
                        if (!obj || typeof obj !== 'object') return null;

                        if (obj.playerCaptionsTracklistRenderer) {
                            return obj.playerCaptionsTracklistRenderer;
                        }

                        for (const key in obj) {
                            const result = findCaptions(obj[key]);
                            if (result) return result;
                        }

                        return null;
                    };

                    const captionsRenderer = findCaptions(ytInitialData);
                    if (captionsRenderer && captionsRenderer.captionTracks) {
                        playerResponse = {
                            captions: {
                                playerCaptionsTracklistRenderer: captionsRenderer
                            }
                        };
                        console.log('[YouTubeToBlog] Found captions in ytInitialData');
                    }
                } catch (e) {
                    console.warn('[YouTubeToBlog] Failed to extract from ytInitialData:', e);
                }
            }
        }

        if (!playerResponse || !playerResponse.captions) {
            console.log('[YouTubeToBlog] No caption data available yet, will retry...');
            // Stop retrying after a reasonable time (30 seconds)
            const now = Date.now();
            if (!window.ytToBlogStartTime) {
                window.ytToBlogStartTime = now;
            }

            if (now - window.ytToBlogStartTime < 30000) {
                setTimeout(() => tryCaptionExtraction(videoId), 1000); // Slower retry
            } else {
                console.log('[YouTubeToBlog] Stopped retrying after 30 seconds');
                window.ytToBlogStartTime = null;
            }
            return;
        }

        const captionTracks = playerResponse.captions.playerCaptionsTracklistRenderer?.captionTracks;

        if (!captionTracks || captionTracks.length === 0) {
            console.log('[YouTubeToBlog] No caption tracks found');
            return;
        }

        // Cache the caption data for later use
        cachedCaptionData = {
            videoId: videoId,
            captionTracks: captionTracks,
            timestamp: Date.now()
        };

        console.log('[YouTubeToBlog] Caption data cached successfully:', captionTracks.length, 'tracks');
        window.ytToBlogStartTime = null; // Reset timer

    } catch (error) {
        console.error('[YouTubeToBlog] Failed to extract captions:', error);
    }
}

/**
 * Initialize content script
 * Detect initial video and set up listeners
 */
function init() {
    console.log('YouTubeToBlog Content Script initialized');

    // Inject the interceptor script into the page context
    injectScript();

    // Listen for messages from the injected script
    window.addEventListener('message', (event) => {
        // Only accept messages from same window
        if (event.source !== window) return;

        // Check if it's our message for caption URL
        if (event.data.type === 'YOUTUBE_CAPTION_URL' &&
            event.data.source === 'youtube-to-blog-injected') {

            const captionUrl = event.data.url;
            console.log('[YouTubeToBlog] Received caption URL from injected script:', captionUrl);

            // Extract video ID from current URL
            const videoId = extractVideoId(window.location.href);

            if (videoId && captionUrl) {
                // Cache the caption URL (merge with existing data)
                cachedCaptionData = {
                    ...cachedCaptionData,
                    videoId: videoId,
                    captionUrl: captionUrl,
                    timestamp: Date.now()
                };

                console.log('[YouTubeToBlog] Caption URL cached successfully');
            }
        }

        // Check if it's our message for caption tracks
        if (event.data.type === 'YOUTUBE_CAPTION_TRACKS' &&
            event.data.source === 'youtube-to-blog-injected') {

            const tracks = event.data.tracks;
            console.log('[YouTubeToBlog] Received caption tracks from injected script:', tracks?.length);

            // Extract video ID from current URL
            const videoId = extractVideoId(window.location.href);

            if (videoId && tracks) {
                // Cache the caption tracks (merge with existing data)
                cachedCaptionData = {
                    ...cachedCaptionData,
                    videoId: videoId,
                    captionTracks: tracks,
                    timestamp: Date.now()
                };

                console.log('[YouTubeToBlog] Caption tracks cached successfully');
            }
        }
    });

    // Detect initial video
    detectAndSendVideoInfo();

    // Listen for URL changes (for SPA navigation)
    let lastUrl = window.location.href;

    // MutationObserver for URL changes
    const observer = new MutationObserver(() => {
        const currentUrl = window.location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            detectAndSendVideoInfo();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Also listen for popstate
    window.addEventListener('popstate', () => {
        detectAndSendVideoInfo();
    });
}

/**
 * Inject script into page context to intercept YouTube's requests
 * CRITICAL: This should run as early as possible
 */
function injectScript() {
    try {
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('injected.js');
        script.onload = function () {
            console.log('[YouTubeToBlog] Injected script loaded');
            this.remove();
        };
        // Use documentElement if head is not ready yet (document_start)
        (document.head || document.documentElement).appendChild(script);
    } catch (error) {
        console.error('[YouTubeToBlog] Failed to inject script:', error);
    }
}

/**
 * Message listener - handle requests from background script
 * Requirements: 2.4
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_CURRENT_VIDEO') {
        // Background script is requesting current video info
        const url = window.location.href;
        const videoId = extractVideoId(url);

        sendResponse({
            videoId: videoId,
            videoUrl: videoId ? url : null
        });

        return false; // Synchronous response
    }

    if (message.type === 'EXTRACT_CAPTIONS') {
        // Extract captions directly from YouTube page
        extractCaptionsFromPage(message.videoId)
            .then(transcript => {
                sendResponse({ transcript });
            })
            .catch(error => {
                sendResponse({ error: error.message });
            });

        return true; // Asynchronous response
    }

    return false;
});

/**
 * Extract captions directly from YouTube page
 * Uses cached caption URL from interceptor if available
 */
async function extractCaptionsFromPage(videoId) {
    try {
        // Check if we have a cached caption URL from the interceptor
        if (cachedCaptionData && cachedCaptionData.videoId === videoId && cachedCaptionData.captionUrl) {
            console.log('[YouTubeToBlog] Using intercepted caption URL');

            const captionUrl = cachedCaptionData.captionUrl;
            const response = await fetch(captionUrl);

            if (!response.ok) {
                throw new Error('Failed to fetch caption data');
            }

            const contentType = response.headers.get('content-type');
            console.log('[YouTubeToBlog] Caption content-type:', contentType);

            // Check if it's JSON format (fmt=json3)
            if (contentType && contentType.includes('application/json')) {
                const jsonData = await response.json();
                console.log('[YouTubeToBlog] Parsing JSON3 format');

                // JSON3 format has events array with segments
                if (jsonData.events) {
                    const transcript = jsonData.events
                        .filter(event => event.segs) // Only events with segments
                        .map(event => {
                            return event.segs
                                .map(seg => seg.utf8 || '')
                                .join('');
                        })
                        .join(' ')
                        .replace(/\n/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();

                    if (transcript) {
                        console.log('[YouTubeToBlog] Successfully extracted transcript:', transcript.length, 'characters');
                        return transcript;
                    }
                }

                throw new Error('No transcript data in JSON format');
            }

            // Fallback to XML parsing
            const xmlText = await response.text();

            // Parse XML and extract text
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            const textElements = xmlDoc.getElementsByTagName('text');

            if (textElements.length === 0) {
                // Try <p> tag format (used in some YouTube caption formats)
                const pElements = xmlDoc.getElementsByTagName('p');
                if (pElements.length > 0) {
                    const transcript = Array.from(pElements)
                        .map(el => el.textContent)
                        .join(' ')
                        .replace(/\n/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim();

                    console.log('[YouTubeToBlog] Successfully extracted transcript from <p> tags:', transcript.length, 'characters');
                    return transcript;
                }
                throw new Error('No text found in captions');
            }

            const transcript = Array.from(textElements)
                .map(el => el.textContent)
                .join(' ')
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            console.log('[YouTubeToBlog] Successfully extracted transcript:', transcript.length, 'characters');
            return transcript;
        }

        // Fallback: try the old method with cached tracks
        if (cachedCaptionData && cachedCaptionData.videoId === videoId && cachedCaptionData.captionTracks) {
            console.log('[YouTubeToBlog] Using cached caption tracks');

            const captionTracks = cachedCaptionData.captionTracks;

            // Prefer Chinese (Traditional), then Chinese (Simplified), then auto-generated, then first available
            let captionTrack = captionTracks.find(track =>
                track.languageCode === 'zh-Hant' || track.languageCode === 'zh-TW'
            ) || captionTracks.find(track =>
                track.languageCode === 'zh-Hans' || track.languageCode === 'zh-CN' || track.languageCode === 'zh'
            ) || captionTracks.find(track =>
                track.kind === 'asr'  // Auto-generated
            ) || captionTracks[0];

            console.log('[YouTubeToBlog] Selected caption track:', captionTrack.languageCode, captionTrack.name?.simpleText);

            const response = await fetch(captionTrack.baseUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch caption data');
            }

            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            const textElements = xmlDoc.getElementsByTagName('text');

            if (textElements.length === 0) {
                throw new Error('No text found in captions');
            }

            const transcript = Array.from(textElements)
                .map(el => el.textContent)
                .join(' ')
                .replace(/\n/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            console.log('[YouTubeToBlog] Successfully extracted transcript:', transcript.length, 'characters');
            return transcript;
        }

        throw new Error('No caption data available - please wait for captions to load or play the video');

    } catch (error) {
        console.error('[YouTubeToBlog] Failed to extract captions from page:', error);
        throw error;
    }
}

// ========================================
// CRITICAL: Inject script as early as possible
// ========================================
injectScript();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    // DOM is already ready
    init();
}

