import { join } from 'node:path';
import { access, readFile } from 'node:fs/promises';
import { load as yamlLoad } from 'js-yaml';
import { useTempDir } from '../helpers/temp-dir.js';
import { makeTestContext } from '../helpers/context-factory.js';
import { runPlan } from '../../src/plan/plan-orchestrator.js';
import { generatePlanAppSkill } from '../../src/plan/skill-generator.js';
import { generateBriefTemplate } from '../../src/plan/brief-template-generator.js';
import { classifyAppType } from '../../src/plan/app-type-classifier.js';
import { generateArchitectureDoc } from '../../src/plan/architecture-generator.js';
import { generateJourneyDecompositionPrompt } from '../../src/plan/journey-to-stories.js';
import { writePartialConfig } from '../../src/plan/config-writer.js';

describe('Plan command — end-to-end integration', () => {
  const tmp = useTempDir('plan-integration-');

  // Test 1: runPlan creates correct directory structure
  it('runPlan creates all 3 expected files in the project directory', async () => {
    const projectDir = join(tmp.path, 'integration_project');
    await runPlan({
      name: 'integration_project',
      description: 'An integration test app.',
      outputDir: projectDir,
    });

    await expect(access(join(projectDir, 'maxsim.config.yaml'))).resolves.toBeUndefined();
    await expect(access(join(projectDir, '.claude', 'skills', 'plan-app.md'))).resolves.toBeUndefined();
    await expect(access(join(projectDir, 'docs', 'project-brief-template.md'))).resolves.toBeUndefined();
  });

  // Test 2: plan-app.md has model: claude-opus-4-6 (Opus)
  it('plan-app.md has model: claude-opus-4-6 in frontmatter', async () => {
    const projectDir = join(tmp.path, 'opus_project');
    await runPlan({
      name: 'opus_project',
      description: 'A project to verify Opus model usage.',
      outputDir: projectDir,
    });

    const skillContent = await readFile(join(projectDir, '.claude', 'skills', 'plan-app.md'), 'utf-8');
    expect(skillContent).toContain('model: claude-opus-4-6');
  });

  // Test 3: skill includes all 9 steps
  it('generated plan-app skill covers all 9 steps', async () => {
    const skill = generatePlanAppSkill({ name: 'test', description: 'Test app.' });
    for (let i = 1; i <= 9; i++) {
      expect(skill).toMatch(new RegExp(`Step ${i}`, 'i'));
    }
  });

  // Test 4: skill has module suggestion matrix (Step 4)
  it('skill includes all 7 app types in module suggestion matrix', () => {
    const skill = generatePlanAppSkill({ name: 'test', description: 'Test.' });
    const appTypes = ['team-collaboration', 'e-commerce', 'content-social', 'utility-tool', 'fitness-health', 'education', 'general'];
    for (const appType of appTypes) {
      expect(skill).toContain(appType);
    }
  });

  // Test 5: project-brief template has all required sections
  it('project-brief template has all required sections', () => {
    const template = generateBriefTemplate({ name: 'my_app', description: 'A test app.' });
    expect(template).toMatch(/problem statement/i);
    expect(template).toMatch(/target users?/i);
    expect(template).toMatch(/user journeys?/i);
    expect(template).toMatch(/non.goals?/i);
    expect(template).toMatch(/success metrics?/i);
    expect(template).toMatch(/description/i);
  });

  // Test 6: app-type classifier returns correct types for various descriptions
  it('app-type classifier returns correct type for known app descriptions', () => {
    const cases: Array<[string, string]> = [
      ['team chat with channels and messages', 'team-collaboration'],
      ['online shop with checkout and payment', 'e-commerce'],
      ['social feed with posts and likes', 'content-social'],
      ['simple calculator tool', 'utility-tool'],
      ['workout tracker with calories', 'fitness-health'],
      ['online courses with quizzes', 'education'],
    ];

    for (const [description, expectedType] of cases) {
      const result = classifyAppType(description);
      expect(result.type).toBe(expectedType);
      expect(result.confidence).toBeGreaterThan(0);
    }
  });

  // Test 7: architecture generator produces valid ASCII diagrams
  it('architecture generator produces provider tree ASCII diagram', () => {
    const context = makeTestContext({
      projectName: 'test_app',
      modules: {
        auth: { provider: 'firebase' },
        api: false,
        database: false,
        i18n: false,
        theme: false,
        push: false,
        analytics: false,
        cicd: false,
        deepLinking: false,
      },
    });

    const doc = generateArchitectureDoc(context);
    expect(doc).toContain('ProviderScope');
    expect(doc).toContain('├──');
    expect(doc).toContain('routerProvider');
    expect(doc).toContain('authRepositoryProvider');
  });

  it('architecture generator produces navigation flow diagram', () => {
    const context = makeTestContext({
      projectName: 'nav_app',
      modules: {
        auth: { provider: 'firebase' },
        api: false,
        database: false,
        i18n: false,
        theme: false,
        push: false,
        analytics: false,
        cicd: false,
        deepLinking: false,
      },
    });

    const doc = generateArchitectureDoc(context);
    expect(doc).toMatch(/navigation flow/i);
    expect(doc).toContain('/login');
  });

  // Test 8: journey-to-stories produces valid story structure prompt
  it('journey decomposition prompt includes domain/data/presentation layers', () => {
    const prompt = generateJourneyDecompositionPrompt(['User signs up and logs in']);
    expect(prompt).toMatch(/domain/i);
    expect(prompt).toMatch(/data/i);
    expect(prompt).toMatch(/presentation/i);
    expect(prompt).toContain('User signs up and logs in');
  });

  it('journey decomposition prompt enforces dependency chain rules', () => {
    const prompt = generateJourneyDecompositionPrompt(['User browses products']);
    expect(prompt).toMatch(/dependenc/i);
    expect(prompt).toContain('domain ← data ← presentation');
  });

  // Test 9: partial maxsim.config.yaml is valid YAML
  it('writePartialConfig produces valid YAML with required fields', async () => {
    const configDir = join(tmp.path, 'yaml_test');
    await writePartialConfig(configDir, {
      name: 'yaml_test_app',
      description: 'Testing YAML validity.',
    });

    const raw = await readFile(join(configDir, 'maxsim.config.yaml'), 'utf-8');
    const parsed = yamlLoad(raw) as Record<string, unknown>;

    expect(parsed).toBeTruthy();
    const project = parsed['project'] as Record<string, unknown>;
    expect(project).toBeTruthy();
    expect(project['name']).toBe('yaml_test_app');
  });

  // Test 10: runPlan result has the right structure
  it('runPlan returns correct PlanResult with projectDir and filesCreated', async () => {
    const projectDir = join(tmp.path, 'result_test');
    const result = await runPlan({
      name: 'result_test',
      description: 'Testing result structure.',
      outputDir: projectDir,
    });

    expect(result.projectDir).toBe(projectDir);
    expect(result.filesCreated).toBeInstanceOf(Array);
    expect(result.filesCreated.length).toBe(3);
    // All paths should be within the project dir
    for (const filePath of result.filesCreated) {
      expect(filePath.startsWith(projectDir)).toBe(true);
    }
  });
});
