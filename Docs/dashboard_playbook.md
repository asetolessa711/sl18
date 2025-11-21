# Dashboards Playbook — Franchise Onboarding & Revenue Sharing

## Purpose
- Give operators and partners a clear view of onboarding progress, launch readiness, and revenue share calculations.
- Leverage the existing Airtable base (`SL18 Calendar`) and automation outputs to feed reporting tools such as Airtable Interfaces, Power BI, or Looker Studio.

## Data Sources
- **Airtable `Franchises` table**: franchise metadata, onboarding checklist status, revenue split percentages, contact info, Drive folder IDs.
- **Airtable `Episodes` table**: publish status, platform IDs, metrics outputs, last sync timestamps.
- **Docs/episodes.csv**: GitHub-synced snapshot for downstream BI or backup.
- **Docs/franchises.csv**: matching CSV for quick import into BI tools.
- **Automation logs** (`/SL18/06_logs/issues_YYYYMM.csv`): manual interventions or escalations to surface in dashboards.

## Dashboard Stack Options
- **Airtable Interfaces**: Fastest for operators already using the base. Build multi-page interface with tabs for onboarding and revenue.
- **Power BI / Looker Studio**: Suitable when stakeholders need richer visuals or cross-tool rollups. Connect via Airtable API or use CSV exports committed in GitHub.
- **Teams/SharePoint Lists + Power Automate**: Alternative when enterprise governance requires Microsoft-native tooling.

## Global & Franchise Perspectives
- **Global Ops Dashboard**: Consolidate all franchises to monitor daily releases, backlog, and aggregate revenue. Include filters by `language`, `country`, and `franchise_id` so you can drill down quickly during ops reviews.
- **Franchise Micro Dashboards**: Create franchise-scoped views or embedded dashboards that only surface that partner's pipeline, publish cadence, and revenue share. Share links via the human review workspace or partner portal.
- **Implementation Notes**
   - Use Airtable Interface permissions or BI row-level security to restrict franchise dashboards to the relevant partner.
   - Mirror filters (date range, persona, platform) between global and franchise experiences so metrics stay comparable.
   - Archive digest exports per franchise in `/SL18/06_logs/analytics_exports/<franchise>/` to back up shared metrics.

## Release Monitoring Dashboard
1. **Core Metrics**
   - Daily/weekly release count by franchise, persona, and platform.
   - Pipeline health (counts of `planned`, `render_ready`, `published`, `needs_review`).
   - Upcoming scheduled slots vs filled content (`Episodes` publish date vs assigned persona).
2. **Visuals**
   - Calendar or timeline view showing planned release windows across time zones.
   - Stacked bar chart of releases per platform to spot under-served channels.
   - Alert list for overdue statuses (e.g., `planned` older than two days) with franchise tags.
3. **Automation Hooks**
   - Extend Make.com publish scenario to log completion timestamps (`published_at_<platform>`) for dashboard consumption.
   - Airtable automation posts to human review workspace when a franchise misses a release SLA.
   - Track manual overrides (e.g., emergency uploads) via checkbox fields so deviations appear in dashboards.

## Franchise Onboarding Dashboard
1. **Core KPIs**
   - Onboarding stage (e.g., Prospect → Contract → Assets Ready → Live).
   - Checklist completion (Drive folders provisioned, personas configured, API keys verified).
   - Target launch date vs actual.
2. **Recommended Views**
   - **Pipeline Kanban** by `status` from `Franchises` table.
   - **Checklist grid** with boolean fields (`drive_scripts_id`, `make_webhook_secret`, `capcut.template_id`) surfaced as progress bars.
   - **Alerts** for missing personas (lookups into `Personas` table) or automation blockers logged in `/SL18/06_logs`.
3. **Implementation Notes**
   - Add onboarding checklist fields to `Franchises` table (e.g., `assets_ready`, `make_configured`, `pilot_episode_done`).
   - Create Airtable automation to ping Slack/Teams when a franchise remains in a stage beyond SLA (e.g., >7 days).
   - Surface creative brief links from `/SL18/06_logs/review_workspace` for each franchise.

## Revenue Sharing Dashboard
1. **Core Metrics**
   - Platform plays/views (`yt_views`, `meta_plays`, `tiktok_views`) per franchise and time period.
   - Estimated revenue (views × CPM or platform payout) using the revenue split defined in `franchises.csv`.
   - Payment status fields (`invoice_sent`, `paid_date`) to track remittances.
2. **Data Modeling**
   - Add calculated fields in Airtable or BI tool: `gross_revenue`, `partner_share`, `central_share`.
   - Use `Episodes` publish date to aggregate by week/month; cross-filter by persona or platform.
3. **Visuals**
   - Time-series chart of plays vs revenue per franchise.
   - Table showing top-performing episodes with share amounts.
   - Alert banner for franchises exceeding threshold (e.g., `alert_threshold_views` from config template).
4. **Automation Hooks**
   - Extend `sl18_analytics_blueprint.json` to write latest revenue estimate into `Episodes` or a new `Revenue` table.
   - Notify finance via email when partner share crosses payout threshold.

## Implementation Steps
1. **Extend Airtable Schema**
   - Add onboarding checklist and finance fields to `Franchises` table.
   - Add `gross_revenue`, `partner_share`, `central_share`, `invoice_status` to `Episodes` or a new revenue table.
2. **Build Interface / Report**
   - Airtable Interface: create pages `Onboarding`, `Revenue`, `Issues` pulling from the respective tables.
   - BI Tool: connect to Airtable API or CSV snapshots, build data model, publish dashboards, and schedule refresh.
3. **Access & Sharing**
   - Set audience-specific views (central ops vs franchise partners) with filtered data or embedded dashboards.
   - Document access instructions in `Docs/franchise_playbook.md` and share links via human review workspace channel.
4. **Maintenance**
   - Review dashboards during weekly retro; ensure metrics align with automation outputs.
   - Update revenue assumptions and thresholds quarterly.
   - Archive historical dashboards annually to keep workspace lean.

## Next Actions
- Decide on the primary dashboard platform (Airtable Interfaces vs external BI).
- Update Airtable schema to include the checklist, release monitoring, and revenue fields.
- Prototype both a global operations dashboard and a franchise-scoped dashboard filtered by `franchise_id` and `language`.
- Integrate dashboard links into the human review workspace, franchise onboarding SOP, and partner communications.
