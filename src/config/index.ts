import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  // Slack
  SLACK_BOT_TOKEN: z.string().min(1, 'SLACK_BOT_TOKEN is required'),
  SLACK_SIGNING_SECRET: z.string().min(1, 'SLACK_SIGNING_SECRET is required'),
  SLACK_APP_TOKEN: z.string().min(1, 'SLACK_APP_TOKEN is required'),

  // Notion
  NOTION_API_KEY: z.string().min(1, 'NOTION_API_KEY is required'),
  NOTION_DATABASE_ID: z.string().min(1, 'NOTION_DATABASE_ID is required'),
  NOTION_KNOWLEDGE_DATABASE_ID: z.string().optional(),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),

  // Optional Enrichment APIs
  CRUNCHBASE_API_KEY: z.string().optional(),
  PITCHBOOK_API_KEY: z.string().optional(),
  APOLLO_API_KEY: z.string().optional(),
  CLEARBIT_API_KEY: z.string().optional(),
  GOOGLE_SEARCH_API_KEY: z.string().optional(),
  GOOGLE_SEARCH_CX: z.string().optional(),

  // App Config
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Rate Limiting
  MAX_CONCURRENT_RESEARCH: z.string().default('3'),
  RESEARCH_TIMEOUT_MS: z.string().default('300000'),
});

const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => e.path.join('.')).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
};

export const env = parseEnv();

export const config = {
  slack: {
    botToken: env.SLACK_BOT_TOKEN,
    signingSecret: env.SLACK_SIGNING_SECRET,
    appToken: env.SLACK_APP_TOKEN,
  },
  notion: {
    apiKey: env.NOTION_API_KEY,
    databaseId: env.NOTION_DATABASE_ID,
    knowledgeDatabaseId: env.NOTION_KNOWLEDGE_DATABASE_ID,
  },
  anthropic: {
    apiKey: env.ANTHROPIC_API_KEY,
  },
  externalApis: {
    crunchbase: env.CRUNCHBASE_API_KEY,
    pitchbook: env.PITCHBOOK_API_KEY,
    apollo: env.APOLLO_API_KEY,
    clearbit: env.CLEARBIT_API_KEY,
    googleSearch: env.GOOGLE_SEARCH_API_KEY,
    googleSearchCx: env.GOOGLE_SEARCH_CX,
  },
  app: {
    env: env.NODE_ENV,
    port: parseInt(env.PORT, 10),
    logLevel: env.LOG_LEVEL,
  },
  agent: {
    maxConcurrentResearch: parseInt(env.MAX_CONCURRENT_RESEARCH, 10),
    researchTimeoutMs: parseInt(env.RESEARCH_TIMEOUT_MS, 10),
  },
} as const;
