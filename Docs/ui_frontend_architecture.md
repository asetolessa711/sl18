# SL18 Frontend Architecture Guide

This guide documents the frontend architecture for the SL18 operator console, covering component structure, state management, and integration patterns.

## Architecture Overview

The SL18 frontend is built with:
- **React 18** - Component framework
- **TypeScript** - Type safety
- **React Router** - Navigation
- **Vite** - Build tooling

## Component Structure

```
src/
├── components/
│   ├── common/           # Shared components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Footer.tsx
│   │   ├── AlertDrawer.tsx
│   │   └── Placeholder.tsx
│   ├── dashboard/        # Dashboard components
│   │   ├── KpiCard.tsx
│   │   ├── ChartWidget.tsx
│   │   └── AlertSummary.tsx
│   ├── language/         # Language controls
│   │   ├── LanguageSelector.tsx
│   │   ├── RegistryBrowser.tsx
│   │   └── QcComparison.tsx
│   ├── series/           # Series workspace
│   │   ├── EpisodeTimeline.tsx
│   │   ├── ContinuityTracker.tsx
│   │   └── PlotThreads.tsx
│   ├── governance/       # Governance console
│   │   ├── RoleManager.tsx
│   │   ├── PolicyList.tsx
│   │   └── AuditTrail.tsx
│   ├── marketplace/      # Marketplace portal
│   │   ├── ListingsGrid.tsx
│   │   ├── OnboardingWizard.tsx
│   │   └── RevenueSplit.tsx
│   ├── partners/         # Partner integrations
│   │   ├── ApiKeyManager.tsx
│   │   ├── ComplianceStatus.tsx
│   │   └── HealthMonitor.tsx
│   ├── personalization/  # Personalization UI
│   │   ├── ProfileSimulator.tsx
│   │   ├── RenderingPreview.tsx
│   │   └── RecommendationView.tsx
│   ├── monetization/     # Monetization controls
│   │   ├── TierManager.tsx
│   │   ├── PricingPreview.tsx
│   │   └── RetentionActions.tsx
│   └── insights/         # Audience insights
│       ├── EngagementChart.tsx
│       ├── SentimentView.tsx
│       ├── RetentionCurve.tsx
│       └── DemographicBreakdown.tsx
├── views/                # Page-level components
│   ├── Dashboard.tsx
│   ├── Languages.tsx
│   ├── Series.tsx
│   ├── Governance.tsx
│   ├── Marketplace.tsx
│   ├── Partners.tsx
│   ├── Personalization.tsx
│   ├── Monetization.tsx
│   ├── Insights.tsx
│   └── Alerts.tsx
├── hooks/                # Custom hooks
│   ├── useCredentialStatus.ts
│   ├── useAlerts.ts
│   ├── useFranchise.ts
│   └── useLanguage.ts
├── context/              # React context
│   ├── CredentialStatusContext.tsx
│   ├── FranchiseContext.tsx
│   └── LanguageContext.tsx
├── types/                # TypeScript types
│   └── index.ts
├── utils/                # Utilities
│   ├── api.ts
│   ├── formatters.ts
│   └── validators.ts
├── styles.css            # Global styles
└── main.tsx              # App entry point
```

## Panel Components

### Language Selection Panel

```tsx
interface LanguageSelectionPanelProps {
  selectedLanguages: string[];
  primaryLanguage: string;
  onLanguageChange: (languages: string[]) => void;
  onPrimaryChange: (language: string) => void;
  showQcStatus?: boolean;
}

const LanguageSelectionPanel: React.FC<LanguageSelectionPanelProps> = ({
  selectedLanguages,
  primaryLanguage,
  onLanguageChange,
  onPrimaryChange,
  showQcStatus = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [registry, setRegistry] = useState<LanguagePack[]>([]);

  // Filter languages by search term
  const filteredLanguages = useMemo(() => {
    if (!searchTerm) return registry;
    const term = searchTerm.toLowerCase();
    return registry.filter(lang =>
      lang.code.toLowerCase().includes(term) ||
      lang.displayName.toLowerCase().includes(term) ||
      lang.nativeName.toLowerCase().includes(term)
    );
  }, [registry, searchTerm]);

  return (
    <div className="language-panel">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search languages..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <div className="language-list">
        {filteredLanguages.map(lang => (
          <LanguageItem
            key={lang.code}
            language={lang}
            selected={selectedLanguages.includes(lang.code)}
            isPrimary={primaryLanguage === lang.code}
            showQcStatus={showQcStatus}
            onSelect={() => handleSelect(lang.code)}
            onSetPrimary={() => onPrimaryChange(lang.code)}
          />
        ))}
      </div>
    </div>
  );
};
```

