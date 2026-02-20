export interface BriefTemplateInput {
  name: string;
  description: string;
}

export function generateBriefTemplate(input: BriefTemplateInput): string {
  return `# Project Brief — ${input.name}

## App Description

${input.description}

## Problem Statement

<!-- What specific problem does this app solve? Why does it need to exist? -->

## Target Users

<!-- Who are the primary users of this app? -->

### Persona: [Primary User Type]

- **Role**: (e.g., freelancer, student, team manager)
- **Goal**: What they want to accomplish
- **Pain point**: What frustrates them today
- **Tech comfort**: Low / Medium / High

### Persona: [Secondary User Type] (optional)

- **Role**:
- **Goal**:
- **Pain point**:

## Core User Journeys

<!-- Describe the 3-5 most important flows a user will complete. -->

1. **[Journey 1]**: (e.g., Sign up → complete profile → create first item)
2. **[Journey 2]**:
3. **[Journey 3]**:
4.
5.

## Explicit Non-Goals

<!-- What are you NOT building in v1? Be specific to avoid scope creep. -->

- Not building:
- Not supporting:
- Deferred to v2:

## Success Metrics

<!-- How will you know the app is successful? -->

- Activation: (e.g., X% of users complete onboarding)
- Engagement: (e.g., DAU/MAU ratio)
- Retention: (e.g., 30-day retention rate)

## Technical Constraints

<!-- Platform targets, integrations, performance requirements. -->

- Platforms: iOS, Android
- Authentication:
- Backend / API:
- Offline support: Yes / No
`;
}
