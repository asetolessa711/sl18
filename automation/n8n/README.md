# n8n Automation Notes

This folder stores optional n8n workflows for teams that prefer self-hosted automation instead of Make.com.

## Quickstart
1. Deploy n8n via Docker or n8n.cloud.
2. Create credentials for Airtable, Google Drive, ElevenLabs (HTTP), and YouTube/Meta (HTTP).
3. Import the workflow JSON from `sl18_n8n_workflow.json` (to be created once Make.com scenario is stable).
4. Reuse the same environment variables defined in `.env.example`.

## Workflow Outline
- **Trigger**: Cron 09:00 Africa/Addis_Ababa.
- **HTTP Node**: Fetch planned Airtable row.
- **Function Node**: Map persona details (paste-in snippet `automation/n8n/persona_mapper.js`).
- **HTTP Nodes**: OpenAI, ElevenLabs, Mubert, CapCut.
- **Drive Node**: Upload outputs to `/SL18` folders.
- **Fallback Branch**: Post evergreen clip if main branch errors.

## Status
- Pending initial implementation. Mirror Make.com modules before activating.
