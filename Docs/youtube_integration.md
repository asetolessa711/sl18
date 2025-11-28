# YouTube Integration Playbook (SL18 + Waliin Studio)

## 1. Purpose & Strategy

YouTube serves as a **complementary distribution and engagement channel** for Waliin Studio, alongside SL18's internal hosting and monetization. The integration drives awareness, diversifies revenue, and funnels audiences back to Waliin Studio for premium experiences.

### 1.1 Strategic Goals

- **Discovery**: Use YouTube's algorithm to reach new audiences globally
- **Engagement**: Build community through Shorts, comments, and live streams
- **Monetization**: Diversify revenue with YouTube ads, memberships, and fan funding
- **Funnel**: Convert YouTube viewers to Waliin Studio subscribers
- **Analytics**: Leverage YouTube data to inform SL18 content strategy

---

## 2. Content Publishing

### 2.1 Content Types

| Content Type | Format | Duration | Cadence | Purpose |
|--------------|--------|----------|---------|---------|
| **Shorts** | 9:16 vertical | ≤60s | 3–5 per week | Discovery, viral reach |
| **Teasers/Trailers** | 16:9 horizontal | 30s–3min | Per release | Drive interest in full content |
| **Highlights** | 16:9 horizontal | 3–10min | 1–2 per week | Best moments, compilations |
| **Behind-the-Scenes** | Mixed | 5–15min | 1–2 per month | Community engagement |
| **Full Episodes** | 16:9 horizontal | 15–45min | Limited/AVOD | Free tier content |
| **Live Premieres** | 16:9 horizontal | Variable | Monthly | Community events |
| **Q&A / Community** | Mixed | Variable | Monthly | Audience interaction |

### 2.2 Channel Structure

```
Waliin Studio (Main Channel)
├── Shorts Shelf (vertical clips, teasers)
├── Playlists
│   ├── Series/Shows (organized by franchise)
│   ├── Behind-the-Scenes
│   ├── Best Of / Highlights
│   └── Live Streams Archive
├── Community Tab (polls, updates, teasers)
└── Memberships (exclusive perks)
```

### 2.3 Video Specifications

**Shorts (9:16)**
- Resolution: 1080×1920 (9:16)
- Codec: H.264
- Container: MP4
- FPS: 30
- Duration: ≤60 seconds
- Safe zones: Avoid outer 10% for TikTok-style UI overlays

**Long-Form (16:9)**
- Resolution: 1920×1080 (16:9), up to 4K
- Codec: H.264 or H.265
- Container: MP4 or MOV
- FPS: 24/30/60
- Duration: No limit (recommend 5–45 minutes)

**Live Streams**
- Resolution: 1080p or 4K
- Bitrate: 4500–51000 Kbps
- Encoder: OBS, Streamlabs, or hardware encoder

---

## 3. Cross-Linking & Funnel Strategy

### 3.1 End Screens (last 20 seconds)

- **Primary CTA**: Subscribe to Waliin Studio
- **Secondary CTA**: Watch full episode on Waliin Studio
- **Tertiary**: Next video / playlist suggestion

### 3.2 Cards (in-video pop-ups)

- Deploy at key moments (cliffhangers, reveals)
- Link to: Waliin Studio premium tier, related content
- Limit: 1–2 per video to avoid viewer fatigue

### 3.3 Descriptions

Standard description template:

```
🎬 [VIDEO TITLE]

[HOOK/SUMMARY - 2-3 lines]

📺 Watch the full episode on Waliin Studio: [LINK]
🔔 Subscribe for more: [CHANNEL LINK]

---

⭐ PREMIUM ACCESS:
Get early access, exclusive content, and ad-free viewing on Waliin Studio!
👉 [WALIIN PREMIUM LINK]

---

📱 FOLLOW US:
• TikTok: @WaliinStudio
• Instagram: @WaliinStudio
• Twitter/X: @WaliinStudio

---

#WaliinStudio #SL18 #[SERIES TAGS] #[GENRE TAGS]

Timestamps:
0:00 - Intro
[...]
```

