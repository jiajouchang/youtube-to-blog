/**
 * Service Worker (background.js)
 * 
 * 職責:
 * - 處理擴充功能圖示點擊事件
 * - 管理側邊欄開啟/關閉
 * - 作為 Content Script 和 Side Panel 之間的訊息橋樑
 * 
 * Requirements: 1.1, 1.2, 2.1, 2.2
 */

// Store the current video info for forwarding to side panel
let currentVideoInfo = {
  videoId: null,
  videoUrl: null
};

/**
 * Handle extension icon click - open side panel
 * Requirements: 1.1 - WHEN a user clicks the extension icon THEN the Side_Panel SHALL open
 */
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Open the side panel for the current window
    await chrome.sidePanel.open({ windowId: tab.windowId });
    
    // If we're on a YouTube page, request current video info from content script
    if (tab.url && tab.url.includes('youtube.com/watch')) {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { 
          type: 'GET_CURRENT_VIDEO' 
        });
        
        if (response && response.videoId) {
          currentVideoInfo = {
            videoId: response.videoId,
            videoUrl: response.videoUrl
          };
        }
      } catch (error) {
        // Content script might not be loaded yet, extract from URL directly
        const videoId = extractVideoIdFromUrl(tab.url);
        if (videoId) {
          currentVideoInfo = {
            videoId: videoId,
            videoUrl: tab.url
          };
        }
      }
    }
  } catch (error) {
    console.error('Failed to open side panel:', error);
  }
});

/**
 * Extract video ID from YouTube URL
 * Used as fallback when content script is not available
 */
function extractVideoIdFromUrl(url) {
  if (!url) return null;
  
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

/**
 * Message listener - handles messages from Content Script and Side Panel
 * Requirements: 2.1, 2.2 - Auto-detect and update video URL
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'VIDEO_DETECTED':
      // Message from Content Script - video detected or changed
      handleVideoDetected(message.payload, sender);
      sendResponse({ success: true });
      break;
      
    case 'GET_VIDEO_INFO':
      // Message from Side Panel - requesting current video info
      handleGetVideoInfo(sendResponse);
      return true; // Keep channel open for async response
      
    default:
      sendResponse({ error: 'Unknown message type' });
  }
  
  return false;
});

/**
 * Handle VIDEO_DETECTED message from Content Script
 * Forward the video info to Side Panel
 */
async function handleVideoDetected(payload, sender) {
  if (!payload || !payload.videoId) return;
  
  // Update stored video info
  currentVideoInfo = {
    videoId: payload.videoId,
    videoUrl: payload.videoUrl
  };
  
  // Forward to Side Panel by broadcasting to all extension pages
  try {
    await chrome.runtime.sendMessage({
      type: 'VIDEO_INFO',
      payload: currentVideoInfo
    });
  } catch (error) {
    // Side panel might not be open yet, that's okay
    // The info will be available when it requests via GET_VIDEO_INFO
  }
}

/**
 * Handle GET_VIDEO_INFO request from Side Panel
 * Returns the current video info
 */
async function handleGetVideoInfo(sendResponse) {
  // First try to get fresh info from the active tab
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab && tab.url && tab.url.includes('youtube.com/watch')) {
      // Try to get info from content script
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { 
          type: 'GET_CURRENT_VIDEO' 
        });
        
        if (response && response.videoId) {
          currentVideoInfo = {
            videoId: response.videoId,
            videoUrl: response.videoUrl
          };
        }
      } catch (error) {
        // Content script not available, extract from URL
        const videoId = extractVideoIdFromUrl(tab.url);
        if (videoId) {
          currentVideoInfo = {
            videoId: videoId,
            videoUrl: tab.url
          };
        }
      }
    } else {
      // Not on a YouTube video page
      currentVideoInfo = {
        videoId: null,
        videoUrl: null
      };
    }
  } catch (error) {
    console.error('Error getting current tab:', error);
  }
  
  sendResponse(currentVideoInfo);
}

/**
 * Listen for tab updates to detect navigation to YouTube videos
 * Requirements: 2.2 - Update detected video URL when user navigates
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only process when URL changes and it's a YouTube video
  if (changeInfo.url && changeInfo.url.includes('youtube.com/watch')) {
    const videoId = extractVideoIdFromUrl(changeInfo.url);
    
    if (videoId) {
      currentVideoInfo = {
        videoId: videoId,
        videoUrl: changeInfo.url
      };
      
      // Notify side panel of the change
      try {
        await chrome.runtime.sendMessage({
          type: 'VIDEO_INFO',
          payload: currentVideoInfo
        });
      } catch (error) {
        // Side panel might not be open
      }
    }
  }
});

/**
 * Listen for tab activation to update video info when switching tabs
 */
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    
    if (tab.url && tab.url.includes('youtube.com/watch')) {
      const videoId = extractVideoIdFromUrl(tab.url);
      
      if (videoId) {
        currentVideoInfo = {
          videoId: videoId,
          videoUrl: tab.url
        };
        
        // Notify side panel
        try {
          await chrome.runtime.sendMessage({
            type: 'VIDEO_INFO',
            payload: currentVideoInfo
          });
        } catch (error) {
          // Side panel might not be open
        }
      }
    } else {
      // Not on YouTube video, clear info
      currentVideoInfo = {
        videoId: null,
        videoUrl: null
      };
      
      try {
        await chrome.runtime.sendMessage({
          type: 'VIDEO_INFO',
          payload: currentVideoInfo
        });
      } catch (error) {
        // Side panel might not be open
      }
    }
  } catch (error) {
    console.error('Error handling tab activation:', error);
  }
});
