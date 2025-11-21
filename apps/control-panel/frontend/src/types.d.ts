export interface AirtableRecord {
  id: string;
  createdTime?: string;
  fields: Record<string, any>;
}

export interface DashboardResponse {
  episodes: AirtableRecord[];
  personas: AirtableRecord[];
  fetchedAt: string;
}

export interface CredentialPreview {
  id: string;
  label: string;
  ready: boolean;
  missing: string[];
}

export interface UploadQueueResponse {
  payloadVersion: number;
  records: AirtableRecord[];
  credentials: Record<string, CredentialPreview>;
  fetchedAt: string;
  filter?: {
    franchise: string | null;
  };
}

export interface UploadStatsResponse {
  counts: Record<string, number>;
  fetchedAt: string;
  filter?: {
    franchise: string | null;
  };
}

export interface UploadActivityEntry {
  recordId: string;
  timestamp: string;
  loggedAt: string;
  actor?: string;
  fields: Record<string, unknown>;
  version: number;
}

export interface UploadActivityResponse {
  entries: UploadActivityEntry[];
}

export interface CredentialAlert {
  id: string;
  label: string;
  missing: string[];
}

export interface CredentialStatusResponse {
  credentials: Record<string, CredentialPreview>;
  alerts: CredentialAlert[];
  generatedAt: string;
}

export interface DocsListResponse {
  files: DocSummary[];
  fetchedAt: string;
}

export interface DocSummary {
  id: string;
  title: string;
  filename: string;
}

export interface DocContentResponse {
  id: string;
  content: string;
  fetchedAt: string;
}