### 3.4 Pinned Comments

- Link to Waliin Studio premium
- Highlight exclusive content available only on Waliin
- Respond to top comments with funnel links

### 3.5 Community Tab Strategy

- **Polls**: Engage audience on content preferences
- **Updates**: Announce new releases, premieres
- **Teasers**: Post stills, GIFs, behind-the-scenes
- **Interactions**: Reply to comments, thank supporters

---

## 4. Monetization Modules

### 4.1 YouTube Ads

| Ad Type | Placement | Revenue Model |
|---------|-----------|---------------|
| Pre-roll | Before video | CPM |
| Mid-roll | During video (8+ min) | CPM |
| Post-roll | After video | CPM |
| Shorts Feed Ads | Shorts shelf | Revenue sharing |
| Display Ads | Video page | CPM |

**Best Practices:**
- Enable mid-roll ads on videos >8 minutes
- Optimize for 10+ minute videos for maximum ad slots
- Use chapters to improve viewer retention

### 4.2 Fan Funding

| Feature | Description | Revenue |
|---------|-------------|---------|
| **Super Chat** | Highlighted live chat messages | Direct payment |
| **Super Stickers** | Animated stickers in live chat | Direct payment |
| **Super Thanks** | One-time tips on videos | Direct payment |

### 4.3 Channel Memberships

**Tier Structure:**

| Tier | Price | Perks |
|------|-------|-------|
| **Supporter** | $2.99/mo | Badge, emoji, exclusive posts |
| **Fan** | $4.99/mo | + Early access (24h), members-only videos |
| **VIP** | $9.99/mo | + Behind-the-scenes, monthly Q&A |
| **Patron** | $24.99/mo | + Credits, shoutouts, exclusive merch discounts |

### 4.4 YouTube Shopping

- Tag merchandise in videos
- Link to official Waliin Studio merch store
- Feature product shelves on channel page

### 4.5 Brand Partnerships (BrandConnect)

- Sponsored content integrations
- Brand deals for specific series/franchises
- Disclosure compliance ("Includes paid promotion")

---

## 5. Engagement & Analytics

### 5.1 Key Performance Indicators

**Discovery Metrics:**
- Impressions & CTR (click-through rate)
- Views (total, unique)
- Watch time (hours)
- Subscriber growth

**Engagement Metrics:**
- Average view duration
- Retention rate (audience retention graph)
- Likes, comments, shares
- Shorts performance (views, likes, engagement)

**Monetization Metrics:**
- RPM (Revenue per Mille)
- CPM (Cost per Mille)
- Estimated revenue
- Membership conversions

**Funnel Metrics:**
- Click-throughs to Waliin Studio
- Conversion rate (YouTube viewer → Waliin subscriber)
- Revenue attribution

### 5.2 Analytics Integration

```
YouTube Analytics API
       │
       ▼
┌─────────────────┐
│  SL18 Analytics │
│    Dashboard    │
├─────────────────┤
│ • Views by geo  │
│ • RPM by region │
│ • Retention     │
│ • Funnel conv.  │
└─────────────────┘
       │
       ▼
Phase 20: Audience Insights
```

### 5.3 Geographic Insights

- Track RPM by region to align with SL18 regional pricing (Phase 32)
- Identify high-value markets for targeted content
- Localize thumbnails/titles for top regions

### 5.4 Reporting Cadence

| Report | Frequency | Audience |
|--------|-----------|----------|
| Daily Dashboard | Daily | Operators |
| Weekly Performance | Weekly | Content team |
| Monthly Revenue | Monthly | Finance, leadership |
| Quarterly Strategy | Quarterly | All stakeholders |

---

## 6. Governance & Compliance

### 6.1 Cultural Sensitivity

All YouTube content must pass Phase 25 Governance cultural sensitivity filters:

- **Religious sensitivity**: Avoid content offensive to religious groups
- **Political sensitivity**: Neutral stance on political issues
- **Social norms**: Respect regional social norms
- **Regional taboos**: Screen for region-specific taboos