### Series Workspace Panel

```tsx
interface SeriesWorkspacePanelProps {
  seriesId: string;
  episodes: Episode[];
  personaProfiles: PersonaProfile[];
  plotThreads: PlotThread[];
}

const SeriesWorkspacePanel: React.FC<SeriesWorkspacePanelProps> = ({
  seriesId,
  episodes,
  personaProfiles,
  plotThreads
}) => {
  return (
    <div className="series-workspace">
      <EpisodeTimeline episodes={episodes} />
      <ContinuityTracker
        episodes={episodes}
        personas={personaProfiles}
      />
      <PlotThreadTracker threads={plotThreads} />
      <CrossFormatQcDashboard seriesId={seriesId} />
    </div>
  );
};
```

### Governance Console Panel

```tsx
interface GovernanceConsolePanelProps {
  policies: GovernancePolicy[];
  roles: Role[];
  auditLogs: AuditLogEntry[];
}

const GovernanceConsolePanel: React.FC<GovernanceConsolePanelProps> = ({
  policies,
  roles,
  auditLogs
}) => {
  const [activeTab, setActiveTab] = useState<'roles' | 'policies' | 'audit'>('roles');

  return (
    <div className="governance-console">
      <TabBar
        tabs={[
          { id: 'roles', label: 'Role Management' },
          { id: 'policies', label: 'Policies' },
          { id: 'audit', label: 'Audit Trail' }
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />
      {activeTab === 'roles' && <RoleManager roles={roles} />}
      {activeTab === 'policies' && <PolicyList policies={policies} />}
      {activeTab === 'audit' && <AuditTrailViewer logs={auditLogs} />}
    </div>
  );
};
```

### Insights Dashboard Panel

```tsx
interface InsightsDashboardPanelProps {
  insights: AudienceInsights;
  feedbackLoops: FeedbackLoop[];
  timeRange: TimeRange;
}

const InsightsDashboardPanel: React.FC<InsightsDashboardPanelProps> = ({
  insights,
  feedbackLoops,
  timeRange
}) => {
  return (
    <div className="insights-dashboard">
      <section className="engagement-section">
        <h3>Engagement Metrics</h3>
        <EngagementChart data={insights.engagement} />
      </section>
      <section className="sentiment-section">
        <h3>Sentiment Analysis</h3>
        <SentimentView data={insights.sentiment} />
      </section>
      <section className="retention-section">
        <h3>Retention Curves</h3>
        <RetentionCurve data={insights.retention} />
      </section>
      <section className="demographics-section">
        <h3>Demographics</h3>
        <DemographicBreakdown data={insights.demographics} />
      </section>
      <section className="feedback-section">
        <h3>Feedback Loops</h3>
        <FeedbackLoopMonitor loops={feedbackLoops} />
      </section>
    </div>
  );
};
```

## State Management

### Context Providers

```tsx
// Franchise Context
interface FranchiseContextValue {
  currentFranchise: Franchise | null;
  setCurrentFranchise: (franchise: Franchise | null) => void;
  franchises: Franchise[];
  loading: boolean;
  error: string | null;
}

const FranchiseContext = createContext<FranchiseContextValue | null>(null);

// Language Context
interface LanguageContextValue {
  selectedLanguages: string[];
  primaryLanguage: string;
  setSelectedLanguages: (languages: string[]) => void;
  setPrimaryLanguage: (language: string) => void;
  registry: LanguagePack[];
}

const LanguageContext = createContext<LanguageContextValue | null>(null);
```

### Custom Hooks

```tsx
// useAlerts hook
function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/alerts');
      const data = await response.json();
      setAlerts(data.alerts);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const acknowledgeAlert = useCallback(async (id: string) => {
    await fetch('/api/alerts/ack', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, actor: 'Operator' })
    });
    await fetchAlerts();
  }, [fetchAlerts]);

  const resolveAlert = useCallback(async (id: string) => {
    await fetch('/api/alerts/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, actor: 'Operator' })
    });
    await fetchAlerts();
  }, [fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    fetchAlerts,
    acknowledgeAlert,
    resolveAlert
  };
}
```

