/**
 * VeriDS Manifest V3 Service Worker / Background Script
 */

const API_BASE = 'http://localhost:3000';

// Register Context Menu on Extension Installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'verids-verify-selection',
    title: 'Verify Selection with VeriDS',
    contexts: ['selection']
  });
});

// Listen for Context Menu Click
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'verids-verify-selection' && info.selectionText) {
    const selectedText = info.selectionText.trim();
    
    try {
      // Send API Request to local VeriDS server
      const response = await fetch(`${API_BASE}/api/analyze/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText })
      });

      const data = await response.json();

      // Forward verification verdict to active tab content script
      if (tab && tab.id) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'VERIDS_VERDICT_RESULT',
          data: data,
          query: selectedText
        });
      }
    } catch (err) {
      console.error('VeriDS Context Menu API Error:', err);
    }
  }
});
