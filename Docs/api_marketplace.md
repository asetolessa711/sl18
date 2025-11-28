# API Marketplace Guide

This guide explains how to use the SL18 API Marketplace, including API discovery, subscription management, usage quotas, pricing tiers, and observability.

## Overview

The SL18 API Marketplace provides a catalog of APIs that enable partners and developers to integrate with the platform. APIs cover multilingual content, distribution, personalization, monetization, analytics, and more.

## API Categories

### Multilingual API
Manage language packs, translations, and multilingual content.
- Language pack management
- Translation workflows
- RTL/LTR support
- Localization validation

### Distribution API
Distribute content across platforms and channels.
- Multi-platform publishing
- Syndication feeds
- Regional compliance
- Format conversion

### Personalization API
Deliver personalized content experiences.
- Viewer profiles
- Content recommendations
- Adaptive rendering
- A/B testing

### Monetization API
Manage pricing, subscriptions, and revenue.
- Dynamic pricing
- Tier management
- Revenue tracking
- Churn prediction

### Analytics API
Access audience insights and engagement metrics.
- Real-time analytics
- Sentiment analysis
- Retention curves
- Demographic data

### QC API
Quality control and content validation.
- Content review workflows
- Persona consistency checks
- Cultural sensitivity validation
- Automated QC

### Governance API
Platform governance and policy management.
- Policy enforcement
- Audit logging
- Compliance tracking
- Access control

### Content API
Content management and operations.
- Asset upload/download
- Metadata management
- Version control
- Content search

### Insights API
Advanced audience insights and feedback.
- Engagement patterns
- Feedback loops
- Cultural reactions
- Performance trends

### Voice API
Voice control and assistant integration.
- Voice commands
- Speech-to-text
- Multilingual recognition
- Assistant integration

### Assistant API
AI operator assistant capabilities.
- Natural language queries
- Contextual help
- Proactive alerts
- Workflow automation

## API Lifecycle

### Alpha
- Early development stage
- Breaking changes expected
- Limited support
- Sandbox only

### Beta
- Feature complete but not production-ready
- Breaking changes possible
- Community support
- Sandbox + limited production

### GA (General Availability)
- Production ready
- Stable API contract
- Full support
- SLA available

### Deprecated
- Still functional but scheduled for retirement
- No new features
- Migration path provided
- Support timeline published

### Retired
- No longer available
- Migration required
- Historical documentation only

## Visibility Levels

| Level | Access |
|-------|--------|
| Public | All registered users |
| Partner Only | Verified partners only |
| Enterprise Only | Enterprise tier partners |
| Internal | SL18 internal use only |

## Authentication

### API Key
Simple authentication for basic access.
```http
GET /api/v2/content HTTP/1.1
Host: api.sl18.io
X-API-Key: your-api-key-here
```

### OAuth 2.0
Full authentication with scopes for production use.
```http
POST /oauth/token HTTP/1.1
Host: auth.sl18.io
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=YOUR_CLIENT_ID&client_secret=YOUR_CLIENT_SECRET
```

### JWT
Token-based authentication for stateless requests.
```http
GET /api/v2/analytics HTTP/1.1
Host: api.sl18.io
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Pricing Tiers

### Free Tier
Perfect for getting started and evaluation.
- 1,000 requests/month
- 10 requests/minute
- 1 GB data transfer
- Community support
- Sandbox access

### Pro Tier ($99/month)
For growing businesses and production use.
- 50,000 requests/month
- 100 requests/minute
- 50 GB data transfer
- Email support (24h)
- 99.5% uptime SLA
- Webhooks included
- Analytics access

### Enterprise Tier ($999/month)
For large organizations with high demands.
- 1,000,000 requests/month
- 1,000 requests/minute
- 500 GB data transfer
- Dedicated support
- 99.99% uptime SLA
- Priority processing
- Custom integrations
- Advanced analytics

### Custom Tier
For partners with unique requirements.
- Custom quota limits
- Custom pricing
- Dedicated infrastructure
- Custom SLA
- White-label options

## Usage Quotas

### Request Limits
```
Monthly: Total requests allowed per billing period
Daily: Rolling 24-hour request limit
Per-minute: Rate limiting threshold
```

### Data Transfer
```
Inbound: Data uploaded to API
Outbound: Data downloaded from API
Total: Combined in/out transfer
```

### Storage
```
Content: Storage for uploaded assets
Metadata: Storage for associated data
Total: Combined storage quota
```

### Webhooks
```
Monthly limit on webhook deliveries
Retry policy for failed deliveries
Event filtering to reduce volume
```

## Overage Handling

### Soft Limits (Default)
When quota is exceeded:
1. Warning notification at 70% usage
2. Critical alert at 90% usage
3. Overage charges apply beyond limit
4. Service continues without interruption

### Hard Limits
When strict limits are enforced:
1. Warning notification at 70% usage
2. Critical alert at 90% usage
3. Service blocked at 100% usage
4. Quota reset required

### Overage Pricing
| Resource | Rate |
|----------|------|
| API Requests | $0.001 per request |
| Data Transfer | $0.05 per GB |
| Storage | $0.02 per GB/month |
| Webhooks | $0.0001 per delivery |

## Subscription Management

### Creating Subscription
1. Browse API catalog
2. Select desired API
3. Choose pricing tier
4. Accept terms
5. Configure payment method
6. Receive API credentials

### Upgrading Tier
1. Navigate to subscription settings
2. Select new tier
3. Confirm prorated charges
4. Immediate access to new limits

### Downgrading Tier
1. Navigate to subscription settings
2. Select lower tier
3. Effective at next billing cycle
4. Usage adjusted accordingly

### Cancellation
1. Navigate to subscription settings
2. Select cancellation option
3. Provide cancellation reason
4. Access continues until period end
5. Data retention per policy

## Webhooks

### Configuration
```json
{
  "url": "https://your-service.example.com/webhooks/sl18",
  "events": ["content.uploaded", "distribution.completed"],
  "secret": "your-webhook-secret"
}
```

### Signature Verification
```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(`sha256=${expected}`)
  );
}
```

### Retry Policy
| Attempt | Delay |
|---------|-------|
| 1 | Immediate |
| 2 | 1 minute |
| 3 | 5 minutes |
| 4 | 30 minutes |
| 5 | 2 hours |

### Available Events
- `content.uploaded` - Content successfully uploaded
- `content.processed` - Content processing complete
- `distribution.started` - Distribution initiated
- `distribution.completed` - Distribution successful
- `distribution.failed` - Distribution failed
- `subscription.created` - New subscription
- `subscription.cancelled` - Subscription ended
- `quota.warning` - Approaching quota limit
- `quota.exceeded` - Quota limit exceeded

## SDKs

### JavaScript/TypeScript
```bash
npm install @sl18/content-api
```

```javascript
import { SL18Client } from '@sl18/content-api';

