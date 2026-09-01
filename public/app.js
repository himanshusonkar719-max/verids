/**
 * VeriDS Frontend Application - Clean & Optimized
 */
class VeriDS {
  constructor() {
    this.currentState = 'input';
    this.currentResult = null;
    this.history = this.loadHistory();
    this.currentTheme = localStorage.getItem('verids_theme') || 'light';
    this.mediaMatrixData = [];
    this.newsfeedData = [];

    this.initElements();
    this.setupTheme();
    this.setupEventListeners();
    this.setupTabs();
    this.setupPresets();
    this.setupCharCounter();
    this.renderHistoryDrawer();
    this.loadMediaMatrix();
    this.loadNewsfeed();
    this.setupSandbox();
  }

  $(id) { return document.getElementById(id); }

  initElements() {
    const ids = [
      'inputState', 'loadingState', 'resultState', 'errorState',
      'textForm', 'urlForm', 'fallacyForm', 'textInput', 'urlInput', 'fallacyInput', 'charCount',
      'textTab', 'urlTab', 'fallacyTab', 'textPanel', 'urlPanel', 'fallacyPanel', 'tabSlider',
      'themeToggleBtn', 'themeIconSun', 'themeIconMoon', 'historyToggleBtn', 'historyBadge', 'langSelect', 'langBadge',
      'historyDrawer', 'historyOverlay', 'closeDrawerBtn', 'historyList', 'clearHistoryBtn',
      'loadingMessage', 'step1', 'step2', 'step3',
      'backButton', 'copyResultBtn', 'exportJsonBtn', 'exportCsvBtn', 'printReportBtn', 'errorBackButton', 'toast',
      'scoreGauge', 'scoreText', 'verdictTitle', 'verdictBadge', 'scoreExplanation', 'resultTitle', 'resultUrl',
      'fallacyResultCard', 'fallacyListContainer',
      'sourceTrustScore', 'sourceTrustBar', 'sourceTrustList',
      'linguisticScore', 'linguisticBar', 'linguisticList',
      'corroborationScore', 'corroborationBar', 'corroborationList',
      'sourcesList', 'matrixGrid', 'matrixSearch',
      'newsfeedGrid', 'newsfeedSearch', 'distRatioText', 'distBarAccurate', 'distBarMixed', 'distBarFalse',
      'sliderTrust', 'sliderSensational', 'sliderCorroboration', 'valTrust', 'valSensational', 'valCorroboration',
      'sandboxScoreDisplay', 'sandboxVerdictTag', 'consensusScoreText', 'commentsList', 'commentForm', 'commentUserInput', 'commentTextInput',
      'errorTitle', 'errorMessage', 'errorDetails'
    ];
    ids.forEach(id => { this[id] = this.$(id); });
  }

  setupTheme() {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    this.updateThemeIcons();
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', this.currentTheme);
    localStorage.setItem('verids_theme', this.currentTheme);
    this.updateThemeIcons();
    this.showToast(`Switched to ${this.currentTheme} mode`);
  }

  updateThemeIcons() {
    if (this.currentTheme === 'light') {
      this.themeIconSun?.classList.add('hidden');
      this.themeIconMoon?.classList.remove('hidden');
    } else {
      this.themeIconSun?.classList.remove('hidden');
      this.themeIconMoon?.classList.add('hidden');
    }
  }

