import { WebClient } from '@slack/web-api';
import { AIAgent } from '../services/ai/agent';
import { NotionService } from '../services/notion/client';
import { EnrichmentService } from '../services/research/enrichment';
import { logger } from '../utils/logger';
import { InvestorLead, StartupProfile } from '../types';

export class MessageHandler {
  constructor(
    private aiAgent: AIAgent,
    private notionService: NotionService,
    private enrichmentService: EnrichmentService,
    private startupProfiles: Map<string, StartupProfile> = new Map()
  ) {}

  async handleMention(event: any, client: WebClient, say: any) {
    const text = event.text.toLowerCase();
    const userId = event.user;
    const threadTs = event.ts;

    // Remove bot mention from text
    const cleanText = text.replace(/<@[A-Z0-9]+>/g, '').trim();

    // Send acknowledgment
    await say({
      text: '👋 Got it! Let me help you with that...',
      thread_ts: threadTs,
    });

    try {
      // Parse intent
      if (this.matchesPattern(cleanText, ['add', 'research'])) {
        await this.handleAddInvestorRequest(cleanText, event, say);
      } else if (this.matchesPattern(cleanText, ['find', 'search', 'match'])) {
        await this.handleFindInvestorsRequest(cleanText, userId, event, say);
      } else if (this.matchesPattern(cleanText, ['profile', 'startup', 'company'])) {
        await this.handleProfileRequest(cleanText, userId, event, say);
      } else if (this.matchesPattern(cleanText, ['list', 'show'])) {
        await this.handleListRequest(event, say);
      } else if (this.matchesPattern(cleanText, ['help'])) {
        await this.sendHelp(say, threadTs);
      } else {
        // General conversation - use AI to understand intent
        await this.handleGeneralQuery(cleanText, userId, event, say);
      }
    } catch (error) {
      logger.error('Error in handleMention', { error });
      await say({
        text: '❌ Sorry, I encountered an error. Please try again or type "help" for assistance.',
        thread_ts: threadTs,
      });
    }
  }

  async handleMessage(message: any, client: WebClient, say: any) {
    // Similar to handleMention but for DMs
    await this.handleMention(message, client, say);
  }

  private async handleAddInvestorRequest(text: string, event: any, say: any) {
    // Extract investor name
    const investorName = this.extractInvestorName(text);

    if (!investorName) {
      await say({
        text: '❓ Please specify an investor or firm name. Example: "add Sequoia Capital"',
        thread_ts: event.ts,
      });
      return;
    }

    logger.info('Processing add investor request', { investorName });

    // Update user
    await say({
      text: `🔍 Researching ${investorName}... This may take a moment.`,
      thread_ts: event.ts,
    });

    try {
      // Research investor with AI
      const investorData = await this.aiAgent.researchInvestor(investorName);

      // Enrich with web data
      const enrichmentResults = await Promise.allSettled([
        this.enrichmentService.enrichFromWeb(investorName, investorData.website),
        this.enrichmentService.enrichFromCrunchbase(investorName),
      ]);

      const successfulEnrichments = enrichmentResults
        .filter((result) => result.status === 'fulfilled')
        .map((result: any) => result.value)
        .filter((result) => result.success);

      const enrichedData = this.enrichmentService.combineEnrichmentResults(
        successfulEnrichments
      );

      // Merge enriched data
      const finalData: InvestorLead = {
        ...investorData,
        ...enrichedData,
      };

      // Show preview and ask for confirmation
      await this.showInvestorPreview(finalData, event, say);
    } catch (error) {
      logger.error('Failed to research investor', { error, investorName });
      await say({
        text: `❌ Failed to research ${investorName}. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        thread_ts: event.ts,
      });
    }
  }

  private async handleFindInvestorsRequest(
    text: string,
    userId: string,
    event: any,
    say: any
  ) {
    const profile = this.startupProfiles.get(userId);

    if (!profile) {
      await say({
        text: '📝 Please set up your startup profile first using: "set profile"',
        thread_ts: event.ts,
      });
      return;
    }

    logger.info('Finding matching investors', { userId, startup: profile.name });

    await say({
      text: `🔍 Searching for investors that match ${profile.name}... This may take a few minutes.`,
      thread_ts: event.ts,
    });

    try {
      const matches = await this.aiAgent.findMatchingInvestors(profile, 10);

      await say({
        text: `✅ Found ${matches.length} potential matches! Adding them to your database...`,
        thread_ts: event.ts,
      });

      // Add matches to Notion
      let addedCount = 0;
      for (const match of matches) {
        try {
          await this.notionService.addInvestor(match);
          addedCount++;
        } catch (error) {
          logger.error('Failed to add investor to Notion', {
            error,
            investor: match.name,
          });
        }
      }

      await say({
        text: `🎉 Successfully added ${addedCount} investors to your Notion database!\n\nTop matches:\n${matches
          .slice(0, 5)
          .map(
            (m, i) =>
              `${i + 1}. *${m.name}* (${m.matchScore}% match)\n   ${m.matchReason}`
          )
          .join('\n\n')}`,
        thread_ts: event.ts,
      });
    } catch (error) {
      logger.error('Failed to find investors', { error });
      await say({
        text: `❌ Failed to find matching investors. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        thread_ts: event.ts,
      });
    }
  }

