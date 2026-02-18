import Handlebars from 'handlebars';
import { readFile, readdir } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';

export interface TemplateContext {
  project: {
    name: string;
    org: string;
    description: string;
  };
  platforms: Record<string, boolean>;
  modules: Record<string, boolean | Record<string, unknown>>;
  [key: string]: unknown;
}

function toCamelCase(str: string): string {
  return str.replace(/[-_](.)/g, (_, char: string) => char.toUpperCase());
}

function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '')
    .replace(/[-\s]+/g, '_');
}

export class TemplateRenderer {
  private readonly hbs: typeof Handlebars;

  constructor() {
    this.hbs = Handlebars.create();
    this.registerHelpers();
  }

  private registerHelpers(): void {
    this.hbs.registerHelper('ifEquals', function (
      this: unknown,
      a: unknown,
      b: unknown,
      options: Handlebars.HelperOptions,
    ) {
      if (a === b) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    this.hbs.registerHelper('ifIncludes', function (
      this: unknown,
      arr: unknown,
      item: unknown,
      options: Handlebars.HelperOptions,
    ) {
      if (Array.isArray(arr) && arr.includes(item)) {
        return options.fn(this);
      }
      return options.inverse(this);
    });

    this.hbs.registerHelper('camelCase', (str: unknown) => {
      if (typeof str !== 'string') return '';
      return toCamelCase(str);
    });

    this.hbs.registerHelper('pascalCase', (str: unknown) => {
      if (typeof str !== 'string') return '';
      return toPascalCase(str);
    });

    this.hbs.registerHelper('snakeCase', (str: unknown) => {
      if (typeof str !== 'string') return '';
      return toSnakeCase(str);
    });
  }

  registerPartial(name: string, template: string): void {
    this.hbs.registerPartial(name, template);
  }

  async registerPartialsFromDir(dirPath: string): Promise<void> {
    const entries = await readdir(dirPath, { withFileTypes: true });
    const hbsFiles = entries.filter(
      (e) => e.isFile() && extname(e.name) === '.hbs',
    );

    await Promise.all(
      hbsFiles.map(async (entry) => {
        const filePath = join(dirPath, entry.name);
        const content = await readFile(filePath, 'utf-8');
        const partialName = basename(entry.name, '.hbs');
        this.hbs.registerPartial(partialName, content);
      }),
    );
  }

  render(template: string, context: TemplateContext): string {
    const compiled = this.hbs.compile(template);
    return compiled(context);
  }

  async renderFile(filePath: string, context: TemplateContext): Promise<string> {
    const template = await readFile(filePath, 'utf-8');
    return this.render(template, context);
  }
}
