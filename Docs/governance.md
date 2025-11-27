# SL18 Governance Documentation

This document describes the SL18 governance layer implementation, covering franchise registration, agreements, revenue management, QC enforcement, governance policies, and access control.

## Overview

The governance layer provides structured workflows for:
- **Franchise Registration**: Onboarding new franchise partners
- **Digital Agreements**: Binding terms for operations
- **Revenue Ledger**: Centralized revenue tracking and distribution
- **Audit Logging**: Complete traceability of governance actions
- **QC Enforcement**: Quality control gates before publishing
- **Governance Policies**: Framework for rules, compliance, and audit requirements (Phase 18)
- **Access Control**: Role-based permissions and MFA enforcement (Phase 18)

## Schema Files

All governance data structures are defined in JSON Schema format:

| Schema | Location | Purpose |
|--------|----------|---------|
| Registration | `schemas/registration.schema.json` | Franchise registration records |
| Agreement | `schemas/agreement.schema.json` | Digital agreement templates |
| Revenue Ledger | `schemas/revenue_ledger.schema.json` | Revenue tracking and payouts |
| Audit Log | `schemas/audit_log.schema.json` | Governance event logging |
| Governance Policy | `schemas/governance_policy.schema.json` | Policy rules and compliance (Phase 18) |
| Contributor Agreement | `schemas/contributor_agreement.schema.json` | Contributor terms (Phase 18) |

## Franchise Registration Workflow

### 1. Registration Submission
```
Partner submits registration → Status: pending
```

Required fields:
- `franchiseId`: Unique identifier (lowercase, alphanumeric)
- `creatorId`: Partner identifier
- `registrationModel`: `fee` or `revenueShare`
- `displayName`, `country`, `ownerContact`

### 2. Registration Approval
```
Central ops reviews → Status: approved/rejected
```

Approval checklist:
- [ ] Partner identity verified
- [ ] Country/market validated
- [ ] Credential readiness confirmed
- [ ] Agreement terms accepted

### 3. Registration Activation
```
Agreement signed + setup complete → Status: active
```

Activation triggers:
- Drive folders provisioned
- Airtable records created
- Make.com scenarios configured
- Training completed

### 4. Status Lifecycle
```
pending → approved → active → (suspended) → (terminated)
```

## Agreement Management

### Creating an Agreement

1. Generate agreement from template (`Docs/agreement_template.md`)
2. Populate terms based on partner negotiation
3. Set status to `draft`
4. Both parties review and request amendments

### Signing Process

1. Franchise representative signs first
2. Central representative countersigns
3. Status changes to `active`
4. Audit log entry created

### Agreement Terms

Key terms defined in every agreement:

| Term Category | Description |
|---------------|-------------|
| `fees` | Registration and monthly fees |
| `revenueShare` | Partner/central split percentages |
| `qcObligations` | QC requirements and strike limits |
| `publishingRights` | Platforms and content ownership |
| `overrideRules` | Central override authority |
| `rollbackRules` | Content rollback permissions |

### Amendments

Agreements can be amended by:
1. Proposing change with `amendmentId` and `description`
2. Obtaining both-party approval
3. Recording `effectiveDate` and `approvedBy`
4. Updating parent agreement status to `amended`

## Revenue Ledger Management

### Ledger Entry Structure

Each ledger entry represents a reporting period:

```json
{
  "ledgerId": "led-core-2025-01",
  "franchiseId": "core",
  "period": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31",
    "type": "monthly"
  },
  "revenueGenerated": {
    "total": 1250.00,
    "currency": "USD",
    "breakdown": {
      "youtube": 500.00,
      "instagram": 400.00,
      "facebook": 200.00,
      "tiktok": 150.00
    }
  },
  "revenueSplit": {
    "partnerShare": 437.50,
    "centralShare": 812.50,
    "partnerPercentage": 35,
    "centralPercentage": 65
  },
  "payoutSchedule": {
    "scheduledDate": "2025-02-15",
    "status": "pending"
  }
}
```

### Revenue Calculation

1. Aggregate platform revenue for period
2. Apply agreement revenue share percentages
3. Apply any adjustments (deductions, bonuses)
4. Schedule payout per agreement terms

### Payout Lifecycle

