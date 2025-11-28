# SL18 Mobile Operator App Guide

This guide covers the SL18 mobile operator application, enabling operators to manage franchises, monitor system health, acknowledge alerts, and switch languages from mobile devices.

## Overview

The SL18 mobile operator app extends the desktop operator console to iOS and Android devices, providing:

- **Quick Actions**: Language switching, alert acknowledgment, QC approvals
- **Push Notifications**: Real-time alerts for anomalies, QC issues, and cultural sensitivity
- **Offline Mode**: Cached dashboards and queued actions for sync
- **Secure Authentication**: MFA, biometric unlock (FaceID/TouchID)

## Supported Platforms

| Platform | Minimum Version | Biometric Support |
|----------|-----------------|-------------------|
| iOS | 15.0+ | Face ID, Touch ID |
| Android | 11+ | Fingerprint |
| Web Mobile | Modern browsers | N/A |

## Authentication

### Secure Login

The mobile app supports multiple authentication methods:

```json
{
  "authMethod": "sso",
  "mfaEnabled": true,
  "mfaMethod": "biometric",
  "biometricEnabled": true,
  "biometricType": "face_id",
  "autoLockMinutes": 5
}
```

### Biometric Unlock

Once logged in with MFA, operators can enable biometric unlock for quick access:

1. Navigate to **Settings** → **Security**
2. Enable **Biometric Unlock**
3. Authenticate with Face ID or Touch ID

Auto-lock engages after the configured inactivity period (default: 5 minutes).

## Navigation

### Bottom Tab Bar

The mobile app uses a 5-tab bottom navigation:

| Tab | Icon | Description |
|-----|------|-------------|
| Home | 🏠 | Dashboard overview |
| Franchises | 📁 | Franchise list and details |
| Alerts | 🔔 | Alert feed with badge count |
| Insights | 📊 | Audience metrics summary |
| More | ⋯ | Additional panels and settings |

### Quick Actions

Quick actions provide shortcuts for common operations:

- **Switch Language**: Open language selection modal
- **Acknowledge Alert**: Mark an alert as acknowledged (works offline)
- **Search**: Global search across franchises, series, alerts

## Mobile Panels

### Language Selection Panel

Mobile-optimized language switching:

```json
{
  "quickSwitch": {
    "enabled": true,
    "recentLanguages": 3,
    "showFlags": true
  },
  "searchBar": {
    "enabled": true,
    "voiceSearch": false,
    "searchFields": ["code", "displayName", "nativeName"]
  },
  "offlineLanguages": ["en", "sw", "am"]
}
```

**Features**:
- Recent languages for quick access
- Search by code, display name, or native name
- Offline language cache for offline switching
- QC status indicators per language

### Observability Panel

Monitor system health on mobile:

- **Dashboard Cards**: KPI cards, status indicators, trend sparklines
- **Alert Summary**: Critical alerts with swipe-to-acknowledge
- **Anomaly Feed**: Timeline of detected anomalies
- **Incident Viewer**: Root cause analysis and suggested actions

### QC Panel

Quality control actions on the go:

```json
{
  "pendingReviews": {
    "swipeToApprove": true,
    "showPreview": true,
    "batchActions": false
  },
  "languageQc": {
    "showAccuracyScore": true,
    "showPersonaConsistency": true
  }
}
```

**Gestures**:
- Swipe right → Approve
- Swipe left → Reject
- Tap → View details

### Alerts Panel

Real-time alert management:

- Filter by severity (info, warning, critical)
- Filter by type (anomaly, QC, feedback, payment)
- Swipe to acknowledge
- Tap for alert context and suggested actions

### Insights Panel

Audience metrics summary:

- Engagement overview with sparklines
- Sentiment card with emoji indicators
- Retention curve (area chart)
- Demographic breakdown (pie chart)

## Offline Mode

### How It Works

The mobile app caches essential data for offline access:

```json
{
  "cacheConfig": {
    "dashboardsCached": true,
    "recentItemsCached": true,
    "maxCacheSizeMB": 100,
    "cacheExpiryHours": 24,
    "priorityData": ["franchises", "alerts", "qc_status"]
  }
}
```

### Queued Actions

When offline, certain actions are queued for sync:

