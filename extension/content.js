/**
 * VeriDS Content Script - In-Page Overlay Toast
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VERIDS_VERDICT_RESULT' && message.data) {
    showInPageToast(message.data);
  }
});

function showInPageToast(result) {
  // Remove existing toast if present
  const existing = document.getElementById('verids-overlay-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'verids-overlay-toast';

  const verdictLabel = result.verdict === 'likely-false' ? 'Likely False' :
                       (result.verdict === 'mixed' ? 'Mixed Signals' : 'Likely Accurate');

  const bgBorderColor = result.verdict === 'likely-false' ? '#E11D48' :
                        (result.verdict === 'mixed' ? '#D97706' : '#059669');

  toast.setAttribute('style', `
    position: fixed !important;
    top: 20px !important;
    right: 20px !important;
    width: 320px !important;
    max-width: 90vw !important;
    background: #FAF9F6 !important;
    color: #0F172A !important;
    border: 2px solid ${bgBorderColor} !important;
    border-radius: 12px !important;
    padding: 16px !important;
    box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
    font-family: 'Inter', -apple-system, sans-serif !important;
    z-index: 2147483647 !important;
    transition: opacity 300ms ease, transform 300ms ease !important;
    line-height: 1.4 !important;
  `);

  toast.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
      <div style="display:flex; align-items:center; gap:6px;">
        <span style="font-weight:700; color:#059669; font-size:14px;">VeriDS Intelligence</span>
      </div>
      <button id="veridsCloseBtn" style="background:none; border:none; color:#64748B; font-size:18px; cursor:pointer; padding:0 4px;">&times;</button>
    </div>
    <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
      <span style="background:${bgBorderColor}22; color:${bgBorderColor}; font-weight:700; font-size:11px; text-transform:uppercase; padding:2px 8px; border-radius:99px;">${verdictLabel}</span>
      <span style="font-size:22px; font-weight:700; color:#0F172A;">${result.confidence}%</span>
    </div>
    <p style="font-size:12px; color:#475569; margin:0;">${result.explanation || ''}</p>
  `;

  document.body.appendChild(toast);

  // Close Button Handler
  document.getElementById('veridsCloseBtn').addEventListener('click', () => {
    toast.remove();
  });

  // Auto Dismiss after 8 seconds
  setTimeout(() => {
    if (document.body.contains(toast)) {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(-10px)';
      setTimeout(() => toast.remove(), 300);
    }
  }, 8000);
}
