import { resolvePreset } from '../../src/claude-setup/preset-resolver.js';
import type { ResolvedClaudeOptions } from '../../src/claude-setup/preset-resolver.js';

describe('resolvePreset', () => {
  describe('minimal preset', () => {
    it('enables only claudeMd and rules', () => {
      const result = resolvePreset('minimal');
      expect(result.claudeMd).toBe(true);
      expect(result.rules).toBe(true);
      expect(result.agents).toBe(false);
      expect(result.hooks).toBe(false);
      expect(result.skills).toBe(false);
      expect(result.commands).toBe(false);
      expect(result.mcp).toBe(false);
    });
  });

  describe('standard preset', () => {
    it('enables all options except mcp', () => {
      const result = resolvePreset('standard');
      expect(result.claudeMd).toBe(true);
      expect(result.rules).toBe(true);
      expect(result.agents).toBe(true);
      expect(result.hooks).toBe(true);
      expect(result.skills).toBe(true);
      expect(result.commands).toBe(true);
      expect(result.mcp).toBe(false);
    });
  });

  describe('full preset', () => {
    it('enables all options', () => {
      const result = resolvePreset('full');
      const keys = Object.keys(result) as (keyof ResolvedClaudeOptions)[];
      for (const key of keys) {
        expect(result[key]).toBe(true);
      }
    });
  });

  describe('undefined preset', () => {
    it('defaults to standard behaviour', () => {
      const result = resolvePreset(undefined);
      expect(result.claudeMd).toBe(true);
      expect(result.rules).toBe(true);
      expect(result.agents).toBe(true);
      expect(result.hooks).toBe(true);
      expect(result.skills).toBe(true);
      expect(result.commands).toBe(true);
      expect(result.mcp).toBe(false);
    });

    it('matches resolvePreset("standard") exactly', () => {
      expect(resolvePreset(undefined)).toEqual(resolvePreset('standard'));
    });
  });

  describe('overrides', () => {
    it('enables a disabled component in minimal preset', () => {
      const result = resolvePreset('minimal', { agents: true });
      expect(result.agents).toBe(true);
      // minimal base values still apply for others
      expect(result.claudeMd).toBe(true);
      expect(result.rules).toBe(true);
      expect(result.hooks).toBe(false);
      expect(result.skills).toBe(false);
      expect(result.commands).toBe(false);
      expect(result.mcp).toBe(false);
    });

    it('disables an enabled component in full preset', () => {
      const result = resolvePreset('full', { mcp: false });
      expect(result.mcp).toBe(false);
      // all other full options still true
      expect(result.claudeMd).toBe(true);
      expect(result.rules).toBe(true);
      expect(result.agents).toBe(true);
      expect(result.hooks).toBe(true);
      expect(result.skills).toBe(true);
      expect(result.commands).toBe(true);
    });

    it('applies multiple overrides simultaneously', () => {
      const result = resolvePreset('minimal', { agents: true, hooks: true, mcp: true });
      expect(result.claudeMd).toBe(true);
      expect(result.rules).toBe(true);
      expect(result.agents).toBe(true);
      expect(result.hooks).toBe(true);
      expect(result.mcp).toBe(true);
      expect(result.skills).toBe(false);
      expect(result.commands).toBe(false);
    });

    it('ignores undefined override values (does not override with undefined)', () => {
      const result = resolvePreset('full', { mcp: undefined });
      // undefined override should not override the preset default
      expect(result.mcp).toBe(true);
    });
  });
});
