import type { ModuleManifest } from '../../../types/module.js';

/**
 * Database module supporting local persistence with Drift (SQLite),
 * Hive (NoSQL box store), or Isar (NoSQL high-performance).
 * Generates Clean Architecture layers with engine-specific datasource.
 */
export const manifest: ModuleManifest = {
  id: 'database',
  name: 'Database',
  description: 'Local database with drift, hive, or isar',
  requires: [],
  templateDir: 'templates/modules/database',
  ralphPhase: 2,

  questions: [
    {
      id: 'engine',
      message: 'Which database engine?',
      type: 'select',
      options: [
        { value: 'drift', label: 'Drift (SQLite)' },
        { value: 'hive', label: 'Hive (NoSQL)' },
        { value: 'isar', label: 'Isar (NoSQL)' },
      ],
      defaultValue: 'drift',
    },
  ],

  contributions: {
    pubspecDependencies: {
      'drift': '^2.22.1',
      'sqlite3_flutter_libs': '^0.5.28',
      'path_provider': '^2.1.5',
      'path': '^1.9.0',
    },
    pubspecDevDependencies: {
      'drift_dev': '^2.22.1',
    },
    providers: [
      {
        name: 'databaseProvider',
        importPath: '../../features/database/presentation/providers/database_provider.dart',
      },
    ],
    routes: [],
    envVars: [],
  },

  isEnabled: (context) => context.modules.database !== false,
};
