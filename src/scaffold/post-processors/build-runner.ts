import { execa } from 'execa';

export async function runBuildRunner(projectDir: string): Promise<void> {
  await execa(
    'dart',
    ['run', 'build_runner', 'build', '--delete-conflicting-outputs'],
    { cwd: projectDir, stdio: 'inherit' },
  );
}
