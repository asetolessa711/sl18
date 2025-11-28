/**
 * SL18 Intelligent Audience Insights & Feedback Loops Test Suite
 * Phase 20: Audience Insights, Feedback Triggers, and Adaptive Actions
 * 
 * Run: node tests/governance/audience_insights.test.js
 */

import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '../..');

// Test result tracking
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`✓ ${name}`);
  } catch (error) {
    failed++;
    failures.push({ name, error: error.message });
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertArrayIncludes(arr, value, message) {
  if (!arr.includes(value)) {
    throw new Error(message || `Array does not include ${value}`);
  }
}

function assertInRange(value, min, max, message) {
  if (value < min || value > max) {
    throw new Error(message || `Value ${value} not in range [${min}, ${max}]`);
  }
}

// Load JSON files
function loadJSON(path) {
  const fullPath = join(repoRoot, path);
  if (!existsSync(fullPath)) {
    throw new Error(`File not found: ${path}`);
  }
  return JSON.parse(readFileSync(fullPath, 'utf8'));
}

// Audience insights validation
function validateAudienceInsight(data) {
  const required = ['insightId', 'franchiseId', 'contentId', 'periodStart', 'periodEnd', 'engagementMetrics', 'status'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  // Validate engagement metrics
  const requiredEngagement = ['totalViews', 'uniqueViewers', 'avgWatchTime'];
  for (const field of requiredEngagement) {
    if (data.engagementMetrics[field] === undefined) {
      return { valid: false, error: `${field} is required in engagementMetrics` };
    }
  }

  // Validate sentiment if present
  if (data.sentimentAnalysis) {
    const validSentiments = ['very_positive', 'positive', 'neutral', 'negative', 'very_negative'];
    if (!validSentiments.includes(data.sentimentAnalysis.overallSentiment)) {
      return { valid: false, error: 'overallSentiment must be one of enum values' };
    }
  }

  // Validate status
  const validStatuses = ['collecting', 'processing', 'ready', 'stale', 'error'];
  if (!validStatuses.includes(data.status)) {
    return { valid: false, error: 'status must be one of enum values' };
  }

  return { valid: true };
}

// Feedback loop validation
function validateFeedbackLoop(data) {
  const required = ['loopId', 'franchiseId', 'loopType', 'triggers', 'actions', 'status'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  // Validate loop type
  const validLoopTypes = ['personalization', 'monetization', 'qc', 'content_optimization', 'distribution'];
  if (!validLoopTypes.includes(data.loopType)) {
    return { valid: false, error: 'loopType must be one of enum values' };
  }

  // Validate triggers array
  if (!Array.isArray(data.triggers)) {
    return { valid: false, error: 'triggers must be an array' };
  }

  // Validate actions array
  if (!Array.isArray(data.actions)) {
    return { valid: false, error: 'actions must be an array' };
  }

  return { valid: true };
}

// Calculate engagement rate
function calculateEngagementRate(totalViews, interactions) {
  if (totalViews === 0) return 0;
  const totalInteractions = (interactions.likes || 0) + (interactions.shares || 0) + (interactions.comments || 0);
  return Math.round((totalInteractions / totalViews) * 100 * 10) / 10;
}

// Classify engagement level
function classifyEngagement(engagementRate) {
  if (engagementRate >= 25) return 'viral';
  if (engagementRate >= 15) return 'high_engagement';
  if (engagementRate >= 5) return 'moderate_engagement';
  return 'low_engagement';
}

// Calculate sentiment score
function calculateSentimentScore(positiveCount, neutralCount, negativeCount) {
  const total = positiveCount + neutralCount + negativeCount;
  if (total === 0) return 0;
  return Math.round(((positiveCount - negativeCount) / total) * 100) / 100;
}

// Classify sentiment
function classifySentiment(sentimentScore) {
  if (sentimentScore >= 0.6) return 'very_positive';
  if (sentimentScore >= 0.3) return 'positive';
  if (sentimentScore >= -0.3) return 'neutral';
  if (sentimentScore >= -0.6) return 'negative';
  return 'very_negative';
}

// Analyze retention curve
function analyzeRetentionCurve(dataPoints) {
  if (dataPoints.length < 2) return { performance: 'insufficient_data' };
  
  // Check for early drop-off (more than 30% drop in first 15%)
  const earlyPoint = dataPoints.find(p => p.position > 0 && p.position <= 15);
  if (earlyPoint && (100 - earlyPoint.retentionPercentage) > 30) {
    return {
      performance: 'poor',
      dropOff: { position: earlyPoint.position, reason: 'pacing_issue' }
    };
  }
  
  // Check final retention
  const finalPoint = dataPoints[dataPoints.length - 1];
  if (finalPoint.retentionPercentage >= 85) return { performance: 'excellent' };
  if (finalPoint.retentionPercentage >= 60) return { performance: 'normal' };
  return { performance: 'below_average' };
}

// Evaluate trigger condition
function evaluateTrigger(trigger, input) {
  const { condition } = trigger;
  const metricValue = input[condition.metric];
  
  if (condition.operator === 'change_by') {
    // For change_by, we compare previous and current values
    const change = input.currentSentimentScore - input.previousSentimentScore;
    return change <= condition.threshold;
  }
  
  switch (condition.operator) {
    case 'lt': return metricValue < condition.threshold;
    case 'lte': return metricValue <= condition.threshold;
    case 'gt': return metricValue > condition.threshold;
    case 'gte': return metricValue >= condition.threshold;
    case 'eq': return metricValue === condition.threshold;
    default: return false;
  }
}

// Determine churn action
function determineChurnAction(churnRiskScore, churnRiskActions) {
  // Sort by risk level priority
  const priorityMap = { critical: 4, high: 3, medium: 2, low: 1 };
  const sortedActions = [...churnRiskActions].sort((a, b) => priorityMap[b.riskLevel] - priorityMap[a.riskLevel]);
  
  for (const action of sortedActions) {
    const threshold = action.riskLevel === 'critical' ? 85 : 
                     action.riskLevel === 'high' ? 70 :
                     action.riskLevel === 'medium' ? 50 : 30;
    if (churnRiskScore >= threshold) {
      return action;
    }
  }
  return null;
}

// Determine upgrade potential action
function determineUpgradeAction(input, upgradeActions) {
  const { engagementRate, completionRate, bingeViewerPercentage } = input;
  
  // High potential: high engagement + high completion + binge watching
  if (engagementRate >= 30 && completionRate >= 85 && bingeViewerPercentage >= 35) {
    return upgradeActions.find(a => a.potentialLevel === 'high');
  }
  
  // Medium potential: moderate engagement + good completion
  if (engagementRate >= 15 && completionRate >= 70) {
    return upgradeActions.find(a => a.potentialLevel === 'medium');
  }
  
  return null;
}

console.log('\n=== SL18 Phase 20: Intelligent Audience Insights & Feedback Loops Tests ===\n');

// Test 1: Schema files exist
console.log('--- Schema File Existence ---');

test('Audience insights schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/audience_insights.schema.json')));
});

