/**
 * Injected Script - Runs in the page context
 * Intercepts YouTube's internal communication to extract caption URLs
 * 
 * This script hooks into:
 * 1. fetch() - for modern timedtext API requests
 * 2. XMLHttpRequest - for legacy timedtext requests
 * 3. Object property setters - to capture ytInitialPlayerResponse
 */

(function () {
    'use strict';

    console.log('[YouTubeToBlog Injected] Script loaded');

    // Flag to prevent duplicate sends
    let lastCaptionUrl = null;
    let captionTracks = null;

    /**
     * Send caption URL to content script
     */
    function sendCaptionUrl(url) {
        if (url === lastCaptionUrl) return; // Prevent duplicates
        lastCaptionUrl = url;

        console.log('[YouTubeToBlog Injected] Sending caption URL:', url);
        window.postMessage({
            type: 'YOUTUBE_CAPTION_URL',
            source: 'youtube-to-blog-injected',
            url: url
        }, '*');
    }

    /**
     * Send caption tracks info to content script
     */
    function sendCaptionTracks(tracks) {
        if (!tracks || tracks.length === 0) return;
        if (captionTracks === JSON.stringify(tracks)) return; // Prevent duplicates
        captionTracks = JSON.stringify(tracks);

        console.log('[YouTubeToBlog Injected] Sending caption tracks:', tracks.length);
        window.postMessage({
            type: 'YOUTUBE_CAPTION_TRACKS',
            source: 'youtube-to-blog-injected',
            tracks: tracks
        }, '*');
    }

    /**
     * Extract caption tracks from player response
     */
    function extractCaptionTracks(playerResponse) {
        try {
            const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
            if (tracks && tracks.length > 0) {
                sendCaptionTracks(tracks);

                // Also send the first available URL for immediate use
                const preferredTrack = tracks.find(t =>
                    t.languageCode === 'zh-Hant' || t.languageCode === 'zh-TW'
                ) || tracks.find(t =>
                    t.languageCode === 'zh-Hans' || t.languageCode === 'zh-CN' || t.languageCode === 'zh'
                ) || tracks.find(t =>
                    t.kind === 'asr'
                ) || tracks[0];

                if (preferredTrack && preferredTrack.baseUrl) {
                    sendCaptionUrl(preferredTrack.baseUrl);
                }
            }
        } catch (e) {
            console.warn('[YouTubeToBlog Injected] Failed to extract caption tracks:', e);
        }
    }

    // ========================================
    // Method 1: Intercept fetch requests
    // ========================================
    const originalFetch = window.fetch;
    window.fetch = function (...args) {
        const url = args[0];

        // Check if this is a timedtext request (captions)
        if (typeof url === 'string' && url.includes('/api/timedtext')) {
            console.log('[YouTubeToBlog Injected] Captured timedtext fetch:', url);
            sendCaptionUrl(url);
        }

        return originalFetch.apply(this, args);
    };

    // ========================================
    // Method 2: Intercept XMLHttpRequest
    // ========================================
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...rest) {
        if (typeof url === 'string' && url.includes('/api/timedtext')) {
            console.log('[YouTubeToBlog Injected] Captured timedtext XHR:', url);
            sendCaptionUrl(url);
        }

        return originalXHROpen.apply(this, [method, url, ...rest]);
    };

    // ========================================
    // Method 3: Hook into ytInitialPlayerResponse
    // ========================================
    let _ytInitialPlayerResponse = window.ytInitialPlayerResponse;

    Object.defineProperty(window, 'ytInitialPlayerResponse', {
        configurable: true,
        get: function () {
            return _ytInitialPlayerResponse;
        },
        set: function (value) {
            _ytInitialPlayerResponse = value;
            console.log('[YouTubeToBlog Injected] ytInitialPlayerResponse set');
            if (value) {
                extractCaptionTracks(value);
            }
        }
    });

    // Check if ytInitialPlayerResponse is already set
    if (window.ytInitialPlayerResponse) {
        console.log('[YouTubeToBlog Injected] ytInitialPlayerResponse already exists');
        extractCaptionTracks(window.ytInitialPlayerResponse);
    }

    // ========================================
    // Method 4: Hook into yt.player.Application.create
    // This catches player initialization
    // ========================================
    function hookPlayerConfig() {
        try {
            // Watch for ytcfg.set which contains player configuration
            const originalYtcfgSet = window.ytcfg?.set;
            if (window.ytcfg && originalYtcfgSet) {
                window.ytcfg.set = function (...args) {
                    const result = originalYtcfgSet.apply(this, args);

                    // Check for player response in config
                    const config = args[0];
                    if (config && config.PLAYER_RESPONSE) {
                        console.log('[YouTubeToBlog Injected] Captured PLAYER_RESPONSE from ytcfg');
                        try {
                            const playerResponse = typeof config.PLAYER_RESPONSE === 'string'
                                ? JSON.parse(config.PLAYER_RESPONSE)
                                : config.PLAYER_RESPONSE;
                            extractCaptionTracks(playerResponse);
                        } catch (e) {
                            console.warn('[YouTubeToBlog Injected] Failed to parse PLAYER_RESPONSE:', e);
                        }
                    }

                    return result;
                };
            }
        } catch (e) {
            console.warn('[YouTubeToBlog Injected] Failed to hook ytcfg:', e);
        }
    }

    // Try to hook immediately and also after a short delay
    hookPlayerConfig();
    setTimeout(hookPlayerConfig, 100);

    // ========================================
    // Method 5: Monitor for SPA navigation
    // ========================================
    let lastUrl = window.location.href;
    const urlCheckInterval = setInterval(() => {
        if (window.location.href !== lastUrl) {
            lastUrl = window.location.href;
            lastCaptionUrl = null; // Reset on navigation
            captionTracks = null;

            // Re-check for player response
            if (window.ytInitialPlayerResponse) {
                extractCaptionTracks(window.ytInitialPlayerResponse);
            }
        }
    }, 500);

    console.log('[YouTubeToBlog Injected] Interception setup complete');
})();