| Action Type | Offline Support |
|-------------|-----------------|
| Alert Acknowledge | ✅ Yes |
| Language Switch | ✅ Yes |
| QC Approval | ✅ Yes |
| Settings Update | ✅ Yes |
| Marketplace Browse | ❌ No |

### Sync Behavior

```json
{
  "syncConfig": {
    "autoSync": true,
    "syncOnWifiOnly": false,
    "syncIntervalMinutes": 15,
    "backgroundSyncEnabled": true
  }
}
```

- **Auto-sync**: Automatically syncs when back online
- **WiFi-only**: Optional restriction to WiFi networks
- **Background sync**: Syncs even when app is backgrounded

### Sync Status Indicator

The app displays sync status:

| Status | Indicator | Description |
|--------|-----------|-------------|
| Synced | ✅ | All data up to date |
| Syncing | 🔄 | Sync in progress |
| Pending | ⏳ | Actions queued for sync |
| Error | ❌ | Sync failed, retry needed |
| Offline | 📵 | No network connection |

## Push Notifications

### Notification Channels

Configure notifications per channel:

```json
{
  "channels": {
    "anomalies": { "enabled": true, "sound": true, "priority": "high" },
    "qcAlerts": { "enabled": true, "sound": true, "priority": "high" },
    "feedbackLoops": { "enabled": true, "sound": false, "priority": "normal" },
    "marketplaceUpdates": { "enabled": true, "sound": false, "priority": "low" },
    "paymentAlerts": { "enabled": true, "sound": true, "priority": "high" },
    "culturalSensitivity": { "enabled": true, "sound": true, "priority": "high" }
  }
}
```

### Quiet Hours

Suppress non-critical notifications during specified hours:

```json
{
  "quietHours": {
    "enabled": true,
    "startTime": "22:00",
    "endTime": "07:00",
    "allowCritical": true
  }
}
```

Critical notifications (high priority) bypass quiet hours when `allowCritical` is enabled.

### Badge Count

The app icon badge shows the count of unread notifications:

- Updates automatically when notifications arrive
- Clears when notifications are acknowledged

## Preferences

### Theme

- **Light**: Light background, dark text
- **Dark**: Dark background, light text
- **System**: Follow device system setting

### Accessibility

| Setting | Description |
|---------|-------------|
| Font Size | Small, Medium, Large, Extra Large |
| High Contrast | Increased color contrast |
| Reduced Motion | Minimize animations |
| Haptic Feedback | Vibration feedback for actions |

## Device Requirements

### iOS

- iOS 15.0 or later
- iPhone 8 or newer
- Face ID or Touch ID capable device (for biometrics)

### Android

- Android 11 (API 30) or later
- Fingerprint sensor (for biometrics)
- Google Play Services for push notifications

### Storage

| Data Type | Approximate Size |
|-----------|------------------|
| App installation | ~50 MB |
| Default cache | ~100 MB |
| Maximum cache | ~500 MB |

## Troubleshooting

### Push Notifications Not Working

1. Check notification permissions in device settings
2. Verify push token registration in audit logs
3. Check network connectivity
4. Ensure background app refresh is enabled

### Biometric Authentication Failed

1. Verify biometric is enrolled on device
2. Check app permissions for biometric access
3. Try re-enabling biometric in app settings

### Offline Sync Issues

1. Check sync status indicator
2. Verify network connectivity
3. Check for queued actions in Settings → Offline
4. Clear cache and re-sync if persistent

## Audit Logging

All mobile actions are logged for compliance:

| Event | Category | Description |
|-------|----------|-------------|
| `app_launched` | mobile | App opened |
| `biometric_authenticated` | mobile | Biometric unlock |
| `offline_action_queued` | mobile | Action queued offline |
| `offline_action_synced` | mobile | Queued action synced |
| `push_notification_received` | mobile | Notification delivered |
| `push_notification_tapped` | mobile | User tapped notification |
| `device_registered` | mobile | New device registered |

## Security Best Practices

1. **Enable MFA**: Required for production environments
2. **Use Biometrics**: More secure than PIN alone
3. **Auto-Lock**: Set appropriate timeout (≤5 minutes)
4. **Remote Wipe**: Contact admin if device is lost
5. **Update Regularly**: Keep app updated for security patches
