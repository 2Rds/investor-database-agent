import { google } from 'googleapis';
import { Client } from '@notionhq/client';
import { config } from '../config';
import { BlockDriveScorer, CSVInvestorRow, BlockDriveMatchScore } from '../services/research/blockdrive-scorer';
import { logger } from '../utils/logger';

interface GoogleSheetsConfig {
  spreadsheetId: string;
  range: string;
  apiKey?: string;
}

class GoogleSheetsToNotionScorer {
  private notion: Client;
  private scorer: BlockDriveScorer;
  private sheetsConfig: GoogleSheetsConfig;

  constructor() {
    this.notion = new Client({ auth: config.notion.apiKey });
    this.scorer = new BlockDriveScorer();

    // Extract spreadsheet ID from URL
    // https://docs.google.com/spreadsheets/d/1ZkmDtxCO8rtOOG4E8TT9drNhi-HV3UZdYw2GlAM98vc/edit?gid=1420193837#gid=1420193837
    this.sheetsConfig = {
      spreadsheetId: '1ZkmDtxCO8rtOOG4E8TT9drNhi-HV3UZdYw2GlAM98vc',
      range: 'Sheet1!A:Z', // Read all columns
      apiKey: process.env.GOOGLE_SHEETS_API_KEY,
    };
  }

  /**
   * Read data from Google Sheets
   */
  async readFromGoogleSheets(): Promise<CSVInvestorRow[]> {
    console.log('📥 Reading investor data from Google Sheets...\n');

    try {
      const sheets = google.sheets({ version: 'v4', auth: this.sheetsConfig.apiKey });

      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: this.sheetsConfig.spreadsheetId,
        range: this.sheetsConfig.range,
      });

      const rows = response.data.values;

      if (!rows || rows.length === 0) {
        throw new Error('No data found in Google Sheet');
      }

      // First row is headers
      const headers = rows[0].map((h: string) => h.trim());
      const dataRows = rows.slice(1);

      console.log(`✅ Found ${dataRows.length} investors in Google Sheet\n`);

      // Map rows to CSVInvestorRow format
      const investors: CSVInvestorRow[] = dataRows.map((row: any[]) => {
        const investor: any = {};

        headers.forEach((header: string, index: number) => {
          const value = row[index] || '';

          // Map Google Sheets columns to our format
          switch (header.toLowerCase()) {
            case 'firm name':
            case 'firmname':
              investor.firmName = value;
              break;
            case 'investor type':
            case 'investortype':
              investor.investorType = value;
              break;
            case 'investment focus':
            case 'investmentfocus':
            case 'focus':
              investor.investmentFocus = value;
              break;
            case 'first name':
            case 'firstname':
              investor.firstName = value;
              break;
            case 'last name':
            case 'lastname':
              investor.lastName = value;
              break;
            case 'contact title':
            case 'title':
              investor.contactTitle = value;
              break;
            case 'email':
            case 'contact email':
              investor.email = value;
              break;
            case 'geography':
            case 'preferred geography':
              investor.preferredGeography = value;
              break;
            case 'linkedin':
            case 'linkedin profile':
              investor.linkedInProfile = value;
              break;
            case 'firm description':
            case 'description':
              investor.firmDescription = value;
              break;
            case 'stage':
            case 'investment stage':
              investor.stage = value;
              break;
            case 'check size':
            case 'avg check size':
            case 'average check size':
              investor.avgCheckSize = value;
              break;
            case 'total investments':
              investor.totalInvestments = value;
              break;
            case 'total exits':
              investor.totalExits = value;
              break;
            case 'website':
              investor.website = value;
              break;
            case 'notes':
            case 'additional notes':
              investor.additionalNotes = value;
              break;
          }
        });

        return investor as CSVInvestorRow;
      });

