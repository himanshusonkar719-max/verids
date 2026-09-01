import express from 'express';
import cors from 'cors';
import { AnalysisEngine } from './analysis-engine.js';

const app = express();
const engine = new AnalysisEngine();

const stats = {
  totalAnalyzed: 0, textCount: 0, urlCount: 0, fallacyCount: 0,
  verdicts: { 'likely-accurate': 0, 'mixed': 0, 'questionable': 0, 'likely-false': 0, 'unverifiable': 0 },
  startTime: Date.now()
};

app.use(cors()).use(express.json({ limit: '10mb' })).use(express.static('public'));

const updateStats = (result, type) => {
  stats.totalAnalyzed++;
  if (type === 'url') stats.urlCount++; else stats.textCount++;
  if (result?.verdict && stats.verdicts[result.verdict] !== undefined) stats.verdicts[result.verdict]++;
};

const handleAnalysis = (handler, type, errorMsg) => async (req, res) => {
  try {
    const input = req.body.text || req.body.url || req.body.claim;
    if (!input || !input.trim()) return res.status(400).json({ success: false, error: errorMsg });
    const result = await handler(req.body);
    if (type) updateStats(result, type);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: `Analysis failed: ${err.message}` });
  }
};

app.get('/api/health', (req, res) => res.json({ status: 'ok', version: '1.0.0', uptimeSeconds: Math.floor((Date.now() - stats.startTime) / 1000) }));
app.get('/api/stats', (req, res) => res.json({ success: true, stats: { ...stats, uptimeSeconds: Math.floor((Date.now() - stats.startTime) / 1000) } }));
app.get('/api/media-matrix', (req, res) => res.json({ success: true, matrix: engine.getMediaBiasMatrix() }));
app.get('/api/newsfeed', (req, res) => res.json(engine.getNewsfeedStream(req.query.category, req.query.verdict, req.query.search)));

app.post('/api/analyze/text', handleAnalysis(b => engine.analyzeText(b.text), 'text', 'Please provide text to analyze'));
app.post('/api/analyze/url', handleAnalysis(b => engine.analyzeUrl(b.url), 'url', 'Please provide a URL to analyze'));
app.post('/api/analyze/claim', handleAnalysis(b => engine.analyzeClaim(b.claim, b.category || 'general'), 'text', 'Please provide a claim to analyze'));

app.post('/api/analyze/fallacies', (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) return res.status(400).json({ success: false, error: 'Please provide text to scan for logical fallacies' });
  stats.fallacyCount++;
  res.json(engine.analyzeFallacies(text));
});

app.post('/api/export/csv', (req, res) => {
  try {
    const { title, verdict, confidence, breakdown } = req.body;
    if (!title || !verdict) return res.status(400).json({ success: false, error: 'Missing report data for CSV export' });
    const headers = ["Title", "Verdict", "ConfidencePct", "SourceTrustScore", "SensationalScore", "CorroborationScore", "Timestamp"];
    const row = [
      `"${title.replace(/"/g, '""')}"`,
      `"${verdict}"`,
      confidence,
      breakdown?.sourceTrust?.trustScore ?? 0,
      breakdown?.linguisticAnalysis?.sensationalScore ?? 0,
      breakdown?.corroboration?.score ?? 0,
      `"${new Date().toISOString()}"`
    ];
    res.json({ success: true, filename: `verids-report-${Date.now()}.csv`, csvContent: `${headers.join(',')}\n${row.join(',')}` });
  } catch (err) {
    res.status(500).json({ success: false, error: `CSV export failed: ${err.message}` });
  }
});

app.get('/api/community/:claimId', (req, res) => res.json({ success: true, feedback: engine.getCommunityFeedback(req.params.claimId || 'default') }));
app.post('/api/community/vote', (req, res) => {
  try {
    const { claimId, voteType, user, commentText } = req.body;
    res.json({ success: true, feedback: engine.addCommunityVote(claimId || 'default', voteType, user, commentText) });
  } catch (err) {
    res.status(500).json({ success: false, error: `Failed to record vote: ${err.message}` });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔍 VeriDS running on http://localhost:${PORT}`));
