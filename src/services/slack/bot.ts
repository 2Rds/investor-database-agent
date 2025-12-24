import { App, LogLevel } from '@slack/bolt';
import { config } from '../../config';
import { logger } from '../../utils/logger';
import { MessageHandler } from '../../handlers/messageHandler';
import { CommandHandler } from '../../handlers/commandHandler';

export class SlackBot {
  private app: App;
  private messageHandler: MessageHandler;
  private commandHandler: CommandHandler;

  constructor(messageHandler: MessageHandler, commandHandler: CommandHandler) {
    this.app = new App({
      token: config.slack.botToken,
      signingSecret: config.slack.signingSecret,
      appToken: config.slack.appToken,
      socketMode: true,
      logLevel: config.app.env === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
    });

    this.messageHandler = messageHandler;
    this.commandHandler = commandHandler;

    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Handle app mentions
    this.app.event('app_mention', async ({ event, client, say }) => {
      try {
        logger.info('Received app mention', {
          user: event.user,
          channel: event.channel,
        });

        await this.messageHandler.handleMention(event, client, say);
      } catch (error) {
        logger.error('Error handling app mention', { error });
        await say({
          text: '❌ Sorry, I encountered an error processing your request. Please try again.',
          thread_ts: event.ts,
        });
      }
    });

    // Handle direct messages
    this.app.message(async ({ message, client, say }) => {
      try {
        if (message.subtype || !('text' in message)) {
          return;
        }

        logger.info('Received message', {
          user: message.user,
          channel: message.channel,
        });

        await this.messageHandler.handleMessage(message, client, say);
      } catch (error) {
        logger.error('Error handling message', { error });
      }
    });

    // Slash commands
    this.app.command('/vc-add', async ({ command, ack, client }) => {
      await ack();
      try {
        await this.commandHandler.handleAddInvestor(command, client);
      } catch (error) {
        logger.error('Error handling /vc-add command', { error });
      }
    });

    this.app.command('/vc-find', async ({ command, ack, client }) => {
      await ack();
      try {
        await this.commandHandler.handleFindInvestors(command, client);
      } catch (error) {
        logger.error('Error handling /vc-find command', { error });
      }
    });

    this.app.command('/vc-profile', async ({ command, ack, client }) => {
      await ack();
      try {
        await this.commandHandler.handleSetProfile(command, client);
      } catch (error) {
        logger.error('Error handling /vc-profile command', { error });
      }
    });

    this.app.command('/vc-list', async ({ command, ack, client }) => {
      await ack();
      try {
        await this.commandHandler.handleListInvestors(command, client);
      } catch (error) {
        logger.error('Error handling /vc-list command', { error });
      }
    });

    this.app.command('/vc-help', async ({ command, ack, say }) => {
      await ack();
      await this.sendHelpMessage(say, command.channel_id);
    });

    // Interactive button clicks
    this.app.action('approve_investor', async ({ ack, body, client }) => {
      await ack();
      try {
        await this.commandHandler.handleApproveInvestor(body, client);
      } catch (error) {
        logger.error('Error handling approve_investor action', { error });
      }
    });

    this.app.action('reject_investor', async ({ ack, body, client }) => {
      await ack();
      try {
        await this.commandHandler.handleRejectInvestor(body, client);
      } catch (error) {
        logger.error('Error handling reject_investor action', { error });
      }
    });

    // Error handling
    this.app.error(async (error) => {
      logger.error('Slack app error', { error });
    });
  }

  async start() {
    await this.app.start();
    logger.info('Slack bot is running!');
  }

  async stop() {
    await this.app.stop();
    logger.info('Slack bot stopped');
  }

  async sendNotification(channel: string, message: string, threadTs?: string) {
    try {
      await this.app.client.chat.postMessage({
        channel,
        text: message,
        thread_ts: threadTs,
      });
    } catch (error) {
      logger.error('Failed to send notification', { error, channel });
    }
  }

  async sendRichMessage(
    channel: string,
    blocks: any[],
    text: string,
    threadTs?: string
  ) {
    try {
      await this.app.client.chat.postMessage({
        channel,
        blocks,
        text,
        thread_ts: threadTs,
      });
    } catch (error) {
      logger.error('Failed to send rich message', { error, channel });
    }
  }

  private async sendHelpMessage(say: any, channel: string) {
    const helpText = `
*Investor Database Agent - Help*

I help you research and manage VC, family office, and angel investor leads directly in Slack!

*Commands:*

📌 \`@InvestorAgent add [investor name]\`
   Research and add a specific investor to your database

🔍 \`@InvestorAgent find investors for [description]\`
   Find matching investors based on your startup profile

👤 \`@InvestorAgent set profile\`
   Set or update your startup profile for better matching

📊 \`@InvestorAgent list investors\`
   View all investors in your database

❓ \`@InvestorAgent help\`
   Show this help message

*Examples:*

• \`@InvestorAgent add Sequoia Capital\`
• \`@InvestorAgent find investors for SaaS startup at seed stage\`
• \`@InvestorAgent add a16z\`

*Natural Language:*
You can also just talk to me naturally! Try:
• "Research Benchmark Capital for me"
• "Find me investors who focus on fintech"
• "What investors in my database match my startup?"

I'll automatically research investors, enrich their data, and add them to your Notion database with notifications when tasks complete.
    `;

    await say({
      text: helpText,
      channel,
    });
  }

  getApp() {
    return this.app;
  }
}