const client = new SL18Client({
  apiKey: process.env.SL18_API_KEY
});

const content = await client.content.upload({
  file: buffer,
  metadata: { title: 'My Content' }
});
```

### Python
```bash
pip install sl18-content-api
```

```python
from sl18 import SL18Client

client = SL18Client(api_key=os.environ['SL18_API_KEY'])

content = client.content.upload(
    file=buffer,
    metadata={'title': 'My Content'}
)
```

### Other Languages
- Java: `com.sl18:content-api`
- Go: `github.com/sl18/go-sdk`
- C#: `SL18.ContentApi`
- Ruby: `sl18-content-api`
- PHP: `sl18/content-api`

## Sandbox Environment

### Access
- Sandbox URL: `https://sandbox.api.sl18.io/v2`
- Separate API credentials required
- Test data provided
- No charges incurred

### Limitations
- Rate limited to 100 requests/minute
- Test data only
- Limited webhook delivery
- No SLA guarantee

### Test Data
- Sample content libraries
- Mock viewer profiles
- Simulated analytics
- Test payment flows

### Reset Schedule
- Daily reset at 00:00 UTC
- On-demand reset via dashboard
- Preserve specific test scenarios

## Observability

### Dashboard Metrics
- Total API calls
- Success/error rates
- Average latency (p50, p95, p99)
- Quota usage percentage
- Active subscriptions

### Endpoint Analytics
Per-endpoint breakdown of:
- Call volume
- Response times
- Error rates
- Usage patterns

### Error Breakdown
- 4xx client errors
- 5xx server errors
- Rate limit events
- Timeout events

### Usage by Region
Geographic distribution of API usage for optimization.

### Usage by Partner
Partner-level usage for revenue share calculations.

### Alerts
| Alert Type | Threshold | Action |
|------------|-----------|--------|
| High Error Rate | >5% errors | Investigate issues |
| High Latency | p95 > 500ms | Scale resources |
| Quota Warning | 70% used | Notify partner |
| Service Degradation | Multiple failures | Incident response |

## Revenue Share

### For Partner APIs
Partners can publish their own APIs and earn revenue.

#### Models
- Percentage: Fixed split (e.g., 70% partner / 30% SL18)
- Tiered: Progressive rates based on revenue
- Flat Fee: Fixed monthly fee to SL18
- Hybrid: Combination models

#### Payout
- Monthly settlement
- $50 minimum payout
- Direct deposit or PayPal
- Revenue dashboard access

### Example Calculation
```
Monthly Revenue: $10,000
Partner Percentage: 70%

Partner Earnings: $10,000 × 0.70 = $7,000
SL18 Share: $10,000 × 0.30 = $3,000
```

## Best Practices

### API Integration
1. Use SDK when available
2. Implement retry logic with exponential backoff
3. Handle rate limits gracefully
4. Cache responses where appropriate
5. Use webhooks instead of polling

### Security
1. Store API keys securely
2. Rotate credentials regularly
3. Use OAuth for production
4. Validate webhook signatures
5. Implement request signing

### Performance
1. Batch requests when possible
2. Use compression for large payloads
3. Implement connection pooling
4. Monitor latency metrics
5. Use regional endpoints

### Error Handling
```javascript
try {
  const result = await client.content.upload(data);
} catch (error) {
  if (error.code === 'RATE_LIMITED') {
    await sleep(error.retryAfter * 1000);
    return retry();
  }
  if (error.code === 'QUOTA_EXCEEDED') {
    // Upgrade plan or wait for reset
  }
  throw error;
}
```

## Support

### Documentation
- API Reference: https://docs.sl18.io/api
- Guides: https://docs.sl18.io/guides
- Changelog: https://docs.sl18.io/changelog

### Community
- Forum: https://community.sl18.io
- Discord: https://discord.gg/sl18
- Stack Overflow: [sl18] tag

### Direct Support
- Email: api-support@sl18.io
- Status Page: https://status.sl18.io

## Related Documentation

- [Partner Ecosystem Guide](partner_ecosystem.md)
- [Distribution Guide](distribution.md)
- [Governance Policies](governance.md)
- [Voice Control Guide](voice_control.md)
