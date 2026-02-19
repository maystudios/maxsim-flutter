import * as p from '@clack/prompts';

export interface CreateAnswers {
  projectName: string;
  orgId: string;
  description: string;
  platforms: string[];
  modules: string[];
}

export async function promptForProjectCreation(
  defaults?: Partial<CreateAnswers>,
): Promise<CreateAnswers> {
  const answers = await p.group(
    {
      projectName: () =>
        p.text({
          message: 'Project name',
          placeholder: defaults?.projectName ?? 'my_app',
          initialValue: defaults?.projectName ?? '',
          validate(value) {
            if (!value || value.trim().length === 0) return 'Project name is required';
            if (!/^[a-z][a-z0-9_]*$/.test(value))
              return 'Project name must be lowercase with underscores (e.g., my_app)';
            return undefined;
          },
        }),

      orgId: () =>
        p.text({
          message: 'Organization ID',
          placeholder: defaults?.orgId ?? 'com.example',
          initialValue: defaults?.orgId ?? 'com.example',
          validate(value) {
            if (!value || value.trim().length === 0) return 'Organization ID is required';
            return undefined;
          },
        }),

      description: () =>
        p.text({
          message: 'App description',
          placeholder: 'A new Flutter application',
          initialValue: defaults?.description ?? 'A new Flutter application',
        }),

      platforms: () =>
        p.multiselect({
          message: 'Target platforms',
          options: [
            { value: 'android', label: 'Android' },
            { value: 'ios', label: 'iOS' },
            { value: 'web', label: 'Web' },
            { value: 'macos', label: 'macOS' },
            { value: 'windows', label: 'Windows' },
            { value: 'linux', label: 'Linux' },
          ],
          initialValues: defaults?.platforms ?? ['android', 'ios'],
          required: true,
        }),

      modules: () =>
        p.multiselect({
          message: 'Select modules to include',
          options: [
            { value: 'auth', label: 'Authentication', hint: 'Firebase / Supabase / Custom' },
            { value: 'api', label: 'API Client', hint: 'Dio + interceptors' },
            { value: 'theme', label: 'Theme', hint: 'Material 3 + dark mode' },
            { value: 'database', label: 'Database', hint: 'Drift / Hive / Isar' },
            { value: 'i18n', label: 'Internationalization', hint: 'ARB + Flutter localizations' },
            { value: 'push', label: 'Push Notifications', hint: 'Firebase / OneSignal' },
            { value: 'analytics', label: 'Analytics', hint: 'Service abstraction' },
            { value: 'cicd', label: 'CI/CD', hint: 'GitHub Actions / GitLab CI' },
            { value: 'deep-linking', label: 'Deep Linking', hint: 'App links + go_router' },
          ],
          initialValues: defaults?.modules ?? [],
          required: false,
        }),
    },
    {
      onCancel() {
        p.cancel('Project creation cancelled.');
        process.exit(0);
      },
    },
  );

  return {
    projectName: answers.projectName as string,
    orgId: answers.orgId as string,
    description: (answers.description as string) ?? 'A new Flutter application',
    platforms: answers.platforms as string[],
    modules: (answers.modules as string[]) ?? [],
  };
}
