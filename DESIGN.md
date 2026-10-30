# PACT: Design System & UI Specification

## 1. Design Vision & Aesthetic Direction

The PACT interface adopts the modern **Material Design 3 (Material You / M3 Enterprise)** design language, inspired by the latest Google Play Console and Google Cloud modern dashboards.

### Core Visual Principles
- **Tonal Color Architecture:** Soft, low-contrast tonal background surfaces rather than harsh stark whites, creating a calm, high-efficiency command center.
- **Organic Geometry:** High border-radii throughout (full rounded pills for interactive controls, `rounded-2xl` for content cards, circular action badges).
- **Metric-First Data Hierarchy:** Clean multi-column stat blocks featuring prominent numerical figures, percentage delta chips, and dotted interactive definition indicators.
- **Persistent Left Navigation Rail:** Dual-state navigation (compact icon rail $\leftrightarrow$ expanded descriptive drawer) with asymmetric active pill highlights.
- **Clearance & Human-in-the-Loop Cards:** High-visibility approval cards designed with clear risk distinctions and unambiguous confirmation actions.

---

## 2. Color Palette & Design Tokens

### 2.1 Surface & Background Tokens
| Token Name | HEX Code | CSS Variable | Usage |
| :--- | :--- | :--- | :--- |
| **Canvas Background** | `#f8fafd` | `--surface-canvas` | Main application background (subtle cool gray/blue tint) |
| **Card Surface** | `#ffffff` | `--surface-card` | Primary elevation for dashboard cards and modal sheets |
| **Card Surface Muted** | `#f0f4f9` | `--surface-muted` | Nested containers inside cards, search bars, and table headers |
| **Active Nav / Highlight** | `#c2e7ff` / `#d3e3fd` | `--surface-active-pill` | Active sidebar item, circular arrow buttons, selected filters |
| **Border Subdued** | `#e0e3e7` | `--border-subdued` | Card outlines, dividers, and table borders (1px) |

### 2.2 Brand & Semantic Tokens
| Token Name | HEX Code | Tailwind Utility | Semantic Role |
| :--- | :--- | :--- | :--- |
| **Primary Brand Blue** | `#0b57d0` | `text-[#0b57d0]`, `bg-[#0b57d0]` | High-emphasis primary CTA buttons, active icon fills |
| **On-Primary Container** | `#041e49` | `text-[#041e49]` | High-contrast dark text inside light-blue pill elements |
| **Success / Positive** | `#146c2e` | `text-[#146c2e]`, `bg-[#c4eed0]` | Metric gains (`+65%`), resolved alerts, verified actions |
| **Warning / Action Required** | `#b06000` | `text-[#b06000]`, `bg-[#ffe2a9]` | Policy conflicts, meeting overlaps, approaching deadlines |
| **Critical / Consequential** | `#ba1a1a` | `text-[#ba1a1a]`, `bg-[#ffdad6]` | Destructive actions, meeting cancellations, execution errors |

### 2.3 Typography & Text Colors