```
pending → approved → processing → completed
                  ↓
               failed → (retry)
```

### Adjustments

Adjustments may be applied for:
- `deduction`: Platform fees, violations
- `bonus`: Performance incentives
- `correction`: Calculation errors
- `refund`: Disputed charges
- `fee`: Service or setup fees

## Audit Logging

### Event Types

All governance actions are logged with these event types:

**Registration Events:**
- `registration_submitted`
- `registration_approved`
- `registration_rejected`
- `registration_suspended`
- `registration_terminated`

**Agreement Events:**
- `agreement_created`
- `agreement_signed`
- `agreement_amended`
- `agreement_terminated`

**Revenue Events:**
- `revenue_recorded`
- `revenue_split_calculated`
- `payout_scheduled`
- `payout_approved`
- `payout_completed`
- `payout_failed`

**QC Events:**
- `qc_submitted`
- `qc_approved`
- `qc_rejected`
- `qc_strike_issued`

**Publishing Events:**
- `content_published`
- `content_rollback`
- `override_applied`

### Audit Log Entry Example

```json
{
  "logId": "audit-20251127-001",
  "timestamp": "2025-11-27T14:00:00Z",
  "eventType": "registration_approved",
  "category": "registration",
  "actor": {
    "type": "user",
    "id": "ops@sl18.africa",
    "name": "Central Ops"
  },
  "target": {
    "type": "franchise",
    "id": "core",
    "franchiseId": "core"
  },
  "details": {
    "description": "Franchise registration approved after verification",
    "previousValue": "pending",
    "newValue": "approved",
    "reason": "All requirements met"
  },
  "result": "success",
  "correlationId": "reg-core-2025"
}
```

### Audit Retention

- Audit logs retained for 7 years minimum
- Stored in append-only format
- Correlate related events via `correlationId`

## QC Enforcement

### Pre-Publishing Gate

Content cannot be published unless:
1. Episode status is `render_ready`
2. QC review completed (if required by agreement)
3. No unresolved QC rejections
4. Partner below strike limit

### QC Review Workflow

```
render_ready → qc_submitted → qc_approved → ready_to_publish
                           ↓
                     qc_rejected → revisions → resubmit
```

### Strike Enforcement

When QC is rejected:
1. Strike recorded against franchise
2. Reason logged in audit trail
3. Partner notified with remediation steps

At strike limit:
1. Franchise status changed to `suspended`
2. Publishing automation paused
3. Central ops review required for reinstatement

## Integration Points

### Airtable Integration

Governance data syncs with Airtable tables:
- `Franchises`: Registration and status
- `Episodes`: QC status and publishing gate
- Revenue fields for ledger reconciliation

### Make.com Automation

Governance events trigger automation:
- Registration approval → provisioning scenario
- QC approval → publishing scenario enabled
- Payout completed → notification scenario

### Control Panel

Backend API endpoints for governance:
- `/api/governance/registrations`: Registration management
- `/api/governance/agreements`: Agreement lifecycle
- `/api/governance/ledger`: Revenue entries
- `/api/governance/audit`: Audit log queries

## File Locations

| Artifact | Path |
|----------|------|
| Registration Schema | `schemas/registration.schema.json` |
| Agreement Schema | `schemas/agreement.schema.json` |
| Revenue Ledger Schema | `schemas/revenue_ledger.schema.json` |
| Audit Log Schema | `schemas/audit_log.schema.json` |
| Agreement Template | `Docs/agreement_template.md` |
| Governance Tests | `tests/governance/` |
| Sample Data | `tests/governance/fixtures/` |

## Success Criteria

- [x] Registration schema validated
- [x] Agreement templates retrievable
- [x] Revenue ledger calculates splits correctly
- [x] Audit logs capture all governance events
- [x] QC enforcement prevents unapproved publishing
- [x] Test cases pass for all workflows
- [x] Governance policies enforce compliance (Phase 18)
- [x] Role-based access control implemented (Phase 18)

## Phase 18: Governance Scaling

### Governance Policies

The governance policy schema (`schemas/governance_policy.schema.json`) enables:

