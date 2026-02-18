import type { z } from 'zod';
import type { MaxsimConfigSchema } from '../core/config/schema.js';

export type MaxsimConfig = z.infer<typeof MaxsimConfigSchema>;
