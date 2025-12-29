import { Client } from '@notionhq/client';
import { config } from '../config';
import { BlockDriveScorer, CSVInvestorRow, BlockDriveMatchScore } from '../services/research/blockdrive-scorer';
import { logger } from '../utils/logger';
import csv from 'csv-parser';
import * as fs from 'fs';
import * as path from 'path';

class CSVToNotionScorer {
  private notion: Client;
  private scorer: BlockDriveScorer;
  private csvFilePath: string;

  constructor() {
    this.notion = new Client({ auth: config.notion.apiKey });
    this.scorer = new BlockDriveScorer();

    // Look for CSV file in project root
    this.csvFilePath = path.join(process.cwd(), 'investor-masterlist.csv');
  }

  /**
   * Read data from local CSV file
   */
  async readFromCSV(): Promise<CSVInvestorRow[]> {
    console.log('📥 Reading investor data from CSV file...\n');
    console.log(`Looking for: ${this.csvFilePath}\n`);

    if (!fs.existsSync(this.csvFilePath)) {
      throw new Error(`CSV file not found at: ${this.csvFilePath}\n\nPlease download your Google Sheet as CSV and save it as 'investor-masterlist.csv' in the project folder.`);
    }

    return new Promise((resolve, reject) => {
      const investors: CSVInvestorRow[] = [];

      fs.createReadStream(this.csvFilePath)
        .pipe(csv())
        .on('data', (row: any) => {
          // Map CSV columns to CSVInvestorRow format
          const investor: CSVInvestorRow = {
            firmName: row['Firm Name'] || row['firmName'] || row['FirmName'] || '',
            investorType: row['Investor Type'] || row['investorType'] || row['InvestorType'] || '',
            investmentFocus: row['Investment Focus'] || row['investmentFocus'] || row['InvestmentFocus'] || row['Focus'] || '',
            firstName: row['First Name'] || row['firstName'] || row['FirstName'] || '',
            lastName: row['Last Name'] || row['lastName'] || row['LastName'] || '',
            contactTitle: row['Contact Title'] || row['contactTitle'] || row['Title'] || '',
            email: row['Email'] || row['email'] || row['Contact Email'] || '',
            preferredGeography: row['Preferred Geography'] || row['preferredGeography'] || row['Geography'] || '',
            linkedInProfile: row['LinkedIn Profile'] || row['linkedInProfile'] || row['LinkedIn'] || '',
            firmDescription: row['Firm Description'] || row['firmDescription'] || row['Description'] || '',
            stage: row['Stage'] || row['stage'] || row['Investment Stage'] || '',
            avgCheckSize: row['Avg Check Size'] || row['avgCheckSize'] || row['Average Check Size'] || row['Check Size'] || '',
            totalInvestments: row['Total Investments'] || row['totalInvestments'] || '',
            totalExits: row['Total Exits'] || row['totalExits'] || '',
            website: row['Website'] || row['website'] || '',
            additionalNotes: row['Additional Notes'] || row['additionalNotes'] || row['Notes'] || '',
          };

          if (investor.firmName) {
            investors.push(investor);
          }
        })
        .on('end', () => {
          console.log(`✅ Found ${investors.length} investors in CSV\n`);
          resolve(investors);
        })
        .on('error', (error) => {
          reject(error);
        });
    });
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
    console.log('🎯 BlockDrive Investor Scoring - CSV → Notion\n');
    console.log('='.repeat(60) + '\n');

    try {
      // Step 1: Read from CSV
      const investors = await this.readFromCSV();

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

      // Step 4: Filter out "Not a Match" investors and populate Notion database
      console.log('💾 Populating Notion database with qualified investors (C-Tier and above)...\n');
      console.log(`📋 Filtering out ${tierCounts['Not a Match']} "Not a Match" investors\n`);

      // Filter to only include C-Tier and above (25%+)
      const qualifiedInvestors = scoredInvestors.filter(({ score }) => score.percentageMatch >= 25);

      let added = 0;
      let failed = 0;

      for (const { investor, score } of qualifiedInvestors) {
        try {
          await this.addInvestorToNotion(databaseId, investor, score);
          added++;

          // Log progress every 50 investors
          if (added % 50 === 0) {
            console.log(`  ✅ Added ${added}/${qualifiedInvestors.length} investors...`);
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
      console.log(`Total Investors Scored: ${investors.length}`);
      console.log(`Qualified Investors (≥25% match): ${qualifiedInvestors.length}`);
      console.log(`Successfully Added to Notion: ${added}`);
      console.log(`Filtered Out (<25% match): ${tierCounts['Not a Match']}`);
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
  const scorer = new CSVToNotionScorer();
  await scorer.run();
}

main();
