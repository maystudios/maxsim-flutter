import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { TemplateRenderer } from '../../src/scaffold/renderer.js';
import type { TemplateContext } from '../../src/scaffold/renderer.js';

const baseContext: TemplateContext = {
  project: {
    name: 'my-app',
    org: 'com.example',
    description: 'A test app',
  },
  platforms: { ios: true, android: true },
  modules: { auth: true, api: false },
};

describe('TemplateRenderer', () => {
  let renderer: TemplateRenderer;

  beforeEach(() => {
    renderer = new TemplateRenderer();
  });

  describe('basic rendering', () => {
    it('renders a simple template with context variables', () => {
      const result = renderer.render('Hello {{project.name}}!', baseContext);
      expect(result).toBe('Hello my-app!');
    });

    it('renders nested context values', () => {
      const result = renderer.render(
        'org: {{project.org}}, desc: {{project.description}}',
        baseContext,
      );
      expect(result).toBe('org: com.example, desc: A test app');
    });

    it('renders boolean module values', () => {
      const result = renderer.render(
        '{{#if modules.auth}}has auth{{/if}}',
        baseContext,
      );
      expect(result).toBe('has auth');
    });
  });

  describe('ifEquals helper', () => {
    it('renders block when values are equal', () => {
      const result = renderer.render(
        '{{#ifEquals project.name "my-app"}}match{{/ifEquals}}',
        baseContext,
      );
      expect(result).toBe('match');
    });

    it('renders inverse when values are not equal', () => {
      const result = renderer.render(
        '{{#ifEquals project.name "other"}}match{{else}}no match{{/ifEquals}}',
        baseContext,
      );
      expect(result).toBe('no match');
    });
  });

  describe('ifIncludes helper', () => {
    const ctxWithArray: TemplateContext = {
      ...baseContext,
      items: ['foo', 'bar', 'baz'],
    };

    it('renders block when array includes item', () => {
      const result = renderer.render(
        '{{#ifIncludes items "bar"}}found{{/ifIncludes}}',
        ctxWithArray,
      );
      expect(result).toBe('found');
    });

    it('renders inverse when array does not include item', () => {
      const result = renderer.render(
        '{{#ifIncludes items "qux"}}found{{else}}not found{{/ifIncludes}}',
        ctxWithArray,
      );
      expect(result).toBe('not found');
    });

    it('renders inverse when value is not an array', () => {
      const result = renderer.render(
        '{{#ifIncludes project.name "my-app"}}found{{else}}not found{{/ifIncludes}}',
        baseContext,
      );
      expect(result).toBe('not found');
    });
  });

  describe('camelCase helper', () => {
    it('converts kebab-case to camelCase', () => {
      const result = renderer.render('{{camelCase "my-string"}}', baseContext);
      expect(result).toBe('myString');
    });

    it('converts underscore_case to camelCase', () => {
      const result = renderer.render('{{camelCase "my_string"}}', baseContext);
      expect(result).toBe('myString');
    });

    it('returns empty string for non-string input', () => {
      const result = renderer.render('{{camelCase project.name}}', {
        ...baseContext,
        project: { name: 'my-app', org: 'com.example', description: 'test' },
      });
      expect(result).toBe('myApp');
    });
  });

  describe('pascalCase helper', () => {
    it('converts kebab-case to PascalCase', () => {
      const result = renderer.render('{{pascalCase "my-string"}}', baseContext);
      expect(result).toBe('MyString');
    });

    it('converts underscore_case to PascalCase', () => {
      const result = renderer.render(
        '{{pascalCase "my_string"}}',
        baseContext,
      );
      expect(result).toBe('MyString');
    });
  });

  describe('snakeCase helper', () => {
    it('converts kebab-case to snake_case', () => {
      const result = renderer.render('{{snakeCase "my-string"}}', baseContext);
      expect(result).toBe('my_string');
    });

    it('converts camelCase to snake_case', () => {
      const result = renderer.render(
        '{{snakeCase "myString"}}',
        baseContext,
      );
      expect(result).toBe('my_string');
    });
  });

  describe('partials', () => {
    it('registers and uses a partial', () => {
      renderer.registerPartial('greeting', 'Hello {{project.name}}');
      const result = renderer.render('{{> greeting}}', baseContext);
      expect(result).toBe('Hello my-app');
    });

    it('registers multiple partials', () => {
      renderer.registerPartial('part1', 'Part1:{{project.name}}');
      renderer.registerPartial('part2', 'Part2:{{project.org}}');
      const result = renderer.render('{{> part1}} {{> part2}}', baseContext);
      expect(result).toBe('Part1:my-app Part2:com.example');
    });
  });

  describe('registerPartialsFromDir', () => {
    let tmpDir: string;

    beforeEach(async () => {
      tmpDir = await mkdtemp(join(tmpdir(), 'renderer-test-'));
    });

    afterEach(async () => {
      await rm(tmpDir, { recursive: true, force: true });
    });

    it('loads all .hbs files from directory as partials', async () => {
      await writeFile(join(tmpDir, 'header.hbs'), 'HEADER:{{project.name}}');
      await writeFile(join(tmpDir, 'footer.hbs'), 'FOOTER:{{project.org}}');
      await renderer.registerPartialsFromDir(tmpDir);
      const result = renderer.render('{{> header}} {{> footer}}', baseContext);
      expect(result).toBe('HEADER:my-app FOOTER:com.example');
    });

    it('ignores non-.hbs files', async () => {
      await writeFile(join(tmpDir, 'ignore.txt'), 'should not be loaded');
      await writeFile(join(tmpDir, 'valid.hbs'), 'valid');
      await renderer.registerPartialsFromDir(tmpDir);
      const result = renderer.render('{{> valid}}', baseContext);
      expect(result).toBe('valid');
    });
  });

  describe('renderFile', () => {
    let tmpDir: string;

    beforeEach(async () => {
      tmpDir = await mkdtemp(join(tmpdir(), 'renderer-file-test-'));
    });

    afterEach(async () => {
      await rm(tmpDir, { recursive: true, force: true });
    });

    it('reads a .hbs file and renders it with context', async () => {
      const filePath = join(tmpDir, 'template.hbs');
      await writeFile(filePath, 'App: {{project.name}} by {{project.org}}');
      const result = await renderer.renderFile(filePath, baseContext);
      expect(result).toBe('App: my-app by com.example');
    });

    it('renders a file with custom helpers', async () => {
      const filePath = join(tmpDir, 'cased.hbs');
      await writeFile(filePath, '{{pascalCase project.name}}');
      const result = await renderer.renderFile(filePath, baseContext);
      expect(result).toBe('MyApp');
    });
  });
});
