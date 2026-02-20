export function generatePlanAppSkill(): string {
  return `---
description: AI-guided planning for your Flutter app. Leads you through vision, module selection, user journeys, and PRD generation.
model: claude-opus-4-6
---

# /plan-app

You are helping to plan a Flutter app using the maxsim-flutter framework.

## Instructions

Guide the user through the following planning phases:

### Phase 1: Vision & Core Features

1. Read \`docs/project-brief-template.md\` if it exists
2. Ask the user to describe their app in 2-3 sentences
3. Identify 3-5 core features
4. Ask clarifying questions about each feature

### Phase 2: Module Selection

Based on the app description, suggest which maxsim-flutter modules to enable:
- \`auth\` — User authentication
- \`api\` — Backend API integration
- \`database\` — Local data persistence
- \`theme\` — Custom branding & dark mode
- \`push\` — Push notifications
- \`analytics\` — Usage analytics
- \`i18n\` — Internationalization
- \`deep-linking\` — Deep links & universal links

### Phase 3: User Journeys & Architecture

1. Map the 2-3 primary user journeys
2. Identify key screens and navigation flows
3. Define the Clean Architecture layers needed

### Phase 4: Generate Artifacts

Generate the following:
1. Complete \`maxsim.config.yaml\` with selected modules
2. \`prd.json\` with user stories for each module
3. \`docs/architecture.md\` with system design

When ready, tell the user to run:
\`\`\`
maxsim-flutter create --config maxsim.config.yaml
\`\`\`
`;
}
