import { WebClient } from '@slack/web-api';
import { NotionService } from '../services/notion/client';
import { AIAgent } from '../services/ai/agent';
import { InvestorLead } from '../types';
import { logger } from '../utils/logger';

export class CommandHandler {
  constructor(
    private notionService: NotionService,
    private aiAgent: AIAgent
  ) {}

  async handleAddInvestor(command: any, client: WebClient) {
    const investorName = command.text.trim();

    if (!investorName) {
      await client.chat.postMessage({
        channel: command.channel_id,
        text: '❓ Usage: `/vc-add [investor name]`\nExample: `/vc-add Sequoia Capital`',
      });
      return;
    }

    await client.chat.postMessage({
      channel: command.channel_id,
      text: `🔍 Researching ${investorName}...`,
    });

    try {
      const investorData = await this.aiAgent.researchInvestor(investorName);
      const pageId = await this.notionService.addInvestor(investorData);

      await client.chat.postMessage({
        channel: command.channel_id,
        text: `✅ Successfully added *${investorName}* to your database!`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `✅ Successfully added *${investorName}* to your database!`,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Type:* ${investorData.type}`,
              },
              {
                type: 'mrkdwn',
                text: `*Industries:* ${investorData.industries.join(', ')}`,
              },
            ],
          },
        ],
      });

      logger.info('Added investor via slash command', {
        investorName,
        pageId,
      });
    } catch (error) {
      logger.error('Failed to add investor via slash command', {
        error,
        investorName,
      });

      await client.chat.postMessage({
        channel: command.channel_id,
        text: `❌ Failed to add ${investorName}. Please try again.`,
      });
    }
  }

  async handleFindInvestors(command: any, client: WebClient) {
    await client.chat.postMessage({
      channel: command.channel_id,
      text: '🔍 Finding matching investors... This feature requires a startup profile to be set up first.',
    });
  }

  async handleSetProfile(command: any, client: WebClient) {
    // In production, this would open a modal for profile input
    await client.chat.postMessage({
      channel: command.channel_id,
      text: '📝 Profile setup coming soon! For now, use natural language commands with @InvestorAgent',
    });
  }

  async handleListInvestors(command: any, client: WebClient) {
    try {
      const investors = await this.notionService.getAllInvestors();

      if (investors.length === 0) {
        await client.chat.postMessage({
          channel: command.channel_id,
          text: '📋 Your investor database is empty.',
        });
        return;
      }

      const blocks = [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `📋 *Your Investor Database* (${investors.length} total)`,
          },
        },
        {
          type: 'divider',
        },
        ...investors.slice(0, 10).map((inv) => ({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `• ${inv.name}`,
          },
        })),
      ];

      if (investors.length > 10) {
        blocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `_...and ${investors.length - 10} more in your Notion database_`,
            },
          ],
        } as any);
      }

      await client.chat.postMessage({
        channel: command.channel_id,
        blocks,
        text: `You have ${investors.length} investors in your database`,
      });
    } catch (error) {
      logger.error('Failed to list investors', { error });
      await client.chat.postMessage({
        channel: command.channel_id,
        text: '❌ Failed to retrieve investors.',
      });
    }
  }

  async handleApproveInvestor(body: any, client: WebClient) {
    try {
      const action = (body as any).actions?.[0];
      const leadData: InvestorLead = JSON.parse(action.value);

      await this.notionService.addInvestor(leadData);

      await client.chat.update({
        channel: (body as any).channel.id,
        ts: (body as any).message.ts,
        text: `✅ Added ${leadData.name} to your database!`,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `✅ *${leadData.name}* has been added to your Notion database!`,
            },
          },
        ],
      });

      logger.info('Investor approved and added', { investor: leadData.name });
    } catch (error) {
      logger.error('Failed to approve investor', { error });
    }
  }

  async handleRejectInvestor(body: any, client: WebClient) {
    try {
      await client.chat.update({
        channel: (body as any).channel.id,
        ts: (body as any).message.ts,
        text: '❌ Cancelled',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: '❌ Investor not added to database.',
            },
          },
        ],
      });

      logger.info('Investor rejected');
    } catch (error) {
      logger.error('Failed to reject investor', { error });
    }
  }
}
