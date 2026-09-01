// Known reputable news domains
const REPUTABLE_DOMAINS = [
  'bbc.com', 'bbc.co.uk', 'reuters.com', 'apnews.com', 'nytimes.com',
  'washingtonpost.com', 'theguardian.com', 'aljazeera.com', 'npr.org',
  'bbc.com', 'afp.com', 'thefacts.com', 'snopes.com', 'factcheck.org',
  'politifact.com', 'fullfact.org', 'reuters.com/fact-check'
];

// Known fact-check domains
const FACTCHECK_DOMAINS = [
  'snopes.com', 'factcheck.org', 'politifact.com', 'fullfact.org',
  'truthorfiction.com', 'checkyourfact.com', 'leadstories.com',
  'hoaxeye.com', 'correctiv.org'
];

// Known misinformation/conspiracy domains
const MISINFORMATION_DOMAINS = [
  'infowars.com', 'beforeitsnews.com', 'naturalnews.com', 'timinglytruth.com',
  'conservativetribune.com', 'thepoliticalinsider.com', 'anonhq.com',
  'newspunch.com', 'redstatewatcher.com', 'truthfeed.com'
];

// Clickbait/sensational indicators
const SENSATIONAL_PHRASES = [
  'shocking', 'unbelievable', 'you won\'t believe', 'this will shock you',
  'experts hate', 'doctors hate', 'they don\'t want you to know',
  'big pharma', 'mainstream media', 'wake up sheeple', 'illuminati',
  'never thought', 'what happens next', 'you\'ve been lied to',
  'destroyed', 'slammed', 'obliterated', 'epic fail'
];

// Credible language markers
const CREDIBLE_MARKERS = [
  'according to', 'peer-reviewed', 'study', 'research', 'scientist',
  'official statement', 'government report', 'confirmed', 'verified',
  'evidence shows', 'data', 'statistics', 'expert'
];

export class AnalysisEngine {
  constructor() {
    this.searchCache = new Map();
  }

  // Main text analysis method
  async analyzeText(text) {
    const startTime = Date.now();
    
    // Extract potential headline/key claim
    const claim = this.extractClaim(text);
    
    // Check if this can be verified
    const verificationResult = await this.verifyContent(text);
    
    if (!verificationResult.isVerifiable) {
      return {
        success: true,
        verdict: 'unverifiable',
        confidence: 0,
        title: claim,
        explanation: verificationResult.reason,
        sources: []
      };
    }

    // Perform comprehensive analysis
    const sourceAnalysis = this.analyzeSource('text');
    const linguisticAnalysis = this.analyzeLinguistics(text);
    const corroboration = verificationResult.corroboration;

    // Calculate final score
    const { verdict, confidence } = this.calculateVerdict(
      sourceAnalysis,
      linguisticAnalysis,
      corroboration
    );

    const analysisTime = Date.now() - startTime;

    return {
      success: true,
      verdict,
      confidence,
      title: claim,
      explanation: this.generateExplanation(verdict, confidence, linguisticAnalysis, sourceAnalysis, corroboration),
      breakdown: {
        sourceTrust: sourceAnalysis,
        linguisticAnalysis,
        corroboration
      },
      sources: verificationResult.sources,
      analysisTime
    };
  }

  // URL analysis method
  async analyzeUrl(urlString) {
    const startTime = Date.now();

    let url;
    try {
      url = new URL(urlString);
    } catch (e) {
      return {
        success: false,
        error: 'Invalid URL format',
        details: 'Please provide a valid URL starting with http:// or https://'
      };
    }

    // Fetch and parse the URL
    let fetchResult;
    try {
      fetchResult = await this.fetchAndParseUrl(url.href);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        details: error.details
      };
    }

    // Analyze the extracted content
    const content = fetchResult.title + '\n' + fetchResult.bodyText;
    
    // Verify content exists
    const verificationResult = await this.verifyContent(content);
    
    if (!verificationResult.isVerifiable) {
      return {
        success: true,
        verdict: 'unverifiable',
        confidence: 0,
        title: fetchResult.title || 'No title found',
        url: url.href,
        explanation: 'The content from this URL could not be verified against known reliable sources.',
        sources: []
      };
    }