#### Policy Types
- `franchise_rules`: Franchise-specific operating rules
- `compliance`: Regulatory compliance requirements
- `audit`: Audit requirements and frequency
- `access_control`: Permission and role definitions
- `content_standards`: Content quality requirements
- `revenue_sharing`: Revenue distribution policies
- `contributor_terms`: Terms for contributors
- `platform_usage`: Platform usage guidelines

#### Policy Scope Levels
- **Global**: Applies to all franchises and regions
- **Region**: Applies to specific geographic regions
- **Franchise**: Applies to specific franchise(s)
- **Contributor**: Applies to specific contributor types

#### Policy Rules

Each policy contains rules with:
- `ruleId`: Unique rule identifier
- `enforcement`: `mandatory`, `recommended`, or `optional`
- `action`: `allow`, `deny`, `warn`, `require_approval`, `log_only`
- `penalty`: Violation penalties with severity levels

Example policy:
```json
{
  "policyId": "policy-content-global-001",
  "name": "Global Content Standards",
  "version": "1.0.0",
  "type": "content_standards",
  "scope": { "level": "global" },
  "rules": [
    {
      "ruleId": "qc-threshold",
      "name": "Minimum QC Score",
      "enforcement": "mandatory",
      "condition": "qcScore >= 85",
      "action": "deny",
      "penalty": {
        "type": "warning",
        "severity": "medium"
      }
    }
  ],
  "status": "active"
}
```

### Access Control

Role-based permissions system with:

#### Roles
| Role | Description | MFA Required |
|------|-------------|--------------|
| `operator` | Day-to-day operations | Optional |
| `reviewer` | Content review and QC | Optional |
| `contributor` | Create and submit content | No |
| `auditor` | Access audit logs and reports | Yes |
| `admin` | Manage policies and users | Yes |
| `super_admin` | Full system access | Yes |

#### Permissions
- Content: `view_content`, `create_content`, `edit_content`, `delete_content`, `publish_content`
- Review: `review_content`, `approve_content`
- Revenue: `view_revenue`, `manage_revenue`
- Policy: `view_policies`, `create_policies`, `edit_policies`, `delete_policies`
- Access: `assign_roles`, `revoke_roles`
- Audit: `view_audit_logs`, `export_audit_logs`, `perform_audit`
- Management: `manage_contributors`, `manage_marketplace`, `access_sensitive_data`

#### MFA Enforcement
Sensitive actions requiring MFA regardless of role:
- Policy changes
- Role assignments
- Payout approvals
- Data exports
- System configuration

### Compliance Requirements

The governance layer supports compliance with:
- **GDPR**: Data protection for EU users
- **CCPA**: California consumer privacy
- **SOC2**: Security controls
- **ISO27001**: Information security management
- **PCI-DSS**: Payment card security
- **Local Regulations**: Region-specific requirements

#### Data Retention
| Data Type | Retention Period |
|-----------|------------------|
| Audit Logs | 7 years minimum |
| User Content | 30 days after deletion request |
| Financial Records | 7 years minimum |

### Audit Requirements

Configurable audit settings:
- **Frequency**: `continuous`, `daily`, `weekly`, `monthly`, `quarterly`
- **Scope**: Access logs, financial transactions, content changes, policy changes, role changes, security events
- **Automation**: Automated or manual audit triggers
- **Alerts**: Tiered alerts with notification channels

### Governance Event Logging

Phase 18 adds new audit event types:

**Policy Events:**
- `policy_created`
- `policy_updated`
- `policy_activated`
- `policy_suspended`
- `policy_deprecated`
- `policy_violation_detected`
- `compliance_check_passed`
- `compliance_check_failed`

**Access Control Events:**
- `role_assigned`
- `role_revoked`
- `permission_granted`
- `permission_revoked`
- `mfa_enabled`
- `mfa_disabled`
- `sensitive_action_attempted`

**Audit Events:**
- `audit_started`
- `audit_completed`

## Next Steps

1. Integrate governance APIs into control panel backend
2. Add Airtable sync for governance records
3. Configure Make.com scenarios for automated governance
4. Build dashboard views for governance monitoring
5. Train operators on governance workflows
6. Implement contributor marketplace (see `Docs/contributor_marketplace.md`)

---

*Version: 2.0*
*Phases: 14 (Governance Layer) + 18 (Governance Scaling)*
*Last Updated: November 2025*
