import { join, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import fsExtra from 'fs-extra';
import { load as yamlLoad } from 'js-yaml';
import { ScaffoldEngine } from '../../src/scaffold/engine.js';
import { makeWritableContext } from '../helpers/context-factory.js';
import { useTempDir } from '../helpers/temp-dir.js';
import { createTestRegistry } from '../helpers/registry-factory.js';

const { pathExists } = fsExtra;
const TEMPLATES_DIR = resolve('templates/core');
const MODULES_DIR = resolve('templates/modules');

describe('Push module template coverage', () => {
  const tmp = useTempDir('template-coverage-push-');

  it('generates RequestPermissionUseCase file when push module is enabled', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
      modules: {
        push: { provider: 'firebase' },
        auth: false,
        api: false,
        database: false,
        i18n: false,
        theme: false,
        analytics: false,
        cicd: false,
        deepLinking: false,
      },
    });
    await engine.run(context);

    const usecasePath = join(
      tmp.path,
      'lib/features/push/domain/usecases/request_permission_usecase.dart',
    );
    expect(await pathExists(usecasePath)).toBe(true);
  });

  it('generates HandleNotificationUseCase file when push module is enabled', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
      modules: {
        push: { provider: 'firebase' },
        auth: false,
        api: false,
        database: false,
        i18n: false,
        theme: false,
        analytics: false,
        cicd: false,
        deepLinking: false,
      },
    });
    await engine.run(context);

    const usecasePath = join(
      tmp.path,
      'lib/features/push/domain/usecases/handle_notification_usecase.dart',
    );
    expect(await pathExists(usecasePath)).toBe(true);
  });

  it('RequestPermissionUseCase contains correct class name and call method', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
      modules: {
        push: { provider: 'firebase' },
        auth: false,
        api: false,
        database: false,
        i18n: false,
        theme: false,
        analytics: false,
        cicd: false,
        deepLinking: false,
      },
    });
    await engine.run(context);

    const content = await readFile(
      join(tmp.path, 'lib/features/push/domain/usecases/request_permission_usecase.dart'),
      'utf-8',
    );
    expect(content).toContain('RequestPermissionUseCase');
    expect(content).toContain('Future<bool> call()');
  });

  it('HandleNotificationUseCase exposes a Stream of PushMessage', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
      modules: {
        push: { provider: 'firebase' },
        auth: false,
        api: false,
        database: false,
        i18n: false,
        theme: false,
        analytics: false,
        cicd: false,
        deepLinking: false,
      },
    });
    await engine.run(context);

    const content = await readFile(
      join(tmp.path, 'lib/features/push/domain/usecases/handle_notification_usecase.dart'),
      'utf-8',
    );
    expect(content).toContain('HandleNotificationUseCase');
    expect(content).toContain('Stream<PushMessage> call()');
  });
});

describe('Analytics router wiring', () => {
  const tmp = useTempDir('template-coverage-analytics-');

  it('app_router.dart includes analyticsRouteObserver when analytics is enabled', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
      modules: {
        analytics: { enabled: true },
        auth: false,
        api: false,
        database: false,
        i18n: false,
        theme: false,
        push: false,
        cicd: false,
        deepLinking: false,
      },
    });
    await engine.run(context);

    const routerContent = await readFile(
      join(tmp.path, 'lib/core/router/app_router.dart'),
      'utf-8',
    );
    expect(routerContent).toContain('analyticsRouteObserverProvider');
  });

  it('app_router.dart imports analytics provider when analytics is enabled', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
      modules: {
        analytics: { enabled: true },
        auth: false,
        api: false,
        database: false,
        i18n: false,
        theme: false,
        push: false,
        cicd: false,
        deepLinking: false,
      },
    });
    await engine.run(context);

    const routerContent = await readFile(
      join(tmp.path, 'lib/core/router/app_router.dart'),
      'utf-8',
    );
    expect(routerContent).toContain(
      "import '../../features/analytics/presentation/providers/analytics_provider.dart'",
    );
  });

  it('app_router.dart has no analytics observer when analytics is disabled', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
    });
    const context = makeWritableContext(tmp.path);
    await engine.run(context);

    const routerContent = await readFile(
      join(tmp.path, 'lib/core/router/app_router.dart'),
      'utf-8',
    );
    expect(routerContent).not.toContain('analyticsRouteObserverProvider');
  });
});

