# Security Framework Guide

This guide covers the SL18 Security Framework for operators and partners, providing comprehensive security policies, encryption standards, access controls, and zero-trust architecture.

## Overview

The Security Framework provides:
- End-to-end encryption for data at rest and in transit
- Role-based access control with adaptive MFA
- Zero-trust architecture enforcement
- Secure credential management with auto-rotation
- Compliance with industry standards (SOC2, ISO27001, GDPR, PCI-DSS)

## Encryption Standards

### Data at Rest

SL18 encrypts all data at rest using:
- **Algorithm**: AES-256-GCM
- **Key Length**: 256-bit
- **Key Rotation**: Every 90 days (automatic)
- **Key Management**: AWS KMS, Azure KeyVault, or HashiCorp Vault

### Data in Transit

All data in transit is protected using:
- **Protocol**: TLS 1.3
- **Certificate**: Extended Validation (EV) SSL
- **HSTS**: Enabled with preload
- **Cipher Suites**: Modern, secure ciphers only

### Field-Level Encryption

Sensitive fields are additionally encrypted:
- SSN
- Payment card numbers
- Bank account details
- Passwords
- API keys

## Access Control

### Authentication Methods

SL18 supports multiple authentication methods:
- Password with strong policy enforcement
- MFA (TOTP, Push, SMS, Email)
- Biometric authentication
- Hardware security keys (FIDO2/WebAuthn)
- SSO (SAML, OIDC)
- API keys and JWTs

### Password Policy

| Setting | Value |
|---------|-------|
| Minimum Length | 12 characters |
| Uppercase Required | Yes |
| Lowercase Required | Yes |
| Numbers Required | Yes |
| Symbols Required | Yes |
| Expiration | 90 days |
| History | 12 passwords |
| Lockout Threshold | 5 attempts |
| Lockout Duration | 30 minutes |

### MFA Requirements

MFA is required for:
- All administrative actions
- Sensitive data access
- Financial operations
- Configuration changes

### Contextual MFA

Additional MFA challenges are triggered when:
- New device detected
- New location detected
- High-risk action attempted
- Multiple failed login attempts
- Unusual access time

## Zero-Trust Architecture

### Principles

1. **Never Trust, Always Verify** - Every request is authenticated and authorized
2. **Least Privilege** - Minimum necessary access granted
3. **Assume Breach** - Design for containment and detection
4. **Verify Explicitly** - All users and devices verified continuously
5. **Continuous Validation** - Ongoing trust assessment
6. **Micro-Segmentation** - Network isolation between services

### Network Segmentation

Services are isolated into segments:

| Segment | Services | Allowed Connections |
|---------|----------|---------------------|
| Public | API Gateway, CDN | Application |
| Application | Web, Mobile, Partner API | Data, Security |
| Data | Database, Cache, Storage | None |
| Security | Auth, Vault, Logging | Application, Data |

### Device Trust

Devices must meet compliance requirements:
- Current OS version
- Security patches applied
- Antivirus enabled
- Disk encryption enabled
- Screen lock configured
- No jailbreak/root detected

## Credential Management

### Vault Configuration

```yaml
vault:
  provider: hashicorp_vault
  enabled: true
  autoRotation: true
  rotationInterval: 30 days
```

### API Key Management

- Format: Prefixed for easy identification
- Expiration: 90 days
- Rate limiting: 1000 requests/minute, 10000 requests/hour
- Automatic rotation supported

### Service Accounts

- Minimum privilege principle enforced
- Automatic rotation required
- All actions audited

## Compliance

### Supported Frameworks

- **SOC 2 Type II** - Active certification
- **ISO 27001** - Active certification
- **GDPR** - Compliant
- **PCI-DSS** - Compliant for payment processing
- **NIST CSF** - Aligned

### Audit Schedule

- Annual external audits
- Quarterly internal reviews
- Continuous compliance monitoring

## Security Metrics

Key metrics tracked:
- Security Score (target: 90+)
- Vulnerabilities Open/Closed
- Mean Time to Detect (MTTD)
- Mean Time to Respond (MTTR)
- Compliance Score

## Operator Actions

### Viewing Security Status

1. Navigate to **Security Dashboard**
2. View the **Security Score** widget
3. Check **Compliance Status** for certification details

### Rotating Credentials

1. Go to **Settings > Credential Management**
2. Select the credential to rotate
3. Click **Rotate** and confirm
4. Update any dependent configurations

### Managing Access

1. Navigate to **Access Control > Roles**
2. Select a role to modify
3. Update permissions as needed
4. Changes take effect immediately

### Reviewing Audit Logs

1. Go to **Security > Audit Logs**
2. Filter by date, user, or action type
3. Export for compliance reporting

## Best Practices

1. **Enable MFA** for all users
2. **Use hardware keys** for administrative accounts
3. **Rotate credentials** regularly
4. **Monitor security metrics** daily
5. **Review audit logs** weekly
6. **Keep systems patched** within 30 days
7. **Test incident response** quarterly

## Related Documentation

- [Threat Detection](./threat_detection.md) - Real-time threat monitoring
- [Security Observability](./security_observability.md) - Dashboards and incident tracking
- [Governance Suite](./governance_suite.md) - Policy management