## API Integration

### API Client

```tsx
// api.ts
const API_BASE = '/api';

export async function fetchDashboard(scope?: DashboardScope): Promise<DashboardData> {
  const params = new URLSearchParams();
  if (scope?.franchiseId) params.set('franchise', scope.franchiseId);
  if (scope?.region) params.set('region', scope.region);
  if (scope?.language) params.set('language', scope.language);
  
  const response = await fetch(`${API_BASE}/dashboard?${params}`);
  if (!response.ok) throw new Error('Failed to fetch dashboard');
  return response.json();
}

export async function fetchInsights(insightId: string): Promise<AudienceInsights> {
  const response = await fetch(`${API_BASE}/insights/${insightId}`);
  if (!response.ok) throw new Error('Failed to fetch insights');
  return response.json();
}

export async function triggerFeedbackLoop(loopId: string, action: FeedbackAction): Promise<void> {
  const response = await fetch(`${API_BASE}/feedback-loops/${loopId}/trigger`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(action)
  });
  if (!response.ok) throw new Error('Failed to trigger feedback loop');
}
```

## Styling

### CSS Variables

```css
:root {
  /* Colors */
  --color-primary: #4f46e5;
  --color-secondary: #6b7280;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
  --color-info: #3b82f6;
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  
  /* Typography */
  --font-sans: system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Layout */
  --sidebar-width: 240px;
  --header-height: 64px;
  --footer-height: 48px;
}
```

### Component Classes

```css
/* Panel container */
.panel {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

/* KPI card */
.kpi-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--color-surface-elevated);
  border-radius: var(--radius-sm);
}

.kpi-card .value {
  font-size: 2rem;
  font-weight: 600;
}

.kpi-card .trend {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 0.875rem;
}

.kpi-card .trend.up { color: var(--color-success); }
.kpi-card .trend.down { color: var(--color-error); }
```

## Testing

### Component Testing

```tsx
// LanguageSelector.test.tsx
describe('LanguageSelector', () => {
  it('filters languages by search term', () => {
    const { getByPlaceholder, queryByText } = render(
      <LanguageSelector
        selectedLanguages={[]}
        onLanguageChange={() => {}}
      />
    );
    
    const searchInput = getByPlaceholder('Search languages...');
    fireEvent.change(searchInput, { target: { value: 'italian' } });
    
    expect(queryByText('Italian')).toBeInTheDocument();
    expect(queryByText('French')).not.toBeInTheDocument();
  });

  it('allows setting primary language', () => {
    const onPrimaryChange = jest.fn();
    const { getByText } = render(
      <LanguageSelector
        selectedLanguages={['en', 'fr']}
        primaryLanguage="en"
        onLanguageChange={() => {}}
        onPrimaryChange={onPrimaryChange}
      />
    );
    
    fireEvent.click(getByText('Set as Primary'));
    expect(onPrimaryChange).toHaveBeenCalledWith('fr');
  });
});
```

## Accessibility

### ARIA Labels

```tsx
<nav aria-label="Primary navigation">
  <ul role="menubar">
    <li role="none">
      <NavLink role="menuitem" to="/dashboard">Dashboard</NavLink>
    </li>
    <li role="none">
      <NavLink role="menuitem" to="/languages">Languages</NavLink>
    </li>
  </ul>
</nav>
```

### Keyboard Navigation

```tsx
function useKeyboardNavigation(items: string[], onSelect: (item: string) => void) {
  const [focusIndex, setFocusIndex] = useState(0);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        setFocusIndex(i => Math.min(i + 1, items.length - 1));
        break;
      case 'ArrowUp':
        setFocusIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        onSelect(items[focusIndex]);
        break;
    }
  }, [items, focusIndex, onSelect]);

  return { focusIndex, handleKeyDown };
}
```

## Related Documentation

- [Operator Console Guide](./ui_operator_console.md)
- [Globalization & Monetization](./globalization_monetization.md)
- [Observability](./observability.md)
- [Audience Insights](./audience_insights.md)