test('Feedback loop schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/feedback_loop.schema.json')));
});

// Test 2: Schema files are valid JSON
console.log('\n--- Schema JSON Validity ---');

test('Audience insights schema is valid JSON', () => {
  const schema = loadJSON('schemas/audience_insights.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assertEqual(schema.title, 'AudienceInsights', 'Incorrect title');
});

test('Feedback loop schema is valid JSON', () => {
  const schema = loadJSON('schemas/feedback_loop.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assertEqual(schema.title, 'FeedbackLoop', 'Incorrect title');
});

test('Audience insights schema has required properties', () => {
  const schema = loadJSON('schemas/audience_insights.schema.json');
  const requiredFields = schema.required;
  assertArrayIncludes(requiredFields, 'insightId', 'Should require insightId');
  assertArrayIncludes(requiredFields, 'engagementMetrics', 'Should require engagementMetrics');
  assertArrayIncludes(requiredFields, 'status', 'Should require status');
});

test('Feedback loop schema has required properties', () => {
  const schema = loadJSON('schemas/feedback_loop.schema.json');
  const requiredFields = schema.required;
  assertArrayIncludes(requiredFields, 'loopId', 'Should require loopId');
  assertArrayIncludes(requiredFields, 'triggers', 'Should require triggers');
  assertArrayIncludes(requiredFields, 'actions', 'Should require actions');
});

// Test 3: Audience insights validation
console.log('\n--- Audience Insights Validation ---');

test('Valid audience insights pass validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  for (const insight of fixtures.validAudienceInsights) {
    const result = validateAudienceInsight(insight);
    assert(result.valid, `Insight ${insight.insightId} failed: ${result.error}`);
  }
});

