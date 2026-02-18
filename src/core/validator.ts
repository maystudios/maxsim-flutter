import { execa } from 'execa';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

async function checkTool(command: string, args: string[]): Promise<boolean> {
  try {
    await execa(command, args, { reject: true });
    return true;
  } catch {
    return false;
  }
}

// Check that required tools are installed
export async function validateEnvironment(): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const [flutterOk, dartOk, gitOk] = await Promise.all([
    checkTool('flutter', ['--version']),
    checkTool('dart', ['--version']),
    checkTool('git', ['--version']),
  ]);

  if (!flutterOk) {
    errors.push('flutter is not installed or not found in PATH');
  }
  if (!dartOk) {
    errors.push('dart is not installed or not found in PATH');
  }
  if (!gitOk) {
    errors.push('git is not installed or not found in PATH');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
