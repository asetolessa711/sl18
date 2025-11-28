# Beta Access Playbook

**Target:** beta.waliinstudio.com  
**Purpose:** Controlled beta distribution with gated access, TLS, and monitoring.

This playbook provides guidelines for testers participating in the SL18 beta program and outlines the security measures in place to protect the staging environment.

---

## Table of Contents
1. [Overview](#overview)
2. [Getting Access](#getting-access)
3. [Cohort Tiers](#cohort-tiers)
4. [Security Guidelines](#security-guidelines)
5. [Testing Guidelines](#testing-guidelines)
6. [Bug Reporting](#bug-reporting)
7. [Feedback Collection](#feedback-collection)
8. [Frequently Asked Questions](#frequently-asked-questions)
9. [Emergency Contacts](#emergency-contacts)

---

## Overview

The beta environment at `beta.waliinstudio.com` is a secure staging space designed for controlled user testing before production release. This environment features:

- **Gated Access**: Invite-only access with tokenized invite links
- **TLS Encryption**: All traffic is encrypted with TLS 1.2+
- **WAF Protection**: Web Application Firewall protects against common attacks
- **Rate Limiting**: Abuse prevention through request rate limits
- **Monitoring**: Real-time monitoring and alerting for security events

---

## Getting Access

### Invite Token System

Access to the beta environment requires a valid invite token. Here's how the system works:

1. **Receive Invite**: You'll receive an invite link via email from `beta@waliinstudio.com`
2. **Token Format**: `https://beta.waliinstudio.com/invite?token=inv_XXXXXX`
3. **Single-Use**: Most tokens can only be used once
4. **Expiry**: Tokens expire after 72 hours (3 days) by default
5. **Email Verification**: You'll need to verify your email address after signup

### Redeeming Your Token

1. Click the invite link in your email
2. Complete the registration form
3. Verify your email address
4. Set up two-factor authentication (recommended)
5. Accept the beta tester agreement

### Token Troubleshooting

| Issue | Solution |
|-------|----------|
| Token expired | Request a new invite from your contact |
| Token already used | Request a new invite if you haven't registered |
| Invalid token | Check the URL for typos; contact support |
| Rate limited | Wait 15 minutes and try again |

---

## Cohort Tiers

Beta testers are organized into three cohorts with different access levels:

### Internal (50-100 users)
- **Who**: Internal team and stakeholders
- **Access Level**: Full
- **Features**: All features including debug tools and admin panels
- **Limits**: 100,000 API requests/day, 10GB storage

### Closed Beta (500-1,000 users)
- **Who**: Selected external testers
- **Access Level**: Standard
- **Features**: Core features + most beta features
- **Limits**: 10,000 API requests/day, 1GB storage

### Open Beta (10,000-25,000 users)
- **Who**: Public beta testers
- **Access Level**: Limited
- **Features**: Core features only
- **Limits**: 1,000 API requests/day, 100MB storage

### Feature Availability by Cohort

| Feature | Internal | Closed | Open |
|---------|:--------:|:------:|:----:|
| Dashboard Access | ✅ | ✅ | ✅ |
| API Access | ✅ | ✅ | ❌ |
| Data Export | ✅ | ✅ | ❌ |
| Integrations | ✅ | ❌ | ❌ |
| AI Assistant | ✅ | ✅ | ❌ |
| Debug Mode | ✅ | ❌ | ❌ |
| Admin Panel | ✅ | ❌ | ❌ |

---

## Security Guidelines

### Protecting Your Account

1. **Strong Password**: Use a unique password with at least 12 characters
2. **Two-Factor Authentication**: Enable 2FA for additional security
3. **Secure Connection**: Only access via HTTPS (enforced automatically)
4. **Session Management**: Log out when finished testing

### Do's and Don'ts

#### ✅ Do:
- Report any security vulnerabilities you discover
- Use unique test data (don't use real personal information)
- Keep your invite token confidential
- Log out after each testing session
- Report suspicious activity immediately

#### ❌ Don't:
- Share your account credentials with others
- Attempt to access other users' data
- Use automated tools or bots without permission
- Attempt SQL injection, XSS, or other attacks
- Share screenshots containing sensitive information publicly
- Store production data in the beta environment

### Rate Limits

To prevent abuse, the following rate limits are enforced:

| Action | Limit |
|--------|-------|
| Login attempts | 5 per minute |
| Signup attempts | 3 per 5 minutes |
| Token redemption | 5 per minute |
| API requests | 100 per minute |
| Password reset | 3 per hour |

Exceeding these limits will result in temporary blocks.

### Reporting Security Issues

If you discover a security vulnerability:

1. **Do NOT** exploit or share the vulnerability publicly
2. Email security details to `security@waliinstudio.com`
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Your contact information
4. We aim to respond within 24 hours
5. Responsible disclosure may be eligible for recognition

---

## Testing Guidelines

### Environment Details

- **URL**: https://beta.waliinstudio.com
- **API Base**: https://api.beta.waliinstudio.com
- **Status Page**: https://status.beta.waliinstudio.com

### Testing Scope

**In Scope:**
- All features available to your cohort
- UI/UX testing
- API functionality (if enabled for your cohort)
- Performance feedback
- Accessibility testing
- Mobile responsiveness

**Out of Scope:**
- Security penetration testing (unless authorized)
- Load testing (coordinate with team first)
- Automated scraping
- Production data migration testing

### Test Data Guidelines

1. Use clearly fake test data (e.g., "Test User", "test@example.com")
2. Don't use real personal information
3. Prefix test items with `[TEST]` or `[BETA]`
4. Clean up test data periodically
5. Report any data that appears to be real

### Browser Support

Tested and supported browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Bug Reporting

### How to Report a Bug

1. Check if the bug is already reported in the known issues list
2. Use the in-app bug report feature (recommended)
3. Or email `beta-bugs@waliinstudio.com`

### Bug Report Template

```
**Title**: [Brief description]

**Environment**:
- Browser: [e.g., Chrome 119]
- OS: [e.g., Windows 11]
- Device: [e.g., Desktop]

**Steps to Reproduce**:
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Screenshots/Videos**:
[Attach if applicable]

**Additional Context**:
[Any other relevant information]
```

### Bug Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| Critical | System down, data loss | 2 hours |
| High | Major feature broken | 4 hours |
| Medium | Feature partially working | 24 hours |
| Low | Minor issues, cosmetic | 72 hours |

---

## Feedback Collection

### NPS Surveys

You'll receive periodic Net Promoter Score surveys:
- **Internal cohort**: Every 7 days
- **Closed cohort**: Every 14 days
- **Open cohort**: Every 30 days

### Feedback Channels

1. **In-App Feedback**: Click the feedback button in the app
2. **Email**: beta-feedback@waliinstudio.com
3. **Slack**: #sl18-beta-testers (for Internal cohort)
4. **Monthly Calls**: Beta tester community calls (optional)

### Feature Requests

Submit feature requests through:
1. In-app feature request form
2. Email to beta-features@waliinstudio.com

Include:
- Clear description of the feature
- Use case / problem it solves
- Priority (nice-to-have vs. essential)

---

## Frequently Asked Questions

### Access & Tokens

**Q: My invite link expired. What do I do?**
A: Contact the person who sent you the invite or email beta@waliinstudio.com for a new token.

**Q: Can I share my account with colleagues?**
A: No, each user needs their own invite and account for proper testing attribution.

**Q: How do I know which cohort I'm in?**
A: Check your profile settings under "Beta Cohort" or the features available to you.

### Testing

**Q: Is my test data visible to other testers?**
A: No, each user has isolated data in the beta environment.

**Q: Will my data transfer to production?**
A: No, beta environment data is separate and will be cleared at launch.

**Q: Can I test on mobile devices?**
A: Yes, the web app is responsive. Native mobile apps are coming in a future phase.

### Security

**Q: Is my data encrypted?**
A: Yes, all data is encrypted in transit (TLS 1.2+) and at rest.

**Q: What happens if I get rate limited?**
A: Wait 15-60 minutes depending on the action, then try again.

**Q: I think I found a security bug. Who do I contact?**
A: Email security@waliinstudio.com immediately. Do not post publicly.

---

## Emergency Contacts

### Support Channels

| Issue Type | Contact | Response SLA |
|------------|---------|--------------|
| General Support | beta@waliinstudio.com | 24 hours |
| Bug Reports | beta-bugs@waliinstudio.com | Based on severity |
| Security Issues | security@waliinstudio.com | 24 hours |
| Account Issues | accounts@waliinstudio.com | 24 hours |

### Escalation Path

1. **Level 1**: Email support channels above
2. **Level 2**: Slack #sl18-beta-support (Internal cohort)
3. **Level 3**: Direct contact with beta program manager

### Status & Maintenance

- **Status Page**: https://status.beta.waliinstudio.com
- **Maintenance Windows**: Sundays 02:00-06:00 UTC (when needed)
- **Announcements**: Email + in-app notification

---

## Changelog

| Date | Version | Changes |
|------|---------|---------|
| 2025-11-28 | 1.0 | Initial playbook release |

---

*Thank you for participating in the SL18 beta program. Your feedback helps us build a better product!*

**Document Owner**: Beta Program Team  
**Last Updated**: 2025-11-28  
**Classification**: Beta Tester Confidential
