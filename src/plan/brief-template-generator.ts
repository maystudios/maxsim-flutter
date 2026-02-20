export interface BriefTemplateInput {
  name: string;
  description: string;
}

export function generateBriefTemplate(input: BriefTemplateInput): string {
  return `# Project Brief — ${input.name}

> ${input.description}

## Vision

<!-- What problem does this app solve? Who is the target user? -->

## Core Features

<!-- List the 3-5 most important features. Be specific. -->

1.
2.
3.

## User Journeys

<!-- Describe the key user flows step by step. -->

### Primary Journey

1. User opens the app
2.

## Technical Constraints

<!-- Platform targets, performance requirements, integrations. -->

- Platforms: iOS, Android
-

## Success Metrics

<!-- How will you measure if the app is successful? -->

-

## Out of Scope

<!-- What are you explicitly NOT building in v1? -->

-
`;
}