      return investors.filter(inv => inv.firmName); // Filter out empty rows
    } catch (error) {
      logger.error('Failed to read Google Sheets', { error });
      throw error;
    }
  }

  /**
   * Create a fresh Notion database with the correct schema
   */
  async createNotionDatabase(): Promise<string> {
    console.log('🏗️  Creating fresh Notion database...\n');

    try {
      const response = await this.notion.databases.create({
        parent: {
          type: 'page_id',
          page_id: process.env.NOTION_PARENT_PAGE_ID || '',
        },
        title: [
          {
            text: {
              content: 'BlockDrive Investor Database - Scored',
            },
          },
        ],
        properties: {
          'Firm Name': {
            title: {},
          },
          '# Match': {
            number: {
              format: 'number',
            },
          },
          'Tier': {
            select: {
              options: [
                { name: 'S-Tier', color: 'green' },
                { name: 'A-Tier', color: 'blue' },
                { name: 'B-Tier', color: 'yellow' },
                { name: 'C-Tier', color: 'orange' },
                { name: 'Not a Match', color: 'red' },
              ],
            },
          },
          'Match Detail': {
            rich_text: {},
          },
          'Investor Type': {
            select: {
              options: [
                { name: 'Venture Capital', color: 'blue' },
                { name: 'Angel', color: 'purple' },
                { name: 'Family Office', color: 'pink' },
                { name: 'Corporate VC', color: 'orange' },
              ],
            },
          },
          'Investment Focus': {
            rich_text: {},
          },
          'Partner Name': {
            rich_text: {},
          },
          'Partner Email': {
            email: {},
          },
          'Website': {
            url: {},
          },
          'LinkedIn': {
            url: {},
          },
          'Stage': {
            multi_select: {
              options: [
                { name: 'Pre-Seed', color: 'gray' },
                { name: 'Seed', color: 'brown' },
                { name: 'Series A', color: 'orange' },
                { name: 'Series B+', color: 'yellow' },
              ],
            },
          },
          'Check Size': {
            rich_text: {},
          },
          'Geography': {
            rich_text: {},
          },
          'Enriched': {
            checkbox: {},
          },
          'Added Date': {
            date: {},
          },
        },
      });

      const databaseId = response.id;
      console.log(`✅ Created database: ${databaseId}\n`);
      console.log(`🔗 View at: https://notion.so/${databaseId.replace(/-/g, '')}\n`);

      return databaseId;
    } catch (error) {
      logger.error('Failed to create Notion database', { error });
      throw error;
    }
  }

  /**
   * Add a scored investor to Notion database
   */
  async addInvestorToNotion(
    databaseId: string,
    investor: CSVInvestorRow,
    score: BlockDriveMatchScore
  ): Promise<void> {
    const matchDetails = `${score.matchReason}\n\n` +
      `Breakdown:\n` +
      `• Web3/Blockchain: ${score.breakdown.web3Blockchain}/30\n` +
      `• Infrastructure: ${score.breakdown.infrastructure}/20\n` +
      `• Privacy/Security: ${score.breakdown.privacySecurity}/15\n` +
      `• Seed Stage: ${score.breakdown.seedStageActive}/15\n` +
      `• Check Size: ${score.breakdown.checkSizeMatch}/10\n` +
      `• Recent Activity: ${score.breakdown.recentActivity}/10`;

    const properties: any = {
      'Firm Name': {
        title: [{ text: { content: investor.firmName || 'Unknown' } }],
      },
      '# Match': {
        number: score.percentageMatch,
      },
      'Tier': {
        select: { name: score.tier },
      },
      'Match Detail': {
        rich_text: [{ text: { content: matchDetails.substring(0, 2000) } }],
      },
      'Enriched': {
        checkbox: true,
      },
      'Added Date': {
        date: { start: new Date().toISOString().split('T')[0] },
      },
    };

    // Add optional properties
    if (investor.investorType) {
      properties['Investor Type'] = {
        select: { name: investor.investorType },
      };
    }

    if (investor.investmentFocus) {
      properties['Investment Focus'] = {
        rich_text: [{ text: { content: investor.investmentFocus.substring(0, 2000) } }],
      };
    }

    if (investor.firstName || investor.lastName) {
      const partnerName = `${investor.firstName || ''} ${investor.lastName || ''}`.trim();
      properties['Partner Name'] = {
        rich_text: [{ text: { content: partnerName } }],
      };
    }

    if (investor.email) {
      properties['Partner Email'] = {
        email: investor.email,
      };
    }

    if (investor.website) {
      properties['Website'] = {
        url: investor.website,
      };
    }

    if (investor.linkedInProfile) {
      properties['LinkedIn'] = {
        url: investor.linkedInProfile,
      };
    }

    if (investor.avgCheckSize) {
      properties['Check Size'] = {
        rich_text: [{ text: { content: investor.avgCheckSize } }],
      };
    }

    if (investor.preferredGeography) {
      properties['Geography'] = {
        rich_text: [{ text: { content: investor.preferredGeography.substring(0, 2000) } }],
      };
    }

    await this.notion.pages.create({
      parent: { database_id: databaseId },
      properties,
    });
  }

  /**
   * Main execution
   */
  async run(): Promise<void> {
    console.log('🎯 BlockDrive Investor Scoring - Google Sheets → Notion\n');
    console.log('='.repeat(60) + '\n');

    try {
      // Step 1: Read from Google Sheets
      const investors = await this.readFromGoogleSheets();

      // Step 2: Score all investors
      console.log('📊 Scoring investors with BlockDrive algorithm...\n');

      const scoredInvestors = investors.map((investor) => {
        const score = this.scorer.calculateMatchScore(investor);
        return { investor, score };
      });

      // Calculate tier distribution
      const tierCounts = {
        'S-Tier': 0,
        'A-Tier': 0,
        'B-Tier': 0,
        'C-Tier': 0,
        'Not a Match': 0,
      };

      scoredInvestors.forEach(({ score }) => {
        tierCounts[score.tier]++;
      });

      console.log('📈 Match Score Distribution:\n');
      console.log(`🌟 S-Tier (90-100%):  ${tierCounts['S-Tier']} investors`);
      console.log(`⭐ A-Tier (75-89%):   ${tierCounts['A-Tier']} investors`);
      console.log(`📌 B-Tier (50-74%):   ${tierCounts['B-Tier']} investors`);
      console.log(`📎 C-Tier (25-49%):   ${tierCounts['C-Tier']} investors`);
      console.log(`❌ Not a Match (<25%): ${tierCounts['Not a Match']} investors`);
      console.log('\n' + '='.repeat(60) + '\n');

      // Step 3: Create fresh Notion database
      const databaseId = await this.createNotionDatabase();

      // Step 4: Populate Notion database with scored investors
      console.log('💾 Populating Notion database with scored investors...\n');

      let added = 0;
      let failed = 0;

      for (const { investor, score } of scoredInvestors) {
        try {
          await this.addInvestorToNotion(databaseId, investor, score);
          added++;

          // Log progress every 50 investors
          if (added % 50 === 0) {
            console.log(`  ✅ Added ${added}/${investors.length} investors...`);
          }

          // Rate limiting: 3 requests per second (Notion API limit)
          await new Promise((resolve) => setTimeout(resolve, 350));
        } catch (error) {
          failed++;
          console.error(`  ❌ Failed to add ${investor.firmName}:`, error);
        }
      }

      console.log('\n' + '='.repeat(60));
      console.log('\n✅ Scoring Complete!\n');
      console.log(`Total Investors: ${investors.length}`);
      console.log(`Successfully Added: ${added}`);
      console.log(`Failed: ${failed}`);
      console.log('\n' + '='.repeat(60) + '\n');

      // Show top 10 matches
      const topMatches = scoredInvestors
        .sort((a, b) => b.score.percentageMatch - a.score.percentageMatch)
        .slice(0, 10);

      console.log('🏆 Top 10 Matches for BlockDrive:\n');
      topMatches.forEach((match, index) => {
        const { investor, score } = match;
        console.log(`${index + 1}. ${investor.firmName}`);
        console.log(`   Match: ${score.percentageMatch}% (${score.tier})`);
        console.log(`   Reason: ${score.matchReason}`);
        console.log('');
      });

      console.log('🎉 All investors have been scored and added to your new Notion database!');
      console.log(`🔗 View at: https://notion.so/${databaseId.replace(/-/g, '')}\n`);
      console.log('📌 Filter by "Tier = S-Tier" to see your top priority targets!\n');

      // Save database ID to file for future reference
      const fs = await import('fs');
      fs.writeFileSync(
        'NOTION_DATABASE_ID.txt',
        `${databaseId}\n\nView at: https://notion.so/${databaseId.replace(/-/g, '')}`
      );
      console.log('💾 Database ID saved to NOTION_DATABASE_ID.txt\n');

    } catch (error) {
      console.error('\n❌ Error:', error);
      process.exit(1);
    }
  }
}

// Main execution
async function main() {
  const scorer = new GoogleSheetsToNotionScorer();
  await scorer.run();
}

main();
