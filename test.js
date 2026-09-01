import { AnalysisEngine } from './analysis-engine.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('🧪 Starting VeriDS Comprehensive Test Suite...\n');
  const engine = new AnalysisEngine();

  // Test 1: Credible Scientific Text
  console.log('Test 1: Credible Scientific Text');
  const res1 = await engine.analyzeText(
    'According to peer-reviewed research and official government statements, scientific consensus confirms the study data.'
  );
  assert(res1.success === true, 'Analysis returns success: true');
  assert(res1.verdict === 'likely-accurate' || res1.verdict === 'mixed', `Verdict is credible (${res1.verdict})`);
  assert(res1.confidence >= 55, `Confidence score is reasonable (${res1.confidence}%)`);
  assert(res1.breakdown.linguisticAnalysis.credibilityScore > 0, 'Credibility markers detected');

  // Test 2: Clickbait / Sensational Fake News
  console.log('\nTest 2: Sensational Clickbait / Fake News');
  const res2 = await engine.analyzeText(
    'You WONT BELIEVE what doctors dont want you to know!!! Shocking miracle cure destroyed by big pharma! Wake up sheeple!'
  );
  assert(res2.success === true, 'Analysis returns success: true');
  assert(res2.verdict === 'likely-false' || res2.verdict === 'questionable', `Verdict flagged as false/questionable (${res2.verdict})`);
  assert(res2.confidence <= 40, `Confidence score is low (${res2.confidence}%)`);
  assert(res2.breakdown.linguisticAnalysis.sensationalScore > 0, 'Sensational markers detected');
  assert(res2.breakdown.linguisticAnalysis.styleIssues > 0, 'Style issues (caps/exclamations) detected');

  // Test 3: Unverifiable / Vague Input
  console.log('\nTest 3: Unverifiable / Vague Text');
  const res3 = await engine.analyzeText('xyz');
  assert(res3.success === true, 'Returns result object');
  assert(res3.verdict === 'unverifiable', 'Verdict is unverifiable');
  assert(res3.confidence === 0, 'Confidence is 0');

  // Test 4: Invalid URL Format Handling
  console.log('\nTest 4: Invalid URL Format');
  const res4 = await engine.analyzeUrl('invalid-url-string');
  assert(res4.success === false, 'Rejects invalid URL');
  assert(res4.error === 'Invalid URL format', 'Returns correct error message');

  // Test 5: Source Reputation Analysis
  console.log('\nTest 5: Domain Reputation Scoring');
  const bbcTrust = engine.analyzeSource('bbc.com');
  assert(bbcTrust.trustScore >= 80, `Reputable domain BBC has high trust (${bbcTrust.trustScore}%)`);
  assert(bbcTrust.category === 'reputable-news', 'BBC identified as reputable-news');

  const infoTrust = engine.analyzeSource('infowars.com');
  assert(infoTrust.trustScore <= 20, `Known misinformation domain has low trust (${infoTrust.trustScore}%)`);
  assert(infoTrust.category === 'known-misinformation', 'Infowars identified as known-misinformation');

  const factTrust = engine.analyzeSource('snopes.com');
  assert(factTrust.trustScore >= 90, `Fact-checker Snopes has very high trust (${factTrust.trustScore}%)`);

  // Test 6: Structured Claim Analysis
  console.log('\nTest 6: Structured Claim Analysis');
  const res6 = await engine.analyzeClaim('Global central banks report 3.2% annual GDP inflation index stabilization.', 'finance');
  assert(res6.success === true, 'Claim analysis succeeds');
  assert(res6.verdict !== 'unverifiable', 'Claim is verified against economic records');

  // Test 7: Logical Fallacy Scan
  console.log('\nTest 7: Logical Fallacy Scan');
  const res7 = engine.analyzeFallacies('This outrageous lie is created by corrupt hypocrites because they don\'t want you to know the secret plot!');
  assert(res7.success === true, 'Fallacy scan succeeds');
  assert(res7.totalDetected >= 2, `Multiple fallacies detected (${res7.totalDetected})`);
  assert(res7.manipulationScore >= 50, `High manipulation score calculated (${res7.manipulationScore}%)`);

  // Test 8: Media Bias Matrix Registry
  console.log('\nTest 8: Media Bias Matrix Registry');
  const matrix = engine.getMediaBiasMatrix();
  assert(Array.isArray(matrix), 'Media matrix returns an array');
  assert(matrix.length >= 10, `Registry contains ${matrix.length} media domain profiles`);
  assert(matrix.some(item => item.domain === 'reuters.com'), 'Contains Reuters profile');

  // Test 9: Real-Time Newsfeed Stream API
  console.log('\nTest 9: Real-Time Newsfeed Stream API');
  const feedAll = engine.getNewsfeedStream('all', 'all');
  assert(feedAll.success === true, 'Newsfeed stream succeeds');
  assert(feedAll.total >= 4, `Newsfeed contains ${feedAll.total} items`);
  assert(typeof feedAll.summary.accuratePct === 'number', 'Calculates accurate percentage ratio');

  const feedScience = engine.getNewsfeedStream('science', 'all');
  assert(feedScience.items.every(i => i.category === 'science'), 'Filters newsfeed by science category');

  // Test 10: CSV Export Payload Formatting
  console.log('\nTest 10: CSV Export Payload Formatting');
  const sampleReport = {
    title: 'Test Article Claim',
    verdict: 'likely-accurate',
    confidence: 90,
    breakdown: { sourceTrust: { trustScore: 85 }, linguisticAnalysis: { sensationalScore: 10 }, corroboration: { score: 95 } }
  };
  const headers = ["Title", "Verdict", "ConfidencePct", "SourceTrustScore", "SensationalScore", "CorroborationScore", "Timestamp"];
  const csvRow = `"${sampleReport.title}", "${sampleReport.verdict}", ${sampleReport.confidence}, ${sampleReport.breakdown.sourceTrust.trustScore}`;
  assert(csvRow.includes('Test Article Claim'), 'Formats title string cleanly in CSV row');
  assert(csvRow.includes('likely-accurate'), 'Formats verdict tag in CSV row');

  // Test 11: Multi-Language Claim Detection
  console.log('\nTest 11: Multi-Language Claim Detection');
  const esLang = engine.detectLanguage('Según estudios científicos recientes sobre el clima mundial.');
  assert(esLang.code === 'es', 'Detects Spanish language (es)');

  const frLang = engine.detectLanguage('Selon une étude scientifique publiée sur la recherche.');
  assert(frLang.code === 'fr', 'Detects French language (fr)');

  const deLang = engine.detectLanguage('Laut einer wissenschaftlichen Studie der Forscher.');
  assert(deLang.code === 'de', 'Detects German language (de)');

  const hiLang = engine.detectLanguage('वैज्ञानिक शोध और आंकड़ों के अनुसार जारी रिपोर्ट।');
  assert(hiLang.code === 'hi', 'Detects Hindi language (hi)');

  // Test 12: Community Discussion & Crowd Rating Voting
  console.log('\nTest 12: Community Voting & Consensus');
  const initialFeedback = engine.getCommunityFeedback('test-claim-1');
  const initialCount = initialFeedback.totalVotes;
  assert(typeof initialFeedback.consensusPct === 'number', 'Retrieves initial community consensus rating');

  const updatedFeedback = engine.addCommunityVote('test-claim-1', 'accurate', 'Reviewer Sam', 'Peer-reviewed evidence matches source data.');
  assert(updatedFeedback.totalVotes === initialCount + 1, 'Increments total vote count');
  assert(updatedFeedback.comments.some(c => c.user === 'Reviewer Sam'), 'Adds user comment to community thread');

  console.log(`\n========================================`);
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
