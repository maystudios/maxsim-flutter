import { join, resolve } from 'node:path';
import { readFile } from 'node:fs/promises';
import fsExtra from 'fs-extra';
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
