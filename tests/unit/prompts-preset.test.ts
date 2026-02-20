import { PRESETS, getPresetModules } from '../../src/cli/ui/prompts.js';

describe('PRESETS constant', () => {
  it('contains exactly 4 presets', () => {
    expect(PRESETS).toHaveLength(4);
  });

  it('preset IDs are minimal, standard, full, custom in order', () => {
    expect(PRESETS.map((p) => p.id)).toEqual(['minimal', 'standard', 'full', 'custom']);
  });

  it('full preset contains all 9 optional module IDs', () => {
    const fullPreset = PRESETS.find((p) => p.id === 'full');
    const ALL_NINE = ['auth', 'api', 'theme', 'database', 'i18n', 'push', 'analytics', 'cicd', 'deep-linking'];
    expect(fullPreset?.modules).toEqual(ALL_NINE);
  });
});

describe('getPresetModules()', () => {
  it('returns empty array for minimal preset', () => {
    expect(getPresetModules('minimal')).toEqual([]);
  });

  it('returns auth, api, theme for standard preset', () => {
    expect(getPresetModules('standard')).toEqual(['auth', 'api', 'theme']);
  });

  it('returns empty array for custom preset', () => {
    expect(getPresetModules('custom')).toEqual([]);
  });

  it('returns all 9 modules for full preset', () => {
    const modules = getPresetModules('full');
    expect(modules).toHaveLength(9);
    expect(modules).toContain('auth');
    expect(modules).toContain('deep-linking');
  });

  it('returns empty array (fallback) when presetId does not match any preset', () => {
    // Cast needed since TypeScript restricts PresetId to the 4 known values
    const result = getPresetModules('unknown' as 'minimal');
    expect(result).toEqual([]);
  });
});
