/**
 * VeriDS Extension Popup Script
 */

const API_BASE = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
  const verifyCurrentTabBtn = document.getElementById('verifyCurrentTabBtn');
  const verifyTextBtn = document.getElementById('verifyTextBtn');
  const quickTextInput = document.getElementById('quickTextInput');
  const statusMsg = document.getElementById('statusMsg');
  const resultView = document.getElementById('resultView');
  const verdictTag = document.getElementById('verdictTag');
  const scoreNum = document.getElementById('scoreNum');
  const explanationText = document.getElementById('explanationText');

  // Verify Active Webpage Tab URL
  verifyCurrentTabBtn.addEventListener('click', () => {
    if (typeof chrome !== 'undefined' && chrome.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0] && tabs[0].url) {
          analyzeUrl(tabs[0].url);
        } else {
          showStatus('Could not read current active tab URL.');
        }
      });
    } else {
      showStatus('Extension chrome.tabs API not active.');
    }
  });

  // Verify Quick Text Claim
  verifyTextBtn.addEventListener('click', () => {
    const text = quickTextInput.value.trim();
    if (!text) {
      showStatus('Please enter text to verify.');
      return;
    }
    analyzeText(text);
  });

  function showStatus(msg) {
    statusMsg.textContent = msg;
    statusMsg.style.display = 'block';
    resultView.classList.remove('active');
  }

  function hideStatus() {
    statusMsg.style.display = 'none';
  }

  async function analyzeUrl(url) {
    showStatus('Analyzing active tab URL...');

    try {
      const response = await fetch(`${API_BASE}/api/analyze/url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();
      hideStatus();

      if (data.success) {
        renderResult(data);
      } else {
        showStatus(data.error || 'URL Verification Failed');
      }
    } catch (err) {
      showStatus('Failed to connect to local VeriDS server (http://localhost:3000).');
    }
  }

  async function analyzeText(text) {
    showStatus('Analyzing quick claim text...');

    try {
      const response = await fetch(`${API_BASE}/api/analyze/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await response.json();
      hideStatus();

      if (data.success) {
        renderResult(data);
      } else {
        showStatus(data.error || 'Text Analysis Failed');
      }
    } catch (err) {
      showStatus('Failed to connect to local VeriDS server (http://localhost:3000).');
    }
  }

  function renderResult(data) {
    scoreNum.textContent = `${data.confidence}%`;
    explanationText.textContent = data.explanation || '';
    
    let verdictClass = 'likely-accurate';
    let label = 'Likely Accurate';

    if (data.verdict === 'likely-false') {
      verdictClass = 'likely-false';
      label = 'Likely False';
    } else if (data.verdict === 'mixed' || data.verdict === 'questionable') {
      verdictClass = 'mixed';
      label = 'Mixed Signals';
    }

    verdictTag.className = `verdict-tag ${verdictClass}`;
    verdictTag.textContent = label;
    resultView.classList.add('active');
  }
});
