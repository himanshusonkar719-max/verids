/**
 * VeriDS Frontend Application
 * Handles UI state, API communication, and real-time analysis visualization
 */

class VeriDS {
  constructor() {
    this.currentState = 'input';
    this.currentResult = null;
    this.isLoading = false;

    this.initElements();
    this.setupEventListeners();
    this.setupTabSwitching();
  }

  // Initialize DOM elements
  initElements() {
    // States
    this.inputState = document.getElementById('inputState');
    this.loadingState = document.getElementById('loadingState');
    this.resultState = document.getElementById('resultState');
    this.errorState = document.getElementById('errorState');

    // Forms
    this.textForm = document.getElementById('textForm');
    this.urlForm = document.getElementById('urlForm');
    this.textInput = document.getElementById('textInput');
    this.urlInput = document.getElementById('urlInput');

    // Tabs
    this.textTab = document.getElementById('textTab');
    this.urlTab = document.getElementById('urlTab');
    this.textPanel = document.getElementById('textPanel');
    this.urlPanel = document.getElementById('urlPanel');

    // Result elements
    this.backButton = document.getElementById('backButton');
    this.errorBackButton = document.getElementById('errorBackButton');
    this.scoreGauge = document.getElementById('scoreGauge');
    this.scoreText = document.getElementById('scoreText');
    this.verdictTitle = document.getElementById('verdictTitle');
    this.verdictBadge = document.getElementById('verdictBadge');
    this.scoreExplanation = document.getElementById('scoreExplanation');
    this.resultTitle = document.getElementById('resultTitle');
    this.resultUrl = document.getElementById('resultUrl');

    // Evidence elements
    this.sourceTrustScore = document.getElementById('sourceTrustScore');
    this.sourceTrustBar = document.getElementById('sourceTrustBar');
    this.sourceTrustList = document.getElementById('sourceTrustList');

    this.linguisticScore = document.getElementById('linguisticScore');
    this.linguisticBar = document.getElementById('linguisticBar');
    this.linguisticList = document.getElementById('linguisticList');

    this.corroborationScore = document.getElementById('corroborationScore');
    this.corroborationBar = document.getElementById('corroborationBar');
    this.corroborationList = document.getElementById('corroborationList');

    this.sourcesList = document.getElementById('sourcesList');

    // Error elements
    this.errorTitle = document.getElementById('errorTitle');
    this.errorMessage = document.getElementById('errorMessage');
    this.errorDetails = document.getElementById('errorDetails');
  }

  // Setup event listeners
  setupEventListeners() {
    this.textForm.addEventListener('submit', (e) => this.handleTextSubmit(e));
    this.urlForm.addEventListener('submit', (e) => this.handleUrlSubmit(e));
    this.backButton.addEventListener('click', () => this.showState('input'));
    this.errorBackButton.addEventListener('click', () => this.showState('input'));

    // Clear inputs when switching tabs
    this.textTab.addEventListener('click', () => {
      this.textInput.value = '';
      this.urlInput.value = '';
    });
    this.urlTab.addEventListener('click', () => {
      this.textInput.value = '';
      this.urlInput.value = '';
    });
  }

  // Setup tab switching
  setupTabSwitching() {
    const tabs = [this.textTab, this.urlTab];
    const panels = [this.textPanel, this.urlPanel];

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => {
        // Update tabs
        tabs.forEach((t) => {
          t.classList.remove('active');
          t.setAttribute('aria-selected', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');

        // Update panels
        panels.forEach((p) => p.classList.remove('active'));
        panels[index].classList.add('active');
      });
    });
  }

  // Handle text form submission
  async handleTextSubmit(e) {
    e.preventDefault();
    const text = this.textInput.value.trim();

    if (!text) {
      this.showError('Empty input', 'Please enter text to analyze');
      return;
    }

    await this.analyzeText(text);
  }