### 6.2 Copyright & Content ID

- Ensure all content is properly licensed
- Register original content with YouTube Content ID
- Monitor and dispute false claims
- Clear any third-party music/footage before upload

### 6.3 Age Restrictions

| Rating | YouTube Setting |
|--------|-----------------|
| G, PG | No restrictions |
| PG-13, TV-14 | May require age restriction |
| TV-MA, R | Age-restricted |
| NC-17 | Not suitable for YouTube |

### 6.4 Brand Consistency

- Always present as "Waliin Studio" (not SL18 internally)
- Use consistent branding: logo, colors, fonts
- Include "Powered by SL18" in About section only
- Maintain professional, family-friendly tone

### 6.5 Disclosure Requirements

- Sponsored content: "Includes paid promotion"
- AI-generated content: Consider disclosure for transparency
- Affiliate links: Disclose in description

---

## 7. Airtable Schema Integration

### 7.1 Required Fields (Episodes Table)

| Field | Type | Description |
|-------|------|-------------|
| `youtube_enabled` | Checkbox | Whether this episode should publish to YouTube |
| `youtube_format` | Select | `short`, `teaser`, `full_episode`, `highlight`, `bts` |
| `youtube_export_ready` | Checkbox | Pipeline has generated YouTube assets |
| `youtube_export_path` | Text | Path to export folder |
| `youtube_publish_status` | Select | `not_needed`, `ready`, `scheduled`, `published`, `failed` |
| `youtube_video_id` | Text | YouTube video ID after upload |
| `youtube_video_url` | URL | Public YouTube URL |
| `youtube_published_at` | DateTime | When video was published |
| `youtube_scheduled_for` | DateTime | Scheduled publish time |
| `youtube_title` | Text | Video title |
| `youtube_description` | Long Text | Video description |
| `youtube_tags` | Text | Comma-separated tags |
| `youtube_thumbnail_path` | Text | Custom thumbnail path |
| `youtube_views` | Number | View count (synced) |
| `youtube_watch_hours` | Number | Watch hours (synced) |
| `youtube_revenue` | Currency | Estimated revenue (synced) |
| `youtube_notes` | Long Text | Operator notes |

### 7.2 Export Outputs

For each YouTube-eligible episode, SL18 generates:

```
exports/youtube/{episodeId}/
├── video_youtube.mp4           # Main video file
├── video_youtube_short.mp4     # Shorts version (if applicable)
├── thumbnail_youtube.jpg       # Custom thumbnail (1280×720)
├── thumbnail_youtube_alt.jpg   # Alternative thumbnail
├── caption_youtube.txt         # Title + description + tags
├── subtitles_en.srt           # English subtitles
├── subtitles_[lang].srt       # Localized subtitles
└── metadata_youtube.json      # Full metadata for API upload
```

### 7.3 Metadata JSON Spec

```json
{
  "episodeId": "ep_2025_11_28_001",
  "title": "Waliin Studio – Falling Skies | Official Trailer",
  "description": "🎬 Watch the full episode...",
  "tags": ["WaliinStudio", "drama", "romance"],
  "categoryId": "24",
  "privacyStatus": "public",
  "madeForKids": false,
  "scheduledPublishTime": "2025-11-29T18:00:00Z",
  "thumbnailPath": "thumbnail_youtube.jpg",
  "subtitles": {
    "en": "subtitles_en.srt",
    "am": "subtitles_am.srt"
  },
  "endScreen": {
    "subscribe": true,
    "waliin_link": "https://waliin.studio/watch/ep_001"
  },
  "cards": [
    {
      "timestamp": 120,
      "type": "link",
      "url": "https://waliin.studio/premium"
    }
  ],
  "createdAt": "2025-11-28T10:00:00Z",
  "createdBy": "sl18-pipeline"
}
```

---

## 8. Operator SOP (YouTube Publishing)

### 8.1 Before Publishing

1. Open Airtable Episodes
2. Filter for:
   - `youtube_enabled = true`
   - `youtube_export_ready = true`
   - `youtube_publish_status = ready`
