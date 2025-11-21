# AI Role and Governance

## Purpose
Clarify how AI systems participate in each workstream, what decisions remain human-owned, and how the platform maintains accountability while operating with minimal human staff.

## Platform Principles
- **Automation-first, human-safe**: AI handles repetitive generation, publishing, and analytics while humans focus on cultural judgment and escalation.
- **Transparency**: Every AI action leaves an audit trail in Airtable, Make.com run history, or `/SL18/06_logs/`.
- **Reversible operations**: Critical steps (publishing, persona tone changes, revenue adjustments) can be paused or rolled back by the operator.
- **Continuous tuning**: Feedback from QC and analytics loops feeds prompt, persona, and pipeline refinements.

## Role by Workstream

### Workstream 1 - Core Infrastructure Setup
- **AI Responsibilities**: Provide checklists, setup guidance, and validation tips to accelerate manual configuration.
- **Human Responsibilities**: Execute environment setup, validate Airtable schema, provision Drive hierarchy, create initial persona briefs.
- **Guardrails**: Baseline configuration documented before automation is enabled.

### Workstream 2 - Automated Asset Pipeline
- **AI Responsibilities**: Generate scripts (LLM), synthesize voice (TTS), compose music stems, assemble CapCut projects via automation.
- **Human Responsibilities**: Choose pilot episodes, review AI outputs for tone and cultural alignment, approve or edit final assets, log adjustments.
- **Guardrails**: QC checklist in human review workspace; automation run logs retained; manual override path via Airtable status changes.

### Workstream 3 - Publishing and Analytics Reliability
- **AI Responsibilities**: Upload finalized assets to each platform, capture returned media IDs, fetch daily performance metrics, send digest notifications.
- **Human Responsibilities**: Schedule test runs, monitor alerts, validate metrics accuracy, rotate tokens, and adjudicate escalations (policy violations, platform strikes).
- **Guardrails**: Error notifications with context, SLA for manual intervention, analytics exports archived for audit.

### Workstream 4 - Franchise Enablement
- **AI Responsibilities**: Scale the established asset and publishing pipelines to new franchises using localized prompts and credentials.
- **Human Responsibilities**: Vet franchise partners, localize persona briefs, conduct training, own compliance decisions, and track revenue agreements.
- **Guardrails**: Franchise onboarding checklist, localized creative briefs, escalation protocol for cultural or legal issues.

## Ownership Matrix (RACI)
| Function | AI Role | Human Operator |
| --- | --- | --- |
| Script drafting | Responsible | Accountable for sign-off |
| Voice synthesis | Responsible | Consulted for pronunciation fixes |
| Music generation | Responsible | Consulted for tone adjustments |
| CapCut assembly | Responsible | Informed, final approval |
| Publishing | Responsible | Accountable to pause/override |
| Analytics sync | Responsible | Accountable to validate anomalies |
| Persona updates | Informed | Responsible |
| Franchise onboarding | Informed | Responsible |

## Escalation and Overrides
- **Pause automation**: Toggle Airtable status fields or disable Make.com scenarios when manual review is required.
- **Issue logging**: Use `/SL18/06_logs/issues_YYYYMM.csv` with tags (`script`, `tts`, `music`, `publish`, `analytics`) for traceability.
- **Critical incidents**: Document context in the human review workspace and notify stakeholders via the agreed escalation channel.
- **Rollback**: Keep template and persona revisions versioned in Drive to revert if an AI change fails QC.

## Continuous Improvement Loop
1. **Feedback capture**: QC notes, analytics deltas, and partner feedback logged daily.
2. **Prompt and persona tuning**: Update `prompts/` and persona briefs based on observed gaps.
3. **Automation refinement**: Adjust Make.com scenario branches, retry logic, and notifications as new patterns emerge.
4. **Review cadence**: Conduct weekly retros covering AI performance, escalation volume, and roadmap items.

## Integration Touchpoints
- Reference `Docs/workstream_1_core_infrastructure.md` through `Docs/workstream_4_franchise_enablement.md` for detailed checklists that tie back to these AI roles.
- Align dashboard metrics (see `Docs/dashboard_playbook.md`) with AI-generated outputs to ensure franchise partners see transparent results.

## Next Steps
- Embed this AI role summary in onboarding materials for future collaborators.
- Review guardrails quarterly to align with platform policy changes or expansion plans.
- Expand the ownership matrix as additional automation components or team roles are introduced.
