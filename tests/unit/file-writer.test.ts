import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathExists } from 'fs-extra';
import { FileWriter } from '../../src/scaffold/file-writer.js';

describe('FileWriter', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'file-writer-test-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  describe('writeFile', () => {
    it('writes a new file successfully', async () => {
      const writer = new FileWriter({ outputDir: tmpDir });
      const outcome = await writer.writeFile('hello.txt', 'hello world');
      expect(outcome).toBe('written');
      const content = await readFile(join(tmpDir, 'hello.txt'), 'utf-8');
      expect(content).toBe('hello world');
    });

    it('creates nested directories as needed', async () => {
      const writer = new FileWriter({ outputDir: tmpDir });
      const outcome = await writer.writeFile(
        'sub/dir/file.txt',
        'nested content',
      );
      expect(outcome).toBe('written');
      const content = await readFile(
        join(tmpDir, 'sub/dir/file.txt'),
        'utf-8',
      );
      expect(content).toBe('nested content');
    });
  });

  describe('dry-run mode', () => {
    it('does not create files when dryRun is true', async () => {
      const writer = new FileWriter({ outputDir: tmpDir, dryRun: true });
      const outcome = await writer.writeFile('dryrun.txt', 'content');
      expect(outcome).toBe('written');
      const exists = await pathExists(join(tmpDir, 'dryrun.txt'));
      expect(exists).toBe(false);
    });

    it('returns written for all files in dry-run mode via writeAll', async () => {
      const writer = new FileWriter({ outputDir: tmpDir, dryRun: true });
      const files = new Map([
        ['a.txt', 'content a'],
        ['b.txt', 'content b'],
      ]);
      const result = await writer.writeAll(files);
      expect(result.written).toEqual(['a.txt', 'b.txt']);
      expect(result.skipped).toEqual([]);
      expect(result.conflicts).toEqual([]);
    });

    it('does not create files in nested dirs during dry-run', async () => {
      const writer = new FileWriter({ outputDir: tmpDir, dryRun: true });
      await writer.writeFile('nested/file.txt', 'content');
      const exists = await pathExists(join(tmpDir, 'nested'));
      expect(exists).toBe(false);
    });
  });

  describe('conflict detection', () => {
    it('detects conflict when file already exists in ask mode', async () => {
      await writeFile(join(tmpDir, 'existing.txt'), 'original');
      const writer = new FileWriter({
        outputDir: tmpDir,
        overwriteMode: 'ask',
      });
      const outcome = await writer.writeFile('existing.txt', 'new content');
      expect(outcome).toBe('conflict');
      // File should remain unchanged
      const content = await readFile(join(tmpDir, 'existing.txt'), 'utf-8');
      expect(content).toBe('original');
    });

    it('calls onConflict callback in ask mode and overwrites when true', async () => {
      await writeFile(join(tmpDir, 'existing.txt'), 'original');
      const writer = new FileWriter({
        outputDir: tmpDir,
        overwriteMode: 'ask',
        onConflict: async () => true,
      });
      const outcome = await writer.writeFile('existing.txt', 'new content');
      expect(outcome).toBe('written');
      const content = await readFile(join(tmpDir, 'existing.txt'), 'utf-8');
      expect(content).toBe('new content');
    });

    it('calls onConflict callback in ask mode and skips when false', async () => {
      await writeFile(join(tmpDir, 'existing.txt'), 'original');
      const writer = new FileWriter({
        outputDir: tmpDir,
        overwriteMode: 'ask',
        onConflict: async () => false,
      });
      const outcome = await writer.writeFile('existing.txt', 'new content');
      expect(outcome).toBe('skipped');
      const content = await readFile(join(tmpDir, 'existing.txt'), 'utf-8');
      expect(content).toBe('original');
    });
  });

  describe('overwrite always mode', () => {
    it('overwrites existing files without asking', async () => {
      await writeFile(join(tmpDir, 'file.txt'), 'original');
      const writer = new FileWriter({
        outputDir: tmpDir,
        overwriteMode: 'always',
      });
      const outcome = await writer.writeFile('file.txt', 'updated');
      expect(outcome).toBe('written');
      const content = await readFile(join(tmpDir, 'file.txt'), 'utf-8');
      expect(content).toBe('updated');
    });

    it('writes new files normally', async () => {
      const writer = new FileWriter({
        outputDir: tmpDir,
        overwriteMode: 'always',
      });
      const outcome = await writer.writeFile('new.txt', 'content');
      expect(outcome).toBe('written');
    });
  });

  describe('overwrite never mode', () => {
    it('skips existing files', async () => {
      await writeFile(join(tmpDir, 'file.txt'), 'original');
      const writer = new FileWriter({
        outputDir: tmpDir,
        overwriteMode: 'never',
      });
      const outcome = await writer.writeFile('file.txt', 'updated');
      expect(outcome).toBe('skipped');
      const content = await readFile(join(tmpDir, 'file.txt'), 'utf-8');
      expect(content).toBe('original');
    });

    it('writes new files normally', async () => {
      const writer = new FileWriter({
        outputDir: tmpDir,
        overwriteMode: 'never',
      });
      const outcome = await writer.writeFile('new.txt', 'content');
      expect(outcome).toBe('written');
    });
  });

  describe('writeAll', () => {
    it('writes all files and returns correct WriteResult', async () => {
      const writer = new FileWriter({ outputDir: tmpDir });
      const files = new Map([
        ['a.txt', 'content a'],
        ['b/c.txt', 'content bc'],
      ]);
      const result = await writer.writeAll(files);
      expect(result.written).toContain('a.txt');
      expect(result.written).toContain('b/c.txt');
      expect(result.skipped).toEqual([]);
      expect(result.conflicts).toEqual([]);
    });

    it('counts skipped files correctly in never mode', async () => {
      await writeFile(join(tmpDir, 'existing.txt'), 'original');
      const writer = new FileWriter({
        outputDir: tmpDir,
        overwriteMode: 'never',
      });
      const files = new Map([
        ['existing.txt', 'new'],
        ['new.txt', 'content'],
      ]);
      const result = await writer.writeAll(files);
      expect(result.written).toEqual(['new.txt']);
      expect(result.skipped).toEqual(['existing.txt']);
      expect(result.conflicts).toEqual([]);
    });

    it('counts conflict files correctly in ask mode without callback', async () => {
      await writeFile(join(tmpDir, 'conflict.txt'), 'original');
      const writer = new FileWriter({
        outputDir: tmpDir,
        overwriteMode: 'ask',
      });
      const files = new Map([['conflict.txt', 'new']]);
      const result = await writer.writeAll(files);
      expect(result.written).toEqual([]);
      expect(result.skipped).toEqual([]);
      expect(result.conflicts).toEqual(['conflict.txt']);
    });
  });
});
