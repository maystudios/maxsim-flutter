/**
 * SNAPSHOT UPDATE WORKFLOW
 *
 * Snapshots are stored in __snapshots__/dart-snapshots.test.ts.snap
 * and committed to source control.
 *
 * When template content changes intentionally:
 *   npm test -- --testPathPattern=dart-snapshots -u
 *
 * CI will fail if snapshot content drifts without running -u.
 * This catches accidental template regressions.
 */
import { resolve } from 'node:path';
import { TemplateRenderer } from '../../src/scaffold/renderer.js';
import { buildTemplateContext } from '../../src/scaffold/template-helpers.js';
import { makeTestContext } from '../helpers/context-factory.js';

const renderer = new TemplateRenderer();

const allModulesFalse = {
  auth: false,
  api: false,
  database: false,
  i18n: false,
  theme: false,
  push: false,
  analytics: false,
  cicd: false,
  deepLinking: false,
} as const;

describe('Core template snapshots — base project', () => {
  it('main.dart renders correctly for base project', async () => {
    const ctx = buildTemplateContext(makeTestContext());
    const rendered = await renderer.renderFile(
      resolve('templates/core/lib/main.dart.hbs'),
      ctx,
    );
    expect(rendered).toMatchSnapshot();
  });

  it('pubspec.yaml renders correctly for base project', async () => {
    const ctx = buildTemplateContext(makeTestContext());
    const rendered = await renderer.renderFile(
      resolve('templates/core/pubspec.yaml.hbs'),
      ctx,
    );
    expect(rendered).toMatchSnapshot();
  });

  it('app_router.dart renders correctly without modules', async () => {
    const ctx = buildTemplateContext(makeTestContext());
    const rendered = await renderer.renderFile(
      resolve('templates/core/lib/core/router/app_router.dart.hbs'),
      ctx,
    );
    expect(rendered).toMatchSnapshot();
  });
});

describe('app_router.dart module combination snapshots', () => {
  it('app_router.dart wires analytics observer when analytics enabled', async () => {
    const ctx = buildTemplateContext(
      makeTestContext({ modules: { ...allModulesFalse, analytics: { enabled: true } } }),
    );
    const rendered = await renderer.renderFile(
      resolve('templates/core/lib/core/router/app_router.dart.hbs'),
      ctx,
    );
    expect(rendered).toMatchSnapshot();
  });

  it('app_router.dart activates deep-link handler when deep-linking enabled', async () => {
    const ctx = buildTemplateContext(
      makeTestContext({
        modules: {
          ...allModulesFalse,
          deepLinking: { scheme: 'myapp', host: 'example.com' },
        },
      }),
    );
    const rendered = await renderer.renderFile(
      resolve('templates/core/lib/core/router/app_router.dart.hbs'),
      ctx,
    );
    expect(rendered).toMatchSnapshot();
  });

  it('app_router.dart wires both analytics and deep-linking when both enabled', async () => {
    const ctx = buildTemplateContext(
      makeTestContext({
        modules: {
          ...allModulesFalse,
          analytics: { enabled: true },
          deepLinking: { scheme: 'myapp', host: 'example.com' },
        },
      }),
    );
    const rendered = await renderer.renderFile(
      resolve('templates/core/lib/core/router/app_router.dart.hbs'),
      ctx,
    );
    expect(rendered).toMatchSnapshot();
  });
});

describe('Module template snapshots', () => {
  it('auth login_page.dart renders correctly', async () => {
    const ctx = buildTemplateContext(
      makeTestContext({ modules: { ...allModulesFalse, auth: { provider: 'firebase' } } }),
    );
    const rendered = await renderer.renderFile(
      resolve(
        'templates/modules/auth/lib/features/auth/presentation/pages/login_page.dart.hbs',
      ),
      ctx,
    );
    expect(rendered).toMatchSnapshot();
  });

  it('push request_permission_usecase.dart renders correctly', async () => {
    const ctx = buildTemplateContext(
      makeTestContext({ modules: { ...allModulesFalse, push: { provider: 'firebase' } } }),
    );
    const rendered = await renderer.renderFile(
      resolve(
        'templates/modules/push/lib/features/push/domain/usecases/request_permission_usecase.dart.hbs',
      ),
      ctx,
    );
    expect(rendered).toMatchSnapshot();
  });

  it('analytics route observer renders correctly', async () => {
    const ctx = buildTemplateContext(
      makeTestContext({ modules: { ...allModulesFalse, analytics: { enabled: true } } }),
    );
    const rendered = await renderer.renderFile(
      resolve(
        'templates/modules/analytics/lib/features/analytics/data/observers/analytics_route_observer.dart.hbs',
      ),
      ctx,
    );
    expect(rendered).toMatchSnapshot();
  });
});

describe('Snapshot determinism', () => {
  it('renderer produces identical output on repeated calls (deterministic)', async () => {
    const ctx = buildTemplateContext(makeTestContext());
    const templatePath = resolve('templates/core/lib/main.dart.hbs');

    const rendered1 = await renderer.renderFile(templatePath, ctx);
    const rendered2 = await renderer.renderFile(templatePath, ctx);

    expect(rendered1).toBe(rendered2);
  });
});