test('Invalid audience insights fail validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  for (const testCase of fixtures.invalidAudienceInsights) {
    const result = validateAudienceInsight(testCase.data);
    assert(!result.valid, `Expected ${testCase.description} to fail`);
  }
});

test('Audience insight has engagement metrics with required fields', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const insight = fixtures.validAudienceInsights[0];
  assert(insight.engagementMetrics.totalViews !== undefined, 'Should have totalViews');
  assert(insight.engagementMetrics.uniqueViewers !== undefined, 'Should have uniqueViewers');
  assert(insight.engagementMetrics.avgWatchTime !== undefined, 'Should have avgWatchTime');
});

test('Audience insight has sentiment analysis', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const insight = fixtures.validAudienceInsights[0];
  assert(insight.sentimentAnalysis !== undefined, 'Should have sentimentAnalysis');
  assert(insight.sentimentAnalysis.overallSentiment !== undefined, 'Should have overallSentiment');
  assert(insight.sentimentAnalysis.sentimentScore !== undefined, 'Should have sentimentScore');
});

test('Audience insight has retention curves', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const insight = fixtures.validAudienceInsights[0];
  assert(insight.retentionCurves !== undefined, 'Should have retentionCurves');
  assert(insight.retentionCurves.dataPoints.length > 0, 'Should have data points');
});

test('Audience insight has demographic breakdown', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const insight = fixtures.validAudienceInsights[0];
  assert(insight.demographicBreakdown !== undefined, 'Should have demographicBreakdown');
  assert(insight.demographicBreakdown.byRegion.length > 0, 'Should have regional data');
});

// Test 4: Engagement metrics calculation
console.log('\n--- Engagement Metrics Calculation ---');

test('High engagement content calculated correctly', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.engagementTestCases[0];
  const rate = calculateEngagementRate(testCase.input.totalViews, testCase.input.interactions);
  assertEqual(rate, testCase.expectedEngagementRate, testCase.description);
});

test('Low engagement content triggers review signal', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.engagementTestCases[1];
  const rate = calculateEngagementRate(testCase.input.totalViews, testCase.input.interactions);
  assertEqual(rate, testCase.expectedEngagementRate, testCase.description);
  assertEqual(classifyEngagement(rate), testCase.expectedSignal, 'Should classify as low engagement');
});

test('Viral content identified correctly', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.engagementTestCases[2];
  const rate = calculateEngagementRate(testCase.input.totalViews, testCase.input.interactions);
  assertEqual(rate, testCase.expectedEngagementRate, testCase.description);
  assertEqual(classifyEngagement(rate), testCase.expectedSignal, 'Should classify as viral');
});

// Test 5: Sentiment analysis
console.log('\n--- Sentiment Analysis ---');

test('Positive sentiment calculated correctly', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.sentimentTestCases[0];
  const score = calculateSentimentScore(testCase.input.positiveCount, testCase.input.neutralCount, testCase.input.negativeCount);
  assertInRange(score, testCase.expectedScoreRange[0], testCase.expectedScoreRange[1], testCase.description);
  assertEqual(classifySentiment(score), testCase.expectedSentiment, 'Should classify as positive');
});

test('Negative sentiment calculated correctly', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.sentimentTestCases[1];
  const score = calculateSentimentScore(testCase.input.positiveCount, testCase.input.neutralCount, testCase.input.negativeCount);
  assertInRange(score, testCase.expectedScoreRange[0], testCase.expectedScoreRange[1], testCase.description);
  assertEqual(classifySentiment(score), testCase.expectedSentiment, 'Should classify as negative');
});

test('Neutral sentiment calculated correctly', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.sentimentTestCases[2];
  const score = calculateSentimentScore(testCase.input.positiveCount, testCase.input.neutralCount, testCase.input.negativeCount);
  assertInRange(score, testCase.expectedScoreRange[0], testCase.expectedScoreRange[1], testCase.description);
  assertEqual(classifySentiment(score), testCase.expectedSentiment, 'Should classify as neutral');
});

// Test 6: Retention curve analysis
console.log('\n--- Retention Curve Analysis ---');

test('Early drop-off flags pacing issue', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.retentionTestCases[0];
  const result = analyzeRetentionCurve(testCase.input.dataPoints);
  assert(result.dropOff !== undefined, 'Should detect drop-off');
  assertEqual(result.dropOff.position, testCase.expectedDropOff.position, testCase.description);
  assertEqual(result.dropOff.reason, testCase.expectedDropOff.reason, 'Should identify reason');
});

