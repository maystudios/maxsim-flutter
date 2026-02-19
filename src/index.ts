// Scaffold
export { ScaffoldEngine } from './scaffold/engine.js';
export type { ScaffoldResult, ScaffoldEngineOptions } from './scaffold/engine.js';

export { TemplateRenderer } from './scaffold/renderer.js';
export type { TemplateContext } from './scaffold/renderer.js';

export { FileWriter } from './scaffold/file-writer.js';
export type { FileWriterOptions, WriteResult, OverwriteMode } from './scaffold/file-writer.js';

// Modules
export { ModuleRegistry } from './modules/registry.js';
export { ModuleResolver } from './modules/resolver.js';
export type { ResolveResult } from './modules/resolver.js';
export { ModuleComposer, pickNewerVersion } from './modules/composer.js';
export type { ComposeResult } from './modules/composer.js';

// Core
export { createProjectContext } from './core/context.js';
export type { ProjectContext } from './core/context.js';

export { MaxsimConfigSchema } from './core/config/schema.js';
export { parseConfig, loadConfig } from './core/config/loader.js';
export { validateEnvironment } from './core/validator.js';
export type { ValidationResult } from './core/validator.js';

// Types
export type { MaxsimConfig } from './types/config.js';
export type {
  ModuleManifest,
  ModuleContribution,
  ModuleQuestion,
  ProviderContribution,
  RouteContribution,
} from './types/module.js';
export type { GeneratedFile, TemplateInstruction, Platform } from './types/project.js';
