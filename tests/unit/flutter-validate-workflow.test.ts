import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { load as yamlLoad } from 'js-yaml';

const WORKFLOW_PATH = join(process.cwd(), '.github', 'workflows', 'flutter-validate.yml');

type WorkflowJob = {
  strategy?: {
    'fail-fast'?: boolean;
    matrix?: {
      include?: Array<{ name: string; [key: string]: unknown }>;
    };
  };
  steps?: Array<{ uses?: string; run?: string; [key: string]: unknown }>;
};

type Workflow = {
  on?: Record<string, unknown>;
  jobs?: Record<string, WorkflowJob>;
};

async function loadWorkflow(): Promise<Workflow> {
  const content = await readFile(WORKFLOW_PATH, 'utf-8');
  return yamlLoad(content) as Workflow;
}

describe('flutter-validate.yml — workflow structure', () => {
  it('file exists and is valid YAML', async () => {
    await expect(loadWorkflow()).resolves.not.toThrow();
    const wf = await loadWorkflow();
    expect(wf).toBeDefined();
    expect(typeof wf).toBe('object');
  });

  it('uses subosito/flutter-action@v2 in at least one step', async () => {
    const wf = await loadWorkflow();
    const job = wf.jobs?.['validate'];
    const steps = job?.steps ?? [];
    const usesFlutter = steps.some((s) => s.uses === 'subosito/flutter-action@v2');
    expect(usesFlutter).toBe(true);
  });

  it('has exactly 4 matrix combinations', async () => {
    const wf = await loadWorkflow();
    const matrix = wf.jobs?.['validate']?.strategy?.matrix;
    expect(matrix?.include).toHaveLength(4);
  });

  it('matrix combination names are correct', async () => {
    const wf = await loadWorkflow();
    const include = wf.jobs?.['validate']?.strategy?.matrix?.include ?? [];
    const names = include.map((e) => e.name);
    expect(names).toContain('core-only');
    expect(names).toContain('core-auth-firebase');
    expect(names).toContain('core-api');
    expect(names).toContain('core-auth-api-theme');
  });

  it('has a step that runs build_runner build', async () => {
    const wf = await loadWorkflow();
    const steps = wf.jobs?.['validate']?.steps ?? [];
    const hasBuildRunner = steps.some((s) => typeof s.run === 'string' && s.run.includes('build_runner build'));
    expect(hasBuildRunner).toBe(true);
  });

  it('has a step that runs flutter analyze', async () => {
    const wf = await loadWorkflow();
    const steps = wf.jobs?.['validate']?.steps ?? [];
    const hasAnalyze = steps.some((s) => typeof s.run === 'string' && s.run.includes('flutter analyze'));
    expect(hasAnalyze).toBe(true);
  });

  it('triggers on pull_request and workflow_dispatch', async () => {
    const wf = await loadWorkflow();
    const triggers = wf.on ?? {};
    expect(triggers).toHaveProperty('pull_request');
    expect(triggers).toHaveProperty('workflow_dispatch');
  });

  it('matrix uses fail-fast: false', async () => {
    const wf = await loadWorkflow();
    const strategy = wf.jobs?.['validate']?.strategy;
    expect(strategy?.['fail-fast']).toBe(false);
  });
});