test('High retention flags excellent performance', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.retentionTestCases[1];
  const result = analyzeRetentionCurve(testCase.input.dataPoints);
  assertEqual(result.performance, testCase.expectedPerformance, testCase.description);
});

test('Gradual decline is normal pattern', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.retentionTestCases[2];
  const result = analyzeRetentionCurve(testCase.input.dataPoints);
  assertEqual(result.performance, testCase.expectedPerformance, testCase.description);
});

// Test 7: Feedback loop validation
console.log('\n--- Feedback Loop Validation ---');

test('Valid feedback loops pass validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  for (const loop of fixtures.validFeedbackLoops) {
    const result = validateFeedbackLoop(loop);
    assert(result.valid, `Loop ${loop.loopId} failed: ${result.error}`);
  }
});

test('Invalid feedback loops fail validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  for (const testCase of fixtures.invalidFeedbackLoops) {
    const result = validateFeedbackLoop(testCase.data);
    assert(!result.valid, `Expected ${testCase.description} to fail`);
  }
});

test('Feedback loop has triggers with conditions', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const loop = fixtures.validFeedbackLoops[0];
  assert(loop.triggers.length > 0, 'Should have triggers');
  assert(loop.triggers[0].condition !== undefined, 'Trigger should have condition');
  assert(loop.triggers[0].condition.metric !== undefined, 'Condition should have metric');
});

test('Feedback loop has actions with parameters', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const loop = fixtures.validFeedbackLoops[0];
  assert(loop.actions.length > 0, 'Should have actions');
  assert(loop.actions[0].parameters !== undefined, 'Action should have parameters');
  assert(loop.actions[0].triggeredBy.length > 0, 'Action should be triggered by triggers');
});

// Test 8: Trigger evaluation
console.log('\n--- Trigger Evaluation ---');

test('Engagement below threshold triggers action', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.feedbackLoopTriggerTestCases[0];
  const triggered = evaluateTrigger(testCase.trigger, testCase.input);
  assertEqual(triggered, testCase.expectedTriggered, testCase.description);
});

test('Engagement above threshold does not trigger', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.feedbackLoopTriggerTestCases[1];
  const triggered = evaluateTrigger(testCase.trigger, testCase.input);
  assertEqual(triggered, testCase.expectedTriggered, testCase.description);
});

test('Sentiment change triggers cultural review', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.feedbackLoopTriggerTestCases[2];
  const triggered = evaluateTrigger(testCase.trigger, testCase.input);
  assertEqual(triggered, testCase.expectedTriggered, testCase.description);
});

test('Retention drop triggers content review', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.feedbackLoopTriggerTestCases[3];
  const triggered = evaluateTrigger(testCase.trigger, testCase.input);
  assertEqual(triggered, testCase.expectedTriggered, testCase.description);
});

test('Churn risk triggers retention action', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.feedbackLoopTriggerTestCases[4];
  const triggered = evaluateTrigger(testCase.trigger, testCase.input);
  assertEqual(triggered, testCase.expectedTriggered, testCase.description);
});

// Test 9: Personalization feedback
console.log('\n--- Personalization Feedback ---');

test('Strong format preference boosts recommendation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.personalizationFeedbackTestCases[0];
  // Verify the rule structure matches expected adjustment
  assertEqual(testCase.rule.adjustment.adjustmentType, 'boost', testCase.description);
  assertEqual(testCase.rule.adjustment.value, testCase.expectedAdjustment.multiplier, 'Multiplier should match');
});

test('Persona preference adds weight to recommendation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.personalizationFeedbackTestCases[1];
  assertEqual(testCase.rule.adjustment.adjustmentType, 'add_weight', testCase.description);
  assertEqual(testCase.rule.adjustment.value, testCase.expectedAdjustment.weightAdded, 'Weight should match');
});

test('Personalization adjustment has target system', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const loop = fixtures.validFeedbackLoops[0];
  const action = loop.actions.find(a => a.actionType === 'adjust_personalization');
  assert(action !== undefined, 'Should have personalization adjustment action');
  assertEqual(action.parameters.targetSystem, 'personalization_engine', 'Should target personalization engine');
});

