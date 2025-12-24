import { Client } from '@notionhq/client';
import { config } from '../../config';
import { KnowledgeItem, StartupKnowledgeBase } from '../../types';
import { logger } from '../../utils/logger';
import { withRetry } from '../../utils/retry';

export class KnowledgeBaseService {
  private client: Client;
  private knowledgeDatabaseId?: string;
  private userKnowledgeBases: Map<string, StartupKnowledgeBase> = new Map();

  constructor() {
    this.client = new Client({ auth: config.notion.apiKey });
    this.knowledgeDatabaseId = config.notion.knowledgeDatabaseId;
  }

  async addKnowledgeItem(userId: string, item: KnowledgeItem): Promise<string> {
    if (!this.knowledgeDatabaseId) {
      // Store in memory if no Notion database configured
      return this.addToMemory(userId, item);
    }

    return withRetry(async () => {
      logger.info('Adding knowledge item to Notion', {
        userId,
        type: item.type,
        title: item.title,
      });

      const response = await this.client.pages.create({
        parent: { database_id: this.knowledgeDatabaseId! },
        properties: {
          Title: {
            title: [{ text: { content: item.title } }],
          },
          Type: {
            select: { name: this.capitalizeType(item.type) },
          },
          'User ID': {
            rich_text: [{ text: { content: userId } }],
          },
          ...(item.content && {
            Content: {
              rich_text: [{ text: { content: item.content.substring(0, 2000) } }],
            },
          }),
          ...(item.url && { URL: { url: item.url } }),
          ...(item.summary && {
            Summary: {
              rich_text: [{ text: { content: item.summary.substring(0, 2000) } }],
            },
          }),
          ...(item.tags && {
            Tags: {
              multi_select: item.tags.map((tag) => ({ name: tag })),
            },
          }),
          ...(item.category && {
            Category: {
              select: { name: item.category },
            },
          }),
          'Added At': {
            date: { start: item.addedAt.toISOString() },
          },
          Source: {
            select: { name: this.formatSource(item.source) },
          },
        },
      });

      logger.info('Successfully added knowledge item', {
        pageId: response.id,
        userId,
      });

      // Also update in-memory cache
      this.addToMemory(userId, { ...item, id: response.id });

      return response.id;
    });
  }

  async getUserKnowledge(userId: string): Promise<StartupKnowledgeBase> {
    // Check memory cache first
    let knowledgeBase = this.userKnowledgeBases.get(userId);

    if (!knowledgeBase) {
      // Initialize new knowledge base
      knowledgeBase = {
        userId,
        knowledgeItems: [],
        conversationHistory: [],
        learnedInsights: [],
        lastUpdated: new Date(),
      };

      // Load from Notion if available
      if (this.knowledgeDatabaseId) {
        await this.loadFromNotion(userId, knowledgeBase);
      }

      this.userKnowledgeBases.set(userId, knowledgeBase);
    }

    return knowledgeBase;
  }

  async getKnowledgeSummary(userId: string): Promise<string> {
    const knowledgeBase = await this.getUserKnowledge(userId);

    if (knowledgeBase.knowledgeItems.length === 0) {
      return 'No knowledge items available yet.';
    }

    const itemsByType = knowledgeBase.knowledgeItems.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let summary = `Knowledge Base Summary (${knowledgeBase.knowledgeItems.length} items total):\n\n`;

    for (const [type, count] of Object.entries(itemsByType)) {
      summary += `• ${count} ${type}${count > 1 ? 's' : ''}\n`;
    }

    if (knowledgeBase.startupProfile) {
      summary += `\nStartup Profile: ${knowledgeBase.startupProfile.name}\n`;
      summary += `Industry: ${knowledgeBase.startupProfile.industry}\n`;
      summary += `Stage: ${knowledgeBase.startupProfile.stage}\n`;
    }

    if (knowledgeBase.learnedInsights.length > 0) {
      summary += `\nKey Insights: ${knowledgeBase.learnedInsights.length} captured\n`;
    }

    return summary;
  }

  async getAllKnowledgeContext(userId: string): Promise<string> {
    const knowledgeBase = await this.getUserKnowledge(userId);

    let context = '';

    // Add startup profile
    if (knowledgeBase.startupProfile) {
      context += `Startup Profile:\n`;
      context += `- Name: ${knowledgeBase.startupProfile.name}\n`;
      context += `- Industry: ${knowledgeBase.startupProfile.industry}\n`;
      context += `- Stage: ${knowledgeBase.startupProfile.stage}\n`;
      context += `- Description: ${knowledgeBase.startupProfile.description}\n`;
      if (knowledgeBase.startupProfile.uniqueValueProp) {
        context += `- Value Proposition: ${knowledgeBase.startupProfile.uniqueValueProp}\n`;
      }
      context += '\n';
    }

    // Add knowledge items summaries
    if (knowledgeBase.knowledgeItems.length > 0) {
      context += 'Knowledge Items:\n';
      knowledgeBase.knowledgeItems.forEach((item, idx) => {
        context += `${idx + 1}. [${item.type}] ${item.title}\n`;
        if (item.summary) {
          context += `   ${item.summary.substring(0, 200)}\n`;
        }
        if (item.content) {
          context += `   ${item.content.substring(0, 300)}...\n`;
        }
      });
      context += '\n';
    }

    // Add learned insights
    if (knowledgeBase.learnedInsights.length > 0) {
      context += 'Learned Insights:\n';
      knowledgeBase.learnedInsights.forEach((insight, idx) => {
        context += `${idx + 1}. ${insight}\n`;
      });
      context += '\n';
    }

    // Add recent conversation context
    if (knowledgeBase.conversationHistory.length > 0) {
      context += 'Recent Conversations:\n';
      const recentConversations = knowledgeBase.conversationHistory.slice(-5);
      recentConversations.forEach((conv) => {
        context += `Q: ${conv.question}\n`;
        context += `A: ${conv.answer.substring(0, 200)}\n\n`;
      });
    }

    return context || 'No startup context available yet.';
  }

