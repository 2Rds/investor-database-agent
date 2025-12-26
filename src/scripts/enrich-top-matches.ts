#!/usr/bin/env node
import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
import { createObjectCsvWriter } from 'csv-writer';
import { firecrawlService } from '../services/research/firecrawl-enrichment';
import { logger } from '../utils/logger';

interface TopMatchRow {
  'Firm Name': string;
  'First Name': string;
  'Last Name': string;
  Email: string;
  Title: string;
  Website: string;
  LinkedIn: string;
  'Total Score': string;
  'Match %': string;
  Tier: string;
  'Match Reason': string;
}

interface EnrichedMatch extends TopMatchRow {
  enrichmentStatus: 'success' | 'failed' | 'skipped';
  investmentThesis?: string;
  industries?: string;
  stages?: string;
  checkSizeMin?: string;
  checkSizeMax?: string;
  geography?: string;
  scrapedNotes?: string;
}

async function enrichTopMatches() {
  console.log('🔥 Firecrawl Investor Enrichment');
  console.log('=================================\n');

  if (!firecrawlService.isAvailable()) {
    console.error('❌ Firecrawl API key not configured!');
    console.log('\n📝 To use Firecrawl enrichment:');
    console.log('   1. Get your Firecrawl API key from Lovable (100% free until Jan 26)');
    console.log('   2. Add to .env file: FIRECRAWL_API_KEY=fc-your-key');
    console.log('   3. Re-run this script\n');
    process.exit(1);
  }

  const inputPath = path.join(
    __dirname,
    '../../analysis-results/top-100-matches.csv'
  );
  const outputPath = path.join(
    __dirname,
    '../../analysis-results/top-100-matches-enriched.csv'
  );

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Top matches file not found: ${inputPath}`);
    console.log('   Run "npm run analyze-csv" first to generate top matches.');
    process.exit(1);
  }

  const topMatches: TopMatchRow[] = [];

  console.log(`📊 Reading top matches from: ${inputPath}\n`);

  // Read CSV
  return new Promise<void>((resolve, reject) => {
    fs.createReadStream(inputPath)
      .pipe(csv())
      .on('data', (row: TopMatchRow) => {
        topMatches.push(row);
      })
      .on('end', async () => {
        console.log(`✅ Loaded ${topMatches.length} top-tier investors\n`);
        console.log('🌐 Starting Firecrawl enrichment...\n');

        const enrichedResults: EnrichedMatch[] = [];
        let successCount = 0;
        let failedCount = 0;
        let skippedCount = 0;

        for (let i = 0; i < topMatches.length; i++) {
          const match = topMatches[i];
          const progress = `[${i + 1}/${topMatches.length}]`;

          console.log(
            `${progress} ${match['Firm Name']} (${match.Tier} - ${match['Match %']}%)`
          );

          // Skip if no website
          if (!match.Website || match.Website === 'NA' || match.Website.trim() === '') {
            console.log('   ⏭️  Skipped - No website\n');
            enrichedResults.push({
              ...match,
              enrichmentStatus: 'skipped',
            });
            skippedCount++;
            continue;
          }

          try {
            // Enrich using Firecrawl
            const result = await firecrawlService.enrichInvestorFromWebsite(
              match['Firm Name'],
              match.Website
            );

            if (result.success && result.data) {
              console.log('   ✅ Success!');
              console.log(
                `   📝 Thesis: ${result.data.investmentThesis?.substring(0, 80) || 'N/A'}...`
              );
              console.log(
                `   🏷️  Industries: ${result.data.industries?.join(', ') || 'N/A'}`
              );
              console.log(`   🎯 Stages: ${result.data.stages?.join(', ') || 'N/A'}`);
              console.log('');

              enrichedResults.push({
                ...match,
                enrichmentStatus: 'success',
                investmentThesis: result.data.investmentThesis || '',
                industries: result.data.industries?.join(', ') || '',
                stages: result.data.stages?.join(', ') || '',
                checkSizeMin: result.data.checkSize?.min.toString() || '',
                checkSizeMax: result.data.checkSize?.max.toString() || '',
                geography: result.data.geography?.join(', ') || '',
                scrapedNotes: result.data.notes || '',
              });

              successCount++;
            } else {
              console.log(`   ❌ Failed: ${result.error}\n`);
              enrichedResults.push({
                ...match,
                enrichmentStatus: 'failed',
              });
              failedCount++;
            }

            // Rate limiting: 1 second between requests
            if (i < topMatches.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          } catch (error) {
            console.log(`   ❌ Error: ${error}\n`);
            enrichedResults.push({
              ...match,
              enrichmentStatus: 'failed',
            });
            failedCount++;
          }
        }

        console.log('\n═══════════════════════════════════════════════════════');
        console.log('✨ Enrichment Complete!');
        console.log('═══════════════════════════════════════════════════════');
        console.log(`✅ Success: ${successCount}`);
        console.log(`❌ Failed:  ${failedCount}`);
        console.log(`⏭️  Skipped: ${skippedCount}`);
        console.log(`📊 Total:   ${topMatches.length}`);
        console.log('═══════════════════════════════════════════════════════\n');

        // Write enriched results
        const csvWriter = createObjectCsvWriter({
          path: outputPath,
          header: [
            { id: 'Firm Name', title: 'Firm Name' },
            { id: 'First Name', title: 'First Name' },
            { id: 'Last Name', title: 'Last Name' },
            { id: 'Email', title: 'Email' },
            { id: 'Title', title: 'Title' },
            { id: 'Website', title: 'Website' },
            { id: 'LinkedIn', title: 'LinkedIn' },
            { id: 'Total Score', title: 'Total Score' },
            { id: 'Match %', title: 'Match %' },
            { id: 'Tier', title: 'Tier' },
            { id: 'Match Reason', title: 'Match Reason' },
            { id: 'enrichmentStatus', title: 'Enrichment Status' },
            { id: 'investmentThesis', title: 'Investment Thesis' },
            { id: 'industries', title: 'Industries' },
            { id: 'stages', title: 'Stages' },
            { id: 'checkSizeMin', title: 'Check Size Min' },
            { id: 'checkSizeMax', title: 'Check Size Max' },
            { id: 'geography', title: 'Geography' },
            { id: 'scrapedNotes', title: 'Notes' },
          ],
        });

        await csvWriter.writeRecords(enrichedResults);

        console.log(`💾 Enriched results saved to: ${outputPath}\n`);
        console.log('🎯 Next Steps:');
        console.log('   1. Review top-100-matches-enriched.csv');
        console.log('   2. Validate investment thesis matches with BlockDrive');
        console.log('   3. Begin personalized outreach on January 1\n');

        resolve();
      })
      .on('error', (error) => {
        logger.error('Error reading CSV', { error });
        reject(error);
      });
  });
}

// Run enrichment
enrichTopMatches()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Enrichment failed:', error);
    process.exit(1);
  });
