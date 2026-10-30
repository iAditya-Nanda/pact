# PACT: Product Specification & Cross-Platform Architecture

## 1. Vision & Core Philosophy

PACT is an autonomous, human-grade AI Chief of Staff operating seamlessly across **Web** and **Mobile**. 

Unlike rigid software utilities or conversational chatbots, PACT:
- Adapts to the user's personality, age, schedule rhythm, and communication tone during onboarding.
- Maintains deep, bidirectional integration with the **Google Ecosystem** (Gmail, Google Calendar, Google Tasks), with immediate visual representation and operational control.
- Operates proactively in the background, surfacing conflicts and proposing validated solutions.
- Provides unified **Chat and Voice AI** across all platforms.
- Employs strict **Human-in-the-Loop (HITL)** governance and cryptographic idempotency to guarantee zero unintended side effects.

---

## 2. Target Ecosystem: Google-First Strategy

To maximize depth and user impact, PACT focuses on deep execution across the Google Suite while providing an extensible adapter interface for other platforms.

```
┌────────────────────────────────────────────────────────┐
│ ACTIVE TIER 1 INTEGRATION (Full Execution & Realtime)  │
│ • Gmail (Inbox triage, draft synthesis, guarded send)  │
│ • Google Calendar (Event query, conflict scheduling)   │
│ • Google Tasks (Task creation, sync, completion)       │
├────────────────────────────────────────────────────────┤
│ TIER 2 ECOSYSTEM (Pluggable Adapters & Future Modules) │
│ • Microsoft 365 (Outlook Mail, Calendar, To Do)        │
│ • Todoist, Notion, Linear, Apple Reminders             │
└────────────────────────────────────────────────────────┘
```

---

## 3. Web Platform Architecture

### 3.1 Onboarding & Persona Tuning
When a user signs up on the web platform:
1. **Profile Calibration:** Captures user profile (age, profession, preferred communication tone, working hours, focus blocks).
2. **Preference Formulation:** Automatically generates initial preference rules in the database (e.g., *"No meetings before 10:00 AM"*, *"Keep email responses concise and professional"*).
3. **Google Workspace Link:** Connects Gmail, Calendar, and Tasks via OAuth 2.0 with one authorization flow.

### 3.2 Web Workspace Cockpit & The "In-App Browser" Technical Strategy
A key requirement is providing immediate visibility into Google apps alongside the AI agent.

#### Technical Constraint:
Google security policies explicitly set `X-Frame-Options: SAMEORIGIN` and `Content-Security-Policy: frame-ancestors 'self'` on `mail.google.com` and `calendar.google.com`. Direct `<iframe>` embedding of raw Google URLs is blocked by all modern web browsers to prevent clickjacking attacks.

#### PACT Architectural Solutions:
1. **Solution 1: Embedded Native Google Workspace Cockpit (Primary Strategy)**
   - PACT renders a high-fidelity, interactive Workspace UI directly inside the dashboard using live data from the Google APIs.
   - Includes full Gmail inbox view, interactive timetable calendar, and prioritized tasks checklist.
   - **Advantage:** Total AI control. The AI can highlight specific emails, visually place tentative blocks on the calendar, and animate changes with full UI interactivity.
2. **Solution 2: Chrome Extension Companion (Dual-Control Browser Bridge)**
   - For users who want the AI to control their actual browser tabs on `mail.google.com`:
   - A lightweight PACT Chrome Extension injects an assistive sidecar panel directly into real Google tabs, enabling DOM-level inspection and agentic automation.

---

## 4. Mobile Platform Architecture (iOS & Android)

### 4.1 System Overlay & Floating Agent
- **Android Implementation:**
  - Utilizes Android's `SYSTEM_ALERT_WINDOW` permission ("Draw over other apps") to render a persistent, draggable PACT Floating Bubble.
  - The user can tap or speak to the bubble while browsing any app on their device.
  - Expanding the bubble reveals the quick Voice/Chat modal and active pending approval cards.
- **iOS Implementation:**
  - Because iOS sandboxing prohibits drawing arbitrary overlays over third-party applications, PACT implements:
    - **Live Activities & Dynamic Island:** Persistent background status showing current agent actions and 1-tap approval buttons.
    - **Picture-in-Picture (PiP) / Floating Audio Widget:** Keeps the voice session live while navigating other apps.
    - **Action Extensions & Share Sheet:** Allows sending any screen content, email, or text directly to PACT.

### 4.2 Cross-App Navigation & App Lifecycle Control
- **Deep-Linking & Intent Execution:**
  - PACT opens native applications dynamically via registered URL schemes and Android Intents:
    - Open specific email: `googlegmail:///co?to=...` or `https://mail.google.com/mail/u/0/#inbox/...`
    - Open calendar date: `googlecalendar://...`
    - Open task list: `googletasks://...`
- **App Termination Boundary:**
  - Modern mobile operating systems (iOS and Android 10+) strictly prohibit third-party apps from force-closing or terminating other apps for security and battery isolation.
  - PACT handles this gracefully: It launches the target app when the user needs it, and smoothly resumes PACT via floating bubble tap or universal link callbacks.

---

## 5. Multimodal Intelligence: Unified Voice & Chat

Both the Web and Mobile applications share a unified AI engine:
1. **Voice AI Pipeline:**
   - **Speech-to-Text (STT):** Low-latency voice capture (Web Speech API / Deepgram / Whisper).
   - **Agent Reasoning:** Streaming LLM orchestrator with tool-call emission.
   - **Text-to-Speech (TTS):** Natural, human-like voice synthesis (ElevenLabs / Cartesia / Web Audio).
2. **Human-in-the-Loop Voice Approvals:**
   - When a consequential action is needed during voice mode, the agent verbally pauses:
     > *"I've drafted a reply to Sarah proposing tomorrow at 10:30 AM and placed a tentative hold on your calendar. Should I send it?"*
   - Execution only fires upon explicit verbal confirmation (*"Yes, go ahead"* / *"Confirm"*) or tap on the approval card.

---

## 6. Verification, Reliability & Idempotency Model

Adhering strictly to Question 01 constraints:
1. **Two-Tier Action Classification:**
   - Safe / Read-only: Executed immediately.
   - Consequential (Send email, delete/reschedule meeting, delete task): Pauses execution and creates an approval request.
2. **Cryptographic Idempotency Keys:**
   - Every planned step generates an idempotency token: `SHA-256(run_id + step_index + payload)`.
   - On retry, completed steps are bypassed to guarantee zero duplicate emails or calendar events.
3. **Comprehensive Audit Logging:**
   - Every tool call, verification check, approval event, and error code is logged to the database for full transparency.
