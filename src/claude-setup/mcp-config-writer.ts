import fs from 'fs-extra';
import path from 'node:path';
import type { ProjectContext } from '../core/context.js';

interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

interface McpConfig {
  mcpServers: Record<string, McpServerConfig>;
}

export async function writeMcpConfig(context: ProjectContext, outputPath: string): Promise<void> {
  const config = buildMcpConfig(context);
  const mcpPath = path.join(outputPath, '.mcp.json');
  await fs.writeFile(mcpPath, JSON.stringify(config, null, 2) + '\n');
}

function buildMcpConfig(context: ProjectContext): McpConfig {
  const servers: Record<string, McpServerConfig> = {};

  if (needsFirebaseMcp(context)) {
    servers['firebase'] = {
      command: 'npx',
      args: ['-y', '@firebase/mcp'],
    };
  }

  if (needsSupabaseMcp(context)) {
    servers['supabase'] = {
      command: 'npx',
      args: ['-y', '@supabase/mcp-server-supabase@latest'],
      env: {
        SUPABASE_ACCESS_TOKEN: '',
      },
    };
  }

  return { mcpServers: servers };
}

function needsFirebaseMcp(context: ProjectContext): boolean {
  if (context.modules.auth && context.modules.auth.provider === 'firebase') {
    return true;
  }
  if (context.modules.push && context.modules.push.provider === 'firebase') {
    return true;
  }
  if (context.modules.analytics !== false && context.modules.analytics) {
    return true;
  }
  return false;
}

function needsSupabaseMcp(context: ProjectContext): boolean {
  return !!(context.modules.auth && context.modules.auth.provider === 'supabase');
}
