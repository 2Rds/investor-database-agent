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
      logger.info('Adding investor to Notion Fundraising Tracker', { name: lead.name });

      const properties: any = {
        Name: {
          title: [{ text: { content: lead.name } }],
        },
        Status: {
          select: { name: 'Contacted' }, // Default to "Contacted" phase
        },
        Description: {
          rich_text: [
            {
              text: {
                content: lead.investmentThesis?.substring(0, 2000) || 'Pending research',
              },
            },
          ],
        },
      };

      // Add optional properties that match the Fundraising Tracker template
      if (lead.checkSize) {
        // Calculate average check size for the template
        const avgCheckSize = (lead.checkSize.min + lead.checkSize.max) / 2;
        properties['Average Check Size'] = {
          number: avgCheckSize,
        };
      }

      // Portfolio URL (use website as portfolio link)
      if (lead.website) {
        properties['Portfolio'] = {
          url: lead.website,
        };
      }

      // Firm LinkedIn
      if (lead.linkedIn) {
        properties['Firm LinkedIn'] = {
          url: lead.linkedIn,
        };
      }

      // Partner Email
      if (lead.email) {
        properties['Partner Email'] = {
          email: lead.email,
        };
      }

      // Partner Name (use firmName if available, fallback to name)
      if (lead.firmName) {
        properties['Partner Name'] = {
          rich_text: [{ text: { content: lead.firmName } }],
        };
      }

      // Match % (0-100 percentage)
      if (lead.matchScore !== undefined) {
        properties['Match %'] = {
          number: lead.matchScore,
        };
      }

      // Enriched checkbox - mark as checked if we have email or website
      const isEnriched = !!(lead.email || lead.website || lead.linkedIn);
      properties['Enriched'] = {
        checkbox: isEnriched,
      };

      const response = await this.client.pages.create({
        parent: { database_id: this.databaseId },
        properties,
      });

      logger.info('Successfully added investor to Fundraising Tracker', {
        pageId: response.id,
        name: lead.name,
        status: 'Contacted'
      });

      return response.id;
    });
  }

  async updateInvestor(pageId: string, lead: Partial<InvestorLead>): Promise<void> {
    return withRetry(async () => {
      logger.info('Updating investor in Notion', { pageId });

      const properties: any = {};

      if (lead.name) {
        properties.Name = { title: [{ text: { content: lead.name } }] };
      }

      if (lead.investmentThesis) {
        properties.Description = {
          rich_text: [{ text: { content: lead.investmentThesis.substring(0, 2000) } }],
        };
      }

      if (lead.checkSize) {
        const avgCheckSize = (lead.checkSize.min + lead.checkSize.max) / 2;
        properties['Average Check Size'] = {
          number: avgCheckSize,
        };
      }

      if (lead.website) {
        properties['Portfolio'] = {
          url: lead.website,
        };
      }

      if (lead.linkedIn) {
        properties['Firm LinkedIn'] = {
          url: lead.linkedIn,
        };
      }

      if (lead.email) {
        properties['Partner Email'] = {
          email: lead.email,
        };
      }

      if (lead.firmName) {
        properties['Partner Name'] = {
          rich_text: [{ text: { content: lead.firmName } }],
        };
      }

      await this.client.pages.update({
        page_id: pageId,
        properties,
      });

      logger.info('Successfully updated investor in Notion', { pageId });
    });
  }

  /**
   * Update the Status/Phase of an investor in the fundraising pipeline
   * @param pageId Notion page ID
   * @param status One of: Contacted, Pitched, Diligence, Won, Lost
   */
  async updateInvestorStatus(pageId: string, status: 'Contacted' | 'Pitched' | 'Diligence' | 'Won' | 'Lost'): Promise<void> {
    return withRetry(async () => {
      logger.info('Updating investor status', { pageId, status });

      await this.client.pages.update({
        page_id: pageId,
        properties: {
          Status: {
            select: { name: status },
          },
        },
      });

      logger.info('Successfully updated investor status', { pageId, status });
    });
  }

  /**
   * Mark an investor as "Lost" with a reason
   */
  async markAsLost(pageId: string, reason: string): Promise<void> {
    return withRetry(async () => {
      logger.info('Marking investor as lost', { pageId, reason });

      await this.client.pages.update({
        page_id: pageId,
        properties: {
          Status: {
            select: { name: 'Lost' },
          },
          'Lost Reason': {
            rich_text: [{ text: { content: reason.substring(0, 2000) } }],
          },
        },
      });

      logger.info('Successfully marked investor as lost', { pageId });
    });
  }

  /**
   * Add warm contact information to an investor
   */
  async addWarmContact(pageId: string, name: string, email: string): Promise<void> {
    return withRetry(async () => {
      logger.info('Adding warm contact', { pageId, name, email });

      await this.client.pages.update({
        page_id: pageId,
        properties: {
          'Warm Contact Name': {
            rich_text: [{ text: { content: name } }],
          },
          'Warm Contact Email': {
            email: email,
          },
        },
      });

      logger.info('Successfully added warm contact', { pageId });
    });
  }

  /**
   * Mark an investor as enriched
   */
  async markAsEnriched(pageId: string, matchScore?: number): Promise<void> {
    return withRetry(async () => {
      logger.info('Marking investor as enriched', { pageId, matchScore });

      const properties: any = {
        'Enriched': {
          checkbox: true,
        },
      };

      if (matchScore !== undefined) {
        properties['Match %'] = {
          number: matchScore,
        };
      }

      await this.client.pages.update({
        page_id: pageId,
        properties,
      });

      logger.info('Successfully marked investor as enriched', { pageId });
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
        const database = await this.client.databases.retrieve({ database_id: this.databaseId });
        logger.info('Notion Fundraising Tracker database validated', {
          title: (database as any).title?.[0]?.text?.content || 'Fundraising Tracker',
          databaseId: this.databaseId
        });
      });
    } catch (error) {
      logger.error('Failed to validate Notion database schema', { error });
      throw new Error(
        'Notion database not accessible. Please check NOTION_DATABASE_ID and permissions.'
      );
    }
  }
}