describe('Deep-linking router wiring', () => {
  const tmp = useTempDir('template-coverage-deeplink-');

  it('app_router.dart watches deepLinkHandlerProvider when deep-linking is enabled', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
      modules: {
        deepLinking: { scheme: 'myapp', host: 'example.com' },
        auth: false,
        api: false,
        database: false,
        i18n: false,
        theme: false,
        push: false,
        analytics: false,
        cicd: false,
      },
    });
    await engine.run(context);

    const routerContent = await readFile(
      join(tmp.path, 'lib/core/router/app_router.dart'),
      'utf-8',
    );
    expect(routerContent).toContain('deepLinkHandlerProvider');
  });

  it('app_router.dart imports deep_link_provider when deep-linking is enabled', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
      modules: {
        deepLinking: { scheme: 'myapp', host: 'example.com' },
        auth: false,
        api: false,
        database: false,
        i18n: false,
        theme: false,
        push: false,
        analytics: false,
        cicd: false,
      },
    });
    await engine.run(context);

    const routerContent = await readFile(
      join(tmp.path, 'lib/core/router/app_router.dart'),
      'utf-8',
    );
    expect(routerContent).toContain(
      "import '../../features/deep_linking/presentation/providers/deep_link_provider.dart'",
    );
  });

  it('app_router.dart has no deep-link handler when deep-linking is disabled', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
    });
    const context = makeWritableContext(tmp.path);
    await engine.run(context);

    const routerContent = await readFile(
      join(tmp.path, 'lib/core/router/app_router.dart'),
      'utf-8',
    );
    expect(routerContent).not.toContain('deepLinkHandlerProvider');
  });
});

describe('Push module edge cases', () => {
  const tmp = useTempDir('template-coverage-push-edge-');

  it('generates use case files with onesignal provider (provider-agnostic templates)', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
      modules: {
        push: { provider: 'onesignal' },
        auth: false,
        api: false,
        database: false,
        i18n: false,
        theme: false,
        analytics: false,
        cicd: false,
        deepLinking: false,
      },
    });
    await engine.run(context);

    expect(
      await pathExists(
        join(tmp.path, 'lib/features/push/domain/usecases/request_permission_usecase.dart'),
      ),
    ).toBe(true);
    expect(
      await pathExists(
        join(tmp.path, 'lib/features/push/domain/usecases/handle_notification_usecase.dart'),
      ),
    ).toBe(true);
  });

  it('generates onesignal_flutter dep and excludes firebase_messaging when provider is onesignal', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
      modules: {
        push: { provider: 'onesignal' },
        auth: false,
        api: false,
        database: false,
        i18n: false,
        theme: false,
        analytics: false,
        cicd: false,
        deepLinking: false,
      },
    });
    await engine.run(context);

    const pubspecContent = await readFile(join(tmp.path, 'pubspec.yaml'), 'utf-8');
    const pubspec = yamlLoad(pubspecContent) as Record<string, unknown>;
    const deps = pubspec['dependencies'] as Record<string, unknown>;

    expect(deps).toHaveProperty('onesignal_flutter');
    expect(deps).not.toHaveProperty('firebase_messaging');
  });

  it('does not generate push use case files when push module is disabled', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
      modules: {
        push: false,
        auth: false,
        api: false,
        database: false,
        i18n: false,
        theme: false,
        analytics: false,
        cicd: false,
        deepLinking: false,
      },
    });
    await engine.run(context);

    expect(
      await pathExists(join(tmp.path, 'lib/features/push/domain/usecases')),
    ).toBe(false);
  });
});