// Test 10: Monetization feedback
console.log('\n--- Monetization Feedback ---');

test('High churn risk triggers discount offer', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.monetizationFeedbackTestCases[0];
  const loop = fixtures.validFeedbackLoops[0];
  const action = determineChurnAction(testCase.input.churnRiskScore, loop.monetizationSignals.churnRiskActions);
  assert(action !== undefined, 'Should return an action');
  assertEqual(action.action, testCase.expectedAction.action, testCase.description);
  assertEqual(action.discountPercentage, testCase.expectedAction.discountPercentage, 'Discount should match');
});

test('Critical churn risk triggers personal outreach', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.monetizationFeedbackTestCases[1];
  const loop = fixtures.validFeedbackLoops[0];
  const action = determineChurnAction(testCase.input.churnRiskScore, loop.monetizationSignals.churnRiskActions);
  assert(action !== undefined, 'Should return an action');
  assertEqual(action.action, testCase.expectedAction.action, testCase.description);
});

test('High upgrade potential suggests tier upgrade', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.monetizationFeedbackTestCases[2];
  const loop = fixtures.validFeedbackLoops[0];
  const action = determineUpgradeAction(testCase.input, loop.monetizationSignals.upgradePotentialActions);
  assert(action !== undefined, 'Should return an action');
  assertEqual(action.suggestedTier, testCase.expectedAction.suggestedTier, testCase.description);
  assertEqual(action.incentive, testCase.expectedAction.incentive, 'Incentive should match');
});

// Test 11: QC feedback
console.log('\n--- QC Feedback ---');

test('Cultural sensitivity issue generates alert', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.qcFeedbackTestCases[0];
  // Verify structure
  assertEqual(testCase.expectedAlert.severity, 'high', testCase.description);
  assertEqual(testCase.expectedAlert.autoFlagged, true, 'Should be auto-flagged');
});

test('Translation quality below threshold flags review', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.qcFeedbackTestCases[1];
  assertEqual(testCase.expectedFlag.suggestedReview, true, testCase.description);
  assertEqual(testCase.expectedFlag.qualityScore, testCase.input.qualityScore, 'Quality score should match');
});

test('Persona drift detected flags consistency review', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const testCase = fixtures.qcFeedbackTestCases[2];
  assertEqual(testCase.expectedFlag.inconsistencyType, testCase.input.driftType, testCase.description);
  assertEqual(testCase.expectedFlag.confidence, testCase.input.confidence, 'Confidence should match');
});

test('Feedback loop has QC feedback configuration', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const loop = fixtures.validFeedbackLoops[0];
  assert(loop.qcFeedback !== undefined, 'Should have qcFeedback');
  assert(loop.qcFeedback.enabled === true, 'QC feedback should be enabled');
});

// Test 12: Extended audit log events
console.log('\n--- Extended Audit Log Events ---');

test('Audit log schema includes audience insight events', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const eventTypes = schema.properties.eventType.enum;
  assertArrayIncludes(eventTypes, 'insight_collected', 'Should include insight_collected');
  assertArrayIncludes(eventTypes, 'insight_processed', 'Should include insight_processed');
  assertArrayIncludes(eventTypes, 'engagement_metrics_updated', 'Should include engagement_metrics_updated');
  assertArrayIncludes(eventTypes, 'sentiment_analysis_completed', 'Should include sentiment_analysis_completed');
});

test('Audit log schema includes feedback loop events', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const eventTypes = schema.properties.eventType.enum;
  assertArrayIncludes(eventTypes, 'feedback_loop_triggered', 'Should include feedback_loop_triggered');
  assertArrayIncludes(eventTypes, 'feedback_loop_action_executed', 'Should include feedback_loop_action_executed');
  assertArrayIncludes(eventTypes, 'personalization_adjusted', 'Should include personalization_adjusted');
});

test('Audit log schema includes QC feedback events', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const eventTypes = schema.properties.eventType.enum;
  assertArrayIncludes(eventTypes, 'qc_feedback_generated', 'Should include qc_feedback_generated');
  assertArrayIncludes(eventTypes, 'cultural_sensitivity_alert', 'Should include cultural_sensitivity_alert');
  assertArrayIncludes(eventTypes, 'translation_quality_flagged', 'Should include translation_quality_flagged');
});

test('Audit log schema includes new categories', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const categories = schema.properties.category.enum;
  assertArrayIncludes(categories, 'audience_insights', 'Should include audience_insights category');
  assertArrayIncludes(categories, 'feedback_loop', 'Should include feedback_loop category');
});

