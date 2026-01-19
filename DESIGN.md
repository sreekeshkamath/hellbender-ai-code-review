# Hellbender Design System

This document defines the visual source of truth for the Hellbender AI Code Review platform. All future UI work must strictly adhere to these tokens, rules, and patterns.

## 1. Design Tokens

### Colors (HSL)
The core theme is a high-contrast dark mode with a signature bright blue primary accent.

| Token | HSL Value | Description |
| :--- | :--- | :--- |
| `background` | `222.2 84% 4.9%` | Main app background (Deep Dark Blue/Black) |
| `foreground` | `210 40% 98%` | Primary text color (Off-White) |
| `primary` | `217.2 91.2% 59.8%` | Main accent color (Bright Blue) |
| `primary-foreground` | `222.2 47.4% 11.2%` | Text on primary backgrounds |
| `secondary` | `217.2 32.6% 17.5%` | Muted backgrounds and components |
| `muted` | `217.2 32.6% 17.5%` | Less prominent text and UI elements |
| `accent` | `217.2 32.6% 17.5%` | Hover states and subtle highlights |
| `destructive` | `0 62.8% 30.6%` | Errors and destructive actions (Dark Red) |
| `border` | `217.2 32.6% 17.5%` | Standard component borders |
| `input` | `217.2 32.6% 17.5%` | Form element borders |
| `ring` | `224.3 76.3% 48%` | Focus rings |

**Semantic Status Colors (Zinc/Custom):**
- **Success:** `bg-green-500` / `text-green-400`
- **Warning/High:** `bg-orange-500`
- **Medium:** `bg-yellow-500`
- **Low/Info:** `bg-blue-500` / `text-blue-400`
- **Neutral/System:** `zinc-400` through `zinc-900`

### Typography
Hellbender uses a combination of modern sans-serif for UI and monospace for technical data.

- **Main UI Font:** System Sans-serif (`font-sans`)
- **Technical/Code Font:** System Monospace (`font-mono`)

| Scale | Definition | Usage |
| :--- | :--- | :--- |
| **H1 / Branding** | `text-xl font-black tracking-tighter uppercase italic` | Main Logo ("Hellbender") |
| **Section Header** | `text-[10px] font-black uppercase tracking-[0.3em]` | Panel and sidebar headers |
| **Card Title** | `text-lg font-bold tracking-tight` | Result card titles |
| **Small Label** | `text-[10px] font-black uppercase tracking-widest` | Field labels, metadata tags |
| **Body (Mono)** | `text-[11px] font-mono leading-relaxed` | Technical logs, paths, file data |
| **Standard Body** | `text-sm text-muted-foreground` | Descriptions, summaries |

### Spacing
Hellbender follows a consistent spacing scale based on 0.25rem (4px) increments.

- **Standard Padding:** `p-6` (24px) for panels and cards.
- **Main Content Gutter:** `p-8` (32px).
- **Component Gap:** `space-y-4` (16px) or `gap-4`.
- **Large Section Gap:** `space-y-8` (32px).
- **Header Heights:** `h-14` (56px) for Main Toolbar, `h-10` (40px) for Secondary Bars.

### Border Radius
- **`radius-lg` (12px):** Default for Cards and large containers.
- **`radius-md` (10px):** Default for Buttons and Inputs.
- **`radius-sm` (8px):** Default for small badges and nested items.
- **`rounded-full`:** Used for status dots and circular buttons.

### Shadows & Visual Effects
- **Card Shadow:** `shadow-sm` (subtle) or `shadow-lg` (elevated).
- **Backdrop:** `backdrop-blur-sm` used on overlays and card surfaces.
- **Status Glow:** `shadow-[0_0_8px_rgba(var(--status-color))]` for active indicators.

---

## 2. Layout Patterns

### Main Application Shell
The application follows a tripartite layout:
1. **Sidebar (`aside`):** `w-80` (320px), fixed height `h-screen`, `border-r border-zinc-800`. Uses `bg-zinc-950/20`.
2. **Main Workspace (`main`):** `flex-1`, `flex-col`, `overflow-hidden`.
3. **Floating/Overlay Panels:** Use `LoadingOverlay` with full-screen `backdrop-blur`.

### Panels & Containers
- **Glassmorphism:** Use `bg-zinc-950/20` or `bg-card/50` with `backdrop-blur-sm`.
- **Borders:** Preferred over background color changes for separation. Use `border-zinc-800` or `border-zinc-900`.
- **Scrollbars:** Custom thin scrollbars (`w-8px`) with `zinc-500` thumb and transparent track.

---

## 3. Component Usage Rules

### Buttons
- **Primary:** `bg-white text-black` with `font-black uppercase tracking-[0.2em]`.
- **Secondary:** `border border-zinc-800 bg-transparent text-zinc-500 hover:border-white hover:text-white`.
- **Icon-only:** `text-zinc-600 hover:text-white transition-colors`.

### Inputs
- **Terminal Style:** `bg-zinc-900/50 border border-zinc-800 text-[11px] font-mono text-zinc-200 focus:border-zinc-500 focus:bg-zinc-900`.
- **Labels:** Always use the **Small Label** typography (`text-[10px] font-black uppercase tracking-widest`).

### Cards (Result Cards)
- **Header:** Contains a vertical status bar (`w-2 h-10 rounded-full`) on the left to indicate severity/score.
- **Content:** Uses `space-y-8` for clear sectioning (Summary, Strengths, Action Items).
- **Severity Colors:**
  - Critical: `bg-red-500`
  - High: `bg-orange-500`
  - Medium: `bg-yellow-500`
  - Low: `bg-blue-500`

---

## 4. Do / Don't Guidelines

### Do
- **Do** use uppercase and tracking-widest for all system labels and headers.
- **Do** use `font-mono` for any technical data, including file paths and scores.
- **Do** stick to the HSL-based Tailwind tokens for consistency.
- **Do** use `zinc-800` or `zinc-900` for borders in the dark theme.

### Don't
- **Don't** use standard rounding (`rounded-md`) for brand-critical buttons; favor the precise `radius` tokens.
- **Don't** introduce new colors outside the HSL theme or the Zinc scale.
- **Don't** use soft gradients; favor solid colors, subtle opacities (`/20`, `/50`), and backdrop blurs.
- **Don't** use generic font sizes; adhere to the defined typography scales (e.g., `text-[10px]` for UI labels).

<promise>DESIGN_SYSTEM_LOCKED</promise>
