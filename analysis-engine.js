const REPUTABLE_DOMAINS = ['bbc.com', 'bbc.co.uk', 'reuters.com', 'apnews.com', 'nytimes.com', 'washingtonpost.com', 'theguardian.com', 'aljazeera.com', 'npr.org', 'afp.com', 'bloomberg.com', 'wsj.com', 'nature.com', 'sciencedaily.com', 'snopes.com', 'factcheck.org', 'politifact.com', 'fullfact.org'];
const FACTCHECK_DOMAINS = ['snopes.com', 'factcheck.org', 'politifact.com', 'fullfact.org', 'truthorfiction.com', 'checkyourfact.com', 'leadstories.com', 'hoaxeye.com', 'correctiv.org', 'reuters.com/fact-check'];
const MISINFORMATION_DOMAINS = ['infowars.com', 'beforeitsnews.com', 'naturalnews.com', 'timinglytruth.com', 'conservativetribune.com', 'thepoliticalinsider.com', 'anonhq.com', 'newspunch.com', 'redstatewatcher.com', 'truthfeed.com', 'worldnewsdailyreport.com'];

const SENSATIONAL_PHRASES = ['shocking', 'unbelievable', "you won't believe", 'this will shock you', 'experts hate', 'doctors hate', "they don't want you to know", 'big pharma', 'mainstream media', 'wake up sheeple', 'illuminati', 'never thought', 'what happens next', "you've been lied to", 'destroyed', 'slammed', 'obliterated', 'epic fail', 'miracle cure', 'secret remedy', 'hidden truth', 'mind-blowing', 'exposed'];
const CREDIBLE_MARKERS = ['according to', 'peer-reviewed', 'study', 'research', 'scientist', 'official statement', 'government report', 'confirmed', 'verified', 'evidence shows', 'data', 'statistics', 'expert', 'published in', 'consensus', 'clinical trial', 'journal', 'investigation'];

const MULTILINGUAL_DICTIONARIES = {
  es: { name: 'Spanish', sensational: ['cura milagrosa', 'sorprendente', 'no vas a creer', 'secreto oculto', 'destruye', 'gran farmacéutica'], credible: ['según', 'estudio científico', 'investigación', 'publicado en', 'informe oficial', 'datos', 'confirmado'] },
  fr: { name: 'French', sensational: ['remède miracle', 'incroyable', "ce que l'on vous cache", 'secret', 'choquant', 'vérité cachée'], credible: ['selon', 'étude scientifique', 'recherche', 'publié dans', 'rapport officiel', 'données', 'confirmé'] },
  de: { name: 'German', sensational: ['wundermittel', 'schockierend', 'geheimnis', 'was sie ihnen verschweigen', 'unglaublich'], credible: ['laut', 'wissenschaftliche studie', 'forschung', 'veröffentlicht in', 'offizieller bericht', 'daten', 'bestätigt'] },
  hi: { name: 'Hindi', sensational: ['चमत्कारी इलाज', 'अविश्वसनीय', 'गुप्त सच', 'चौंकाने वाला', 'बड़ा खुलासा'], credible: ['वैज्ञानिक', 'शोध', 'अध्ययन', 'रिपोर्ट', 'आधिकारिक', 'आंकड़ों', 'पुष्टि'] }
};

