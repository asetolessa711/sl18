// Airtable Automation script to export the Episodes table to CSV and push it to GitHub.
// Configure the automation with input variables (Settings > Input variables):
//  - githubToken  : GitHub personal access token (classic, repo scope) stored as a secret.
//  - repoOwner    : GitHub account or organization that owns the repo.
//  - repoName     : Repository name.
//  - targetPath   : Path for the CSV (e.g. "Docs/episodes.csv").
//  - branch       : Target branch (defaults to "main" if omitted).
//  - viewName     : Optional Airtable view to filter records (defaults to "Grid view").
// The script will validate the table schema for required fields, serialize the records as CSV,
// and upsert the file in GitHub using the Contents API. If the file already exists, it will be
// replaced in-place; otherwise it will be created.

const {
    githubToken,
    repoOwner,
    repoName,
    targetPath,
    branch = "main",
    viewName = "Grid view"
} = input.config();

function assertConfig(value, name) {
    if (!value) {
        throw new Error(`Missing required input variable: ${name}`);
    }
}

assertConfig(githubToken, "githubToken");
assertConfig(repoOwner, "repoOwner");
assertConfig(repoName, "repoName");
assertConfig(targetPath, "targetPath");

const table = base.getTable("Episodes");
const driveFieldNames = [
    "drive_scripts_id",
    "drive_audio_id",
    "drive_music_id",
    "drive_video_id",
    "drive_captions_id"
];

const orderedFields = [
    "episode_id",
    "date",
    "persona_code",
    "franchise_id",
    "theme",
    "hook",
    "melody_reference",
    "script_file",
    "tts_file",
    "music_file",
    "video_file",
    "caption_file",
    "publish_url",
    "youtube_video_id",
    "meta_ig_media_id",
    "meta_fb_post_id",
    "tiktok_video_id",
    "tiktok_enabled",
    "tiktok_export_ready",
    "tiktok_export_path",
    "tiktok_post_status",
    "tiktok_posted_at",
    "tiktok_posted_by",
    "tiktok_post_url",
    "tiktok_notes",
    "drive_scripts_id",
    "drive_audio_id",
    "drive_music_id",
    "drive_video_id",
    "drive_captions_id",
    "franchise_owner_email",
    "yt_views",
    "meta_plays",
    "tiktok_views",
    "last_metrics_sync",
    "status",
    "notes"
];

// Ensure every expected field exists; capture the Airtable field objects.
const airtableFields = {};
const missingFields = [];
for (const fieldName of orderedFields) {
    const field = table.getFieldIfExists(fieldName);
    if (!field) {
        missingFields.push(fieldName);
    } else {
        airtableFields[fieldName] = field;
    }
}

if (missingFields.length > 0) {
    throw new Error(`Missing required fields in Episodes table: ${missingFields.join(", ")}`);
}

// Drive ID columns should be simple text fields so imports and exports stay consistent.
for (const name of driveFieldNames) {
    const field = airtableFields[name];
    if (field.type !== "singleLineText") {
        await table.updateFieldAsync(field, { type: "singleLineText" });
    }
}

const view = table.getView(viewName);
const query = await view.selectRecordsAsync({ fields: Object.values(airtableFields) });

function escapeCsv(value) {
    if (value === null || value === undefined) {
        return "";
    }
    const stringValue = `${value}`;
    if (stringValue.includes("\"") || stringValue.includes(",") || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
}

function extractCellValue(record, field) {
    const raw = record.getCellValue(field);
    if (raw === null || raw === undefined) {
        return "";
    }
    switch (field.type) {
        case "multipleAttachments":
            return raw.map((attachment) => attachment.url).join("; ");
        case "singleSelect":
            return raw?.name ?? "";
        case "multipleSelects":
            return raw.map((choice) => choice.name).join("; ");
        case "singleCollaborator":
        case "multipleCollaborators":
            return record.getCellValueAsString(field);
        default:
            return record.getCellValueAsString(field);
    }
}

const headerRow = orderedFields.join(",");
const dataRows = [];
for (const record of query.records) {
    const values = orderedFields.map((fieldName) => {
        const field = airtableFields[fieldName];
        const extracted = extractCellValue(record, field);
        return escapeCsv(extracted);
    });
    dataRows.push(values.join(","));
}

const csvContent = [headerRow, ...dataRows].join("\n");

function toBase64(utf8String) {
    const utf8Bytes = new TextEncoder().encode(utf8String);
    let binary = "";
    for (const byte of utf8Bytes) {
        binary += String.fromCharCode(byte);
    }
    return btoa(binary);
}

const encodedContent = toBase64(csvContent);
const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${encodeURI(targetPath)}`;

const commonHeaders = {
    Authorization: `Bearer ${githubToken}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json"
};

let existingSha = null;
const getUrl = `${apiUrl}?ref=${encodeURIComponent(branch)}`;
const getResponse = await fetch(getUrl, { headers: commonHeaders });
if (getResponse.status === 200) {
    const existing = await getResponse.json();
    existingSha = existing.sha;
} else if (getResponse.status !== 404) {
    const text = await getResponse.text();
    throw new Error(`GitHub lookup failed (${getResponse.status}): ${text}`);
}

const commitMessage = `chore: sync episodes export (${new Date().toISOString()})`;
const payload = {
    message: commitMessage,
    branch,
    content: encodedContent
};
if (existingSha) {
    payload.sha = existingSha;
}

const putResponse = await fetch(apiUrl, {
    method: "PUT",
    headers: commonHeaders,
    body: JSON.stringify(payload)
});

if (!putResponse.ok) {
    const text = await putResponse.text();
    throw new Error(`GitHub update failed (${putResponse.status}): ${text}`);
}

output.set("recordsExported", query.records.length);
output.set("targetPath", targetPath);
query.unloadData();