3. Review export folder:
   - Verify video quality
   - Check thumbnail
   - Review title/description

### 8.2 Publishing via YouTube Studio

**Manual Upload:**
1. Open YouTube Studio
2. Click "Create" → "Upload videos"
3. Select `video_youtube.mp4`
4. Copy title from `caption_youtube.txt`
5. Paste description
6. Add tags
7. Upload custom thumbnail
8. Set visibility (Public/Scheduled)
9. Configure end screen
10. Add cards
11. Publish

**Scheduled Publishing:**
- Set `scheduledPublishTime` in metadata
- Configure visibility to "Scheduled"
- Verify scheduled time in correct timezone

### 8.3 After Publishing

1. Copy video URL
2. Update Airtable:
   - `youtube_publish_status` → `published`
   - `youtube_video_id` → video ID
   - `youtube_video_url` → full URL
   - `youtube_published_at` → current time
3. Verify:
   - Video plays correctly
   - Thumbnail displays
   - End screen works
   - Cards function properly

### 8.4 Troubleshooting

| Issue | Solution |
|-------|----------|
| Upload fails | Check file size, format, internet |
| Copyright claim | Review content, dispute if valid |
| Age restriction | Review content, appeal if appropriate |
| Low CTR | Test different thumbnails/titles |
| Poor retention | Analyze retention graph, optimize content |

---

## 9. API Integration (Automated Publishing)

### 9.1 YouTube Data API v3

**Authentication:**
- OAuth 2.0 for channel management
- API key for public data
- Credential ref: `vault://youtube/oauth_credentials`

**Endpoints Used:**
- `videos.insert` - Upload videos
- `videos.update` - Update metadata
- `videos.delete` - Remove videos
- `thumbnails.set` - Set custom thumbnails
- `channels.list` - Channel info
- `playlistItems.insert` - Add to playlists
- `search.list` - Search channel content
- `analytics` - YouTube Analytics API

### 9.2 Rate Limits

| Operation | Quota Cost | Daily Limit |
|-----------|------------|-------------|
| Video upload | 1600 units | ~6 uploads/day |
| Metadata update | 50 units | ~200/day |
| Thumbnail set | 50 units | ~200/day |
| Read operations | 1-100 units | Varies |

**Total daily quota:** 10,000 units (default)

### 9.3 Webhook Integration

Configure webhooks for:
- Video published
- Comment received
- Subscriber milestone
- Revenue threshold
- Copyright claim

---

## 10. Future Enhancements

### 10.1 Phase 2: Full Automation

- Implement automated YouTube Data API uploads
- Real-time analytics sync to SL18 dashboards
- Automated thumbnail A/B testing
- AI-powered title/description optimization

### 10.2 Phase 3: Advanced Features

- YouTube Live integration with Waliin Studio
- Premiere coordination across platforms
- Cross-platform subscriber sync
- Advanced audience segmentation

### 10.3 Phase 4: Multi-Channel Network

- Franchise-specific YouTube channels
- Centralized MCN management
- Cross-promotion automation
- Unified analytics dashboard

---

## 11. Appendix

### 11.1 YouTube Category IDs

| ID | Category |
|----|----------|
| 1 | Film & Animation |
| 22 | People & Blogs |
| 23 | Comedy |
| 24 | Entertainment |
| 25 | News & Politics |
| 26 | Howto & Style |

### 11.2 Recommended Hashtags

Core: `#WaliinStudio` `#SL18` `#AIFilm`

Genre-specific:
- Drama: `#Drama` `#ShortFilm` `#Series`
- Romance: `#Romance` `#LoveStory`
- Comedy: `#Comedy` `#Funny`
- Music: `#AIMusic` `#MusicVideo`

### 11.3 Related Documentation

- [Distribution Connectors](distribution_connectors.md)
- [Media Rendering](media_rendering.md)
- [Waliin Showcase](waliin_showcase.md)
- [Monetization Analytics](monetization_analytics.md)
- [TikTok Manual Playbook](tiktok_manual_playbook.md)