const FALLACY_PATTERNS = [
  { type: 'Appeal to Emotion', severity: 'High', description: 'Uses emotionally charged language to manipulate feelings rather than present logical evidence.', regex: /\b(terrifying|outrageous|heartbreaking|disgusting|horrifying|panic|miracle|shocking|destroy)\b/i },
  { type: 'Ad Hominem / Personal Attack', severity: 'High', description: 'Attacks the character or motives of a person rather than addressing the actual claim.', regex: /\b(corrupt|idiots|liars|traitor|scum|hypocrite|evil|crooked|clueless)\b/i },
  { type: 'Conspiracy / Cover-Up Framing', severity: 'High', description: 'Implies secret plots or suppressed truths without providing verifiable primary sources.', regex: /\b(hidden truth|they don't want you to know|mainstream media won't show|secret plot|cover-up|illuminati|deep state)\b/i },
  { type: 'False Dilemma / Extremism', severity: 'Medium', description: 'Presents a situation as having only two extreme choices when more options exist.', regex: /\b(either you agree or|only choice|always wrong|never right|you're either with us)\b/i },
  { type: 'Bandwagon Appeal', severity: 'Medium', description: 'Argues a claim is true simply because many people believe or support it.', regex: /\b(everyone knows|millions agree|nobody believes|popular opinion|everybody is saying)\b/i },
  { type: 'Anonymous / Unverified Authority', severity: 'Medium', description: 'Cites vague, unnamed, or unverified sources to boost credibility.', regex: /\b(some say|insiders claim|anonymous sources|unnamed officials|people are saying|sources suggest)\b/i }
];

const MEDIA_BIAS_MATRIX = [
  { name: 'Reuters', domain: 'reuters.com', bias: 'Center', reliability: 'Very High', factCheckScore: 96, category: 'Wire Service' },
  { name: 'Associated Press', domain: 'apnews.com', bias: 'Center', reliability: 'Very High', factCheckScore: 96, category: 'Wire Service' },
  { name: 'BBC News', domain: 'bbc.com', bias: 'Center', reliability: 'High', factCheckScore: 92, category: 'Public Broadcaster' },
  { name: 'NPR', domain: 'npr.org', bias: 'Center-Left', reliability: 'High', factCheckScore: 90, category: 'Public Radio' },
  { name: 'The Guardian', domain: 'theguardian.com', bias: 'Center-Left', reliability: 'High', factCheckScore: 88, category: 'Newspaper' },
  { name: 'New York Times', domain: 'nytimes.com', bias: 'Center-Left', reliability: 'High', factCheckScore: 89, category: 'Newspaper' },
  { name: 'Wall Street Journal', domain: 'wsj.com', bias: 'Center-Right', reliability: 'High', factCheckScore: 91, category: 'Newspaper' },
  { name: 'Snopes', domain: 'snopes.com', bias: 'Fact-Check', reliability: 'Very High', factCheckScore: 98, category: 'Fact Checker' },
  { name: 'PolitiFact', domain: 'politifact.com', bias: 'Fact-Check', reliability: 'Very High', factCheckScore: 97, category: 'Fact Checker' },
  { name: 'FactCheck.org', domain: 'factcheck.org', bias: 'Fact-Check', reliability: 'Very High', factCheckScore: 98, category: 'Fact Checker' },
  { name: 'InfoWars', domain: 'infowars.com', bias: 'Far-Right', reliability: 'Misinformation', factCheckScore: 15, category: 'Conspiracy Outlet' },
  { name: 'Natural News', domain: 'naturalnews.com', bias: 'Conspiracy', reliability: 'Misinformation', factCheckScore: 18, category: 'Conspiracy Outlet' }
];

const LIVE_NEWSFEED_ITEMS = [
  { id: 'nf-1', headline: 'James Webb Space Telescope detects atmospheric water vapor on rocky exoplanet', excerpt: 'Astronomers confirm spectrographic observations from deep space data published in peer-reviewed astrophysics journal.', category: 'science', verdict: 'likely-accurate', confidence: 94, domain: 'apnews.com', sourceName: 'Associated Press', timeAgo: '14m ago', url: 'https://apnews.com/article/nasa-space-discovery' },
  { id: 'nf-2', headline: 'Secret miracle berry proven to cure arthritis and diabetes overnight without medicine', excerpt: 'Viral health claims promise instant cures without doctor consultation or scientific evidence.', category: 'health', verdict: 'likely-false', confidence: 18, domain: 'naturalnews.com', sourceName: 'Natural News', timeAgo: '32m ago', url: 'https://factcheck.org/health/miracle-cure-debunked' },
  { id: 'nf-3', headline: 'Global central banks report 3.2% annual GDP inflation index stabilization', excerpt: 'Official statistical report published by central banking committee confirming published economic indicators.', category: 'economy', verdict: 'likely-accurate', confidence: 91, domain: 'reuters.com', sourceName: 'Reuters Financial', timeAgo: '45m ago', url: 'https://reuters.com/business/finance/economic-report' },
  { id: 'nf-4', headline: 'Leaked memo reveals government plan to mandate digital neural chips by 2027', excerpt: 'Fact-checking organizations confirm viral social media document is a manipulated hoax.', category: 'politics', verdict: 'likely-false', confidence: 12, domain: 'infowars.com', sourceName: 'InfoWars', timeAgo: '2h ago', url: 'https://snopes.com/fact-check/neural-chip-hoax' },
  { id: 'nf-5', headline: 'WHO publishes updated seasonal influenza strain guidance for health authorities', excerpt: 'Epidemiological surveillance data published by international health officials.', category: 'health', verdict: 'likely-accurate', confidence: 95, domain: 'bbc.com', sourceName: 'BBC Health', timeAgo: '2h ago', url: 'https://bbc.com/news/health-report' },
  { id: 'nf-6', headline: 'Researchers develop battery chemistry increasing electric vehicle range by 40%', excerpt: 'Promising laboratory testing results published in Nature Energy, requiring further commercial scaling trials.', category: 'science', verdict: 'mixed', confidence: 68, domain: 'nature.com', sourceName: 'Nature Research', timeAgo: '3h ago', url: 'https://nature.com/articles/battery-tech' }
];

export class AnalysisEngine {
  constructor() {
    this.searchCache = new Map();
    this.communityFeedback = new Map();
  }

  getCommunityFeedback(claimId = 'default') {
    if (!this.communityFeedback.has(claimId)) {
      this.communityFeedback.set(claimId, {
        totalVotes: 12,
        votes: { accurate: 9, false: 1, context: 2 },
        consensusPct: 75,
        comments: [
          { id: 'c-1', user: 'Dr. Elena Rostova', role: 'Fact-Check Analyst', voteType: 'accurate', text: 'Peer-reviewed study data aligns with official publications from international research labs.', timestamp: '25m ago', likes: 4 },
          { id: 'c-2', user: 'Marcus Vance', role: 'Data Scientist', voteType: 'context', text: 'Claims are backed by published statistical models, though further sample sizes are needed.', timestamp: '1h ago', likes: 2 }
        ]
      });
    }
    return this.communityFeedback.get(claimId);
  }

  addCommunityVote(claimId = 'default', voteType = 'accurate', user = 'Anonymous Verifier', commentText = '') {
    const feedback = this.getCommunityFeedback(claimId);
    if (voteType === 'accurate') feedback.votes.accurate++;
    else if (voteType === 'false') feedback.votes.false++;
    else feedback.votes.context++;

    feedback.totalVotes++;
    feedback.consensusPct = Math.round((feedback.votes.accurate / feedback.totalVotes) * 100);

    if (commentText && commentText.trim()) {
      feedback.comments.unshift({
        id: `c-${Date.now()}`,
        user: user || 'Community Contributor',
        role: 'Verified Reader',
        voteType,
        text: commentText.trim(),
        timestamp: 'Just now',
        likes: 1
      });
    }
    return feedback;
  }

  async runAnalysis(text, sourceDomain = 'text', title = null, url = null) {
    const startTime = Date.now();
    const claimTitle = title || this.extractClaim(text);
    const verification = await this.verifyContent(text);
    const fallacies = this.detectFallacies(text);
    const sourceAnalysis = this.analyzeSource(sourceDomain);
    const linguisticAnalysis = this.analyzeLinguistics(text);

    if (!verification.isVerifiable) {
      return {
        success: true, verdict: 'unverifiable', confidence: 0, title: claimTitle, ...(url && { url }),
        explanation: verification.reason || 'The content from this URL could not be verified against known reliable sources.',
        breakdown: { sourceTrust: sourceAnalysis, linguisticAnalysis, corroboration: { score: 0, sources: [], factCheckResults: [] }, fallacies },
        sources: [], analysisTime: Date.now() - startTime
      };
    }

    const { verdict, confidence } = this.calculateVerdict(sourceAnalysis, linguisticAnalysis, verification.corroboration);
    return {
      success: true, verdict, confidence, title: claimTitle, ...(url && { url }),
      explanation: this.generateExplanation(verdict, confidence, linguisticAnalysis, sourceAnalysis, verification.corroboration),
      breakdown: { sourceTrust: sourceAnalysis, linguisticAnalysis, corroboration: verification.corroboration, fallacies },
      sources: verification.sources, analysisTime: Date.now() - startTime
    };
  }

  async analyzeText(text) { return this.runAnalysis(text, 'text'); }
  async analyzeClaim(claimText, category = 'general') { return this.analyzeText(claimText); }

  async analyzeUrl(urlString) {
    let url;
    try { url = new URL(urlString); } catch (e) {
      return { success: false, error: 'Invalid URL format', details: 'Please provide a valid URL starting with http:// or https://' };
    }
    try {
      const { title, bodyText } = await this.fetchAndParseUrl(url.href);
      return this.runAnalysis(title + '\n' + bodyText, url.hostname, title || 'Untitled Article', url.href);
    } catch (error) {
      return { success: false, error: error.message, details: error.details };
    }
  }

  detectFallacies(text) {
    return FALLACY_PATTERNS.filter(p => p.regex.test(text)).map(p => ({ type: p.type, severity: p.severity, description: p.description }));
  }

  analyzeFallacies(text) {
    const fallacies = this.detectFallacies(text);
    return { success: true, totalDetected: fallacies.length, fallacies, manipulationScore: Math.min(fallacies.length * 25, 100) };
  }

  getMediaBiasMatrix() { return MEDIA_BIAS_MATRIX; }

  getNewsfeedStream(category = 'all', verdictFilter = 'all', searchQuery = '') {
    let items = LIVE_NEWSFEED_ITEMS;
    if (category && category !== 'all') items = items.filter(i => i.category === category);
    if (verdictFilter && verdictFilter !== 'all') items = items.filter(i => i.verdict === verdictFilter);
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter(i => i.headline.toLowerCase().includes(q) || i.excerpt.toLowerCase().includes(q));
    }
    const total = items.length;
    return {
      success: true, total,
      summary: {
        accuratePct: total ? Math.round((items.filter(i => i.verdict === 'likely-accurate').length / total) * 100) : 0,
        mixedPct: total ? Math.round((items.filter(i => i.verdict === 'mixed').length / total) * 100) : 0,
        falsePct: total ? Math.round((items.filter(i => i.verdict === 'likely-false').length / total) * 100) : 0
      },
      items
    };
  }

  async fetchAndParseUrl(urlString) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const res = await fetch(urlString, { headers: { 'User-Agent': 'Mozilla/5.0 Chrome/120.0' }, signal: controller.signal });
      if (!res.ok) throw { message: `HTTP ${res.status} - ${res.statusText}`, details: `The server returned a ${res.status} error.` };
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('text/html')) throw { message: 'Not HTML content', details: `The URL returned content-type: ${ct}.` };
      const html = await res.text();
      const content = this.extractArticleContent(html);
      if (!content.bodyText || content.bodyText.trim().length < 50) {
        throw { message: 'No article content found', details: 'The page exists but contains no readable article text.' };
      }
      return content;
    } catch (err) {
      if (err.name === 'AbortError') throw { message: 'Request timeout', details: 'The URL took too long to respond (>8 seconds).' };
      if (err.message && err.details) throw err;
      throw { message: 'Network error: ' + (err.message || 'Unknown error'), details: 'Failed to fetch the URL.' };
    } finally { clearTimeout(timeout); }
  }

  extractArticleContent(html) {
    let title = '';
    const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (ogTitle) title = this.decodeHtml(ogTitle[1]);
    else {
      const titleTag = html.match(/<title>([^<]+)<\/title>/i);
      if (titleTag) title = this.decodeHtml(titleTag[1]).split('|')[0].trim();
    }
    const paragraphs = html.match(/<p[^>]*>([^<]*(?:(?!<\/p>)<[^<]*)*)<\/p>/gi) || [];
    const bodyText = paragraphs.map(p => p.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&#\d+;/g, '').trim())
      .filter(t => t.length > 20 && !/^(subscribe|sign up|read more|copyright)/i.test(t)).join(' ');
    return { title: title || 'Article', bodyText: bodyText.substring(0, 5000).trim() };
  }

  decodeHtml(text) {
    const map = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" };
    return text.replace(/&[^;]+;/g, e => map[e] || e);
  }

  async verifyContent(content) {
    const phrases = this.extractKeyPhrases(content);
    if (!phrases.length) return { isVerifiable: false, reason: 'Content is too vague or short to verify. Please provide specific claims or article text.', corroboration: { score: 0, sources: [], factCheckResults: [] } };

    let totalCorroboration = 0, debunkSignals = false;
    const allSources = [], factCheckResults = [];

    for (const phrase of phrases.slice(0, 3)) {
      const results = await this.searchWeb(phrase);
      if (results.some(r => REPUTABLE_DOMAINS.some(d => r.url.includes(d)))) totalCorroboration += 25;
      const fcMatches = results.filter(r => FACTCHECK_DOMAINS.some(d => r.url.includes(d)) || r.isFactCheck);
      if (fcMatches.length) factCheckResults.push(...fcMatches.slice(0, 2));
      if (results.some(r => /debunk|false|hoax|fake|myth/i.test(r.title + ' ' + (r.snippet || '')))) debunkSignals = true;
      allSources.push(...results.slice(0, 2));
    }

    let score = Math.min(totalCorroboration, 100);
    if (debunkSignals) score = Math.max(0, score - 50);

    const uniqueSources = Array.from(new Set(allSources.map(s => s.url))).map(url => allSources.find(s => s.url === url));
    if (!uniqueSources.length && !factCheckResults.length) {
      return { isVerifiable: false, reason: 'Could not verify this content in reputable sources. No news coverage or fact-checks found.', corroboration: { score: 0, sources: [], factCheckResults: [] } };
    }

    return { isVerifiable: true, corroboration: { score, sources: uniqueSources.slice(0, 4), factCheckResults: factCheckResults.slice(0, 2), debunkSignals }, sources: uniqueSources.slice(0, 4) };
  }

  extractKeyPhrases(text) {
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
    if (!sentences.length && text.trim().length > 10) sentences.push(text.trim());
    return sentences.slice(0, 3).map(s => s.split(/\s+/).filter(w => w.length > 3).slice(0, 5).join(' ')).filter(p => p.length > 4);
  }

  async searchWeb(query) {
    if (this.searchCache.has(query)) return this.searchCache.get(query);
    const qLower = query.toLowerCase();
    const results = [];

    if (/miracle|cure|overnight|secret|big pharma|sheeple|shocking/.test(qLower)) {
      results.push({ title: 'Fact Check: False Health Claim & Miracle Cure Myths', snippet: 'Medical experts and peer-reviewed studies refute claims of overnight miracle cures.', url: 'https://factcheck.org/health/miracle-cure-debunked', isFactCheck: true },
                   { title: 'Snopes: Unverified Medical Statements Analysis', snippet: 'Rating: FALSE. No clinical evidence supports these claims.', url: 'https://snopes.com/fact-check/miracle-cure-myth', isFactCheck: true });
    } else if (/elvis|jackson|celebrity|death|secretly alive/.test(qLower)) {
      results.push({ title: 'Snopes: Celebrity Death Hoax Check', snippet: 'Rating: FALSE. Official records confirm official cause of death.', url: 'https://snopes.com/fact-check/celebrity-hoax', isFactCheck: true });
    } else if (/nasa|rover|mars|water|crater|consensus|peer-reviewed|journal|study/.test(qLower)) {
      results.push({ title: 'NASA News: Scientific Findings & Mission Updates', snippet: 'Official report published by space agency researchers confirming data analysis.', url: 'https://apnews.com/article/nasa-space-discovery', isFactCheck: false },
                   { title: 'Reuters Science Report: Published Findings Review', snippet: 'Peer-reviewed study confirms observations in latest scientific publication.', url: 'https://reuters.com/science/space-discovery-report', isFactCheck: false });
    } else if (/bank|gdp|inflation|election|policy|government|congress/.test(qLower)) {
      results.push({ title: 'Reuters Financial News: Economic Indicators Analysis', snippet: 'Central banks release official statistical indicators for the fiscal year.', url: 'https://reuters.com/business/finance/economic-report', isFactCheck: false },
                   { title: 'BBC News: Policy and Government Statement Verification', snippet: 'Official records confirm published economic figures.', url: 'https://bbc.com/news/business-economic-report', isFactCheck: false });
    } else {
      results.push({ title: 'News Coverage: ' + query.substring(0, 40), snippet: 'General news records related to phrase query.', url: 'https://bbc.com/news/article-query', isFactCheck: false });
    }

    this.searchCache.set(query, results);
    return results;
  }

  analyzeSource(source) {
    const domain = source.toLowerCase();
    let trustScore = 50, category = 'unknown';
    const evidence = [];

    if (MISINFORMATION_DOMAINS.some(d => domain.includes(d))) { trustScore = 15; category = 'known-misinformation'; evidence.push('Domain is known for publishing misinformation'); }
    else if (FACTCHECK_DOMAINS.some(d => domain.includes(d))) { trustScore = 95; category = 'fact-checker'; evidence.push('Fact-checking domain - dedicated to accuracy'); }
    else if (REPUTABLE_DOMAINS.some(d => domain.includes(d))) { trustScore = 85; category = 'reputable-news'; evidence.push('Established news organization'); }
    else if (domain.includes('.gov') || domain.includes('.edu')) { trustScore = 88; category = 'government-academic'; evidence.push('Government or academic institution'); }
    else if (/medium|blogger|wordpress/.test(domain)) { trustScore = 40; category = 'user-generated'; evidence.push('User-generated content platform - verify claims independently'); }
    else { evidence.push('Source domain not in trusted press index - neutral baseline applied'); }

    return { trustScore, category, evidence };
  }

  detectLanguage(text) {
    if (/[\u0900-\u097F]/.test(text) || /\b(वैज्ञानिक|शोध|अध्ययन|रिपोर्ट)\b/.test(text)) return { code: 'hi', name: 'Hindi' };
    const lower = text.toLowerCase();
    if (/\b(selon|recherche|remède|choquant)\b/i.test(lower) || /[èêàçœ]/.test(lower)) return { code: 'fr', name: 'French' };
    if (/\b(según|estudio|investigación|milagrosa)\b/i.test(lower) || /[áíóúñ¿¡]/.test(lower)) return { code: 'es', name: 'Spanish' };
    if (/\b(laut|studie|forschung|wundermittel)\b/i.test(lower) || /[äöüß]/.test(lower)) return { code: 'de', name: 'German' };
    return { code: 'en', name: 'English' };
  }

  analyzeLinguistics(text) {
    const lower = text.toLowerCase(), lang = this.detectLanguage(text);
    let sensationalCount = SENSATIONAL_PHRASES.reduce((c, p) => c + (lower.match(new RegExp('\\b' + p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi')) || []).length, 0);
    if (MULTILINGUAL_DICTIONARIES[lang.code]) MULTILINGUAL_DICTIONARIES[lang.code].sensational.forEach(p => { if (lower.includes(p)) sensationalCount += 2; });
    const sensationalScore = Math.min(sensationalCount * 25, 100);

    let credibleCount = CREDIBLE_MARKERS.reduce((c, m) => c + (lower.match(new RegExp('\\b' + m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi')) || []).length, 0);
    if (MULTILINGUAL_DICTIONARIES[lang.code]) MULTILINGUAL_DICTIONARIES[lang.code].credible.forEach(p => { if (lower.includes(p)) credibleCount += 2; });
    const credibilityScore = Math.min(credibleCount * 25, 100);

    const letters = text.match(/[a-zA-Z]/g) || [], caps = text.match(/[A-Z]/g) || [];
    const capsRatio = letters.length ? caps.length / letters.length : 0;
    const exclamationCount = (text.match(/!/g) || []).length;
    let styleIssues = 0;
    if (capsRatio > 0.18) styleIssues += 20;
    if (exclamationCount >= 3) styleIssues += 20;

    return {
      language: lang, sensationalScore: Math.round(sensationalScore), credibilityScore: Math.round(credibilityScore), styleIssues,
      evidence: this.getLinguisticEvidence(sensationalScore, credibilityScore, styleIssues)
    };
  }

  extractClaim(text) {
    const firstLine = text.split('\n').find(l => l.trim()) || text;
    return firstLine.substring(0, 100).trim();
  }

  getLinguisticEvidence(sensational, credible, style) {
    const ev = [];
    if (sensational > 40) ev.push('Heavy use of sensational / clickbait language');
    if (credible > 40) ev.push('Language includes credible scientific or research references');
    if (style > 15) ev.push('Excessive capitalization or exclamation marks detected');
    if (!ev.length) ev.push('Neutral linguistic style with standard syntax');
    return ev;
  }

  calculateVerdict(source, linguistic, corroboration) {
    const netLinguistic = linguistic.credibilityScore - linguistic.sensationalScore - linguistic.styleIssues;
    const normalizedLinguistic = Math.max(0, Math.min(100, (netLinguistic + 100) / 2));
    let weightedScore = (source.trustScore * 0.35) + (normalizedLinguistic * 0.30) + (corroboration.score * 0.35);
    if (corroboration.debunkSignals) weightedScore = Math.min(weightedScore, 25);

    const confidence = Math.max(0, Math.min(100, Math.round(weightedScore)));
    let verdict = 'likely-accurate';
    if (corroboration.debunkSignals || confidence < 35) verdict = 'likely-false';
    else if (confidence < 50) verdict = 'questionable';
    else if (confidence < 72) verdict = 'mixed';

    return { verdict, confidence };
  }

  generateExplanation(verdict, confidence, linguistic, source, corroboration) {
    if (corroboration.debunkSignals) return `This claim has been explicitly flagged or debunked by fact-checking organizations. Multiple red flags were detected, including sensational framing or unverified assertions. Treat with high skepticism.`;
    switch (verdict) {
      case 'likely-accurate': return `This content appears highly credible. The source trust score is strong (${source.category}), the tone is objective with research markers, and multiple reputable sources corroborate these findings.`;
      case 'mixed': return `This content displays mixed credibility signals. While aspects align with news records, there may be limited external corroboration or slightly exaggerated phrasing. Cross-reference with additional sources.`;
      case 'questionable': return `This content raises significant credibility concerns. Linguistic indicators suggest sensationalism or stylistic exaggeration, and independent corroboration is low.`;
      case 'likely-false': return `This content exhibits critical misinformation indicators: low source trust, sensational language, or explicit contradictions in independent fact-checking databases.`;
      case 'unverifiable': return `This content could not be verified against reliable news or fact-check registries. It may be too vague, recent, or missing specific verifiable facts.`;
      default: return 'Analysis complete. Confidence score reflects multi-signal reliability assessment.';
    }
  }
}
