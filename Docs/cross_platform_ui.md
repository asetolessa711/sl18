# SL18 Cross-Platform UI Guide

This guide covers the SL18 cross-platform UI system, enabling consistent experiences across desktop, tablet, and mobile devices with WCAG 2.1 AA accessibility compliance.

## Overview

The SL18 cross-platform UI provides:

- **Responsive Layouts**: Adaptive breakpoints for all device sizes
- **Unified Design System**: Consistent colors, typography, spacing
- **Accessibility**: WCAG 2.1 AA compliance with RTL/LTR support
- **Adaptive Components**: Device-optimized UI components
- **Cross-Platform Notifications**: Unified notification system

## Device Profiles

### Supported Devices

| Profile | Category | Width Range | Touch | Pointer |
|---------|----------|-------------|-------|---------|
| `mobile_small` | Mobile | 320-374px | ✅ | Touch |
| `mobile_large` | Mobile | 375-767px | ✅ | Touch |
| `tablet_portrait` | Tablet | 768-1023px | ✅ | Both |
| `tablet_landscape` | Tablet | 1024-1279px | ✅ | Both |
| `desktop` | Desktop | 1024-1439px | ❌ | Mouse |
| `desktop_large` | Desktop | 1440px+ | ❌ | Mouse |

### Device Capabilities

```json
{
  "mobile_large": {
    "touchEnabled": true,
    "pointerType": "touch",
    "features": {
      "hover": false,
      "rightClick": false,
      "multiTouch": true,
      "hapticFeedback": true,
      "keyboardShortcuts": false
    }
  },
  "desktop": {
    "touchEnabled": false,
    "pointerType": "mouse",
    "features": {
      "hover": true,
      "rightClick": true,
      "multiTouch": false,
      "hapticFeedback": false,
      "keyboardShortcuts": true
    }
  }
}
```

## Responsive Breakpoints

### Grid System

The layout uses a responsive grid system:

| Breakpoint | Max/Min Width | Columns | Gutter | Margin |
|------------|---------------|---------|--------|--------|
| Mobile | ≤767px | 4 | 16px | 16px |
| Tablet | 768-1023px | 8 | 24px | 24px |
| Desktop | 1024-1439px | 12 | 24px | 32px |
| Large Desktop | ≥1440px | 12 | 32px | 48px |

### Breakpoint Configuration

```json
{
  "responsiveBreakpoints": {
    "mobile": { "maxWidth": 767, "columns": 4, "gutter": 16, "margin": 16 },
    "tablet": { "minWidth": 768, "maxWidth": 1023, "columns": 8, "gutter": 24, "margin": 24 },
    "desktop": { "minWidth": 1024, "maxWidth": 1439, "columns": 12, "gutter": 24, "margin": 32 },
    "largeDesktop": { "minWidth": 1440, "columns": 12, "gutter": 32, "margin": 48 }
  }
}
```

## Design System

### Color Tokens

```json
{
  "colors": {
    "primary": "#2563eb",
    "secondary": "#7c3aed",
    "success": "#10b981",
    "warning": "#f59e0b",
    "error": "#ef4444",
    "info": "#3b82f6",
    "background": {
      "primary": "#ffffff",
      "secondary": "#f3f4f6",
      "tertiary": "#e5e7eb"
    },
    "text": {
      "primary": "#111827",
      "secondary": "#6b7280",
      "disabled": "#9ca3af",
      "inverse": "#ffffff"
    },
    "border": {
      "default": "#d1d5db",
      "focus": "#2563eb",
      "error": "#ef4444"
    }
  }
}
```

### Typography

```json
{
  "typography": {
    "fontFamily": {
      "primary": "Inter, system-ui, sans-serif",
      "secondary": "Georgia, serif",
      "monospace": "JetBrains Mono, monospace"
    },
    "fontSizes": {
      "xs": 12,
      "sm": 14,
      "base": 16,
      "lg": 18,
      "xl": 20,
      "2xl": 24,
      "3xl": 30,
      "4xl": 36
    },
    "fontWeights": {
      "light": 300,
      "normal": 400,
      "medium": 500,
      "semibold": 600,
      "bold": 700
    },
    "lineHeights": {
      "tight": 1.25,
      "normal": 1.5,
      "relaxed": 1.75
    }
  }
}
```

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Tight padding |
| `sm` | 8px | Compact spacing |
| `md` | 16px | Default spacing |
| `lg` | 24px | Section spacing |
| `xl` | 32px | Large sections |
| `2xl` | 48px | Major sections |
| `3xl` | 64px | Page sections |

### Shadows

