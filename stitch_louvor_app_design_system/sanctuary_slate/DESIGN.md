---
name: Sanctuary Slate
colors:
  surface: '#0b1326'
  surface-dim: '#0b1326'
  surface-bright: '#31394d'
  surface-container-lowest: '#060e20'
  surface-container-low: '#131b2e'
  surface-container: '#171f33'
  surface-container-high: '#222a3d'
  surface-container-highest: '#2d3449'
  on-surface: '#dae2fd'
  on-surface-variant: '#c3c6d7'
  inverse-surface: '#dae2fd'
  inverse-on-surface: '#283044'
  outline: '#8d90a0'
  outline-variant: '#434655'
  surface-tint: '#b4c5ff'
  primary: '#b4c5ff'
  on-primary: '#002a78'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#0053db'
  secondary: '#b7c8e1'
  on-secondary: '#213145'
  secondary-container: '#3a4a5f'
  on-secondary-container: '#a9bad3'
  tertiary: '#d0bcff'
  on-tertiary: '#3c0091'
  tertiary-container: '#7d4ce7'
  on-tertiary-container: '#f6edff'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d3e4fe'
  secondary-fixed-dim: '#b7c8e1'
  on-secondary-fixed: '#0b1c30'
  on-secondary-fixed-variant: '#38485d'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d0bcff'
  on-tertiary-fixed: '#23005c'
  on-tertiary-fixed-variant: '#5516be'
  background: '#0b1326'
  on-background: '#dae2fd'
  surface-variant: '#2d3449'
typography:
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '800'
    lineHeight: 28px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '800'
    lineHeight: 26px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 24px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '700'
    lineHeight: 20px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: '0'
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: '0'
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '800'
    lineHeight: 14px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 9px
    fontWeight: '900'
    lineHeight: 12px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 0.75rem
  margin: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system is tailored for worship leaders, praise teams, and stage musicians operating under dynamic and demanding live-performance settings. The interface reflects reverence, clarity, and precision, eliminating visual friction so performers can focus on ministry, setlists, and chord execution.

The style merges **Modern Glassmorphic Dark-Slate** with tactile, ergonomic mobile primitives. Built primarily for low-light platform environments (dim stage monitors, backline setups, and church sound booths), the system prioritizes eye relief, legible chord keys, high-contrast statuses, and seamless one-handed thumb interaction. Subtle tactile cues and celebratory micro-interactions reward attendance and duty execution, while strict layout boundaries safeguard usability across stage tablets and mobile phones.

## Colors

The palette is engineered around dark sanctuary aesthetics with liturgical semantic categorization:

### Surface Architecture
- **Midnight Slate Base (`#0f172a`):** The primary backdrop, reducing eye strain in dim environments.
- **Deep Void (`#020617`):** Recessed canvas token for outer letterboxing, text fields, and modal scrim backdrops.
- **Elevated Glass Surface (`#1e293b` / `rgba(30, 41, 59, 0.90)`):** Elevated container layer for hymn cards, agenda slots, and interactive sheets.
- **Hairline Boundary (`#334155`):** Structural 1px border contrast ensuring component distinction without harsh lines.