  // Handle URL form submission
  async handleUrlSubmit(e) {
    e.preventDefault();
    const url = this.urlInput.value.trim();

    if (!url) {
      this.showError('Empty input', 'Please enter a URL to analyze');
      return;
    }

    await this.analyzeUrl(url);
  }

  // Analyze text via API
  async analyzeText(text) {
    this.showState('loading');

    try {
      const response = await fetch('/api/analyze/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      const data = await response.json();

      if (!data.success) {
        this.showError(data.error || 'Analysis failed', data.details || '');
        return;
      }

      this.showResult(data);
    } catch (error) {
      this.showError(
        'Network error',
        'Could not connect to analysis server. Check your connection and try again.'
      );
      console.error('Analysis error:', error);
    }
  }

  // Analyze URL via API
  async analyzeUrl(url) {
    this.showState('loading');

    try {
      const response = await fetch('/api/analyze/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });

      const data = await response.json();

      if (!data.success) {
        this.showError(data.error || 'Analysis failed', data.details || '');
        return;
      }

      this.showResult(data);
    } catch (error) {
      this.showError(
        'Network error',
        'Could not connect to analysis server. Check your connection and try again.'
      );
      console.error('Analysis error:', error);
    }
  }

  // Display result
  showResult(result) {
    this.currentResult = result;

    // Set title and URL
    this.resultTitle.textContent = result.title;
    if (result.url) {
      this.resultUrl.textContent = result.url;
      this.resultUrl.style.display = 'block';
    } else {
      this.resultUrl.style.display = 'none';
    }

    // Update verdict
    this.verdictTitle.textContent = this.formatVerdict(result.verdict);
    this.verdictBadge.textContent = this.formatVerdict(result.verdict);
    this.verdictBadge.className = `verdict-badge ${result.verdict}`;
    this.scoreExplanation.textContent = result.explanation;

    // Animate gauge
    this.animateGauge(result.confidence);
    this.updateGradient(result.verdict);

    // Update evidence
    if (result.breakdown) {
      this.updateEvidenceCard(
        'sourceTrust',
        result.breakdown.sourceTrust.trustScore,
        result.breakdown.sourceTrust.evidence
      );

      const linguisticScore = Math.round(
        (result.breakdown.linguisticAnalysis.credibilityScore -
          result.breakdown.linguisticAnalysis.sensationalScore +
          100) /
          2
      );
      this.updateEvidenceCard(
        'linguistic',
        linguisticScore,
        result.breakdown.linguisticAnalysis.evidence
      );

      this.updateEvidenceCard(
        'corroboration',
        result.breakdown.corroboration.score,
        this.getCorroborationEvidence(result.breakdown.corroboration)
      );
    }

    // Display sources
    this.displaySources(result.sources);

    // Show state
    this.showState('result');
  }

  // Animate gauge to score
  animateGauge(targetScore) {
    const gauge = this.scoreGauge.querySelector('.gauge-progress');
    const textElem = this.scoreText;

    let currentScore = 0;
    const duration = 1000;
    const steps = 30;
    const increment = targetScore / steps;
    const stepDuration = duration / steps;

    textElem.textContent = '0';

    const animate = () => {
      currentScore += increment;
      if (currentScore > targetScore) currentScore = targetScore;

      textElem.textContent = Math.round(currentScore);

      // Calculate circumference of circle: 2πr = 2π(90) ≈ 565
      const circumference = 565;
      const offset = circumference - (currentScore / 100) * circumference;
      gauge.style.strokeDashoffset = offset;

      if (currentScore < targetScore) {
        setTimeout(animate, stepDuration);
      }
    };

    animate();
  }

  // Update gauge gradient based on verdict
  updateGradient(verdict) {
    const gradientStart = this.scoreGauge.querySelector('.gradient-start');
    const gradientEnd = this.scoreGauge.querySelector('.gradient-end');

    let startColor = '#A8D5BA';
    let endColor = '#94C9A8';

    switch (verdict) {
      case 'likely-accurate':
        startColor = '#10B981';
        endColor = '#059669';
        break;
      case 'mixed':
        startColor = '#F59E0B';
        endColor = '#D97706';
        break;
      case 'questionable':
        startColor = '#F59E0B';
        endColor = '#D97706';
        break;
      case 'likely-false':
        startColor = '#EF4444';
        endColor = '#DC2626';
        break;
      case 'unverifiable':
        startColor = '#8B5CF6';
        endColor = '#7C3AED';
        break;
    }

    gradientStart.setAttribute('stop-color', startColor);
    gradientEnd.setAttribute('stop-color', endColor);
  }

  // Update evidence card
  updateEvidenceCard(type, score, evidence) {
    let scoreElem, barElem, listElem;

    if (type === 'sourceTrust') {
      scoreElem = this.sourceTrustScore;
      barElem = this.sourceTrustBar;
      listElem = this.sourceTrustList;
    } else if (type === 'linguistic') {
      scoreElem = this.linguisticScore;
      barElem = this.linguisticBar;
      listElem = this.linguisticList;
    } else {
      scoreElem = this.corroborationScore;
      barElem = this.corroborationBar;
      listElem = this.corroborationList;
    }

    // Set score
    scoreElem.textContent = Math.round(score) + '%';

    // Animate bar
    barElem.style.setProperty('--fill-percentage', score + '%');

    // Update list
    listElem.innerHTML = '';
    evidence.forEach((item) => {
      const li = document.createElement('li');
      li.textContent = item;
      listElem.appendChild(li);
    });
  }

  // Get corroboration evidence
  getCorroborationEvidence(corroboration) {
    const evidence = [];

    if (corroboration.score > 70) {
      evidence.push('Strong corroboration from multiple sources');
    } else if (corroboration.score > 40) {
      evidence.push('Partial corroboration found');
    } else if (corroboration.score > 0) {
      evidence.push('Minimal corroboration');
    } else {
      evidence.push('No corroboration found');
    }

    if (corroboration.factCheckResults && corroboration.factCheckResults.length > 0) {
      evidence.push('Covered by fact-check organizations');
    }

    if (corroboration.debunkSignals) {
      evidence.push('Debunk signals detected');
    }

    return evidence;
  }

  // Display sources
  displaySources(sources) {
    this.sourcesList.innerHTML = '';

    if (!sources || sources.length === 0) {
      this.sourcesList.innerHTML =
        '<p style="grid-column: 1/-1; color: var(--color-text-secondary);">No sources available</p>';
      return;
    }

    sources.forEach((source) => {
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'source-link';

      const title = document.createElement('div');
      title.className = 'source-title';
      title.textContent = source.title || 'Source';

      const url = document.createElement('div');
      url.className = 'source-url';
      url.textContent = source.url;

      link.appendChild(title);
      link.appendChild(url);
      this.sourcesList.appendChild(link);
    });
  }

  // Format verdict text
  formatVerdict(verdict) {
    const map = {
      'likely-accurate': 'Likely Accurate',
      'mixed': 'Mixed Signals',
      'questionable': 'Questionable',
      'likely-false': 'Likely False',
      'unverifiable': 'Cannot Verify'
    };
    return map[verdict] || 'Unknown';
  }

  // Show state
  showState(state) {
    this.currentState = state;

    this.inputState.classList.remove('active');
    this.loadingState.classList.remove('active');
    this.resultState.classList.remove('active');
    this.errorState.classList.remove('active');

    switch (state) {
      case 'input':
        this.inputState.classList.add('active');
        break;
      case 'loading':
        this.loadingState.classList.add('active');
        break;
      case 'result':
        this.resultState.classList.add('active');
        window.scrollTo(0, 0);
        break;
      case 'error':
        this.errorState.classList.add('active');
        window.scrollTo(0, 0);
        break;
    }
  }

  // Show error
  showError(title, message) {
    this.errorTitle.textContent = title;
    this.errorMessage.textContent = message;
    this.errorDetails.textContent = '';
    this.showState('error');
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  window.app = new VeriDS();
});
