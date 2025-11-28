/**
 * SL18 Audience Engagement & Interactive Features Test Suite
 * Phase 31: Interactive Polls, Comments, Reactions, Personalization, Engagement Analytics
 * 
 * Run: node tests/governance/audience_engagement.test.js
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

// Poll validation
function validatePoll(data) {
  const required = ['pollId', 'franchiseId', 'contentId', 'pollType', 'pollConfig', 'status'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  const validPollTypes = ['story_choice', 'character_vote', 'sentiment_slider', 'prediction', 'rating', 'feedback', 'trivia', 'opinion'];
  if (!validPollTypes.includes(data.pollType)) {
    return { valid: false, error: 'pollType must be one of enum values' };
  }

  if (!data.pollConfig.question && data.pollType !== 'sentiment_slider') {
    return { valid: false, error: 'pollConfig.question is required' };
  }

  const validStatuses = ['draft', 'scheduled', 'active', 'paused', 'closed', 'archived'];
  if (!validStatuses.includes(data.status)) {
    return { valid: false, error: 'status must be one of enum values' };
  }

  return { valid: true };
}

// Comment validation
function validateComment(data) {
  const required = ['commentId', 'franchiseId', 'contentId', 'contentType', 'author', 'content', 'createdAt'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  const validContentTypes = ['movie', 'episode', 'series', 'short_drama', 'trailer', 'behind_the_scenes'];
  if (!validContentTypes.includes(data.contentType)) {
    return { valid: false, error: 'contentType must be one of enum values' };
  }

  if (!data.author.userId) {
    return { valid: false, error: 'author.userId is required' };
  }

  if (!data.content.text) {
    return { valid: false, error: 'content.text is required' };
  }

  return { valid: true };
}

// Personalization validation
function validatePersonalization(data) {
  const required = ['personalizationId', 'customerId', 'franchiseId', 'status'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  const validStatuses = ['active', 'inactive', 'suspended', 'deleted'];
  if (!validStatuses.includes(data.status)) {
    return { valid: false, error: 'status must be one of enum values' };
  }

  return { valid: true };
}

// Engagement validation
function validateEngagement(data) {
  const required = ['engagementId', 'franchiseId', 'contentId', 'periodStart', 'periodEnd', 'status'];
  for (const field of required) {
    if (data[field] === undefined) {
      return { valid: false, error: `${field} is required` };
    }
  }

  const validStatuses = ['collecting', 'processing', 'ready', 'stale', 'error'];
  if (!validStatuses.includes(data.status)) {
    return { valid: false, error: 'status must be one of enum values' };
  }

  return { valid: true };
}

// Calculate poll participation rate
function calculatePollParticipationRate(totalVotes, totalViewers) {
  if (totalViewers === 0) return 0;
  return Math.round((totalVotes / totalViewers) * 100 * 10) / 10;
}

// Calculate engagement score
function calculateEngagementScore(pollRate, commentRate, reactionRate) {
  // Weighted average: polls 25%, comments 35%, reactions 40%
  const score = (pollRate * 0.25) + (commentRate * 5) + (reactionRate * 0.4);
  return Math.round(score * 10) / 10;
}

// Classify engagement tier
function classifyEngagementTier(score) {
  if (score >= 90) return 'viral';
  if (score >= 70) return 'high';
  if (score >= 40) return 'moderate';
  if (score >= 20) return 'low';
  return 'minimal';
}

// Evaluate moderation result
function evaluateModerationResult(flags, confidenceScore) {
  if (flags.length === 0 && confidenceScore >= 0.9) {
    return { passed: true, suggestedAction: 'approve' };
  }
  if (flags.includes('hate_speech') || flags.includes('violence')) {
    return { passed: false, suggestedAction: 'auto_hide' };
  }
  if (flags.length > 0 && confidenceScore < 0.8) {
    return { passed: false, suggestedAction: 'flag_review' };
  }
  return { passed: false, suggestedAction: 'flag_review' };
}

// Check if alert should trigger
function shouldTriggerAlert(alertType, input) {
  switch (alertType) {
    case 'engagement_drop':
      const drop = input.previousScore - input.currentScore;
      return drop >= input.threshold;
    case 'moderation_backlog':
      return input.pendingItems >= input.threshold;
    case 'cultural_issue':
      return input.sentimentDrop >= 0.3 && input.negativeFeedbackCount >= 100;
    default:
      return false;
  }
}

console.log('\n=== SL18 Phase 31: Audience Engagement & Interactive Features Tests ===\n');

// Test 1: Schema files exist
console.log('--- Schema File Existence ---');

test('Audience polls schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/audience_polls.schema.json')));
});

test('Audience comments schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/audience_comments.schema.json')));
});

test('Audience personalization schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/audience_personalization.schema.json')));
});

test('Audience engagement schema exists', () => {
  assert(existsSync(join(repoRoot, 'schemas/audience_engagement.schema.json')));
});

// Test 2: Schema files are valid JSON
console.log('\n--- Schema JSON Validity ---');

test('Audience polls schema is valid JSON', () => {
  const schema = loadJSON('schemas/audience_polls.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assertEqual(schema.title, 'AudiencePolls', 'Incorrect title');
});

test('Audience comments schema is valid JSON', () => {
  const schema = loadJSON('schemas/audience_comments.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assertEqual(schema.title, 'AudienceComments', 'Incorrect title');
});

test('Audience personalization schema is valid JSON', () => {
  const schema = loadJSON('schemas/audience_personalization.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assertEqual(schema.title, 'AudiencePersonalization', 'Incorrect title');
});

test('Audience engagement schema is valid JSON', () => {
  const schema = loadJSON('schemas/audience_engagement.schema.json');
  assert(schema.$schema !== undefined, 'Missing $schema');
  assertEqual(schema.title, 'AudienceEngagement', 'Incorrect title');
});

// Test 3: Schema required properties
console.log('\n--- Schema Required Properties ---');

test('Audience polls schema has required properties', () => {
  const schema = loadJSON('schemas/audience_polls.schema.json');
  const requiredFields = schema.required;
  assertArrayIncludes(requiredFields, 'pollId', 'Should require pollId');
  assertArrayIncludes(requiredFields, 'pollType', 'Should require pollType');
  assertArrayIncludes(requiredFields, 'pollConfig', 'Should require pollConfig');
});

test('Audience comments schema has required properties', () => {
  const schema = loadJSON('schemas/audience_comments.schema.json');
  const requiredFields = schema.required;
  assertArrayIncludes(requiredFields, 'commentId', 'Should require commentId');
  assertArrayIncludes(requiredFields, 'author', 'Should require author');
  assertArrayIncludes(requiredFields, 'content', 'Should require content');
});

test('Audience personalization schema has required properties', () => {
  const schema = loadJSON('schemas/audience_personalization.schema.json');
  const requiredFields = schema.required;
  assertArrayIncludes(requiredFields, 'personalizationId', 'Should require personalizationId');
  assertArrayIncludes(requiredFields, 'customerId', 'Should require customerId');
});

test('Audience engagement schema has required properties', () => {
  const schema = loadJSON('schemas/audience_engagement.schema.json');
  const requiredFields = schema.required;
  assertArrayIncludes(requiredFields, 'engagementId', 'Should require engagementId');
  assertArrayIncludes(requiredFields, 'periodStart', 'Should require periodStart');
  assertArrayIncludes(requiredFields, 'periodEnd', 'Should require periodEnd');
});

// Test 4: Poll validation
console.log('\n--- Poll Validation ---');

test('Valid polls pass validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  for (const poll of fixtures.validPolls) {
    const result = validatePoll(poll);
    assert(result.valid, `Poll ${poll.pollId} failed: ${result.error}`);
  }
});

test('Invalid polls fail validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  for (const testCase of fixtures.invalidPolls) {
    const result = validatePoll(testCase.data);
    assert(!result.valid, `Expected ${testCase.description} to fail`);
  }
});

test('Poll has question configuration', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const poll = fixtures.validPolls[0];
  assert(poll.pollConfig.question !== undefined, 'Should have question');
  assert(poll.pollConfig.question.length > 0, 'Question should not be empty');
});

test('Poll has localized question', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const poll = fixtures.validPolls[0];
  assert(poll.pollConfig.questionLocalized !== undefined, 'Should have localized questions');
  assert(poll.pollConfig.questionLocalized.sw !== undefined, 'Should have Swahili translation');
});

test('Story choice poll has options', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const poll = fixtures.validPolls[0];
  assert(poll.pollConfig.options !== undefined, 'Should have options');
  assert(poll.pollConfig.options.length >= 2, 'Should have at least 2 options');
});

test('Sentiment slider poll has slider config', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const poll = fixtures.validPolls[1];
  assert(poll.pollConfig.sliderConfig !== undefined, 'Should have sliderConfig');
  assert(poll.pollConfig.sliderConfig.minValue !== undefined, 'Should have minValue');
  assert(poll.pollConfig.sliderConfig.maxValue !== undefined, 'Should have maxValue');
});

test('Poll has display settings', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const poll = fixtures.validPolls[0];
  assert(poll.displaySettings !== undefined, 'Should have displaySettings');
  assert(poll.displaySettings.triggerPoint !== undefined, 'Should have triggerPoint');
});

test('Poll has results tracking', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const poll = fixtures.validPolls[0];
  assert(poll.results !== undefined, 'Should have results');
  assert(poll.results.totalVotes !== undefined, 'Should have totalVotes');
  assert(poll.results.optionResults !== undefined, 'Should have optionResults');
});

test('Poll has story influence configuration', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const poll = fixtures.validPolls[0];
  assert(poll.storyInfluence !== undefined, 'Should have storyInfluence');
  assert(poll.storyInfluence.influenceEnabled === true, 'Story influence should be enabled');
  assert(poll.storyInfluence.outcomeMapping.length > 0, 'Should have outcome mappings');
});

// Test 5: Comment validation
console.log('\n--- Comment Validation ---');

test('Valid comments pass validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  for (const comment of fixtures.validComments) {
    const result = validateComment(comment);
    assert(result.valid, `Comment ${comment.commentId} failed: ${result.error}`);
  }
});

test('Invalid comments fail validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  for (const testCase of fixtures.invalidComments) {
    const result = validateComment(testCase.data);
    assert(!result.valid, `Expected ${testCase.description} to fail`);
  }
});

test('Comment has author information', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const comment = fixtures.validComments[0];
  assert(comment.author.userId !== undefined, 'Should have userId');
  assert(comment.author.displayName !== undefined, 'Should have displayName');
});

test('Comment has content with text', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const comment = fixtures.validComments[0];
  assert(comment.content.text !== undefined, 'Should have text');
  assert(comment.content.text.length > 0, 'Text should not be empty');
});

test('Comment has reactions tracking', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const comment = fixtures.validComments[0];
  assert(comment.reactions !== undefined, 'Should have reactions');
  assert(comment.reactions.totalCount !== undefined, 'Should have totalCount');
  assert(comment.reactions.breakdown !== undefined, 'Should have breakdown');
});

test('Comment has moderation status', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const comment = fixtures.validComments[0];
  assert(comment.moderation !== undefined, 'Should have moderation');
  assert(comment.moderation.status !== undefined, 'Should have status');
});

test('Comment has sentiment analysis', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const comment = fixtures.validComments[0];
  assert(comment.sentimentAnalysis !== undefined, 'Should have sentimentAnalysis');
  assert(comment.sentimentAnalysis.sentiment !== undefined, 'Should have sentiment');
  assert(comment.sentimentAnalysis.sentimentScore !== undefined, 'Should have sentimentScore');
});

test('Reply comment has parent reference', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const reply = fixtures.validComments[1];
  assert(reply.parentCommentId !== undefined, 'Reply should have parentCommentId');
  assertEqual(reply.threadDepth, 1, 'Reply should have threadDepth of 1');
});

// Test 6: Personalization validation
console.log('\n--- Personalization Validation ---');

test('Valid personalizations pass validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  for (const pers of fixtures.validPersonalizations) {
    const result = validatePersonalization(pers);
    assert(result.valid, `Personalization ${pers.personalizationId} failed: ${result.error}`);
  }
});

test('Invalid personalizations fail validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  for (const testCase of fixtures.invalidPersonalizations) {
    const result = validatePersonalization(testCase.data);
    assert(!result.valid, `Expected ${testCase.description} to fail`);
  }
});

test('Personalization has genre preferences', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const pers = fixtures.validPersonalizations[0];
  assert(pers.preferences !== undefined, 'Should have preferences');
  assert(pers.preferences.genres !== undefined, 'Should have genres');
  assert(pers.preferences.genres.length > 0, 'Should have at least one genre');
});

test('Personalization has persona affinities', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const pers = fixtures.validPersonalizations[0];
  assert(pers.preferences.personas !== undefined, 'Should have personas');
  assert(pers.preferences.personas[0].affinity !== undefined, 'Should have affinity score');
});

test('Personalization has recommendations queue', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const pers = fixtures.validPersonalizations[0];
  assert(pers.recommendations !== undefined, 'Should have recommendations');
  assert(pers.recommendations.forYouQueue !== undefined, 'Should have forYouQueue');
  assert(pers.recommendations.forYouQueue.length > 0, 'Should have recommendations');
});

test('Personalization has continue watching', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const pers = fixtures.validPersonalizations[0];
  assert(pers.recommendations.continueWatching !== undefined, 'Should have continueWatching');
  assert(pers.recommendations.continueWatching[0].progress !== undefined, 'Should have progress');
});

test('Personalization has adaptive UI settings', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const pers = fixtures.validPersonalizations[0];
  assert(pers.adaptiveUI !== undefined, 'Should have adaptiveUI');
  assert(pers.adaptiveUI.heroBanner !== undefined, 'Should have heroBanner settings');
  assert(pers.adaptiveUI.categoryOrder !== undefined, 'Should have categoryOrder');
});

test('Personalization has engagement history', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const pers = fixtures.validPersonalizations[0];
  assert(pers.engagementHistory !== undefined, 'Should have engagementHistory');
  assert(pers.engagementHistory.pollsParticipated !== undefined, 'Should have pollsParticipated');
  assert(pers.engagementHistory.engagementTier !== undefined, 'Should have engagementTier');
});

// Test 7: Engagement validation
console.log('\n--- Engagement Analytics Validation ---');

test('Valid engagements pass validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  for (const engagement of fixtures.validEngagements) {
    const result = validateEngagement(engagement);
    assert(result.valid, `Engagement ${engagement.engagementId} failed: ${result.error}`);
  }
});

test('Invalid engagements fail validation', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  for (const testCase of fixtures.invalidEngagements) {
    const result = validateEngagement(testCase.data);
    assert(!result.valid, `Expected ${testCase.description} to fail`);
  }
});

test('Engagement has poll metrics', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const engagement = fixtures.validEngagements[0];
  assert(engagement.pollEngagement !== undefined, 'Should have pollEngagement');
  assert(engagement.pollEngagement.totalVotes !== undefined, 'Should have totalVotes');
  assert(engagement.pollEngagement.participationRate !== undefined, 'Should have participationRate');
});

test('Engagement has comment metrics', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const engagement = fixtures.validEngagements[0];
  assert(engagement.commentEngagement !== undefined, 'Should have commentEngagement');
  assert(engagement.commentEngagement.totalComments !== undefined, 'Should have totalComments');
  assert(engagement.commentEngagement.moderationStats !== undefined, 'Should have moderationStats');
});

test('Engagement has reaction metrics', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const engagement = fixtures.validEngagements[0];
  assert(engagement.reactionEngagement !== undefined, 'Should have reactionEngagement');
  assert(engagement.reactionEngagement.totalReactions !== undefined, 'Should have totalReactions');
  assert(engagement.reactionEngagement.reactionBreakdown !== undefined, 'Should have reactionBreakdown');
});

test('Engagement has regional heatmap data', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const engagement = fixtures.validEngagements[0];
  assert(engagement.regionalEngagement !== undefined, 'Should have regionalEngagement');
  assert(engagement.regionalEngagement.heatmapData !== undefined, 'Should have heatmapData');
  assert(engagement.regionalEngagement.heatmapData.length > 0, 'Should have regional data');
});

test('Engagement has overall metrics', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const engagement = fixtures.validEngagements[0];
  assert(engagement.overallMetrics !== undefined, 'Should have overallMetrics');
  assert(engagement.overallMetrics.engagementScore !== undefined, 'Should have engagementScore');
  assert(engagement.overallMetrics.engagementTier !== undefined, 'Should have engagementTier');
});

test('Engagement has trend analysis', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const engagement = fixtures.validEngagements[0];
  assert(engagement.trendAnalysis !== undefined, 'Should have trendAnalysis');
  assert(engagement.trendAnalysis.engagementTrend !== undefined, 'Should have engagementTrend');
});

test('Engagement has alerts configuration', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const engagement = fixtures.validEngagements[0];
  assert(engagement.alerts !== undefined, 'Should have alerts');
  assert(engagement.alerts.alertThresholds !== undefined, 'Should have alertThresholds');
});

test('Engagement has operator dashboard config', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const engagement = fixtures.validEngagements[0];
  assert(engagement.operatorDashboard !== undefined, 'Should have operatorDashboard');
  assert(engagement.operatorDashboard.widgets !== undefined, 'Should have widgets');
});

// Test 8: Poll participation calculation
console.log('\n--- Poll Participation Calculation ---');

test('Calculate poll participation rate correctly', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const testCase = fixtures.pollCalculationTests[0];
  const rate = calculatePollParticipationRate(testCase.input.totalVotes, testCase.input.totalViewers);
  assertEqual(rate, testCase.expectedRate, testCase.description);
});

test('High participation poll calculated correctly', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const testCase = fixtures.pollCalculationTests[1];
  const rate = calculatePollParticipationRate(testCase.input.totalVotes, testCase.input.totalViewers);
  assertEqual(rate, testCase.expectedRate, testCase.description);
});

test('Low participation poll calculated correctly', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const testCase = fixtures.pollCalculationTests[2];
  const rate = calculatePollParticipationRate(testCase.input.totalVotes, testCase.input.totalViewers);
  assertEqual(rate, testCase.expectedRate, testCase.description);
});

// Test 9: Engagement score calculation
console.log('\n--- Engagement Score Calculation ---');

test('High engagement score calculated correctly', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const testCase = fixtures.engagementScoreTests[0];
  const score = calculateEngagementScore(testCase.input.pollRate, testCase.input.commentRate, testCase.input.reactionRate);
  assertInRange(score, testCase.expectedScore - 5, testCase.expectedScore + 5, testCase.description);
});

test('High engagement classified correctly', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const testCase = fixtures.engagementScoreTests[0];
  const score = calculateEngagementScore(testCase.input.pollRate, testCase.input.commentRate, testCase.input.reactionRate);
  const tier = classifyEngagementTier(score);
  assertEqual(tier, testCase.expectedTier, 'Should classify as high engagement');
});

test('Viral engagement classified correctly', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const testCase = fixtures.engagementScoreTests[1];
  const score = calculateEngagementScore(testCase.input.pollRate, testCase.input.commentRate, testCase.input.reactionRate);
  const tier = classifyEngagementTier(score);
  assertEqual(tier, testCase.expectedTier, 'Should classify as viral engagement');
});

test('Low engagement classified correctly', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const testCase = fixtures.engagementScoreTests[2];
  const score = calculateEngagementScore(testCase.input.pollRate, testCase.input.commentRate, testCase.input.reactionRate);
  const tier = classifyEngagementTier(score);
  assertEqual(tier, testCase.expectedTier, 'Should classify as low engagement');
});

// Test 10: Moderation evaluation
console.log('\n--- Moderation Evaluation ---');

test('Clean comment auto-approved', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const testCase = fixtures.moderationTests[0];
  const result = evaluateModerationResult(testCase.input.flags, testCase.input.confidenceScore);
  assertEqual(result.passed, testCase.expectedResult.passed, testCase.description);
  assertEqual(result.suggestedAction, testCase.expectedResult.suggestedAction, 'Should suggest approve');
});

test('Flagged comment sent for review', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const testCase = fixtures.moderationTests[1];
  const result = evaluateModerationResult(testCase.input.flags, testCase.input.confidenceScore);
  assertEqual(result.passed, testCase.expectedResult.passed, testCase.description);
  assertEqual(result.suggestedAction, testCase.expectedResult.suggestedAction, 'Should suggest flag_review');
});

test('Hate speech auto-hidden', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const testCase = fixtures.moderationTests[2];
  const result = evaluateModerationResult(testCase.input.flags, testCase.input.confidenceScore);
  assertEqual(result.passed, testCase.expectedResult.passed, testCase.description);
  assertEqual(result.suggestedAction, testCase.expectedResult.suggestedAction, 'Should suggest auto_hide');
});

// Test 11: Alert triggering
console.log('\n--- Alert Triggering ---');

test('Engagement drop triggers alert', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const testCase = fixtures.alertTests[0];
  const shouldTrigger = shouldTriggerAlert('engagement_drop', testCase.input);
  assertEqual(shouldTrigger, testCase.expectedAlert.shouldTrigger, testCase.description);
});

test('Moderation backlog triggers alert', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const testCase = fixtures.alertTests[1];
  const shouldTrigger = shouldTriggerAlert('moderation_backlog', testCase.input);
  assertEqual(shouldTrigger, testCase.expectedAlert.shouldTrigger, testCase.description);
});

test('Cultural sensitivity triggers alert', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const testCase = fixtures.alertTests[2];
  const shouldTrigger = shouldTriggerAlert('cultural_issue', testCase.input);
  assertEqual(shouldTrigger, testCase.expectedAlert.shouldTrigger, testCase.description);
});

// Test 12: Audit log events
console.log('\n--- Audit Log Events ---');

test('Audit log schema includes poll events', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const eventTypes = schema.properties.eventType.enum;
  assertArrayIncludes(eventTypes, 'poll_created', 'Should include poll_created');
  assertArrayIncludes(eventTypes, 'poll_voted', 'Should include poll_voted');
  assertArrayIncludes(eventTypes, 'poll_closed', 'Should include poll_closed');
});

test('Audit log schema includes comment events', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const eventTypes = schema.properties.eventType.enum;
  assertArrayIncludes(eventTypes, 'comment_posted', 'Should include comment_posted');
  assertArrayIncludes(eventTypes, 'comment_moderated', 'Should include comment_moderated');
  assertArrayIncludes(eventTypes, 'comment_reported', 'Should include comment_reported');
});

test('Audit log schema includes reaction events', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const eventTypes = schema.properties.eventType.enum;
  assertArrayIncludes(eventTypes, 'reaction_added', 'Should include reaction_added');
  assertArrayIncludes(eventTypes, 'reaction_removed', 'Should include reaction_removed');
});

test('Audit log schema includes personalization events', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const eventTypes = schema.properties.eventType.enum;
  assertArrayIncludes(eventTypes, 'personalization_updated', 'Should include personalization_updated');
  assertArrayIncludes(eventTypes, 'recommendation_served', 'Should include recommendation_served');
});

test('Audit log schema includes engagement categories', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const categories = schema.properties.category.enum;
  assertArrayIncludes(categories, 'audience_engagement', 'Should include audience_engagement category');
  assertArrayIncludes(categories, 'audience_personalization', 'Should include audience_personalization category');
});

test('Audit log schema includes engagement target types', () => {
  const schema = loadJSON('schemas/audit_log.schema.json');
  const targetTypes = schema.properties.target.properties.type.enum;
  assertArrayIncludes(targetTypes, 'poll', 'Should include poll target type');
  assertArrayIncludes(targetTypes, 'comment', 'Should include comment target type');
  assertArrayIncludes(targetTypes, 'personalization', 'Should include personalization target type');
  assertArrayIncludes(targetTypes, 'engagement_analytics', 'Should include engagement_analytics target type');
});

// Test 13: Insights integration
console.log('\n--- Insights Integration ---');

test('Poll has insights integration config', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const poll = fixtures.validPolls[0];
  assert(poll.insightsIntegration !== undefined, 'Should have insightsIntegration');
  assert(poll.insightsIntegration.feedToAudienceInsights === true, 'Should feed to audience insights');
});

test('Comment has insights integration config', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const comment = fixtures.validComments[0];
  assert(comment.insightsIntegration !== undefined, 'Should have insightsIntegration');
  assert(comment.insightsIntegration.contributesToSentiment === true, 'Should contribute to sentiment');
});

test('Personalization has insights integration config', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const pers = fixtures.validPersonalizations[0];
  assert(pers.insightsIntegration !== undefined, 'Should have insightsIntegration');
  assert(pers.insightsIntegration.feedToPersonalizationEngine === true, 'Should feed to personalization engine');
});

test('Engagement has insights integration config', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const engagement = fixtures.validEngagements[0];
  assert(engagement.insightsIntegration !== undefined, 'Should have insightsIntegration');
  assert(engagement.insightsIntegration.feedToAudienceInsights === true, 'Should feed to audience insights');
  assert(engagement.insightsIntegration.feedToFeedbackLoop === true, 'Should feed to feedback loop');
});

// Test 14: Data quality tracking
console.log('\n--- Data Quality Tracking ---');

test('Engagement has data quality metrics', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const engagement = fixtures.validEngagements[0];
  assert(engagement.dataQuality !== undefined, 'Should have dataQuality');
  assert(engagement.dataQuality.completeness !== undefined, 'Should have completeness');
  assert(engagement.dataQuality.reliability !== undefined, 'Should have reliability');
});

test('Data quality has sample size', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const engagement = fixtures.validEngagements[0];
  assert(engagement.dataQuality.sampleSize !== undefined, 'Should have sampleSize');
  assert(engagement.dataQuality.sampleSize > 0, 'Sample size should be positive');
});

// Test 15: Timestamped comments
console.log('\n--- Timestamped Comments ---');

test('Engagement tracks timestamped comments', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const engagement = fixtures.validEngagements[0];
  assert(engagement.commentEngagement.timestampedComments !== undefined, 'Should have timestampedComments');
  assert(engagement.commentEngagement.timestampedComments.count !== undefined, 'Should have count');
});

test('Timestamped comments have hotspots', () => {
  const fixtures = loadJSON('tests/governance/fixtures/audience_engagement.json');
  const engagement = fixtures.validEngagements[0];
  const hotspots = engagement.commentEngagement.timestampedComments.hotspots;
  assert(hotspots !== undefined, 'Should have hotspots');
  assert(hotspots.length > 0, 'Should have at least one hotspot');
  assert(hotspots[0].timestamp !== undefined, 'Hotspot should have timestamp');
  assert(hotspots[0].commentCount !== undefined, 'Hotspot should have commentCount');
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
