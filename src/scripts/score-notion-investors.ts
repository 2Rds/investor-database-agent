import { Client } from '@notionhq/client';
import { config } from '../config';
import { BlockDriveScorer, CSVInvestorRow, BlockDriveMatchScore } from '../services/research/blockdrive-scorer';
import { logger } from '../utils/logger';

interface NotionInvestor {
  id: string;
  firmName: string;
  partnerName: string;
  description: string;
  portfolio: string;
  firmLinkedIn: string;
  partnerEmail: string;
  averageCheckSize: number;
  currentMatchScore: number;
  enriched: boolean;
}

class NotionScorer {
  private client: Client;
  private databaseId: string;
  private scorer: BlockDriveScorer;

  constructor() {
    this.client = new Client({ auth: config.notion.apiKey });
    this.databaseId = config.notion.databaseId;
    this.scorer = new BlockDriveScorer();
  }

  /**
   * Fetch all investors from Notion database with pagination
   */
  async fetchAllInvestors(): Promise<NotionInvestor[]> {
    const investors: NotionInvestor[] = [];
    let hasMore = true;
    let cursor: string | undefined;

    console.log('📥 Fetching all investors from Notion database...\n');

    while (hasMore) {
      try {
        const response: any = await this.client.databases.query({
          database_id: this.databaseId,
          start_cursor: cursor,
          page_size: 100,
        });

        for (const page of response.results) {
          const props = page.properties;

          // Extract properties from Notion (handle null/undefined gracefully)
          const firmName = props.Name?.title?.[0]?.text?.content || 'Unknown Firm';
          const partnerName = props['Partner Name']?.rich_text?.[0]?.text?.content || '';
          const description = props.Description?.rich_text?.[0]?.text?.content || '';
          const portfolio = props.Portfolio?.url || '';
          const firmLinkedIn = props['Firm LinkedIn']?.url || '';
          const partnerEmail = props['Partner Email']?.email || '';
          const averageCheckSize = props['Average Check Size']?.number || 0;
          const currentMatchScore = props['Match %']?.number || 0;
          const enriched = props.Enriched?.checkbox || false;

          investors.push({
            id: page.id,
            firmName,
            partnerName,
            description,
            portfolio,
            firmLinkedIn,
            partnerEmail,
            averageCheckSize,
            currentMatchScore,
            enriched,
          });
        }

        hasMore = response.has_more;
        cursor = response.next_cursor || undefined;

        console.log(`  Fetched ${investors.length} investors so far...`);
      } catch (error) {
        logger.error('Failed to fetch investors from Notion', { error });
        throw error;
      }
    }

    console.log(`\n✅ Fetched ${investors.length} total investors\n`);
    return investors;
  }

  /**
   * Convert Notion investor data to CSVInvestorRow format for scoring
   */
  mapNotionToCSVFormat(investor: NotionInvestor): CSVInvestorRow {
    // Extract first/last name from partnerName if available
    const nameParts = investor.partnerName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Parse check size to string format (e.g., "$1M-$3M")
    let avgCheckSize = '';
    if (investor.averageCheckSize > 0) {
      const checkInMillions = investor.averageCheckSize / 1_000_000;
      avgCheckSize = `$${checkInMillions.toFixed(1)}M`;
    }

    return {
      firmName: investor.firmName,
      investorType: '', // Not available in Notion schema
      investmentFocus: investor.description,
      firstName,
      lastName,
      contactTitle: '', // Not available in Notion schema
      email: investor.partnerEmail,
      preferredGeography: '', // Not available in Notion schema
      linkedInProfile: investor.firmLinkedIn,
      firmDescription: investor.description,
      stage: '', // Not available in Notion schema
      avgCheckSize,
      totalInvestments: '', // Not available in Notion schema
      totalExits: '', // Not available in Notion schema
      website: investor.portfolio,
      additionalNotes: '',
    };
  }

