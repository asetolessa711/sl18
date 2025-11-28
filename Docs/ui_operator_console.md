# SL18 Operator Console Guide

This guide covers the unified operator console interface for SL18, providing access to all backend features across Phases 1-20.

## Overview

The SL18 Operator Console is a comprehensive interface that surfaces:
- **Observability** - Multi-franchise dashboards, anomaly detection, alerts
- **Multilingual Controls** - Language selection, registry browser, QC integration
- **Series & Hybrid Workspaces** - Episode arcs, continuity tracking, cross-format publishing
- **Governance** - Role management, policy enforcement, audit trails
- **Marketplace** - Contributor listings, onboarding, revenue splits
- **Partner Integrations** - API management, compliance workflows, syndication
- **Personalization** - Viewer profiles, adaptive rendering, recommendations
- **Monetization** - Tier management, pricing controls, retention actions
- **Audience Insights** - Engagement metrics, sentiment, retention curves, demographics

## Console Architecture

### Global Navigation

The console provides a unified navigation structure:

```
┌─────────────────────────────────────────────────────────────────┐
│ SL18 Operator Console                         [🔔 Alerts] [👤]  │
├─────────┬───────────────────────────────────────────────────────┤
│         │                                                       │
│ 📊 Dash │    Context: Franchise-Kenya / English / Africa        │
│ 🏢 Fran │  ──────────────────────────────────────────────────   │
│ 📺 Seri │                                                       │
│ 👥 Pers │    [Dashboard Content Area]                           │
│ 🌐 Lang │                                                       │
│ 📡 Dist │    KPIs | Charts | Tables | Alerts                    │
│ 🤝 Part │                                                       │
│ 🛒 Mark │                                                       │
│ 🛡️ Gove │                                                       │
│ 🎯 Pers │                                                       │
│ 💰 Mone │                                                       │
│ 📈 Insi │                                                       │
│ ⚠️ Aler │                                                       │
│ ⚙️ Sett │                                                       │
│         │                                                       │
└─────────┴───────────────────────────────────────────────────────┘
```

### Context Bar

The context bar shows:
- **Current Franchise** - Selected franchise context
- **Language** - Primary operating language
- **Region** - Geographic context for compliance/localization
- **Role** - Current operator role and permissions

### Quick Actions

- `Ctrl+K` - Command palette for quick navigation
- `Ctrl+N` - New episode/content creation
- `Ctrl+/` - Help and documentation

## Module Reference

### 1. Dashboard (📊)

**Purpose**: Unified overview of all SL18 operations

**Features**:
- Multi-franchise KPIs
- Real-time alerts summary
- Revenue, engagement, QC status at a glance
- Customizable widget layout

**Configuration**:
```json
{
  "dashboardId": "dash-main-overview",
  "type": "overview",
  "kpis": [
    { "metric": "total_revenue", "format": "currency" },
    { "metric": "active_franchises", "format": "count" },
    { "metric": "qc_pass_rate", "format": "percent" },
    { "metric": "engagement_rate", "format": "percent" }
  ]
}
```

### 2. Franchises (🏢)

**Purpose**: Franchise hub for managing all registered franchises

**Features**:
- Franchise list with status indicators
- Registration workflow management
- Agreement tracking
- Revenue ledger access

### 3. Series & Episodes (📺)

**Purpose**: Series workspace with episode management

**Features**:
- Episode timeline view
- Persona continuity tracker
- Plot thread management (active/resolved/abandoned)
- Cross-format QC dashboard

**Continuity Tracking**:
```
Episode 1 → Episode 2 → Episode 3 → Episode 4
    ↓           ↓           ↓           ↓
  Persona     Check       Check       Check
  Profile   Continuity  Continuity  Continuity
```

### 4. Language Controls (🌐)

**Purpose**: Multilingual workspace configuration

**Features**:
- Language selection panel with search
- Primary/secondary language toggle
- Registry browser for all supported languages
- Preview-before-publish for subtitles/captions
- Side-by-side QC comparison

**Supported Languages**:
| Code | Language | Direction | Script |
|------|----------|-----------|--------|
| en | English | LTR | Latin |
| fr | French | LTR | Latin |
| es | Spanish | LTR | Latin |
| ar | Arabic | RTL | Arabic |
| zh-CN | Chinese | LTR | Han |
| it | Italian | LTR | Latin |
| om | Oromifa | LTR | Latin |
| am | Amharic | LTR | Ethiopic |
| sw | Kiswahili | LTR | Latin |

### 5. Distribution (📡)

**Purpose**: Global distribution pipeline management

**Features**:
- Channel configuration (YouTube, TikTok, Spotify, etc.)
- Syndication feed management
- Regional compliance settings
- Distribution analytics

**Channel Types**:
- Streaming platforms
- Broadcasters (TV, Radio, OTT)
- Social media integrations

