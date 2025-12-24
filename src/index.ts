import { logger } from './utils/logger';
import { config } from './config';
import { SlackBot } from './services/slack/bot';
import { AIAgent } from './services/ai/agent';
import { NotionService } from './services/notion/client';
import { EnrichmentService } from './services/research/enrichment';
import { Orchestrator } from './services/orchestrator';
import { KnowledgeBaseService } from './services/knowledge/knowledgeBase';
import { LearningService } from './services/knowledge/learningService';
import { FileProcessor } from './services/knowledge/fileProcessor';
import { MessageHandler } from './handlers/messageHandler';
import { CommandHandler } from './handlers/commandHandler';

async function main() {
  try {
    logger.info('Starting Investor Database Agent', {
      env: config.app.env,
      nodeVersion: process.version,
    });

    // Initialize services
    logger.info('Initializing services...');

    const notionService = new NotionService();
    const aiAgent = new AIAgent();
    const enrichmentService = new EnrichmentService();
    const orchestrator = new Orchestrator(aiAgent, notionService, enrichmentService);

    // Initialize knowledge base services
    logger.info('Initializing knowledge base...');
    const knowledgeBase = new KnowledgeBaseService();
    const learningService = new LearningService(knowledgeBase);
    const fileProcessor = new FileProcessor();

    // Validate Notion database connections
    logger.info('Validating Notion database connection...');
    await notionService.ensureDatabaseSchema();
    await knowledgeBase.ensureKnowledgeDatabaseSchema();

    // Initialize handlers
    const messageHandler = new MessageHandler(aiAgent, notionService, enrichmentService);
    const commandHandler = new CommandHandler(
      notionService,
      aiAgent,
      knowledgeBase,
      learningService,
      fileProcessor
    );

    // Initialize Slack bot
    logger.info('Initializing Slack bot...');
    const slackBot = new SlackBot(messageHandler, commandHandler);

    // Start the bot
    await slackBot.start();

    logger.info('✅ Investor Database Agent is running!', {
      maxConcurrentResearch: config.agent.maxConcurrentResearch,
      researchTimeout: config.agent.researchTimeoutMs,
      knowledgeBaseEnabled: !!config.notion.knowledgeDatabaseId,
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down...');
      await slackBot.stop();
      logger.info('Shutdown complete');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Health check endpoint (optional)
    if (config.app.env === 'production') {
      const http = await import('http');
      const server = http.createServer((req, res) => {
        if (req.url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              status: 'healthy',
              uptime: process.uptime(),
              activeResearchTasks: orchestrator.getActiveTaskCount(),
              queueSize: orchestrator.getQueueSize(),
            })
          );
        } else {
          res.writeHead(404);
          res.end();
        }
      });

      server.listen(config.app.port, () => {
        logger.info(`Health check endpoint listening on port ${config.app.port}`);
      });
    }
  } catch (error) {
    logger.error('Failed to start application', { error });
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error });
  process.exit(1);
});

main();