  /**
   * Update a Notion investor page with match score and tier
   */
  async updateInvestorScore(pageId: string, score: BlockDriveMatchScore): Promise<void> {
    try {
      // Create a detailed match reason with breakdown
      const matchDetails = `${score.matchReason}\n\n` +
        `Breakdown:\n` +
        `• Web3/Blockchain: ${score.breakdown.web3Blockchain}/30\n` +
        `• Infrastructure: ${score.breakdown.infrastructure}/20\n` +
        `• Privacy/Security: ${score.breakdown.privacySecurity}/15\n` +
        `• Seed Stage: ${score.breakdown.seedStageActive}/15\n` +
        `• Check Size: ${score.breakdown.checkSizeMatch}/10\n` +
        `• Recent Activity: ${score.breakdown.recentActivity}/10`;

      await this.client.pages.update({
        page_id: pageId,
        properties: {
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
        },
      });
    } catch (error) {
      logger.error('Failed to update investor score in Notion', { pageId, error });
      throw error;
    }
  }

  /**
   * Score all investors and update Notion database
   */
  async scoreAllInvestors(): Promise<void> {
    console.log('🎯 BlockDrive Investor Match Scoring - Notion Edition\n');
    console.log('='.repeat(60) + '\n');

    // Fetch all investors
    const investors = await this.fetchAllInvestors();

    if (investors.length === 0) {
      console.log('❌ No investors found in Notion database');
      return;
    }

    // Score each investor
    console.log('📊 Scoring investors with BlockDrive algorithm...\n');

    const scoredInvestors: Array<{ investor: NotionInvestor; score: BlockDriveMatchScore }> = [];
    const tierCounts = {
      'S-Tier': 0,
      'A-Tier': 0,
      'B-Tier': 0,
      'C-Tier': 0,
      'Not a Match': 0,
    };

    for (const investor of investors) {
      // Convert to CSV format for scoring
      const csvFormat = this.mapNotionToCSVFormat(investor);

      // Calculate match score
      const score = this.scorer.calculateMatchScore(csvFormat);

      scoredInvestors.push({ investor, score });
      tierCounts[score.tier]++;

      // Log progress
      const emoji = score.tier === 'S-Tier' ? '🌟' : score.tier === 'A-Tier' ? '⭐' : '📌';
      console.log(`${emoji} ${investor.firmName.padEnd(40)} ${score.percentageMatch}% (${score.tier})`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n📈 Match Score Distribution:\n');
    console.log(`🌟 S-Tier (90-100%):  ${tierCounts['S-Tier']} investors`);
    console.log(`⭐ A-Tier (75-89%):   ${tierCounts['A-Tier']} investors`);
    console.log(`📌 B-Tier (50-74%):   ${tierCounts['B-Tier']} investors`);
    console.log(`📎 C-Tier (25-49%):   ${tierCounts['C-Tier']} investors`);
    console.log(`❌ Not a Match (<25%): ${tierCounts['Not a Match']} investors`);
    console.log('\n' + '='.repeat(60) + '\n');

    // Update Notion database
    console.log('💾 Updating Notion database with match scores...\n');

    let updated = 0;
    let failed = 0;

    for (const { investor, score } of scoredInvestors) {
      try {
        await this.updateInvestorScore(investor.id, score);
        updated++;

        // Log progress every 10 updates
        if (updated % 10 === 0) {
          console.log(`  ✅ Updated ${updated}/${investors.length} investors...`);
        }

        // Rate limiting: 3 requests per second (Notion API limit)
        await new Promise((resolve) => setTimeout(resolve, 350));
      } catch (error) {
        failed++;
        console.error(`  ❌ Failed to update ${investor.firmName}:`, error);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Scoring Complete!\n');
    console.log(`Total Investors: ${investors.length}`);
    console.log(`Successfully Updated: ${updated}`);
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

    console.log('🎉 All match scores have been updated in your Notion database!');
    console.log('📌 Check the "Match %", "Match Tier", and "Match Details" columns\n');
  }
}

// Main execution
async function main() {
  try {
    const scorer = new NotionScorer();
    await scorer.scoreAllInvestors();
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();