### 6. Partners (🤝)

**Purpose**: Partner integration console

**Features**:
- API key management with rotation
- Compliance workflow tracking
- Syndication feed previews
- Health monitoring (uptime, latency, errors)

**Integration Types**:
- Payment providers
- Distribution partners
- Analytics partners
- CDN providers
- Translation services

### 7. Marketplace (🛒)

**Purpose**: Contributor marketplace portal

**Features**:
- Contributor listings (grid/list view)
- Onboarding wizard
- Revenue split configuration
- QC badges and certifications

**Onboarding Steps**:
1. Profile creation
2. Skills assessment
3. Portfolio upload
4. Identity verification
5. Agreement signing
6. Pricing configuration

### 8. Governance (🛡️)

**Purpose**: Governance and compliance console

**Features**:
- Role assignment and management
- Policy creation and enforcement
- Audit trail viewer with export
- MFA settings and enforcement

**Roles**:
| Role | Description |
|------|-------------|
| viewer | Read-only access |
| operator | Day-to-day operations |
| reviewer | QC and approval authority |
| contributor | Content creation |
| auditor | Compliance monitoring |
| admin | Full configuration access |
| super_admin | System-wide authority |

### 9. Personalization (🎯)

**Purpose**: AI-driven personalization controls

**Features**:
- Viewer profile simulator
- Adaptive rendering preview
- QC enforcement panel
- Recommendation engine visualization

**Simulator Fields**:
- Language preference
- Region/locale
- Genre affinity
- Engagement history
- Content preferences

### 10. Monetization (💰)

**Purpose**: Pricing and subscription management

**Features**:
- Tier management (free, basic, premium, vip, enterprise)
- Pricing previews with regional adjustments
- Retention action triggers
- Revenue analytics and conversion funnels

**Price Models**:
- Subscription
- Pay-per-view
- Freemium
- Ad-supported
- Hybrid

### 11. Insights (📈)

**Purpose**: Audience insights and feedback loops

**Features**:
- Engagement charts (watch time, likes, shares, comments)
- Sentiment analysis with cultural reactions
- Retention curves with drop-off detection
- Demographic breakdowns

**Feedback Loop Triggers**:
- Engagement threshold breaches
- Sentiment changes
- Retention drops
- Churn risk detection
- Cultural sensitivity issues

### 12. Alerts (⚠️)

**Purpose**: Alert center for all notifications

**Features**:
- Tiered alerts (info, warning, critical)
- Acknowledgment workflow
- Resolution tracking
- Operator notes

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Command palette |
| `Ctrl+N` | New content |
| `Ctrl+/` | Help |
| `Ctrl+R` | Refresh |
| `Ctrl+F` | Search |
| `Esc` | Close modal/drawer |

## Permissions Reference

| Permission | Description |
|------------|-------------|
| `view:dashboard` | View dashboard |
| `manage:franchises` | Manage franchise settings |
| `manage:languages` | Configure languages |
| `manage:distribution` | Configure distribution channels |
| `manage:partners` | Manage partner integrations |
| `manage:marketplace` | Manage marketplace listings |
| `manage:governance` | Manage policies and roles |
| `manage:monetization` | Configure pricing and tiers |
| `view:insights` | View audience insights |
| `manage:alerts` | Acknowledge and resolve alerts |

## Customization

### Dashboard Widgets

Operators can customize their dashboard with widgets:

```json
{
  "widgetId": "widget-revenue-chart",
  "widgetType": "chart_line",
  "title": "Revenue Trend",
  "dataSource": "revenue",
  "position": { "row": 0, "col": 0, "width": 6, "height": 2 },
  "refreshInterval": 60
}
```

### Theme Options

- Light mode
- Dark mode
- System preference

### Layout Density

- Compact
- Normal
- Comfortable

## Troubleshooting

### Common Issues

1. **Dashboard not loading**
   - Check network connectivity
   - Verify API endpoint status
   - Clear browser cache

2. **Permissions denied**
   - Verify role assignment
   - Check policy requirements
   - Contact administrator

3. **Language pack not available**
   - Check registry status
   - Verify language code
   - Ensure QC rules are configured

## Related Documentation

- [Globalization & Monetization](./globalization_monetization.md)
- [Language Selection](./language_selection.md)
- [Observability](./observability.md)
- [Hybrid Formats](./hybrid_formats.md)
- [Personalization](./personalization.md)
- [Adaptive Monetization](./adaptive_monetization.md)
- [Governance](./governance.md)
- [Contributor Marketplace](./contributor_marketplace.md)
- [Distribution](./distribution.md)
- [Partner Integrations](./partner_integrations.md)
- [Audience Insights](./audience_insights.md)
- [Feedback Loops](./feedback_loops.md)
