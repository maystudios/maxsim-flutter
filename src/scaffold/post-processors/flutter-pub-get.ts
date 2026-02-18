import { execa } from 'execa';

export async function runFlutterPubGet(projectDir: string): Promise<void> {
  await execa('flutter', ['pub', 'get'], { cwd: projectDir, stdio: 'inherit' });
}
