import { execa } from 'execa';

export async function runDartFormat(projectDir: string): Promise<void> {
  await execa('dart', ['format', '.'], { cwd: projectDir, stdio: 'inherit' });
}