    // Analyze the domain
    const sourceAnalysis = this.analyzeSource(url.hostname);
    const linguisticAnalysis = this.analyzeLinguistics(content);
    const corroboration = verificationResult.corroboration;

    // Calculate final score
    const { verdict, confidence } = this.calculateVerdict(
      sourceAnalysis,
      linguisticAnalysis,
      corroboration
    );

    const analysisTime = Date.now() - startTime;

    return {
      success: true,
      verdict,
      confidence,
      title: fetchResult.title || 'Untitled Article',
      url: url.href,
      explanation: this.generateExplanation(verdict, confidence, linguisticAnalysis, sourceAnalysis, corroboration),
      breakdown: {
        sourceTrust: sourceAnalysis,
        linguisticAnalysis,
        corroboration
      },
      sources: verificationResult.sources,
      analysisTime
    };
  }

  // Fetch and parse URL content
  async fetchAndParseUrl(urlString) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(urlString, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: controller.signal
      });

      if (!response.ok) {
        throw {
          message: `HTTP ${response.status} - ${response.statusText}`,
          details: `The server returned a ${response.status} error. This may indicate the page doesn't exist or cannot be accessed.`
        };
      }

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        throw {
          message: 'Not HTML content',
          details: 'The URL returned content-type: ' + contentType + '. VeriDS analyzes HTML articles only.'
        };
      }

      const html = await response.text();
      const { title, bodyText } = this.extractArticleContent(html);

      if (!bodyText || bodyText.trim().length < 50) {
        throw {
          message: 'No article content found',
          details: 'The page exists but contains no readable article text. It may be a list page, paywall, or non-article content.'
        };
      }

      return { title, bodyText };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw {
          message: 'Request timeout',
          details: 'The URL took too long to respond (>8 seconds). The server may be slow or unavailable.'
        };
      }
      if (error.message && error.details) {
        throw error;
      }
      throw {
        message: 'Network error: ' + (error.message || 'Unknown error'),
        details: 'Failed to fetch the URL. Check the link and try again.'
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  // Extract article content from HTML
  extractArticleContent(html) {
    // Extract title
    let title = '';
    const ogTitle = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
    if (ogTitle) {
      title = this.decodeHtml(ogTitle[1]);
    } else {
      const titleTag = html.match(/<title>([^<]+)<\/title>/i);
      if (titleTag) {
        title = this.decodeHtml(titleTag[1]).split('|')[0].trim();
      }
    }

    // Extract body text from paragraphs, filtering common noise
    let bodyText = '';
    const paragraphs = html.match(/<p[^>]*>([^<]*(?:(?!<\/p>)<[^<]*)*)<\/p>/gi) || [];
    
    paragraphs.forEach(p => {
      const text = p
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&#\d+;/g, '')
        .trim();
      
      // Filter out common navigation/footer text
      if (text.length > 20 && !this.isBoilerplate(text)) {
        bodyText += text + ' ';
      }
    });

    return {
      title: title || 'Article',
      bodyText: bodyText.substring(0, 5000).trim() // Limit to first 5000 chars
    };
  }

  // Check if text is likely boilerplate
  isBoilerplate(text) {
    const boilerplatePatterns = [
      /^(subscribe|sign up|read more|follow us|share this|click here|advertisement)/i,
      /^(copyright|all rights reserved)/i,
      /^(click to show|click to hide)/i
    ];
    return boilerplatePatterns.some(p => p.test(text));
  }

  // Decode HTML entities
  decodeHtml(text) {
    const map = {
      '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'"
    };
    return text.replace(/&[^;]+;/g, entity => map[entity] || entity);
  }

  // Verify content through web search
  async verifyContent(content) {
    // Extract key phrases
    const phrases = this.extractKeyPhrases(content);
    
    if (phrases.length === 0) {
      return {
        isVerifiable: false,
        reason: 'Content is too vague to verify. Please provide specific claims or article text.',
        corroboration: { score: 0, sources: [], factCheckResults: [] }
      };
    }

    // Search for each phrase
    let totalCorroboration = 0;
    const allSources = [];
    const factCheckResults = [];

    for (const phrase of phrases.slice(0, 3)) {
      const searchResults = await this.searchWeb(phrase);
      
      // Check if found in reputable sources
      const reputableMatches = searchResults.filter(r => 
        REPUTABLE_DOMAINS.some(d => r.url.includes(d))
      );
      
      if (reputableMatches.length > 0) {
        totalCorroboration += 25;
      }

      // Check for fact-check coverage
      const factCheckMatches = searchResults.filter(r =>
        FACTCHECK_DOMAINS.some(d => r.url.includes(d))
      );
      
      if (factCheckMatches.length > 0) {
        factCheckResults.push(...factCheckMatches.slice(0, 2));
      }

      // Check for "debunked" or "false" signals
      const debunkedSignals = searchResults.filter(r =>
        /debunk|false|hoax|myth/i.test(r.title + r.snippet)
      );

      allSources.push(...searchResults.slice(0, 2));
    }

    const corroboration = Math.min(totalCorroboration, 100);
    
    // If nothing found, mark as unverifiable
    if (allSources.length === 0 && factCheckResults.length === 0) {
      return {
        isVerifiable: false,
        reason: 'Could not verify this content in reputable sources. No news coverage or fact-checks found.',
        corroboration: { score: 0, sources: [], factCheckResults: [] }
      };
    }

    return {
      isVerifiable: true,
      corroboration: {
        score: corroboration,
        sources: allSources.slice(0, 3),
        factCheckResults: factCheckResults.slice(0, 2),
        debunkSignals: factCheckResults.some(r => /debunk|false|hoax/i.test(r.title))
      }
    };
  }

  // Extract key phrases for search
  extractKeyPhrases(text) {
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
    if (sentences.length === 0) return [];
    
    // Take first 2-3 sentences
    return sentences.slice(0, 3).map(s => {
      // Extract key terms (remove common words)
      const words = s.split(/\s+/).filter(w => w.length > 4);
      return words.slice(0, 5).join(' ');
    }).filter(p => p.length > 5);
  }

  // Simulate web search (in production, use actual API)
  async searchWeb(query) {
    // Cache to avoid repeated searches
    if (this.searchCache.has(query)) {
      return this.searchCache.get(query);
    }

    // Simulate search results based on query content
    const results = [];
    
    // Known fact-check results
    if (/elvis|michael jackson|celebrity|death/.test(query.toLowerCase())) {
      results.push({
        title: 'Celebrity Death Hoax Check',
        snippet: 'No credible evidence found for this claim.',
        url: 'https://snopes.com/fact-check/example',
        isFactCheck: true
      });
    }

    // Science/health claims
    if (/vaccine|cure|treatment|health|miracle/.test(query.toLowerCase())) {
      results.push({
        title: 'Health Claim Verification',
        snippet: 'Peer-reviewed sources contradict this claim.',
        url: 'https://factcheck.org/health/example',
        isFactCheck: true
      });
    }

    // Political claims
    if (/politician|election|vote|government|law/.test(query.toLowerCase())) {
      results.push({
        title: 'Political Fact Check',
        snippet: 'Official records show different information.',
        url: 'https://politifact.com/example',
        isFactCheck: true
      });
    }

    // Default reputable source
    results.push({
      title: 'News Coverage: ' + query.substring(0, 40),
      snippet: 'Covered by major news outlets.',
      url: 'https://bbc.com/news/example',
      isFactCheck: false
    });

    this.searchCache.set(query, results);
    return results;
  }

  // Analyze source domain
  analyzeSource(source) {
    const domain = source.toLowerCase();

    let trustScore = 50; // Base score
    let category = 'unknown';
    let evidence = [];

    if (MISINFORMATION_DOMAINS.some(d => domain.includes(d))) {
      trustScore = 15;
      category = 'known-misinformation';
      evidence.push('Domain is known for publishing misinformation');
    } else if (FACTCHECK_DOMAINS.some(d => domain.includes(d))) {
      trustScore = 95;
      category = 'fact-checker';
      evidence.push('Fact-checking domain - dedicated to accuracy');
    } else if (REPUTABLE_DOMAINS.some(d => domain.includes(d))) {
      trustScore = 85;
      category = 'reputable-news';
      evidence.push('Established news organization');
    } else if (domain.includes('.gov') || domain.includes('.edu')) {
      trustScore = 88;
      category = 'government-academic';
      evidence.push('Government or academic institution');
    } else if (domain.includes('medium.com') || domain.includes('blogger.com')) {
      trustScore = 40;
      category = 'user-generated';
      evidence.push('User-generated content platform - verify claims independently');
    }

    return {
      trustScore,
      category,
      evidence
    };
  }

  // Analyze linguistic patterns
  analyzeLinguistics(text) {
    const lower = text.toLowerCase();
    let sensationalScore = 0;
    let credibilityScore = 0;

    // Count sensational indicators
    let sensationalCount = 0;
    SENSATIONAL_PHRASES.forEach(phrase => {
      const regex = new RegExp('\\b' + phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
      sensationalCount += (lower.match(regex) || []).length;
    });

    sensationalScore = Math.min(sensationalCount * 15, 100);

    // Count credible markers
    let credibleCount = 0;
    CREDIBLE_MARKERS.forEach(marker => {
      const regex = new RegExp('\\b' + marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi');
      credibleCount += (lower.match(regex) || []).length;
    });

    credibilityScore = Math.min(credibleCount * 20, 100);

    // Check for excessive caps/punctuation
    const capsRatio = (lower.match(/[A-Z]/g) || []).length / text.length;
    const exclamationCount = (lower.match(/!/g) || []).length;

    let styleFactor = 0;
    if (capsRatio > 0.15) styleFactor += 20;
    if (exclamationCount > text.split(' ').length * 0.1) styleFactor += 20;

    return {
      sensationalScore: Math.round(sensationalScore),
      credibilityScore: Math.round(credibilityScore),
      styleIssues: styleFactor,
      evidence: this.getLinguisticEvidence(sensationalScore, credibilityScore, styleFactor)
    };
  }

  // Extract claim from text
  extractClaim(text) {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    return lines[0].substring(0, 100);
  }

  // Get linguistic evidence
  getLinguisticEvidence(sensational, credible, style) {
    const evidence = [];
    
    if (sensational > 50) {
      evidence.push('Heavy use of sensational language');
    }
    
    if (credible > 50) {
      evidence.push('Language includes credible markers (sources, research references)');
    }
    
    if (style > 20) {
      evidence.push('Excessive capitalization or punctuation');
    }

    if (evidence.length === 0) {
      evidence.push('Neutral linguistic style');
    }

    return evidence;
  }

  // Calculate final verdict
  calculateVerdict(source, linguistic, corroboration) {
    // Weight different factors
    const sourceWeight = 0.35;
    const linguisticWeight = 0.25;
    const corroborationWeight = 0.40;

    // Invert sensational score (high sensational = low trust)
    const linguisticScore = (linguistic.credibilityScore - linguistic.sensationalScore + 100) / 2;

    // Calculate weighted score
    const weightedScore = (source.trustScore * sourceWeight) +
                          (linguisticScore * linguisticWeight) +
                          (corroboration.score * corroborationWeight);

    let verdict = 'uncertain';
    let confidence = Math.round(weightedScore);

    if (confidence >= 75) {
      verdict = 'likely-accurate';
    } else if (confidence >= 60) {
      verdict = 'mixed';
    } else if (confidence >= 40) {
      verdict = 'questionable';
    } else {
      verdict = 'likely-false';
    }

    return { verdict, confidence };
  }

  // Generate explanation
  generateExplanation(verdict, confidence, linguistic, source, corroboration) {
    let explanation = '';

    switch (verdict) {
      case 'likely-accurate':
        explanation = `This content appears to be from a trustworthy source (${source.category}). The language style is relatively neutral and measured. Multiple reputable sources corroborate similar information.`;
        break;
      case 'mixed':
        explanation = `This content has mixed signals. While the source has some credibility, there are concerns about the language style or incomplete corroboration. Recommend reading multiple perspectives.`;
        break;
      case 'questionable':
        explanation = `This content has significant credibility concerns. The source trust is lower, the language contains sensational elements, and corroboration is limited. Verify against multiple sources.`;
        break;
      case 'likely-false':
        explanation = `This content exhibits multiple red flags: low source trust (${source.category}), sensational language patterns, and little to no corroboration from reputable sources. Treat with extreme skepticism.`;
        break;
      case 'unverifiable':
        explanation = `This content could not be verified against known reliable sources. It may be too vague, too recent, or referring to non-public information. Not necessarily false, but cannot be confirmed.`;
        break;
      default:
        explanation = 'Analysis complete. Confidence score reflects the reliability assessment.';
    }

    return explanation;
  }
}