  private async handleProfileRequest(text: string, userId: string, event: any, say: any) {
    await say({
      text: '📝 Let\'s set up your startup profile! Please provide:\n\n1. Company name\n2. Industry\n3. Stage (e.g., seed, series A)\n4. Brief description\n5. Funding goal (optional)\n6. Geography (optional)',
      thread_ts: event.ts,
    });

    // In a production app, this would trigger a modal or conversation flow
    // For simplicity, we'll use a placeholder
    const profile: StartupProfile = {
      name: 'Your Startup',
      industry: 'Technology',
      stage: 'seed',
      description: 'Your startup description',
    };

    this.startupProfiles.set(userId, profile);

    await say({
      text: '✅ Profile saved! You can now use "find investors" to get personalized matches.',
      thread_ts: event.ts,
    });
  }

  private async handleListRequest(event: any, say: any) {
    try {
      const investors = await this.notionService.getAllInvestors();

      if (investors.length === 0) {
        await say({
          text: '📋 Your investor database is empty. Use "add [investor name]" to get started!',
          thread_ts: event.ts,
        });
        return;
      }

      const list = investors
        .slice(0, 20)
        .map((inv, i) => `${i + 1}. ${inv.name}`)
        .join('\n');

      await say({
        text: `📋 You have ${investors.length} investors in your database:\n\n${list}${
          investors.length > 20 ? `\n\n...and ${investors.length - 20} more` : ''
        }`,
        thread_ts: event.ts,
      });
    } catch (error) {
      logger.error('Failed to list investors', { error });
      await say({
        text: '❌ Failed to retrieve investors from database.',
        thread_ts: event.ts,
      });
    }
  }

  private async handleGeneralQuery(text: string, userId: string, event: any, say: any) {
    // Use AI to understand and respond to general queries
    await say({
      text: '💬 I can help you with:\n• Adding specific investors\n• Finding matching investors\n• Managing your startup profile\n• Listing your database\n\nTry: "add Sequoia Capital" or "find investors for my SaaS startup"',
      thread_ts: event.ts,
    });
  }

  private async showInvestorPreview(lead: InvestorLead, event: any, say: any) {
    const blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${lead.name}*${lead.firmName ? ` (${lead.firmName})` : ''}\n_${this.capitalizeType(lead.type)}_`,
        },
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Investment Thesis:*\n${lead.investmentThesis.substring(0, 200)}...`,
          },
          {
            type: 'mrkdwn',
            text: `*Industries:*\n${lead.industries.join(', ') || 'N/A'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Stages:*\n${lead.stages.join(', ') || 'N/A'}`,
          },
          {
            type: 'mrkdwn',
            text: `*Geography:*\n${lead.geography.join(', ') || 'N/A'}`,
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Recent Investments:*\n${lead.recentInvestments
            .slice(0, 3)
            .map((inv) => `• ${inv.company} (${inv.round || 'N/A'})`)
            .join('\n')}`,
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '✅ Add to Database',
            },
            style: 'primary',
            action_id: 'approve_investor',
            value: JSON.stringify(lead),
          },
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '❌ Cancel',
            },
            action_id: 'reject_investor',
          },
        ],
      },
    ];

    await say({
      blocks,
      text: `Found investor: ${lead.name}`,
      thread_ts: event.ts,
    });
  }

  private extractInvestorName(text: string): string | null {
    // Remove common command words
    const cleaned = text
      .replace(/\b(add|research|find|about|tell me about)\b/gi, '')
      .trim();

    return cleaned || null;
  }

  private matchesPattern(text: string, keywords: string[]): boolean {
    return keywords.some((keyword) => text.includes(keyword));
  }

  private capitalizeType(type: string): string {
    const typeMap: Record<string, string> = {
      vc: 'Venture Capital',
      family_office: 'Family Office',
      angel: 'Angel Investor',
    };
    return typeMap[type] || type;
  }

  private async sendHelp(say: any, threadTs: string) {
    const helpText = `
*How to use Investor Database Agent:*

🔹 *Add an investor:* "add Sequoia Capital"
🔹 *Find matches:* "find investors for my startup"
🔹 *Set profile:* "set profile"
🔹 *List database:* "list investors"

Just talk to me naturally and I'll understand what you need!
    `;

    await say({
      text: helpText,
      thread_ts: threadTs,
    });
  }
}
