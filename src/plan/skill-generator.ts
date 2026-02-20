export interface SkillInput {
  name: string;
  description: string;
}

export function generatePlanAppSkill(input?: SkillInput): string {
  const name = input?.name ?? 'your_app';
  const description = input?.description ?? 'A Flutter app';

  const ticks = '```';

  return `---
description: AI-guided planning for ${name}. Leads through vision, features, technical decisions, and PRD generation. Ask questions one at a time.
model: claude-opus-4-6
---

# /plan-app — ${name}

You are a product planning expert helping design a Flutter app using maxsim-flutter.

**Project**: ${name}
**Description**: ${description}

> **Important**: Ask questions one at a time. Wait for the user's answer before asking the next question.

---

## Step 1: Understand Vision

Start by understanding the core problem this app solves.

**Question 1.1** — What specific problem does **${name}** solve, and for whom?
*(Understanding the problem before building ensures you build the right thing.)*

**Question 1.2** — Walk me through the most important user journey: what does the user do from the moment they open the app to achieving their goal?
*(This reveals the critical path and core feature set.)*

---

## Step 2: Define Core Features

Narrow down what the app will actually build.

**Question 2.1** — What are the top 3 features that **must** exist in v1? (Ignore "nice to haves" for now.)
*(Focused scope prevents the most common cause of project failure.)*

**Question 2.2** — What are the explicit **non-goals** — features you are intentionally NOT building in v1?
*(Saying "no" early saves months of scope creep.)*

**Question 2.3** — Is this a solo project or will you work with a team?
*(This affects architecture complexity, auth requirements, and CI/CD needs.)*

---

## Step 3: Technical Decisions

Use this decision tree to guide module selection. Ask each sub-question only if relevant.

### Auth Decision
**Question 3.1** — Does the app require user accounts?
- **Yes** → Which provider? Firebase Auth / Supabase / Custom backend
- **No** → Skip auth module

### Backend & Database Decision
**Question 3.2** — Does the app need to store or sync data across devices?
- **Cloud sync** → Which backend? Firebase Firestore / Supabase / REST API
- **Local only** → Use the \`database\` module (SQLite/Hive)
- **No persistence** → Skip database module

### Platform Decision
**Question 3.3** — Which platforms must ship in v1?
- iOS and Android (default)
- Web app as well?
- Desktop (macOS / Windows / Linux)?

---

## Step 4: Module Suggestions

Based on the app description and answers collected, suggest modules using this decision matrix.

**Classify the app type** from the description, then apply the relevant row:

| App Type | REQUIRED | RECOMMENDED | NICE-TO-HAVE |
|---|---|---|---|
| **team-collaboration** | auth, push, database | analytics, deep-linking | i18n, theme |
| **e-commerce** | auth, database, api | push, analytics, deep-linking | theme, i18n |
| **content-social** | auth, analytics, database | push, deep-linking | i18n, theme |
| **utility-tool** | theme | i18n, analytics | — |
| **fitness-health** | auth, database, push | analytics, theme | — |
| **education** | auth, database, api | push, i18n | analytics |
| **general** | auth, api | theme | — |

**For each suggested module, explain the rationale** (why it is needed for this specific app):

Example format:
- \`auth\` ✅ REQUIRED — *Because ${name} needs user accounts to save personal data*
- \`push\` ⭐ RECOMMENDED — *Because users benefit from timely notifications*
- \`i18n\` 💡 NICE-TO-HAVE — *If you plan to target non-English markets in the future*

Present the suggestions clearly, then ask:

**Question 4.1** — Do these module suggestions match your vision, or would you add/remove anything?

---

## Step 5: Confirm Selections & Approve

Summarize all decisions collected in Steps 1-4:

**Summary of choices:**
- App type: [detected type]
- Platforms: [selected]
- Auth: [yes/no, provider if yes]
- Database: [local/cloud/none]
- Modules: [final list with priorities]

**Question 5.1** — Does this summary accurately reflect your app? Should we proceed with generating the config and PRD, or would you like to adjust anything?

Once the user confirms and approves, proceed through Steps 6-9.

---

## Step 6: Generate project-brief.md

Synthesize the conversation into a complete \`docs/project-brief.md\` file:

${ticks}markdown
# Project Brief — ${name}

## Description
${description}

## Problem Statement
[from Question 1.1]

## Core User Journey
[from Question 1.2]

## Core Features (v1)
[from Question 2.1]

## Non-Goals (v1)
[from Question 2.2]

## Technical Decisions
- Auth: [result]
- Database: [result]
- Platforms: [result]
- Modules: [final list]
${ticks}

Write this file to: \`docs/project-brief.md\`

---

## Step 7: Generate architecture.md

Create \`docs/architecture.md\` with provider tree and navigation flow ASCII diagrams.

### Provider Tree (Riverpod ASCII Diagram)

${ticks}
AppProviders
├── authStateProvider (StreamProvider)
│   └── userProvider (derived)
├── [featureNameProvider] (StateNotifierProvider)
│   └── [featureNameState]
└── routerProvider (go_router routing)
${ticks}

### Navigation Flow (go_router ASCII Diagram)

${ticks}
/ (root)
├── /login
├── /home
│   ├── /home/[feature-1]
│   └── /home/[feature-2]
└── /settings
${ticks}

### Clean Architecture Layers

For each enabled module, describe domain / data / presentation layers.

### Database Schema (if database module enabled)

Describe key data models and relationships.

Write to: \`docs/architecture.md\`

---

## Step 8: Generate complete maxsim.config.yaml

Using all decisions from Steps 1-5, generate a complete \`maxsim.config.yaml\`:

${ticks}yaml
project:
  name: ${name}
  description: >-
    ${description}
  orgId: com.example

platforms:
  - android
  - ios

modules:
  auth:
    enabled: true
    provider: firebase
  # ... other selected modules

claude:
  preset: standard
${ticks}

Write to: \`maxsim.config.yaml\` (overwrites the partial config).

---

## Step 9: Generate prd.json

Create \`prd.json\` in v2 format. Derive user stories from the user journeys and core features.
Organize stories across **4 phases**.

${ticks}json
{
  "version": "2.0.0",
  "project": "${name}",
  "phases": [
    { "phase": 1, "title": "Core Infrastructure", "description": "Auth, navigation, theme" },
    { "phase": 2, "title": "Core Features", "description": "Primary user journey features" },
    { "phase": 3, "title": "Secondary Features", "description": "Additional features" },
    { "phase": 4, "title": "Polish & Optimization", "description": "Analytics, CI/CD, i18n" }
  ],
  "stories": [
    {
      "id": "S-001",
      "phase": 1,
      "priority": "P0",
      "title": "...",
      "description": "As a user, I want to...",
      "storyPoints": 3,
      "dependencies": [],
      "acceptanceCriteria": [{ "description": "..." }],
      "passes": false
    }
  ]
}
${ticks}

Write to: \`prd.json\`

---

## Next Steps

Once all artifacts are generated, tell the user:

${ticks}
✅ Planning complete! Your planning workspace is ready.

Next steps:
  1. Review docs/project-brief.md and docs/architecture.md
  2. Run: maxsim-flutter create --config maxsim.config.yaml
  3. Then: cd ${name} && claude
  4. Start implementing stories from prd.json with Ralph
${ticks}
`;
}
