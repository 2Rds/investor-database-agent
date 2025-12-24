import { Client } from '@notionhq/client';
import { config } from '../../config';
import { InvestorLead } from '../../types';
import { logger } from '../../utils/logger';
import { withRetry } from '../../utils/retry';

export class NotionService {
  private client: Client;
  private databaseId: string;

  constructor() {
    this.client = new Client({ auth: config.notion.apiKey });
    this.databaseId = config.notion.databaseId;
  }

  async addInvestor(lead: InvestorLead): Promise<string> {
    return withRetry(async () => {
      logger.info('Adding investor to Notion', { name: lead.name });

      const response = await this.client.pages.create({
        parent: { database_id: this.databaseId },
        properties: {
          Name: {
            title: [{ text: { content: lead.name } }],
          },
          Type: {
            select: { name: this.capitalizeType(lead.type) },
          },
          ...(lead.firmName && {
            'Firm Name': {
              rich_text: [{ text: { content: lead.firmName } }],
            },
          }),
          'Investment Thesis': {
            rich_text: [
              {
                text: {
                  content: lead.investmentThesis.substring(0, 2000), // Notion limit
                },
              },
            ],
          },
          Industries: {
            multi_select: lead.industries.map((industry) => ({ name: industry })),
          },
          Stages: {
            multi_select: lead.stages.map((stage) => ({
              name: this.formatStage(stage),
            })),
          },
          ...(lead.checkSize && {
            'Check Size': {
              rich_text: [
                {
                  text: {
                    content: `${lead.checkSize.currency} ${lead.checkSize.min.toLocaleString()} - ${lead.checkSize.max.toLocaleString()}`,
                  },
                },
              ],
            },
          }),
          Geography: {
            multi_select: lead.geography.map((geo) => ({ name: geo })),
          },
          ...(lead.website && { Website: { url: lead.website } }),
          ...(lead.linkedIn && { LinkedIn: { url: lead.linkedIn } }),
          ...(lead.email && { Email: { email: lead.email } }),
          ...(lead.matchScore && { 'Match Score': { number: lead.matchScore } }),
          ...(lead.matchReason && {
            'Match Reason': {
              rich_text: [{ text: { content: lead.matchReason.substring(0, 2000) } }],
            },
          }),
          'Last Updated': {
            date: { start: lead.lastUpdated.toISOString() },
          },
          Source: {
            select: { name: lead.source },
          },
          ...(lead.notes && {
            Notes: {
              rich_text: [{ text: { content: lead.notes.substring(0, 2000) } }],
            },
          }),
        },
      });

      logger.info('Successfully added investor to Notion', {
        pageId: response.id,
        name: lead.name,
      });

      return response.id;
    });
  }

  async updateInvestor(pageId: string, lead: Partial<InvestorLead>): Promise<void> {
    return withRetry(async () => {
      logger.info('Updating investor in Notion', { pageId });

      const properties: Record<string, unknown> = {};

      if (lead.name) {
        properties.Name = { title: [{ text: { content: lead.name } }] };
      }
      if (lead.investmentThesis) {
        properties['Investment Thesis'] = {
          rich_text: [{ text: { content: lead.investmentThesis.substring(0, 2000) } }],
        };
      }
      if (lead.industries) {
        properties.Industries = {
          multi_select: lead.industries.map((industry) => ({ name: industry })),
        };
      }
      if (lead.matchScore !== undefined) {
        properties['Match Score'] = { number: lead.matchScore };
      }

      await this.client.pages.update({
        page_id: pageId,
        properties,
      });

      logger.info('Successfully updated investor in Notion', { pageId });
    });
  }

  async findInvestorByName(name: string): Promise<string | null> {
    return withRetry(async () => {
      const response = await this.client.databases.query({
        database_id: this.databaseId,
        filter: {
          property: 'Name',
          title: {
            equals: name,
          },
        },
      });

      return response.results.length > 0 ? response.results[0].id : null;
    });
  }

  async getAllInvestors(): Promise<Array<{ id: string; name: string }>> {
    return withRetry(async () => {
      const response = await this.client.databases.query({
        database_id: this.databaseId,
        page_size: 100,
      });

      return response.results.map((page: any) => ({
        id: page.id,
        name: page.properties.Name?.title?.[0]?.text?.content || 'Unknown',
      }));
    });
  }

  async ensureDatabaseSchema(): Promise<void> {
    try {
      await withRetry(async () => {
        await this.client.databases.retrieve({ database_id: this.databaseId });
        logger.info('Notion database schema validated');
      });
    } catch (error) {
      logger.error('Failed to validate Notion database schema', { error });
      throw new Error(
        'Notion database not accessible. Please check NOTION_DATABASE_ID and permissions.'
      );
    }
  }

  private capitalizeType(type: string): string {
    const typeMap: Record<string, string> = {
      vc: 'VC',
      family_office: 'Family Office',
      angel: 'Angel',
    };
    return typeMap[type] || type;
  }

  private formatStage(stage: string): string {
    return stage
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