```json
{
  "shadows": {
    "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    "md": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
  }
}
```

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `none` | 0px | No rounding |
| `sm` | 4px | Subtle rounding |
| `md` | 8px | Default buttons/cards |
| `lg` | 12px | Large cards |
| `full` | 9999px | Pills/circles |

## Adaptive Components

### Component Variants

Each component adapts to device profile:

```json
{
  "componentId": "card",
  "name": "Adaptive Card",
  "variants": {
    "mobile": {
      "layout": "full-width",
      "size": "compact",
      "touchTarget": 48,
      "spacing": "sm"
    },
    "tablet": {
      "layout": "grid",
      "size": "medium",
      "touchTarget": 44,
      "spacing": "md"
    },
    "desktop": {
      "layout": "grid",
      "size": "large",
      "touchTarget": 32,
      "spacing": "lg"
    }
  }
}
```

### Touch Targets

Minimum touch target sizes per device:

| Device | Minimum Size | Recommended |
|--------|--------------|-------------|
| Mobile | 44px | 48px |
| Tablet | 40px | 44px |
| Desktop | 24px | 32px |

### Table Adaptation

Tables transform based on screen size:

| Breakpoint | Layout | Features |
|------------|--------|----------|
| Mobile | Card list | Stacked fields, swipe actions |
| Tablet | Scrollable table | Horizontal scroll, fixed columns |
| Desktop | Full table | All columns visible, sorting |

### Navigation Adaptation

| Breakpoint | Layout | Features |
|------------|--------|----------|
| Mobile | Bottom tabs | 5 tabs, FAB optional |
| Tablet | Side rail | Collapsed icons, expand on hover |
| Desktop | Sidebar | Full labels, nested menus |

## Accessibility (WCAG 2.1 AA)

### Compliance Level

The cross-platform UI targets **WCAG 2.1 Level AA** compliance:

```json
{
  "accessibility": {
    "wcagLevel": "AA",
    "colorContrast": {
      "minimumRatio": 4.5,
      "largeTextRatio": 3.0,
      "highContrastMode": false
    }
  }
}
```

### Color Contrast

| Text Size | Minimum Ratio | Our Ratio |
|-----------|---------------|-----------|
| Normal text | 4.5:1 | ≥4.5:1 |
| Large text (18px+) | 3.0:1 | ≥3.0:1 |
| UI components | 3.0:1 | ≥3.0:1 |

### Focus Indicators

All interactive elements have visible focus indicators:

```json
{
  "focusIndicators": {
    "enabled": true,
    "style": "ring",
    "color": "#2563eb",
    "width": 2
  }
}
```

### Keyboard Navigation

Full keyboard support:

- **Tab**: Move between focusable elements
- **Shift+Tab**: Reverse navigation
- **Enter/Space**: Activate buttons/links
- **Arrow keys**: Navigate within components
- **Escape**: Close modals/dropdowns

Skip links allow users to bypass repetitive content:

```json
{
  "keyboardNavigation": {
    "enabled": true,
    "skipLinks": true,
    "tabOrder": "natural"
  }
}
```

### Screen Reader Support

```json
{
  "screenReader": {
    "ariaLabels": true,
    "liveRegions": true,
    "announcements": true
  }
}
```

- **ARIA Labels**: Descriptive labels on all controls
- **Live Regions**: Dynamic content announcements
- **Announcements**: Status changes and alerts

### Reduced Motion

Respects user preference for reduced motion:

```json
{
  "reducedMotion": {
    "respectSystem": true,
    "disableAnimations": false,
    "simplifyTransitions": true
  }
}
```

When enabled:
- Animations are simplified or disabled
- Transitions become instant
- Parallax effects are removed

### Text Scaling

Supports system text scaling:

```json
{
  "textScaling": {
    "minScale": 1.0,
    "maxScale": 2.0,
    "respectSystem": true
  }
}
```

- Layout remains usable at 200% zoom
- No horizontal scrolling required
- Text doesn't overflow containers

## RTL/LTR Localization

### Text Direction

The UI automatically switches direction for RTL languages:

```json
{
  "localization": {
    "defaultDirection": "ltr",
    "rtlLanguages": ["ar", "he", "fa", "ur"]
  }
}
```

### Direction Changes

When RTL is enabled:
- Layout mirrors horizontally
- Icons flip where appropriate
- Navigation reverses
- Text aligns right

### Per-Language Fonts

Custom font families per language:

```json
{
  "fontFamilies": {
    "en": {
      "primary": "Inter",
      "secondary": "Georgia",
      "monospace": "JetBrains Mono"
    },
    "ar": {
      "primary": "Noto Sans Arabic",
      "secondary": "Amiri",
      "monospace": "Courier New"
    },
    "am": {
      "primary": "Noto Sans Ethiopic",
      "secondary": "Noto Serif Ethiopic",
      "monospace": "Courier New"
    },
    "zh-CN": {
      "primary": "Noto Sans SC",
      "secondary": "Noto Serif SC",
      "monospace": "Noto Sans Mono CJK"
    }
  }
}
```

### Date and Number Formats

Localized formatting:

| Locale | Date Format | Number Format |
|--------|-------------|---------------|
| en | MM/DD/YYYY | 1,234.56 |
| en-GB | DD/MM/YYYY | 1,234.56 |
| ar | YYYY/MM/DD | ١٬٢٣٤٫٥٦ |
| am | DD/MM/YYYY | 1,234.56 |

## Cross-Platform Notifications

### Notification Channels

```json
{
  "notifications": {
    "channels": ["in_app", "push", "email"],
    "inAppNotifications": {
      "position": "top_right",
      "duration": 5000,
      "maxVisible": 3,
      "stackBehavior": "stack"
    }
  }
}
```

### In-App Notifications

| Property | Default | Description |
|----------|---------|-------------|
| Position | top_right | Screen position |
| Duration | 5000ms | Auto-dismiss time |
| Max Visible | 3 | Maximum stack count |
| Stack Behavior | stack | stack, replace, queue |

### Push Notifications

```json
{
  "pushNotifications": {
    "platforms": ["ios", "android", "web"],
    "richNotifications": true,
    "actionButtons": true
  }
}
```

Supports:
- Rich notifications with images
- Action buttons (Approve, Dismiss, View)
- Platform-specific delivery (APNs, FCM, Web Push)

## Audit Logging

### Cross-Platform Events

| Event | Category | Description |
|-------|----------|-------------|
| `app_launched` | mobile | App opened |
| `app_backgrounded` | mobile | App sent to background |
| `device_registered` | mobile | Device registered for push |
| `biometric_authenticated` | mobile | Biometric unlock |
| `offline_action_queued` | mobile | Action queued offline |
| `offline_action_synced` | mobile | Action synced |
| `push_notification_received` | mobile | Push delivered |
| `push_notification_tapped` | mobile | User opened notification |
| `accessibility_feature_enabled` | cross_platform | A11y feature toggled |
| `language_direction_changed` | cross_platform | RTL/LTR switched |
| `responsive_layout_changed` | cross_platform | Breakpoint changed |
| `theme_changed` | cross_platform | Theme switched |

### Event Metadata

```json
{
  "eventType": "responsive_layout_changed",
  "category": "cross_platform",
  "metadata": {
    "previousBreakpoint": "tablet",
    "newBreakpoint": "mobile",
    "orientation": "portrait"
  }
}
```

## Testing Guidelines

### Device Testing Matrix

| Platform | Devices | Browsers |
|----------|---------|----------|
| iOS | iPhone SE, 15, 15 Pro Max | Safari |
| Android | Pixel 7, Samsung S24 | Chrome |
| Tablet | iPad, Galaxy Tab | Safari, Chrome |
| Desktop | Windows, Mac | Chrome, Safari, Firefox |

### Accessibility Testing

1. **Screen Reader**: Test with VoiceOver (iOS/Mac), TalkBack (Android)
2. **Keyboard Only**: Navigate entire UI without mouse
3. **High Contrast**: Test with high contrast mode enabled
4. **Text Scaling**: Test at 200% zoom
5. **Reduced Motion**: Test with reduce motion enabled

### RTL Testing

1. Switch to Arabic (`ar`) or Hebrew (`he`)
2. Verify layout mirrors correctly
3. Check icon direction (arrows, back buttons)
4. Verify text alignment
5. Test form inputs

## Best Practices

### Performance

1. **Lazy Loading**: Load components on demand
2. **Image Optimization**: Use WebP, responsive srcset
3. **Code Splitting**: Split bundles per route
4. **Service Worker**: Cache static assets

### Accessibility

1. **Semantic HTML**: Use proper heading hierarchy
2. **ARIA Landmarks**: Define page regions
3. **Alt Text**: Describe all images
4. **Form Labels**: Associate labels with inputs
5. **Error Messages**: Clear, actionable errors

### Responsive Design

1. **Mobile First**: Design for mobile, enhance for desktop
2. **Fluid Typography**: Use relative units
3. **Flexible Images**: Max-width: 100%
4. **Touch Targets**: Minimum 44px on mobile
5. **Test Real Devices**: Emulators miss edge cases