describe('Analytics router wiring edge cases', () => {
  const tmp = useTempDir('template-coverage-analytics-edge-');

  it('app_router.dart has no analytics wiring when analytics is explicitly false', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
      modules: {
        analytics: false,
        auth: false,
        api: false,
        database: false,
        i18n: false,
        theme: false,
        push: false,
        cicd: false,
        deepLinking: false,
      },
    });
    await engine.run(context);

    const routerContent = await readFile(
      join(tmp.path, 'lib/core/router/app_router.dart'),
      'utf-8',
    );
    expect(routerContent).not.toContain('analyticsRouteObserverProvider');
    expect(routerContent).not.toContain('analytics_provider.dart');
  });

  it('analyticsRouteObserver appears inside the GoRouter observers list', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
      modules: {
        analytics: { enabled: true },
        auth: false,
        api: false,
        database: false,
        i18n: false,
        theme: false,
        push: false,
        cicd: false,
        deepLinking: false,
      },
    });
    await engine.run(context);

    const routerContent = await readFile(
      join(tmp.path, 'lib/core/router/app_router.dart'),
      'utf-8',
    );
    // Observer must be inside the observers: [...] array of GoRouter
    expect(routerContent).toMatch(/observers:\s*\[[\s\S]*analyticsRouteObserverProvider[\s\S]*\]/);
  }, 15000);
});

describe('Deep-linking router wiring edge cases', () => {
  const tmp = useTempDir('template-coverage-deeplink-edge-');

  it('app_router.dart has no deep-link wiring when deepLinking is explicitly false', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
      modules: {
        deepLinking: false,
        auth: false,
        api: false,
        database: false,
        i18n: false,
        theme: false,
        push: false,
        analytics: false,
        cicd: false,
      },
    });
    await engine.run(context);

    const routerContent = await readFile(
      join(tmp.path, 'lib/core/router/app_router.dart'),
      'utf-8',
    );
    expect(routerContent).not.toContain('deepLinkHandlerProvider');
    expect(routerContent).not.toContain('deep_link_provider.dart');
  });

  it('deepLinkHandlerProvider is watched before GoRouter is constructed', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
      modules: {
        deepLinking: { scheme: 'myapp', host: 'example.com' },
        auth: false,
        api: false,
        database: false,
        i18n: false,
        theme: false,
        push: false,
        analytics: false,
        cicd: false,
      },
    });
    await engine.run(context);

    const routerContent = await readFile(
      join(tmp.path, 'lib/core/router/app_router.dart'),
      'utf-8',
    );
    const deepLinkIdx = routerContent.indexOf('ref.watch(deepLinkHandlerProvider)');
    const goRouterIdx = routerContent.indexOf('GoRouter(');
    expect(deepLinkIdx).toBeGreaterThanOrEqual(0);
    expect(deepLinkIdx).toBeLessThan(goRouterIdx);
  }, 15000);
});

describe('Combined analytics and deep-linking router wiring', () => {
  const tmp = useTempDir('template-coverage-combined-');

  it('app_router.dart includes both analytics observer and deep-link handler when both are enabled', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
      modules: {
        analytics: { enabled: true },
        deepLinking: { scheme: 'myapp', host: 'example.com' },
        auth: false,
        api: false,
        database: false,
        i18n: false,
        theme: false,
        push: false,
        cicd: false,
      },
    });
    await engine.run(context);

    const routerContent = await readFile(
      join(tmp.path, 'lib/core/router/app_router.dart'),
      'utf-8',
    );
    expect(routerContent).toContain('analyticsRouteObserverProvider');
    expect(routerContent).toContain('deepLinkHandlerProvider');
    expect(routerContent).toContain(
      "import '../../features/analytics/presentation/providers/analytics_provider.dart'",
    );
    expect(routerContent).toContain(
      "import '../../features/deep_linking/presentation/providers/deep_link_provider.dart'",
    );
  }, 15000);

  it('enabling both modules does not introduce duplicate GoRouter constructor calls', async () => {
    const engine = new ScaffoldEngine({
      templatesDir: TEMPLATES_DIR,
      modulesTemplatesDir: MODULES_DIR,
      registry: createTestRegistry(),
    });
    const context = makeWritableContext(tmp.path, {
      modules: {
        analytics: { enabled: true },
        deepLinking: { scheme: 'myapp', host: 'example.com' },
        auth: false,
        api: false,
        database: false,
        i18n: false,
        theme: false,
        push: false,
        cicd: false,
      },
    });
    await engine.run(context);

    const routerContent = await readFile(
      join(tmp.path, 'lib/core/router/app_router.dart'),
      'utf-8',
    );
    const goRouterMatches = routerContent.match(/GoRouter\s*\(/g);
    expect(goRouterMatches).toHaveLength(1);
  }, 15000);
});
