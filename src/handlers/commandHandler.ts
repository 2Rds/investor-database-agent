import { WebClient } from '@slack/web-api';
import { NotionService } from '../services/notion/client';
import { AIAgent } from '../services/ai/agent';
import { KnowledgeBaseService } from '../services/knowledge/knowledgeBase';
import { LearningService } from '../services/knowledge/learningService';
import { FileProcessor } from '../services/knowledge/fileProcessor';
import { InvestorLead } from '../types';
import { logger } from '../utils/logger';

export class CommandHandler {
  constructor(
    private notionService: NotionService,
    private aiAgent: AIAgent,
    private knowledgeBase?: KnowledgeBaseService,
    private learningService?: LearningService,
    private fileProcessor?: FileProcessor
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

  async handleKnowledge(command: any, client: WebClient) {
    if (!this.knowledgeBase || !this.fileProcessor) {
      await client.chat.postMessage({
        channel: command.channel_id,
        text: '❌ Knowledge base service not available.',
      });
      return;
    }

    const userId = command.user_id;
    const text = command.text.trim();

    try {
      // If text contains a URL, process as link
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = text.match(urlRegex);

      if (urls && urls.length > 0) {
        // Process links
        await client.chat.postMessage({
          channel: command.channel_id,
          text: `📎 Processing ${urls.length} link(s)...`,
        });

        for (const url of urls) {
          const item = await this.fileProcessor.processLink(url);
          await this.knowledgeBase.addKnowledgeItem(userId, {
            ...item,
            addedAt: new Date(),
            source: 'user_upload',
          } as any);
        }

        await client.chat.postMessage({
          channel: command.channel_id,
          text: `✅ Added ${urls.length} link(s) to your knowledge base!\n\nUse \`/vc-knowledge-summary\` to see what I know about your startup.`,
        });
      } else if (text) {
        // Process as text
        const item = await this.fileProcessor.processText(text);
        await this.knowledgeBase.addKnowledgeItem(userId, {
          ...item,
          addedAt: new Date(),
          source: 'user_upload',
        } as any);

        await client.chat.postMessage({
          channel: command.channel_id,
          text: `✅ Added text to your knowledge base!\n\nSummary: ${item.summary || 'Information stored'}`,
        });
      } else {
        // Show instructions
        await client.chat.postMessage({
          channel: command.channel_id,
          text: `📚 *Knowledge Base Command*

Add information about your startup to help me provide better investor matches!

*Usage:*
• \`/vc-knowledge [link]\` - Add a webpage or document link
• \`/vc-knowledge [text]\` - Add text information
• Upload files with the command to process them

*Examples:*
• \`/vc-knowledge https://yourcompany.com\`
• \`/vc-knowledge We recently hit 10k users with 50% MoM growth\`

*Supported content:*
• Links to your website, pitch deck, blog posts
• Text updates about traction, team, product
• Images (screenshots, charts, photos)
• Documents (PDFs, Google Docs links)
• Videos (pitch videos, product demos)`,
        });
      }

      logger.info('Processed knowledge command', { userId, hasUrls: !!urls, hasText: !!text });
    } catch (error) {
      logger.error('Failed to handle knowledge command', { error, userId });
      await client.chat.postMessage({
        channel: command.channel_id,
        text: '❌ Failed to add knowledge. Please try again.',
      });
    }
  }

  async handleKnowledgeSummary(command: any, client: WebClient) {
    if (!this.knowledgeBase) {
      await client.chat.postMessage({
        channel: command.channel_id,
        text: '❌ Knowledge base service not available.',
      });
      return;
    }

    const userId = command.user_id;

    try {
      const summary = await this.knowledgeBase.getKnowledgeSummary(userId);

      await client.chat.postMessage({
        channel: command.channel_id,
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `📚 *Your Knowledge Base*\n\n${summary}`,
            },
          },
          {
            type: 'divider',
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: 'Use `/vc-knowledge` to add more information or `/vc-learn` to start an interactive learning session.',
              },
            ],
          },
        ],
        text: summary,
      });

      logger.info('Displayed knowledge summary', { userId });
    } catch (error) {
      logger.error('Failed to get knowledge summary', { error, userId });
      await client.chat.postMessage({
        channel: command.channel_id,
        text: '❌ Failed to retrieve knowledge summary.',
      });
    }
  }

  async handleLearn(command: any, client: WebClient) {
    if (!this.learningService || !this.knowledgeBase) {
      await client.chat.postMessage({
        channel: command.channel_id,
        text: '❌ Learning service not available.',
      });
      return;
    }

    const userId = command.user_id;
    const channelId = command.channel_id;

    try {
      // Check if there's already an active session
      const existingSession = this.learningService.getActiveSession(userId);

      if (existingSession) {
        await client.chat.postMessage({
          channel: channelId,
          text: '⚠️ You already have an active learning session. Please complete it first or use `/vc-learn-stop` to end it.',
        });
        return;
      }

      // Start a learning session
      const response = await client.chat.postMessage({
        channel: channelId,
        text: `🎓 *Starting Interactive Learning Session*\n\nI'll ask you some questions to better understand your startup and optimize investor matching.\n\nYou can stop anytime by typing "stop" or using \`/vc-learn-stop\`.`,
      });

      const threadTs = response.ts!;
      const session = await this.learningService.startLearningSession(userId, channelId, threadTs);

      // Ask first question
      const firstQuestion = await this.learningService.getNextQuestion(session.id);

      if (firstQuestion) {
        await client.chat.postMessage({
          channel: channelId,
          thread_ts: threadTs,
          text: `**Question 1/${10}:**\n\n${firstQuestion}`,
        });

        logger.info('Started learning session', { sessionId: session.id, userId });
      }
    } catch (error) {
      logger.error('Failed to start learning session', { error, userId });
      await client.chat.postMessage({
        channel: channelId,
        text: '❌ Failed to start learning session. Please try again.',
      });
    }
  }

  async handleLearnStop(command: any, client: WebClient) {
    if (!this.learningService) {
      return;
    }

    const userId = command.user_id;

    try {
      const session = this.learningService.getActiveSession(userId);

      if (!session) {
        await client.chat.postMessage({
          channel: command.channel_id,
          text: '❓ You don\'t have an active learning session.',
        });
        return;
      }

      await this.learningService.completeSession(session.id);

      const report = await this.learningService.generateLearningReport(session.id);

      await client.chat.postMessage({
        channel: command.channel_id,
        text: `✅ Learning session stopped.\n\n${report}`,
      });

      logger.info('Stopped learning session', { sessionId: session.id, userId });
    } catch (error) {
      logger.error('Failed to stop learning session', { error, userId });
    }
  }
}