  setupEventListeners() {
    this.textForm?.addEventListener('submit', (e) => this.handleSubmit(e, '/api/analyze/text', { text: this.textInput.value }));
    this.urlForm?.addEventListener('submit', (e) => this.handleSubmit(e, '/api/analyze/url', { url: this.urlInput.value }));
    this.fallacyForm?.addEventListener('submit', (e) => this.handleFallacySubmit(e));
    this.backButton?.addEventListener('click', () => this.showState('input'));
    this.errorBackButton?.addEventListener('click', () => this.showState('input'));

    this.copyResultBtn?.addEventListener('click', () => this.copyReportSummary());
    this.exportJsonBtn?.addEventListener('click', () => this.exportJsonReport());
    this.exportCsvBtn?.addEventListener('click', () => this.exportCsvReport());
    this.printReportBtn?.addEventListener('click', () => window.print());

    this.themeToggleBtn?.addEventListener('click', () => this.toggleTheme());
    this.historyToggleBtn?.addEventListener('click', () => this.toggleHistoryDrawer(true));
    this.closeDrawerBtn?.addEventListener('click', () => this.toggleHistoryDrawer(false));
    this.historyOverlay?.addEventListener('click', () => this.toggleHistoryDrawer(false));
    this.clearHistoryBtn?.addEventListener('click', () => this.clearHistory());

    this.matrixSearch?.addEventListener('input', () => this.filterMediaMatrix());
    document.querySelectorAll('.matrix-filter-chip').forEach(c => c.addEventListener('click', (e) => {
      document.querySelectorAll('.matrix-filter-chip').forEach(ch => ch.classList.remove('active'));
      e.target.classList.add('active');
      this.filterMediaMatrix();
    }));

    this.newsfeedSearch?.addEventListener('input', () => this.loadNewsfeed());
    document.querySelectorAll('.newsfeed-cat-chip, .newsfeed-verdict-chip').forEach(c => c.addEventListener('click', (e) => {
      const parent = e.target.parentElement;
      parent.querySelectorAll('button').forEach(ch => ch.classList.remove('active'));
      e.target.classList.add('active');
      this.loadNewsfeed();
    }));

    document.querySelectorAll('.vote-btn').forEach(btn => btn.addEventListener('click', () => this.submitVote(btn.dataset.vote)));
    this.commentForm?.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = this.commentUserInput?.value.trim(), text = this.commentTextInput?.value.trim();
      if (text) { this.submitVote('accurate', user, text); if (this.commentTextInput) this.commentTextInput.value = ''; }
    });
  }

  setupTabs() {
    const tabs = [{ tab: this.textTab, panel: this.textPanel, index: 0 }, { tab: this.urlTab, panel: this.urlPanel, index: 1 }];
    tabs.forEach(({ tab, panel, index }) => {
      tab?.addEventListener('click', () => {
        tabs.forEach(t => { t.tab?.classList.remove('active'); t.panel?.classList.remove('active'); });
        tab.classList.add('active'); panel.classList.add('active');
        if (this.tabSlider) this.tabSlider.style.transform = `translateX(${index * 100}%)`;
      });
    });
  }

  setupPresets() {
    document.querySelectorAll('[data-preset]').forEach(btn => btn.addEventListener('click', () => {
      if (this.textInput) { this.textInput.value = btn.dataset.preset; this.updateCharCounter(); }
    }));
    document.querySelectorAll('[data-preset-url]').forEach(btn => btn.addEventListener('click', () => {
      if (this.urlInput) this.urlInput.value = btn.dataset-preset-url;
    }));
  }

  setupCharCounter() {
    this.textInput?.addEventListener('input', () => this.updateCharCounter());
  }

  updateCharCounter() {
    if (!this.textInput || !this.charCount) return;
    const len = this.textInput.value.length;
    const words = this.textInput.value.trim() ? this.textInput.value.trim().split(/\s+/).length : 0;
    this.charCount.textContent = `${len} chars • ${words} words`;
  }

  showState(stateName) {
    ['inputState', 'loadingState', 'resultState', 'errorState'].forEach(s => {
      if (this[s]) this[s].classList.toggle('active', s === `${stateName}State`);
    });
    this.currentState = stateName;
  }

  async handleSubmit(e, endpoint, bodyData) {
    e.preventDefault();
    const val = Object.values(bodyData)[0];
    if (!val || !val.trim()) return this.showToast('Please provide input to analyze');

    this.showState('loading');
    this.animateLoadingSteps();

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Analysis failed');

      this.currentResult = data;
      this.saveToHistory(data);
      this.renderResults(data);
      this.showState('result');
    } catch (err) {
      this.showError('Analysis Failed', err.message);
    }
  }

  async handleFallacySubmit(e) {
    e.preventDefault();
    const text = this.fallacyInput?.value;
    if (!text || !text.trim()) return this.showToast('Please enter rhetoric text to scan');

    this.showState('loading');
    try {
      const res = await fetch('/api/analyze/fallacies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Fallacy scan failed');

      const resultObj = {
        title: text.substring(0, 80) + '...',
        verdict: data.totalDetected > 0 ? 'likely-false' : 'likely-accurate',
        confidence: Math.max(0, 100 - data.manipulationScore),
        explanation: `Fallacy Scan complete. ${data.totalDetected} manipulation tactic(s) detected.`,
        breakdown: {
          sourceTrust: { trustScore: 50, category: 'Rhetoric Scan', evidence: ['Direct rhetoric scan'] },
          linguisticAnalysis: { sensationalScore: data.manipulationScore, credibilityScore: 50, styleIssues: 0, evidence: [] },
          corroboration: { score: 50, sources: [] },
          fallacies: data.fallacies
        },
        sources: []
      };

      this.currentResult = resultObj;
      this.renderResults(resultObj);
      this.showState('result');
    } catch (err) {
      this.showError('Scan Error', err.message);
    }
  }

  animateLoadingSteps() {
    const steps = [this.step1, this.step2, this.step3];
    steps.forEach((s, idx) => {
      setTimeout(() => {
        steps.forEach(st => st?.classList.remove('active'));
        s?.classList.add('active');
      }, idx * 600);
    });
  }

  renderResults(data) {
    if (this.verdictTitle) this.verdictTitle.textContent = (data.verdict || 'Unknown').replace('-', ' ');
    if (this.verdictBadge) {
      this.verdictBadge.textContent = data.verdict || 'Pending';
      this.verdictBadge.className = `verdict-badge ${data.verdict || ''}`;
    }
    if (this.scoreExplanation) this.scoreExplanation.textContent = data.explanation || '';
    if (this.resultTitle) this.resultTitle.textContent = data.title || 'Analysis Report';
    if (this.resultUrl) this.resultUrl.textContent = data.url || '';
    if (this.langBadge && data.breakdown?.linguisticAnalysis?.language) {
      this.langBadge.textContent = `Language: ${data.breakdown.linguisticAnalysis.language.name}`;
    }

    this.animateGauge(data.confidence || 0);

    const b = data.breakdown || {};
    this.updateCard(this.sourceTrustScore, this.sourceTrustBar, this.sourceTrustList, b.sourceTrust?.trustScore, b.sourceTrust?.evidence);
    this.updateCard(this.linguisticScore, this.linguisticBar, this.linguisticList, b.linguisticAnalysis?.credibilityScore, b.linguisticAnalysis?.evidence);
    this.updateCard(this.corroborationScore, this.corroborationBar, this.corroborationList, b.corroboration?.score, b.corroboration?.factCheckResults?.map(f => f.title) || ['Searched news & fact registries']);

    if (this.fallacyResultCard && this.fallacyListContainer) {
      const fallacies = b.fallacies || [];
      if (fallacies.length > 0) {
        this.fallacyResultCard.classList.remove('hidden');
        this.fallacyListContainer.innerHTML = fallacies.map(f => `<span class="chip-button" style="color:var(--color-false); border-color:var(--color-false-bg); background:var(--color-false-bg)">⚠️ ${f.type}</span>`).join('');
      } else {
        this.fallacyResultCard.classList.add('hidden');
      }
    }

    if (this.sourcesList) {
      const sources = data.sources || [];
      this.sourcesList.innerHTML = sources.length ? sources.map(s => `
        <div class="source-item">
          <a href="${s.url}" target="_blank" class="source-link">${s.title}</a>
          <span class="verdict-tag ${s.isFactCheck ? 'mixed' : 'likely-accurate'}">${s.isFactCheck ? 'Fact Check' : 'News'}</span>
        </div>
      `).join('') : '<p class="empty-history">No direct reference URLs linked.</p>';
    }

    this.loadCommunityFeedback();
  }

  animateGauge(score) {
    if (this.scoreText) this.scoreText.textContent = score;
    const progressCircle = document.querySelector('.gauge-progress');
    if (progressCircle) {
      const offset = 515 - (515 * score) / 100;
      progressCircle.style.strokeDashoffset = offset;
    }
  }

  updateCard(scoreEl, barEl, listEl, score = 0, evidence = []) {
    if (scoreEl) scoreEl.textContent = `${score}%`;
    if (barEl) barEl.style.width = `${score}%`;
    if (listEl) listEl.innerHTML = (evidence || []).map(item => `<li>${item}</li>`).join('');
  }

  async loadMediaMatrix() {
    try {
      const res = await fetch('/api/media-matrix');
      const data = await res.json();
      if (data.success) { this.mediaMatrixData = data.matrix; this.filterMediaMatrix(); }
    } catch (e) { console.error(e); }
  }

  filterMediaMatrix() {
    if (!this.matrixGrid) return;
    const q = this.matrixSearch?.value.toLowerCase() || '';
    const activeChip = document.querySelector('.matrix-filter-chip.active')?.dataset.filter || 'all';

    let items = this.mediaMatrixData.filter(item => item.name.toLowerCase().includes(q) || item.domain.toLowerCase().includes(q));
    if (activeChip === 'fact-check') items = items.filter(i => i.category === 'Fact Checker');
    else if (activeChip === 'center') items = items.filter(i => i.bias === 'Center');
    else if (activeChip === 'misinformation') items = items.filter(i => i.reliability === 'Misinformation');

    this.matrixGrid.innerHTML = items.map(i => `
      <div class="matrix-card">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <strong style="font-size:0.9375rem;">${i.name}</strong>
            <span class="verdict-tag ${i.factCheckScore >= 80 ? 'likely-accurate' : i.factCheckScore >= 50 ? 'mixed' : 'likely-false'}">${i.factCheckScore}% Score</span>
          </div>
          <p style="font-size:0.75rem; color:var(--color-text-subtle);">${i.domain} • ${i.category}</p>
        </div>
        <div style="margin-top:10px; font-size:0.75rem; color:var(--color-text-muted); display:flex; justify-content:space-between;">
          <span>Bias: <strong>${i.bias}</strong></span>
          <span>Reliability: <strong>${i.reliability}</strong></span>
        </div>
      </div>
    `).join('');
  }

  async loadNewsfeed() {
    if (!this.newsfeedGrid) return;
    const cat = document.querySelector('.newsfeed-cat-chip.active')?.dataset.cat || 'all';
    const verdict = document.querySelector('.newsfeed-verdict-chip.active')?.dataset.verdict || 'all';
    const search = this.newsfeedSearch?.value || '';

    try {
      const res = await fetch(`/api/newsfeed?category=${cat}&verdict=${verdict}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (!data.success) return;

      if (this.distRatioText) this.distRatioText.textContent = `${data.summary.accuratePct}% Accurate • ${data.summary.mixedPct}% Mixed • ${data.summary.falsePct}% Debunked`;
      if (this.distBarAccurate) this.distBarAccurate.style.width = `${data.summary.accuratePct}%`;
      if (this.distBarMixed) this.distBarMixed.style.width = `${data.summary.mixedPct}%`;
      if (this.distBarFalse) this.distBarFalse.style.width = `${data.summary.falsePct}%`;

      this.newsfeedGrid.innerHTML = data.items.map(item => `
        <div class="newsfeed-item-card">
          <div>
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <span class="verdict-tag ${item.verdict}">${item.verdict.replace('-', ' ')}</span>
              <span style="font-size:0.75rem; color:var(--color-text-subtle);">${item.timeAgo}</span>
            </div>
            <h4 class="newsfeed-item-headline">${item.headline}</h4>
            <p class="newsfeed-item-excerpt">${item.excerpt}</p>
          </div>
          <div class="newsfeed-item-footer">
            <span>${item.sourceName}</span>
            <a href="${item.url}" target="_blank" class="source-link">View Source</a>
          </div>
        </div>
      `).join('');
    } catch (e) { console.error(e); }
  }

  setupSandbox() {
    const updateSandbox = () => {
      const trust = parseInt(this.sliderTrust?.value || 85);
      const sensational = parseInt(this.sliderSensational?.value || 10);
      const corroboration = parseInt(this.sliderCorroboration?.value || 75);

      if (this.valTrust) this.valTrust.textContent = `${trust}%`;
      if (this.valSensational) this.valSensational.textContent = `${sensational}%`;
      if (this.valCorroboration) this.valCorroboration.textContent = `${corroboration}%`;

      const score = Math.round((trust * 0.35) + (Math.max(0, 100 - sensational) * 0.30) + (corroboration * 0.35));
      if (this.sandboxScoreDisplay) this.sandboxScoreDisplay.textContent = `${score}%`;

      let tag = 'Likely Accurate', cls = 'likely-accurate';
      if (score < 35) { tag = 'Likely False'; cls = 'likely-false'; }
      else if (score < 55) { tag = 'Questionable'; cls = 'mixed'; }
      else if (score < 75) { tag = 'Mixed Signals'; cls = 'mixed'; }

      if (this.sandboxVerdictTag) {
        this.sandboxVerdictTag.textContent = tag;
        this.sandboxVerdictTag.className = `sandbox-verdict-tag ${cls}`;
      }
    };

    [this.sliderTrust, this.sliderSensational, this.sliderCorroboration].forEach(s => s?.addEventListener('input', updateSandbox));
  }

  async loadCommunityFeedback() {
    try {
      const res = await fetch('/api/community/default');
      const data = await res.json();
      if (data.success) this.renderCommunity(data.feedback);
    } catch (e) { console.error(e); }
  }

  async submitVote(voteType, user = '', text = '') {
    try {
      const res = await fetch('/api/community/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimId: 'default', voteType, user, commentText: text })
      });
      const data = await res.json();
      if (data.success) { this.renderCommunity(data.feedback); this.showToast('Community vote recorded'); }
    } catch (e) { this.showToast('Failed to record vote'); }
  }

  renderCommunity(fb) {
    if (this.consensusScoreText) this.consensusScoreText.textContent = `${fb.consensusPct}%`;
    if (this.commentsList) {
      this.commentsList.innerHTML = fb.comments.map(c => `
        <div class="comment-item">
          <div class="comment-header"><span>${c.user} (${c.role})</span><span>${c.timestamp}</span></div>
          <p class="comment-text">${c.text}</p>
        </div>
      `).join('');
    }
  }

  loadHistory() {
    try { return JSON.parse(localStorage.getItem('verids_history')) || []; } catch (e) { return []; }
  }

  saveToHistory(item) {
    this.history.unshift({ title: item.title, verdict: item.verdict, confidence: item.confidence, timestamp: new Date().toLocaleTimeString() });
    this.history = this.history.slice(0, 10);
    localStorage.setItem('verids_history', JSON.stringify(this.history));
    this.renderHistoryDrawer();
  }

  renderHistoryDrawer() {
    if (this.historyBadge) this.historyBadge.textContent = this.history.length;
    if (!this.historyList) return;
    if (!this.history.length) {
      this.historyList.innerHTML = '<p class="empty-history">No recent fact-checks recorded.</p>';
      return;
    }
    this.historyList.innerHTML = this.history.map(item => `
      <div class="history-item">
        <div class="history-item-title">${item.title}</div>
        <div class="history-item-meta">
          <span class="verdict-tag ${item.verdict}">${item.verdict}</span>
          <span>${item.confidence}% • ${item.timestamp}</span>
        </div>
      </div>
    `).join('');
  }

  toggleHistoryDrawer(open) {
    this.historyDrawer?.classList.toggle('active', open);
    this.historyOverlay?.classList.toggle('active', open);
  }

  clearHistory() {
    this.history = [];
    localStorage.removeItem('verids_history');
    this.renderHistoryDrawer();
    this.showToast('History cleared');
  }

  showToast(msg) {
    if (!this.toast) return;
    this.toast.textContent = msg;
    this.toast.classList.add('show');
    setTimeout(() => this.toast.classList.remove('show'), 2500);
  }

  showError(title, msg) {
    if (this.errorTitle) this.errorTitle.textContent = title;
    if (this.errorMessage) this.errorMessage.textContent = msg;
    this.showState('error');
  }

  copyReportSummary() {
    if (!this.currentResult) return;
    const text = `VeriDS Fact-Check Report:\nTitle: ${this.currentResult.title}\nVerdict: ${this.currentResult.verdict}\nConfidence: ${this.currentResult.confidence}%\nExplanation: ${this.currentResult.explanation}`;
    navigator.clipboard.writeText(text);
    this.showToast('Report copied to clipboard');
  }

  exportJsonReport() {
    if (!this.currentResult) return;
    this.downloadFile(`verids-report-${Date.now()}.json`, JSON.stringify(this.currentResult, null, 2), 'application/json');
  }

  async exportCsvReport() {
    if (!this.currentResult) return;
    try {
      const res = await fetch('/api/export/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.currentResult)
      });
      const data = await res.json();
      if (data.success) this.downloadFile(data.filename, data.csvContent, 'text/csv');
    } catch (e) { this.showToast('Export CSV failed'); }
  }

  downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    this.showToast(`Downloaded ${filename}`);
  }
}

document.addEventListener('DOMContentLoaded', () => new VeriDS());
