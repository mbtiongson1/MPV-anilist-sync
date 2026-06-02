---
name: MPV Anilist Tracker Design System
description: Visual specifications for the MPV Anilist Sync desktop application.
colors:
  primary: "#00d1ff"
  primary-hover: "#4cd6ff"
  bg-primary: "#10141a"
  bg-secondary: "#1c2026"
  bg-card: "#262a31"
  bg-card-hover: "#31353c"
  bg-input: "#181c22"
  text-primary: "#dfe2eb"
  text-secondary: "#bbc9cf"
  text-muted: "#859399"
  border: "#3c494e"
  success: "#37fe11"
  error: "#ffb4ab"
  warning: "#ffb693"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.2
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.bg-primary}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.bg-card}"
    rounded: "{rounded.md}"
    padding: "16px"
---

# Design System: MPV Anilist Tracker

## 1. Overview

**Creative North Star: "The Neon Cyber-Den"**

The design system is engineered around high contrast, deep dark interfaces suited for media consumption, movie theater environments, and gaming rigs. It centers on a "Restrained" color strategy where deep neutral greys and blacks form the visual foundation, and single neon cyan/purple accents provide state transitions, primary button actions, and glowing feedback cues.

### Key Characteristics:
- **Neon Dark Mode Default**: High-contrast, easy-on-the-eyes layout built for late-night viewing.
- **Accented Glows**: Uses subtle box-shadow glows on accents, indicating active tracking state.
- **Familiar UI Forms**: Standardized desktop navigation using collapsing side panels and compact grids.

## 2. Colors

The color palette features two core themes (Dark Mode as default and Light Mode as an alternate user preference).

### Primary (Dark Theme)
- **Neon Cyan** (`#00d1ff`): The primary brand accent, used for active buttons, selected tabs, progress bars, and glowing interactive markers.
- **Neon Cyan Hover** (`#4cd6ff`): Interactive hover state for accent colors.

### Neutral (Dark Theme)
- **Deep Black** (`#10141a`): Primary background surface.
- **Slate Secondary** (`#1c2026`): Secondary container background (used in sidebar and inputs).
- **Charcoal Card** (`#262a31`): Standard card layout background.
- **Slate Border** (`#3c494e`): Grid dividing lines and element boundaries.

### Semantic
- **Laser Green** (`#37fe11`): Indicates "Completed" watch states or sync successes.
- **Coral Red** (`#ffb4ab`): Indicates "Dropped" watch states or errors.
- **Peach Warning** (`#ffb693`): Warns user of pending sync actions or unsaved progress.

## 3. Typography

**Display Font:** Inter, system-ui, sans-serif
**Body Font:** Inter, system-ui, sans-serif

The system relies on a single typography family, Inter, ensuring clean legibility across dense data tables, media titles, and settings views without adding unnecessary render overhead.

### Hierarchy
- **Display** (Bold, `1.5rem`, `1.2`): Section and modal headers.
- **Title** (Semi-bold, `1.15rem`, `1.3`): Card titles and search bars.
- **Body** (Regular, `0.95rem`, `1.5`): General UI details, descriptive summaries, and settings labels. Max line length 75ch.
- **Label** (Medium, `0.8rem`, uppercase tracking `0.05em`): Metadata badges, table headers, and indicator labels.

## 4. Elevation

The design utilizes flat surfaces, depth-layering (primary page vs sidebar vs floating cards), and responsive neon glows instead of traditional stacked drop shadows.

### Shadow Vocabulary
- **Card Flat Shadow** (`0 4px 20px rgba(0, 0, 0, 0.2)`): Standard container elevation overlay.
- **Neon Cyan Glow** (`0 0 40px rgba(0, 209, 255, 0.08)`): Used behind media cards to highlight currently active playback.

## 5. Components

### Buttons
- **Shape:** Rounded corners (sm: `4px` or md: `8px`).
- **Primary:** Neon Cyan background, deep black text. Transitions cleanly on hover (Accent Hover).
- **Secondary:** Transparent background, Slate border, light grey text.

### Media Cards
- **Shape:** Rounded corners (md: `8px`).
- **Layout:** Flexbox image container with bottom details bar. Glow shadows are displayed if marked as "Currently Playing".

### Status Badges
- **Shape:** Rounded border (full: `9999px`).
- **States:** Background colored matching the semantic status color with a transparent background wrapper.

## 6. Do's and Don'ts

### Do's
- **Do** bind interactive states (hover/focus) with high-contrast indicator animations.
- **Do** respect system prefers-reduced-motion queries by providing simple transitions.
- **Do** use OKLCH values in css variables, keeping Hex equivalents inside variables where compatible with other parsers.

### Don'ts
- **Don't** introduce secondary brand typefaces (e.g. cursive display fonts) inside UI labels.
- **Don't** use fluid typography scales inside dense list grids.
- **Don't** stack multiple modals; instead, use expandable panels or inline overlays.
