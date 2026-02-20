import { MaxsimConfigSchema } from '../../src/core/config/schema.js';

const minimalProjectConfig = {
  project: { name: 'my_app', orgId: 'com.example' },
};

describe('MaxsimConfigSchema — externalModules', () => {
  it('defaults externalModules to [] when the field is omitted', () => {
    const result = MaxsimConfigSchema.parse(minimalProjectConfig);
    expect(result.externalModules).toEqual([]);
  });

  it('parses externalModules array with multiple valid package names', () => {
    const result = MaxsimConfigSchema.parse({
      ...minimalProjectConfig,
      externalModules: ['maxsim-module-stripe', 'maxsim-module-analytics'],
    });
    expect(result.externalModules).toEqual([
      'maxsim-module-stripe',
      'maxsim-module-analytics',
    ]);
  });

  it('fails parsing when externalModules contains a non-string entry (e.g., 123)', () => {
    expect(() =>
      MaxsimConfigSchema.parse({
        ...minimalProjectConfig,
        externalModules: [123],
      }),
    ).toThrow();
  });

  it('full config including externalModules passes MaxsimConfigSchema.parse()', () => {
    const result = MaxsimConfigSchema.parse({
      version: '1',
      project: { name: 'my_app', orgId: 'com.example', description: 'An app' },
      platforms: ['android', 'ios'],
      modules: { auth: { enabled: true, provider: 'firebase' } },
      externalModules: ['maxsim-module-stripe'],
      scaffold: { overwriteExisting: 'ask', runDartFormat: true, runPubGet: true, runBuildRunner: true, dryRun: false },
    });

    expect(result.externalModules).toEqual(['maxsim-module-stripe']);
    expect(result.project.name).toBe('my_app');
  });
});
