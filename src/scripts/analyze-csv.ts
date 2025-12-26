#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import { BlockDriveScorer, CSVInvestorRow } from '../services/research/blockdrive-scorer';
import { logger } from '../utils/logger';

interface CSVRow {
  'Firm Name': string;
  'Investor Type': string;
  'Investment Focus': string;
  'First Name': string;
  'Last Name': string;
  'Contact Title': string;
  Email: string;
  'Preferred Geography': string;
  'LinkedIn Profile': string;
  'Firm Description': string;
  Stage: string;
  'Avg Check Size': string;
  'Total Investments': string;
  'Total Exits': string;
  Website: string;
  'Additional Notes': string;
}

interface ScoredInvestorOutput {
  firmName: string;
  firstName: string;
  lastName: string;
  email: string;
  contactTitle: string;
  website: string;
  linkedInProfile: string;
  investmentFocus: string;
  stage: string;
  avgCheckSize: string;
  totalScore: number;
  percentageMatch: number;
  tier: string;
  matchReason: string;
  web3Score: number;
  infrastructureScore: number;
  securityScore: number;
  seedStageScore: number;
  checkSizeScore: number;
  activityScore: number;
}

async function analyzeInvestorDatabase() {
  console.log('🚀 BlockDrive Investor Database Analyzer');
  console.log('========================================\n');

  const csvPath = path.join(__dirname, '../../_3000 Investor Database - Masterlist - Final.csv');
  const outputDir = path.join(__dirname, '../../analysis-results');

  // Create output directory
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const investors: CSVInvestorRow[] = [];
  const scorer = new BlockDriveScorer();

  console.log(`📊 Reading CSV from: ${csvPath}\n`);

  // Read and parse CSV
  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row: CSVRow) => {
        const investor: CSVInvestorRow = {
          firmName: row['Firm Name'] || '',
          investorType: row['Investor Type'] || '',
          investmentFocus: row['Investment Focus'] || '',
          firstName: row['First Name'] || '',
          lastName: row['Last Name'] || '',
          contactTitle: row['Contact Title'] || '',
          email: row['Email'] || '',
          preferredGeography: row['Preferred Geography'] || '',
          linkedInProfile: row['LinkedIn Profile'] || '',
          firmDescription: row['Firm Description'] || '',
          stage: row['Stage'] || '',
          avgCheckSize: row['Avg Check Size'] || '',
          totalInvestments: row['Total Investments'] || '',
          totalExits: row['Total Exits'] || '',
          website: row['Website'] || '',
          additionalNotes: row['Additional Notes'] || '',
        };
        investors.push(investor);
      })
      .on('end', async () => {
        console.log(`✅ Loaded ${investors.length} investors\n`);
        console.log('🔍 Calculating match scores...\n');

        // Score all investors
        const scoredResults = investors.map((investor) => {
          const score = scorer.calculateMatchScore(investor);
          return { investor, score };
        });

        // Generate statistics
        const tierCounts = {
          'S-Tier': 0,
          'A-Tier': 0,
          'B-Tier': 0,
          'C-Tier': 0,
          'Not a Match': 0,
        };

        scoredResults.forEach((result) => {
          tierCounts[result.score.tier]++;
        });

        console.log('📈 Match Score Distribution:');
        console.log('──────────────────────────────');
        console.log(`S-Tier (90-100%): ${tierCounts['S-Tier']} investors`);
        console.log(`A-Tier (75-89%):  ${tierCounts['A-Tier']} investors`);
        console.log(`B-Tier (60-74%):  ${tierCounts['B-Tier']} investors`);
        console.log(`C-Tier (40-59%):  ${tierCounts['C-Tier']} investors`);
        console.log(`Not a Match:      ${tierCounts['Not a Match']} investors`);
        console.log('──────────────────────────────\n');

        // Sort by score
        const sortedResults = scoredResults.sort(
          (a, b) => b.score.totalScore - a.score.totalScore
        );

        // Prepare output data
        const fullResults: ScoredInvestorOutput[] = sortedResults.map((result) => ({
          firmName: result.investor.firmName,
          firstName: result.investor.firstName,
          lastName: result.investor.lastName,
          email: result.investor.email,
          contactTitle: result.investor.contactTitle,
          website: result.investor.website,
          linkedInProfile: result.investor.linkedInProfile,
          investmentFocus: result.investor.investmentFocus,
          stage: result.investor.stage,
          avgCheckSize: result.investor.avgCheckSize,
          totalScore: result.score.totalScore,
          percentageMatch: result.score.percentageMatch,
          tier: result.score.tier,
          matchReason: result.score.matchReason,
          web3Score: result.score.breakdown.web3Blockchain,
          infrastructureScore: result.score.breakdown.infrastructure,
          securityScore: result.score.breakdown.privacySecurity,
          seedStageScore: result.score.breakdown.seedStageActive,
          checkSizeScore: result.score.breakdown.checkSizeMatch,
          activityScore: result.score.breakdown.recentActivity,
        }));

        // Write full results
        const fullResultsPath = path.join(outputDir, 'all-investors-scored.csv');
        const fullCsvWriter = createObjectCsvWriter({
          path: fullResultsPath,
          header: [
            { id: 'firmName', title: 'Firm Name' },
            { id: 'firstName', title: 'First Name' },
            { id: 'lastName', title: 'Last Name' },
            { id: 'email', title: 'Email' },
            { id: 'contactTitle', title: 'Title' },
            { id: 'website', title: 'Website' },
            { id: 'linkedInProfile', title: 'LinkedIn' },
            { id: 'investmentFocus', title: 'Investment Focus' },
            { id: 'stage', title: 'Stage' },
            { id: 'avgCheckSize', title: 'Check Size' },
            { id: 'totalScore', title: 'Total Score' },
            { id: 'percentageMatch', title: 'Match %' },
            { id: 'tier', title: 'Tier' },
            { id: 'matchReason', title: 'Match Reason' },
            { id: 'web3Score', title: 'Web3 Score' },
            { id: 'infrastructureScore', title: 'Infra Score' },
            { id: 'securityScore', title: 'Security Score' },
            { id: 'seedStageScore', title: 'Seed Score' },
            { id: 'checkSizeScore', title: 'Check $ Score' },
            { id: 'activityScore', title: 'Activity Score' },
          ],
        });

        await fullCsvWriter.writeRecords(fullResults);
        console.log(`💾 Full results saved to: ${fullResultsPath}\n`);

        // Get top 100 S-Tier and A-Tier matches
        const topMatches = fullResults.filter(
          (r) => r.tier === 'S-Tier' || r.tier === 'A-Tier'
        );
        const top100 = topMatches.slice(0, 100);

        const topMatchesPath = path.join(outputDir, 'top-100-matches.csv');
        const topCsvWriter = createObjectCsvWriter({
          path: topMatchesPath,
          header: [
            { id: 'firmName', title: 'Firm Name' },
            { id: 'firstName', title: 'First Name' },
            { id: 'lastName', title: 'Last Name' },
            { id: 'email', title: 'Email' },
            { id: 'contactTitle', title: 'Title' },
            { id: 'website', title: 'Website' },
            { id: 'linkedInProfile', title: 'LinkedIn' },
            { id: 'totalScore', title: 'Total Score' },
            { id: 'percentageMatch', title: 'Match %' },
            { id: 'tier', title: 'Tier' },
            { id: 'matchReason', title: 'Match Reason' },
          ],
        });

        await topCsvWriter.writeRecords(top100);
        console.log(`🎯 Top 100 matches saved to: ${topMatchesPath}\n`);

        // Display top 20 matches
        console.log('🏆 TOP 20 BLOCKDRIVE MATCHES:');
        console.log('═════════════════════════════════════════════════════════════\n');

        top100.slice(0, 20).forEach((match, index) => {
          console.log(`${index + 1}. ${match.tier} - ${match.percentageMatch}% Match`);
          console.log(`   Firm: ${match.firmName}`);
          console.log(`   Contact: ${match.firstName} ${match.lastName} (${match.contactTitle})`);
          console.log(`   Email: ${match.email}`);
          console.log(`   Focus: ${match.investmentFocus}`);
          console.log(`   Stage: ${match.stage} | Check: ${match.avgCheckSize}`);
          console.log(`   Why: ${match.matchReason}`);
          console.log(
            `   Scores: Web3=${match.web3Score} Infra=${match.infrastructureScore} Sec=${match.securityScore}`
          );
          console.log('');
        });

        console.log('═════════════════════════════════════════════════════════════');
        console.log('\n✨ Analysis complete!\n');
        console.log('📁 Results saved to:', outputDir);
        console.log(`   - all-investors-scored.csv (${fullResults.length} investors)`);
        console.log(`   - top-100-matches.csv (${top100.length} top matches)`);
        console.log('\n🎯 Next Steps:');
        console.log('   1. Review top-100-matches.csv for S-Tier/A-Tier investors');
        console.log('   2. Begin enrichment on top matches using Firecrawl');
        console.log('   3. Start outreach campaign on January 1\n');

        resolve();
      })
      .on('error', (error) => {
        logger.error('Error reading CSV', { error });
        reject(error);
      });
  });
}

// Run the analysis
analyzeInvestorDatabase()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Analysis failed:', error);
    process.exit(1);
  });
