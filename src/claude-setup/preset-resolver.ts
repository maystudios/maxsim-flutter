export interface ResolvedClaudeOptions {
  claudeMd: boolean;
  rules: boolean;
  agents: boolean;
  hooks: boolean;
  skills: boolean;
  commands: boolean;
  mcp: boolean;
}

const PRESETS: Record<'minimal' | 'standard' | 'full', ResolvedClaudeOptions> = {
  minimal: {
    claudeMd: true,
    rules: true,
    agents: false,
    hooks: false,
    skills: false,
    commands: false,
    mcp: false,
  },
  standard: {
    claudeMd: true,
    rules: true,
    agents: true,
    hooks: true,
    skills: true,
    commands: true,
    mcp: false,
  },
  full: {
    claudeMd: true,
    rules: true,
    agents: true,
    hooks: true,
    skills: true,
    commands: true,
    mcp: true,
  },
};

export function resolvePreset(
  preset?: 'minimal' | 'standard' | 'full',
  overrides?: Partial<ResolvedClaudeOptions>,
): ResolvedClaudeOptions {
  const base = PRESETS[preset ?? 'standard'];
  if (!overrides) return { ...base };

  const result = { ...base };
  for (const key of Object.keys(overrides) as (keyof ResolvedClaudeOptions)[]) {
    const value = overrides[key];
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
}
