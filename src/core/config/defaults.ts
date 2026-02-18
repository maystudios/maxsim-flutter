import type { MaxsimConfig } from '../../types/config.js';

export const defaultConfig: Partial<MaxsimConfig> = {
  version: '1',
  platforms: ['android', 'ios'],
  modules: {},
  claude: {
    enabled: true,
    generateAgents: false,
    generateSkills: false,
    generateHooks: false,
    agentTeams: false,
    mcpServers: [],
  },
  scaffold: {
    overwriteExisting: 'ask',
    runDartFormat: true,
    runPubGet: true,
    runBuildRunner: false,
    dryRun: false,
  },
};