### Liturgical Semantic Tints
Specific event categories rely on immutable color-coded identification:
- **Culto (Assembly / Sunday Service):** Royal Blue (`#3b82f6`)
- **Santa Ceia (Lord's Supper / Communion):** Sacramental Rose (`#f43f5e`)
- **Ensaio (Rehearsal / Band Practice):** Acoustic Amber (`#f59e0b`)
- **Congresso (Festival / Assembly):** Regal Violet (`#8b5cf6`)
- **Batismo (Baptism):** Immersion Cyan (`#06b6d4`)
- **Jovens (Youth Revival):** Holy Emerald (`#10b981`)

### Presence Tokens
Attendance confirmation rings utilize strict status hues:
- **Confirmed:** Emerald `#10b981` (paired with an ambient presence ring).
- **Pending:** Amber `#f59e0b`.
- **Declined:** Rose `#f43f5e`.

## Typography

Typography relies on **Plus Jakarta Sans** across all hierarchies for its open counters, balanced geometric foundation, and reliable legibility under stage illumination and rapid thumb scanning.

- **Hero & Modal Heads (`headline-lg`, `headline-md`):** Tight negative letter-spacing with an extra-bold stance to establish clear hierarchy within limited viewport bounds.
- **Song Titles & Setlist Roles (`headline-sm`):** Bold weight to distinguish titles instantly from artist metadata.
- **Musical Keys & Sacred Badges (`label-md`):** Fixed uppercase letter-spacing with tabular numeral alignment, preventing horizontal jitter when transposing chords from natural notes (`C`) to accidentals (`C#`, `Bb`).
- **Micro Counters (`label-sm`):** Reserved for unread notification dots and badge counters.

## Layout & Spacing

The layout is strictly mobile-first, adhering to an ergonomic smartphone container capped at a maximum width of 448px (`max-w-md`) centered on desktop screens.

### Viewport & Canvas Dynamics
- **Dynamic Viewport Height:** Always employ `100dvh` for full-height drawers and app canvases to accommodate dynamic mobile address bar shifts.
- **Safe Area Insets:** Fixed bottom navigation, persistent floating controls, and top headers inject dynamic padding calculated using `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)`.
- **Canvas Margins:** Screen margins default to 1rem (16px), ensuring touch targets retain comfortable buffer zones away from the device chassis.
- **Vertical Rhythm:** Card stacks use 0.75rem (12px) to 1rem (16px) vertical gaps, preventing informational crowding while maintaining continuous setlist visibility.
- **Touch Target Floor:** All actionable controls (chord step buttons, status confirmations, icon buttons) enforce a minimum touch bounding box of 44×44px.

## Elevation & Depth

Visual depth is achieved through translucent structural layers and selective luminous accents rather than heavy diffuse drop shadows:

- **Surface Level 0 (Base Canvas):** Solid dark canvas `#0f172a` providing deep tonal contrast.
- **Surface Level 1 (Cards & Hymn Strips):** `#1e293b` rendered with a 90% opacity alpha mask, paired with a subtle 1px border (`#334155`) to establish boundary definition without heavy separation.
- **Surface Level 2 (Floating Nav & App Bars):** Translucent backdrop layers utilizing `backdrop-filter: blur(12px)` and 95% opacity, preserving contextual stage awareness beneath overlays.
- **Surface Level 3 (Bottom Sheet Modals):** Pinned to the base canvas over a dimming scrim (`#020617` at 80% opacity with `backdrop-filter: blur(4px)`).
- **The Next-Service Beacon:** The primary upcoming event card uses a dual-gradient conic border beam (transitioning between `#3b82f6` and `#8b5cf6`), giving the imminent service a glowing, active perimeter.

## Shapes

The design system embraces a friendly, tactile curvature calibrated at **Rounded (level 2)**:

- Standard card surfaces, list group items, and input fields utilize `rounded-2xl` (1rem / 16px).
- Primary hero service containers and bottom sheet cards extend to `rounded-3xl` (1.5rem / 24px).
- Status chips, chord transposition pills, and member presence tags utilize fully pill-shaped geometry (`rounded-full`) for high-contrast scanning.
- Touch feedback scales down slightly (`active:scale-95`) to produce an instant tactile response.

## Components

### Buttons
- **Primary Action:** Solid `#2563eb` fill with 1px border (`rgba(59, 130, 246, 0.3)`), `rounded-2xl`, minimum height 46px, with white bold text. Produces a subtle ambient glow on active states.
- **Secondary / Action Surface:** Neutral `#1e293b` container with crisp 1px `#334155` border and `#e2e8f0` text.
- **Destructive:** Deep rose fill (`#f43f5e`) for absence justifications or destructive roster changes.
- **Icon Buttons:** Fixed 44×44px interactive bounds, centered icon, `rounded-xl`, with subtle background transitions on press.

### Chips & Badges
- **Liturgical Type Badges:** Pill-shaped, tinted at 15% opacity of their respective liturgical parent hue, bordered by a 30% alpha hairline border, and text set in the corresponding bright tint.
- **Musical Key Badge:** High-contrast dark badge showcasing chord keys (e.g., `Tom: G#`) in extra-bold tabular formatting with dedicated semitone decrement/increment steppers.
- **Hymn Registry Tag:** Harpa Cristã entries utilize a dedicated pill tag featuring book numbering (e.g., `#545`) for rapid pulpit-to-stage lookup.

### Musician Avatar Cluster
- Stacked overlapping avatar groupings (`-space-x-2.5`).
- Each avatar features a 2px presence border:
  - Green (`#10b981`) for confirmed members.
  - Amber (`#f59e0b`) for pending status.
  - Rose (`#f43f5e`) for declined requests.
- Ministry leaders are identified by an additional amber/gold outer halo ring (`ring-2 ring-amber-500/30`).
- Initials placeholders use vibrant diagonal two-tone gradients (e.g., `from-blue-500 to-indigo-600`).

### Input Fields
- Deep void container background (`#020617`) inset inside cards, with 1px border (`#334155`).
- Focused states trigger an emerald or blue 1px outline with a matching low-opacity halo (`rgba(37, 99, 235, 0.2)`).
- Touch target height remains at 46px minimum with integrated clear and icon actions.

### Bottom Sheet Drawer
- Anchored to the viewport bottom with `border-t border-slate-700` and `bg-slate-900/95`.
- Features an ergonomic top drag indicator pill (`w-12 h-1.5 rounded-full bg-slate-700`).
- Sticky top title bar with quick dismissal, and fixed bottom action container allowing immediate thumb access to confirmation CTAs.