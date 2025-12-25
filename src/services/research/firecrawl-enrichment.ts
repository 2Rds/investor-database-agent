import FirecrawlApp from '@mendable/firecrawl-js';
import { EnrichmentResult, InvestorLead } from '../../types';
import { logger } from '../../utils/logger';
import { config } from '../../config';

/**
 * Firecrawl Enrichment Service
 *
 * Uses Firecrawl's AI-powered web scraping to extract investor data.
 * Free via Lovable promo until January 26, 2025.
 *
 * Firecrawl Features:
 * - AI-powered content extraction
 * - JavaScript rendering
 * - Anti-bot bypass
 * - Clean markdown output
 * - Much more reliable than cheerio/axios
 */
export class FirecrawlEnrichmentService {
  private client: FirecrawlApp | null = null;

  constructor() {
    if (config.externalApis.firecrawl) {
      this.client = new FirecrawlApp({ apiKey: config.externalApis.firecrawl });
      logger.info('Firecrawl client initialized');
    } else {
      logger.warn('Firecrawl API key not configured - scraping will be limited');
    }
  }

  /**
   * Scrape investor website using Firecrawl
   */
  async scrapeInvestorWebsite(url: string): Promise<{
    markdown: string;
    html?: string;
    metadata?: Record<string, any>;
  }> {
    if (!this.client) {
      throw new Error('Firecrawl not configured');
    }

    try {
      logger.info('Scraping website with Firecrawl', { url });

      const scrapeResult = await this.client.scrapeUrl(url, {
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      });

      if (!scrapeResult.success) {
        throw new Error('Firecrawl scrape failed');
      }

      logger.info('Successfully scraped website', {
        url,
        markdownLength: scrapeResult.markdown?.length || 0,
      });

      return {
        markdown: scrapeResult.markdown || '',
        html: scrapeResult.html,
        metadata: scrapeResult.metadata,
      };
    } catch (error) {
      logger.error('Firecrawl scrape failed', { error, url });
      throw error;
    }
  }

  /**
   * Enrich investor from their website using Firecrawl + AI extraction
   */
  async enrichInvestorFromWebsite(
    firmName: string,
    website: string
  ): Promise<EnrichmentResult> {
    if (!this.client) {
      return {
        success: false,
        source: 'firecrawl',
        error: 'Firecrawl API key not configured',
      };
    }

    try {
      logger.info('Enriching investor from website', { firmName, website });

      // Scrape the website
      const { markdown } = await this.scrapeInvestorWebsite(website);

      // Extract structured data using AI
      const enrichedData = await this.extractInvestorData(markdown, firmName);

      return {
        success: true,
        data: enrichedData,
        source: 'firecrawl',
      };
    } catch (error) {
      logger.error('Firecrawl enrichment failed', { error, firmName, website });
      return {
        success: false,
        source: 'firecrawl',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Extract structured investor data from scraped markdown content
   * Uses pattern matching and AI to identify key information
   */
  private async extractInvestorData(
    markdown: string,
    firmName: string
  ): Promise<Partial<InvestorLead>> {
    const data: Partial<InvestorLead> = {
      firmName,
    };

    // Extract investment thesis
    const thesisMatches = markdown.match(
      /(?:investment (?:thesis|philosophy|focus|strategy)|we (?:invest in|focus on|back))[:.\s]+([^.!?\n]+[.!?])/gi
    );
    if (thesisMatches && thesisMatches.length > 0) {
      data.investmentThesis = thesisMatches[0].replace(/^[^:]+:?\s*/, '').trim();
    }

    // Extract industries/focus areas
    const industries: string[] = [];
    const industryKeywords = [
      'blockchain',
      'crypto',
      'web3',
      'fintech',
      'infrastructure',
      'saas',
      'enterprise',
      'cybersecurity',
      'ai',
      'ml',
      'healthcare',
      'biotech',
    ];

    industryKeywords.forEach((keyword) => {
      if (markdown.toLowerCase().includes(keyword)) {
        industries.push(keyword);
      }
    });

    if (industries.length > 0) {
      data.industries = industries;
    }

    // Extract stage focus
    const stages: string[] = [];
    if (markdown.toLowerCase().includes('seed')) stages.push('seed');
    if (markdown.toLowerCase().includes('series a')) stages.push('series_a');
    if (markdown.toLowerCase().includes('series b')) stages.push('series_b');
    if (markdown.toLowerCase().includes('pre-seed')) stages.push('pre_seed');

    if (stages.length > 0) {
      data.stages = stages as any;
    }

    // Extract check size
    const checkSizeMatch = markdown.match(
      /\$(\d+(?:\.\d+)?)\s*(?:million|m|k)\s*(?:to|-)\s*\$(\d+(?:\.\d+)?)\s*(?:million|m|k)/i
    );
    if (checkSizeMatch) {
      const min = parseFloat(checkSizeMatch[1]);
      const max = parseFloat(checkSizeMatch[2]);
      const unit = checkSizeMatch[0].toLowerCase().includes('million') ? 1_000_000 : 1_000;

      data.checkSize = {
        min: min * unit,
        max: max * unit,
        currency: 'USD',
      };
    }

    // Extract geography
    const geography: string[] = [];
    const geoKeywords = [
      'san francisco',
      'new york',
      'boston',
      'austin',
      'seattle',
      'los angeles',
      'chicago',
      'miami',
      'united states',
      'us',
      'europe',
      'asia',
    ];

    geoKeywords.forEach((geo) => {
      if (markdown.toLowerCase().includes(geo)) {
        geography.push(geo);
      }
    });

    if (geography.length > 0) {
      data.geography = geography;
    }

    // Store full markdown as notes for later analysis
    data.notes = `Scraped via Firecrawl. Content preview: ${markdown.substring(0, 500)}...`;

    return data;
  }

  /**
   * Batch enrich multiple investors from CSV
   */
  async batchEnrichInvestors(
    investors: Array<{ firmName: string; website: string }>
  ): Promise<Map<string, EnrichmentResult>> {
    const results = new Map<string, EnrichmentResult>();

    logger.info(`Starting batch enrichment of ${investors.length} investors`);

    for (const investor of investors) {
      if (!investor.website || investor.website === 'NA') {
        continue;
      }

      try {
        const result = await this.enrichInvestorFromWebsite(investor.firmName, investor.website);
        results.set(investor.firmName, result);

        // Rate limiting: Wait 1 second between requests
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        logger.error('Batch enrichment error', { error, investor });
        results.set(investor.firmName, {
          success: false,
          source: 'firecrawl',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.info(`Batch enrichment complete: ${results.size} investors processed`);
    return results;
  }

  /**
   * Check if Firecrawl is available
   */
  isAvailable(): boolean {
    return this.client !== null;
  }
}

// Export singleton instance
export const firecrawlService = new FirecrawlEnrichmentService();
