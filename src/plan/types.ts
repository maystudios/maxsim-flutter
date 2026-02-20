export interface PlanInput {
  name: string;
  description: string;
  outputDir: string;
}

export interface PlanResult {
  projectDir: string;
  filesCreated: string[];
}

export function isValidSnakeCase(name: string): boolean {
  if (!name) return false;
  return /^[a-z][a-z0-9_]*$/.test(name);
}
