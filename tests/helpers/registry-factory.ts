import { ModuleRegistry } from '../../src/modules/registry.js';
import { manifest as coreManifest } from '../../src/modules/definitions/core/module.js';
import { manifest as authManifest } from '../../src/modules/definitions/auth/module.js';
import { manifest as apiManifest } from '../../src/modules/definitions/api/module.js';
import { manifest as themeManifest } from '../../src/modules/definitions/theme/module.js';
import { manifest as databaseManifest } from '../../src/modules/definitions/database/module.js';
import { manifest as i18nManifest } from '../../src/modules/definitions/i18n/module.js';
import { manifest as pushManifest } from '../../src/modules/definitions/push/module.js';
import { manifest as analyticsManifest } from '../../src/modules/definitions/analytics/module.js';
import { manifest as cicdManifest } from '../../src/modules/definitions/cicd/module.js';
import { manifest as deepLinkingManifest } from '../../src/modules/definitions/deep-linking/module.js';

/**
 * Build a pre-loaded registry with ALL 10 module manifests (core + 9 optional).
 * Use in integration tests that need a fully populated registry.
 */
export function createTestRegistry(): ModuleRegistry {
  const registry = new ModuleRegistry();
  registry.register(coreManifest);
  registry.register(authManifest);
  registry.register(apiManifest);
  registry.register(themeManifest);
  registry.register(databaseManifest);
  registry.register(i18nManifest);
  registry.register(pushManifest);
  registry.register(analyticsManifest);
  registry.register(cicdManifest);
  registry.register(deepLinkingManifest);
  return registry;
}
