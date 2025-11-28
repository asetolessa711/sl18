# Waliin Studio Showcase Pages

This document describes the Waliin Studio showcase/landing page system within SL18, providing audiences with rich browsing, discovery, and engagement features.

## Overview

The Waliin Studio Showcase system enables:
- **Hero Banners**: Rotating featured releases with trailer autoplay
- **Category Displays**: Genre, ranking, trending, and personalized carousels
- **Navigation**: Home, Categories, Popular, New, Region, Country, My Account
- **Responsive Design**: Mobile, tablet, desktop, and large desktop layouts
- **Studio Promotion**: About page, upcoming releases, behind-the-scenes content

## Schema: `waliin_showcase.schema.json`

### Core Configuration

```json
{
  "showcaseId": "showcase-waliin-global",
  "version": "1.0.0",
  "name": "Waliin Studio Global Showcase",
  "scope": {
    "level": "global",
    "regions": ["africa", "asia", "europe", "americas"],
    "languages": ["en", "am", "sw", "om", "ar"]
  }
}
```

### Scope Levels

| Level | Description |
|-------|-------------|
| `global` | Available worldwide |
| `region` | Specific to a region (e.g., Africa, Asia) |
| `country` | Specific to a country |
| `franchise` | Specific to a franchise |

## Hero Banner

The hero banner is the primary visual element, featuring rotating content slots.

### Rotation Modes

| Mode | Description |
|------|-------------|
| `automatic` | Auto-rotate at configured interval |
| `manual` | User controls rotation |
| `shuffle` | Random order on each load |
| `scheduled` | Time-based rotation |

### Content Types for Slots

| Type | Description |
|------|-------------|
| `featured_release` | Highlighted content |
| `new_release` | Recently released |
| `trending` | Currently popular |
| `editors_pick` | Curated selection |
| `premiere` | Upcoming premiere |
| `exclusive` | Platform exclusive |

### Banner Slot Configuration

```json
{
  "slotId": "hero-slot-1",
  "priority": 1,
  "contentType": "featured_release",
  "displayMode": "trailer_autoplay",
  "autoplayTrailer": true,
  "muteAutoplay": true,
  "callToAction": {
    "primaryButton": {
      "text": "Watch Now",
      "action": "play",
      "style": "primary"
    },
    "secondaryButton": {
      "text": "More Info",
      "action": "details",
      "style": "secondary"
    }
  }
}
```

## Category Displays

Categories organize content into browsable rows/carousels.

### Category Types

| Type | Description |
|------|-------------|
| `genre` | Drama, Comedy, Thriller, etc. |
| `ranking` | Top 10, Trending, Most Watched |
| `trending` | Currently trending content |
| `new_releases` | Recently released |
| `popular` | Most popular content |
| `continue_watching` | User's in-progress content |
| `personalized` | AI-recommended content |
| `because_you_watched` | Related to watch history |

### Display Layouts

| Layout | Description |
|--------|-------------|
| `horizontal_carousel` | Netflix-style scrolling row |
| `vertical_scroll` | Long-form browsing |
| `grid` | Multi-column grid |
| `hero_row` | Large featured row |
| `spotlight` | Single featured item |

### Card Styles

| Style | Description |
|-------|-------------|
| `poster` | Portrait poster image |
| `backdrop` | Landscape backdrop image |
| `square` | Square aspect ratio |
| `wide` | Wide format card |
| `numbered` | With rank number overlay |

### Genre Options

- Drama, Comedy, Thriller, Romance, Action
- Horror, Documentary, Mini Series, Musical
- Family, Sci-Fi, Fantasy, Historical, Slice of Life

## Navigation

### Tab Types

| Tab | Description |
|-----|-------------|
| `home` | Main landing page |
| `categories` | Browse by category |
| `popular` | Popular content |
| `new_releases` | New content |
| `region` | Regional content |
| `country` | Country-specific content |
| `search` | Search functionality |
| `watchlist` | User's watchlist |
| `my_account` | Account settings |

### Search Bar Features

- **Autocomplete**: Suggestions as you type
- **Voice Search**: Voice input support
- **Recent Searches**: Quick access to history
- **Trending Searches**: Popular search terms
- **Filters**: Genre, year, region, language, rating

## Responsive Layouts

### Mobile (≤767px)

```json
{
  "columnsGrid": 2,
  "carouselItemsVisible": 2,
  "heroBannerHeight": "280px",
  "touchGestures": true,
  "bottomNavigation": true
}
```

### Tablet (768-1024px)

```json
{
  "columnsGrid": 4,
  "carouselItemsVisible": 4,
  "heroBannerHeight": "400px"
}
```

### Desktop (1025-1920px)

```json
{
  "columnsGrid": 6,
  "carouselItemsVisible": 6,
  "heroBannerHeight": "600px",
  "sidebarNavigation": true
}
```

### Large Desktop (≥1921px)

```json
{
  "columnsGrid": 8,
  "carouselItemsVisible": 8,
  "heroBannerHeight": "700px"
}
```

## Studio Promotion Page

### Studio Information

- **Name**: Studio brand name
- **Tagline**: Marketing tagline
- **Mission**: Studio mission statement
- **Creative Vision**: Artistic direction
- **Brand Positioning**: Market positioning

### Upcoming Releases

- Calendar of upcoming content
- Countdown timers
- Notification signup for releases

### Behind-the-Scenes Content

| Type | Description |
|------|-------------|
| `production_diary` | Daily production updates |
| `interview` | Cast/crew interviews |
| `making_of` | Making-of documentaries |
| `bloopers` | Blooper reels |
| `cast_spotlight` | Cast feature |
| `director_notes` | Director commentary |

### Contributor Showcase

- Featured creators
- Featured actors
- Featured directors
- Partner highlights

## SEO Configuration

```json
{
  "enabled": true,
  "title": "Waliin Studio - Premium African Entertainment",
  "description": "Stream the best African dramas and movies",
  "keywords": ["African drama", "Ethiopian movies", "streaming"],
  "ogImage": "https://cdn.waliin.studio/og-image.jpg",
  "structuredData": true
}
```

## Analytics Tracking

| Metric | Description |
|--------|-------------|
| `trackPageViews` | Page view tracking |
| `trackScrollDepth` | Scroll depth tracking |
| `trackCarouselInteractions` | Carousel usage |
| `trackSearchQueries` | Search analytics |
| `trackContentClicks` | Content click-through |
| `heatmaps` | Visual heatmaps |

## Performance Optimizations

- **Lazy Loading**: Images and carousels load on demand
- **Image Optimization**: WebP, AVIF, responsive images
- **Prefetching**: Next page content prefetch
- **Caching**: Category and banner content caching

## Localization

### Supported Languages

| Language | Code | RTL |
|----------|------|-----|
| English | en | No |
| Amharic | am | No |
| Kiswahili | sw | No |
| Oromifa | om | No |
| Arabic | ar | Yes |
| French | fr | No |

### Localized Elements

- Category names
- Navigation tab names
- Search placeholder text
- SEO metadata

## Integration Points

- **Phase 15**: Language pack registry for localization
- **Phase 17**: Personalization engine for recommendations
- **Phase 20**: Audience insights for trending/popular
- **Phase 28**: Media pipeline for content delivery