* **Primary Typeface:** **Outfit** (Google Font: `var(--font-outfit)`, fallbacks: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`)
* **Design Characteristic:** A clean, modern geometric sans-serif that balances high-readability UI data density with an elegant enterprise aesthetic.

| Role | HEX Code | Typography Spec | Hierarchy |
| :--- | :--- | :--- | :--- |
| **Headings (Display)** | `#1f1f1f` | `font-outfit font-semibold text-2xl` | Dashboard titles ("Here's the latest for...") |
| **Card / Section Titles** | `#1f1f1f` | `font-outfit font-semibold text-lg` | Card headers, modal headings |
| **Body Primary** | `#1f1f1f` | `font-outfit font-normal text-sm` | Action labels, email snippets, chat text |
| **Body Secondary** | `#444746` | `font-outfit font-normal text-xs` | Subtitles, timestamps, metadata labels |
| **Metric Values** | `#1f1f1f` | `font-outfit font-medium text-3xl` | Big numerical figures (`167`, `4 Unread`) |
| **Muted Metric Labels** | `#747775` | `font-outfit font-medium text-xs` | Stat headers with dotted interactive underline |

---

## 3. Structural Layout Architecture

The screen follows a **3-Tier Responsive Layout**:

```
┌──────┬───────────────────────────────────────────────────────────────────────┐
│ Rail │ Top App Bar: Logo | Account Pill | Notifications | + New Action       │
├──────┼───────────────────────────────────────────────────────────────────────┤
│ [ ]  │ Header Banner: User Greeting Avatar | System Health | Fast Actions    │
│ [ ]  ├───────────────────────────────────────────────────────────────────────┤
│ [ ]  │ 3 Quick Status Cards: Conflicts (0) | Deadlines (2) | Approvals (1)   │
│ [ ]  ├───────────────────────────────────┬───────────────────────────────────┤
│ [ ]  │ Workspace Pane 1 (Email Triage)   │ Workspace Pane 2 (Calendar/Tasks) │
│ [ ]  │ Header + List + Fast Actions      │ Visual Schedule + Priority Items  │
│ [ ]  ├───────────────────────────────────┴───────────────────────────────────┤
│ [ ]  │ Agent Control Cockpit: AI Chat + Voice Visualizer + HITL Approval Card│
└──────┴───────────────────────────────────────────────────────────────────────┘
```

---

## 4. Component Design Specifications

### 4.1 Left Navigation Rail (Dual State)
* **Collapsed Mode (Width: 72px):**
  - Displays vertical stack of rounded icon buttons (`w-12 h-12 rounded-full`).
  - Active item features a light blue pill container (`bg-[#c2e7ff] text-[#041e49]`).
  - Inactive items have subtle gray hover effect (`hover:bg-[#e9eef6] text-[#444746]`).
* **Expanded Drawer Mode (Width: 260px):**
  - Triggered by toggle button or hover.
  - Active item is styled as a right-rounded asymmetric pill (`rounded-r-full py-3 px-4`).
  - Items:
    1. **Overview** (Home icon)
    2. **Inbox** (Gmail sync & triage)
    3. **Calendar** (Schedule, conflicts, focus blocks)
    4. **Tasks** (Action pipeline & deadlines)
    5. **Agent Copilot** (Chat, voice, execution engine)
    6. **User Preferences** (Rules: e.g. "No meetings before 10 AM")
    7. **Audit Log** (Live verified tool execution history)

### 4.2 Top Header & Account Bar
* **Left:** Clean Google-style wordmark: **PACT** (Google Blue `#0b57d0`) + sub-label `Executive OS`.
* **Right:**
  - **Notifications:** Rounded pill with border (`rounded-full border border-slate-300 px-4 py-2 text-sm flex items-center gap-2`).
  - **Account Avatar:** Circular badge with initials or profile picture.
  - **Primary Action Button:** Pill-shaped "+ New Workflow" button (`rounded-full bg-[#0b57d0] text-white px-5 py-2.5 font-medium hover:bg-[#0842a0] shadow-sm`).

### 4.3 KPI Status Cards (Top Tier)
Inspired by the "Production / Policy tasks / Publishing submissions" cards in Google Play Console:
* Three side-by-side cards with `rounded-2xl bg-[#f0f4f9] p-5 flex items-center justify-between border border-transparent hover:border-slate-200 transition-all`.
* **Card 1: Active Conflicts**
  - Icon: Circular light-green badge (`w-10 h-10 rounded-full bg-[#c4eed0] flex items-center justify-center text-[#146c2e]`).
  - Text: **Schedule Integrity** (bold) • "0 conflicts detected".
  - Right: Filter icon.
* **Card 2: Priority Deadlines**
  - Icon: Circular light-teal shield badge (`bg-[#d3e3fd] text-[#0b57d0]`).
  - Text: **Pending Deadlines** • "2 deliverables due today".
* **Card 3: Action Clearance Queue**
  - Icon: Circular light-purple rocket badge (`bg-[#e8def8] text-[#65558f]`).
  - Text: **Awaiting Approval** • "1 consequential action paused".

### 4.4 Dashboard Content Grid Cards
Inspired by the "Test and release" and "Grow users" cards in Google Play Console:
* **Card Container:** `rounded-2xl bg-white border border-[#e0e3e7] p-6 shadow-xs`.
* **Card Header:**
  - Left: Category Icon + Title (`text-lg font-semibold text-[#1f1f1f]`).
  - Right: **Circular Arrow Button** (`w-9 h-9 rounded-full bg-[#c2e7ff] text-[#041e49] flex items-center justify-center hover:bg-[#b0deff] transition-all cursor-pointer`).
* **Sub-header / Context Tag:** Calendar icon + "Today, Realtime Sync" in muted font.
* **3-Column Metric Block:**
  - Metric 1: Value in 32px regular font (`Sep 19, 2026` or `4 Unread`).
  - Label: 12px muted text with dotted underline indicating interactive tooltip.
  - Delta Chip: Green pill with upward arrow (`text-[#146c2e] text-xs font-semibold`).
* **Card Footer Banner (Nested Notification):**
  - Rounded container inside the card (`rounded-xl bg-[#f0f4f9] p-3 flex items-center justify-between text-xs text-[#444746]`).
  - Left: Bell icon + actionable recommendation text.
  - Right: Quick trigger icon.

### 4.5 Human-in-the-Loop Approval Card (Special Component)
When the agent pauses for consequential clearance:
* **Card Container:** `rounded-2xl border-2 border-[#0b57d0]/30 bg-[#f8fafd] p-6 relative overflow-hidden`.
* **Top Badge:** `px-3 py-1 rounded-full bg-[#d3e3fd] text-[#041e49] text-xs font-semibold uppercase tracking-wide inline-flex items-center gap-1.5`.
* **Action Summary:** Clear, bold explanation of what will be executed (e.g., *"Send email to Sarah Chen with proposed 10:30 AM reschedule and book calendar hold"*).
* **Payload Diff Inspector:** Clean JSON / visual diff view showing exact parameters passed to the Google API tool.
* **Control Actions:**
  - **Approve Button:** `rounded-full bg-[#0b57d0] text-white px-6 py-2.5 font-medium hover:bg-[#0842a0]`.
  - **Reject / Modify Button:** `rounded-full border border-slate-300 text-[#444746] px-5 py-2.5 font-medium hover:bg-slate-100`.

### 4.6 Multimodal Voice Assistant Drawer
* Floating pill at the bottom center or dock:
  - Ambient glowing orb / dynamic audio wave visualizer.
  - Micro-state indicator: `Listening...` $\leftrightarrow$ `Thinking...` $\leftrightarrow$ `Awaiting Confirmation`.
  - Push-to-talk / Always-listening toggle.

---

## 5. Mobile UI Adaptations (React Native / Expo)

* **Design Parity:** Identical color palette, rounded pill buttons, and M3 typography.
* **Floating System Bubble (Android):**
  - Circular floating widget (`w-14 h-14 rounded-full bg-[#0b57d0] shadow-xl flex items-center justify-center text-white`).
  - Expands into a bottom-sheet modal matching the Web Card styling.
* **Dynamic Island / Live Activity (iOS):**
  - Black background with compact pill state showing live tool progress.
  - Expanded state features quick Approve/Decline buttons for pending actions.

---

## 6. Iconography & Assets

- **Icon Family:** Lucide Icons / Google Material Symbols (Rounded variant, 20px-24px, 1.5px stroke).
- **Corner Radii Tokens:**
  - `rounded-full`: Buttons, status chips, circular action arrows, search inputs.
  - `rounded-2xl` (16px): Cards, modals, drawers.
  - `rounded-xl` (12px): Nested sub-cards, email list items.
