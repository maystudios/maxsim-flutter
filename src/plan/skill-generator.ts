export interface SkillInput {
  name: string;
  description: string;
}

export function generatePlanAppSkill(input?: SkillInput): string {
  const name = input?.name ?? 'your_app';
  const description = input?.description ?? 'A Flutter app';

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

## After Collecting Answers

Once you have answers to all questions, generate:

1. **Updated \`maxsim.config.yaml\`** with selected modules
2. **\`prd.json\`** with user stories organized by phase
3. **\`docs/architecture.md\`** with system design overview

Then tell the user:
\`\`\`
maxsim-flutter create --config maxsim.config.yaml
\`\`\`
`;
}
