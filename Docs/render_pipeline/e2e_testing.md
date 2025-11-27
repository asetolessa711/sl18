# End-to-End Pipeline Testing

This document describes how to run and understand the SL18 render pipeline end-to-end integration tests.

## Overview

The E2E tests validate the complete render pipeline:

```
Asset Manifest → Timeline Builder → Render Worker → Storage Upload → QC Workflow
```

## Running E2E Tests

### Prerequisites

1. Node.js 18+ installed
2. Dependencies installed: `npm install`

### Run All Tests

```bash
npm test
```

### Run E2E Tests Only

```bash
npm test -- tests/e2e-integration.test.ts
```

### Run with Coverage

```bash
npm run test:coverage
```

## Test Phases

### Phase 1: Asset Manifest Loading

Tests that asset manifests are properly structured and all referenced files exist.

```typescript
// Example manifest structure
const manifest: AssetManifest = {
  episodeId: 'episode_001',
  personaCode: 'ADDIS',
  franchiseCode: 'ADDIS_ENTERTAINMENT',
  createdAt: '2024-01-15T10:00:00Z',
  assets: [
    { assetId: 'voice', type: 'audio', role: 'voice', localPath: '/path/to/voice.mp3' },
    { assetId: 'bg', type: 'image', role: 'background', localPath: '/path/to/bg.jpg' }
  ]
};
```

### Phase 2: Timeline Building

Validates timeline JSON generation from asset manifests:

- Track creation (audio, video, captions)
- Clip timing and synchronization
- Styling information
- QC flags initialization

### Phase 3: Render Job Simulation

Tests the render job queue and execution:

- Job creation and queuing
- Status transitions (queued → rendering → completed)
- Render metrics collection

### Phase 4: Storage Upload

Validates storage adapter functionality:

- Local storage writes
- URL generation
- Checksum verification
- Storage record creation

### Phase 5: QC Workflow

Tests quality control evaluation:

- Caption length validation
- Duration limits
- Content warning detection
- Review decision tracking

## Test Configuration

### Environment Variables

Set these for cloud storage testing:

```bash
# Azure Blob Storage
export AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."
export AZURE_STORAGE_CONTAINER="sl18-renders"

# AWS S3
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="us-east-1"
export S3_BUCKET="sl18-renders"
```

### Test Fixtures

Tests use mock fixtures in `/tmp/sl18-e2e-test/`:

```
/tmp/sl18-e2e-test/
├── assets/
│   └── e2e_test_001/
│       ├── manifest.json
│       ├── voice.mp3
│       ├── background.jpg
│       └── transcript.srt
├── timelines/
│   └── e2e_test_001/
│       └── timeline.json
├── renders/
│   └── e2e_test_001/
│       └── master.mp4
└── storage/
    └── renders/
        └── e2e_test_001/
            └── master.mp4
```

## Writing New E2E Tests

### Test Structure

```typescript
describe('New Feature E2E', () => {
  beforeAll(() => {
    // Setup test environment
  });

  afterAll(() => {
    // Cleanup
  });

  it('validates complete workflow', async () => {
    // 1. Create test data
    // 2. Run pipeline steps
    // 3. Verify results
  });
});
```

### Best Practices

1. **Isolation**: Each test should clean up after itself
2. **Fixtures**: Use `/tmp` for test files to avoid polluting the repo
3. **Mocking**: Mock external services (ffmpeg, cloud APIs) for unit tests
4. **Timeouts**: Set appropriate timeouts for async operations

## CI/CD Integration

The E2E tests run automatically on:

- Pull requests to `main`
- Push to `main`
- Manual workflow dispatch

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
```

## Troubleshooting

### Common Issues

**Test timeout errors:**
```bash
# Increase timeout in vitest.config.ts
testTimeout: 30000
```

**Permission errors:**
```bash
# Ensure /tmp is writable
chmod 755 /tmp
```

**Missing dependencies:**
```bash
npm install
```

### Debug Mode

Run tests with verbose output:

```bash
npm test -- --reporter=verbose
```

## Metrics and Coverage

### Coverage Report

```bash
npm run test:coverage
```

Coverage thresholds:
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

### Test Performance

Current test suite runs in ~500ms on standard hardware.

## Related Documentation

- [Timeline Schema](./timeline_schema.md)
- [Render Worker](./render_worker.md)
- [Storage Adapters](./storage_adapters.md)
- [QC Styling](./qc_styling.md)