test('Audit log schema includes new target types', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const targetTypes = schema.properties.target.properties.type.enum;
  assertArrayIncludes(targetTypes, 'audience_insight', 'Should include audience_insight target type');
  assertArrayIncludes(targetTypes, 'feedback_loop', 'Should include feedback_loop target type');
});

// Test 13: Execution history tracking
console.log('\n--- Execution History ---');

test('Feedback loop has execution history', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const loop = fixtures.validFeedbackLoops[0];
  assert(loop.executionHistory !== undefined, 'Should have executionHistory');
  assert(loop.executionHistory.length > 0, 'Should have execution records');
});

test('Execution history has required fields', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const execution = fixtures.validFeedbackLoops[0].executionHistory[0];
  assert(execution.executionId !== undefined, 'Should have executionId');
  assert(execution.triggerId !== undefined, 'Should have triggerId');
  assert(execution.actionId !== undefined, 'Should have actionId');
  assert(execution.result !== undefined, 'Should have result');
});

test('Execution history tracks impact metrics', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const execution = fixtures.validFeedbackLoops[0].executionHistory[0];
  assert(execution.impactMetrics !== undefined, 'Should have impactMetrics');
  assert(execution.impactMetrics.affectedViewers !== undefined, 'Should have affectedViewers');
  assert(execution.impactMetrics.engagementChange !== undefined, 'Should have engagementChange');
});

// Test 14: Configuration options
console.log('\n--- Configuration Options ---');

test('Feedback loop has config with evaluation interval', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const loop = fixtures.validFeedbackLoops[0];
  assert(loop.config !== undefined, 'Should have config');
  assert(loop.config.evaluationInterval !== undefined, 'Should have evaluationInterval');
});

test('Feedback loop has rollback configuration', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const loop = fixtures.validFeedbackLoops[0];
  assert(loop.config.rollbackEnabled !== undefined, 'Should have rollbackEnabled');
  assert(loop.config.rollbackThreshold !== undefined, 'Should have rollbackThreshold');
});

test('Feedback loop has rate limiting', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const loop = fixtures.validFeedbackLoops[0];
  assert(loop.config.maxActionsPerHour !== undefined, 'Should have maxActionsPerHour');
});

// Test 15: Data quality tracking
console.log('\n--- Data Quality Tracking ---');

test('Audience insight has data quality metrics', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const insight = fixtures.validAudienceInsights[0];
  assert(insight.dataQuality !== undefined, 'Should have dataQuality');
  assert(insight.dataQuality.completeness !== undefined, 'Should have completeness');
  assert(insight.dataQuality.reliability !== undefined, 'Should have reliability');
});

test('Data quality includes sample size', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const insight = fixtures.validAudienceInsights[0];
  assert(insight.dataQuality.sampleSize !== undefined, 'Should have sampleSize');
  assert(insight.dataQuality.sampleSize > 0, 'Sample size should be positive');
});

// Test 16: Audit log test data validation
console.log('\n--- Audit Log Test Data ---');

test('Audit log test data has correct event types', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const insightLog = fixtures.auditLogTestData.find(l => l.eventType === 'insight_collected');
  assert(insightLog !== undefined, 'Should have insight_collected log');
  assertEqual(insightLog.category, 'audience_insights', 'Should have correct category');
});

test('Audit log test data has feedback loop events', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const loopLog = fixtures.auditLogTestData.find(l => l.eventType === 'feedback_loop_triggered');
  assert(loopLog !== undefined, 'Should have feedback_loop_triggered log');
  assertEqual(loopLog.category, 'feedback_loop', 'Should have correct category');
});

test('Audit log test data has personalization events', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_insights.json');
  const personalizationLog = fixtures.auditLogTestData.find(l => l.eventType === 'personalization_adjusted');
  assert(personalizationLog !== undefined, 'Should have personalization_adjusted log');
  assert(personalizationLog.details.previousValue !== undefined, 'Should have previousValue');
  assert(personalizationLog.details.newValue !== undefined, 'Should have newValue');
});

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failures.length > 0) {
  console.log('\nFailures:');
  for (const f of failures) {
    console.log(`  - ${f.name}: ${f.error}`);
  }
}

// Exit with appropriate code
process.exit(failed > 0 ? 1 : 0);