  async addInsight(userId: string, insight: string): Promise<void> {
    const knowledgeBase = await this.getUserKnowledge(userId);
    knowledgeBase.learnedInsights.push(insight);
    knowledgeBase.lastUpdated = new Date();

    logger.info('Added insight to knowledge base', { userId, insight });
  }

  async updateStartupProfile(userId: string, profile: any): Promise<void> {
    const knowledgeBase = await this.getUserKnowledge(userId);
    knowledgeBase.startupProfile = profile;
    knowledgeBase.lastUpdated = new Date();

    logger.info('Updated startup profile', { userId, name: profile.name });
  }

  private addToMemory(userId: string, item: KnowledgeItem): string {
    const knowledgeBase = this.userKnowledgeBases.get(userId) || {
      userId,
      knowledgeItems: [],
      conversationHistory: [],
      learnedInsights: [],
      lastUpdated: new Date(),
    };

    const id = item.id || `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    knowledgeBase.knowledgeItems.push({ ...item, id });
    knowledgeBase.lastUpdated = new Date();

    this.userKnowledgeBases.set(userId, knowledgeBase);

    return id;
  }

  private async loadFromNotion(
    userId: string,
    knowledgeBase: StartupKnowledgeBase
  ): Promise<void> {
    try {
      const response = await withRetry(async () => {
        return this.client.databases.query({
          database_id: this.knowledgeDatabaseId!,
          filter: {
            property: 'User ID',
            rich_text: {
              equals: userId,
            },
          },
        });
      });

      // Parse Notion pages into KnowledgeItems
      knowledgeBase.knowledgeItems = response.results.map((page: any) => {
        const props = page.properties;
        return {
          id: page.id,
          type: this.parseType(props.Type?.select?.name),
          title: props.Title?.title?.[0]?.text?.content || 'Untitled',
          content: props.Content?.rich_text?.[0]?.text?.content,
          url: props.URL?.url,
          summary: props.Summary?.rich_text?.[0]?.text?.content,
          tags: props.Tags?.multi_select?.map((tag: any) => tag.name) || [],
          category: props.Category?.select?.name,
          addedAt: new Date(props['Added At']?.date?.start || Date.now()),
          source: this.parseSource(props.Source?.select?.name),
        } as KnowledgeItem;
      });

      logger.info('Loaded knowledge from Notion', {
        userId,
        itemCount: knowledgeBase.knowledgeItems.length,
      });
    } catch (error) {
      logger.error('Failed to load knowledge from Notion', { error, userId });
    }
  }

  private capitalizeType(type: string): string {
    const typeMap: Record<string, string> = {
      file: 'File',
      link: 'Link',
      text: 'Text',
      image: 'Image',
      video: 'Video',
      document: 'Document',
    };
    return typeMap[type] || type;
  }

  private parseType(type: string): KnowledgeItem['type'] {
    const lowerType = type?.toLowerCase() || 'text';
    if (['file', 'link', 'text', 'image', 'video', 'document'].includes(lowerType)) {
      return lowerType as KnowledgeItem['type'];
    }
    return 'text';
  }

  private formatSource(source: string): string {
    const sourceMap: Record<string, string> = {
      user_upload: 'User Upload',
      slack_message: 'Slack Message',
      conversation: 'Conversation',
    };
    return sourceMap[source] || source;
  }

  private parseSource(source: string): KnowledgeItem['source'] {
    const lowerSource = source?.toLowerCase().replace(' ', '_') || 'user_upload';
    if (['user_upload', 'slack_message', 'conversation'].includes(lowerSource)) {
      return lowerSource as KnowledgeItem['source'];
    }
    return 'user_upload';
  }

  async ensureKnowledgeDatabaseSchema(): Promise<void> {
    if (!this.knowledgeDatabaseId) {
      logger.warn(
        'Knowledge database ID not configured. Knowledge will be stored in memory only.'
      );
      return;
    }

    try {
      await withRetry(async () => {
        await this.client.databases.retrieve({ database_id: this.knowledgeDatabaseId! });
        logger.info('Knowledge base database schema validated');
      });
    } catch (error) {
      logger.error('Failed to validate knowledge database schema', { error });
      logger.warn('Knowledge will be stored in memory only');
      this.knowledgeDatabaseId = undefined;
    }
  }
}
