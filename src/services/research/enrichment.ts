import axios from 'axios';
import * as cheerio from 'cheerio';
import { InvestorLead, EnrichmentResult } from '../../types';
import { logger } from '../../utils/logger';
import { withRetry } from '../../utils/retry';
import { config } from '../../config';

export class EnrichmentService {
  private userAgent =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';

  async enrichFromWeb(investorName: string, website?: string): Promise<EnrichmentResult> {
    try {
      logger.info('Enriching investor from web', { investorName, website });

      let url: string | undefined = website;
      if (!url) {
        // Try to find website via search
        url = (await this.findWebsite(investorName)) || undefined;
      }

      if (!url) {
        return {
          success: false,
          source: 'web',
          error: 'Could not find website',
        };
      }

      const content = await this.scrapeWebsite(url);

      return {
        success: true,
        data: {
          website: url,
          notes: `Scraped content from ${url}`,
        },
        source: 'web_scraping',
      };
    } catch (error) {
      logger.error('Web enrichment failed', { error, investorName });
      return {
        success: false,
        source: 'web',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async enrichFromCrunchbase(investorName: string): Promise<EnrichmentResult> {
    if (!config.externalApis.crunchbase) {
      return {
        success: false,
        source: 'crunchbase',
        error: 'Crunchbase API key not configured',
      };
    }

    try {
      logger.info('Enriching investor from Crunchbase', { investorName });

      // Crunchbase API integration
      const response = await withRetry(async () => {
        return axios.get(
          `https://api.crunchbase.com/api/v4/entities/organizations/${encodeURIComponent(investorName)}`,
          {
            headers: {
              'X-cb-user-key': config.externalApis.crunchbase,
            },
            timeout: 10000,
          }
        );
      });

      const data = response.data.properties;

      const enrichedData: Partial<InvestorLead> = {
        firmName: data.name,
        investmentThesis: data.description,
        website: data.website_url,
        linkedIn: data.linkedin_url,
        geography: data.location_identifiers?.map((loc: any) => loc.value) || [],
      };

      return {
        success: true,
        data: enrichedData,
        source: 'crunchbase',
      };
    } catch (error) {
      logger.error('Crunchbase enrichment failed', { error, investorName });
      return {
        success: false,
        source: 'crunchbase',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async enrichFromLinkedIn(linkedInUrl: string): Promise<EnrichmentResult> {
    try {
      logger.info('Enriching investor from LinkedIn', { linkedInUrl });

      // Note: LinkedIn scraping is limited and may require authentication
      // This is a simplified version - in production, consider using LinkedIn API
      const content = await this.scrapeWebsite(linkedInUrl);

      return {
        success: true,
        data: {
          linkedIn: linkedInUrl,
        },
        source: 'linkedin',
      };
    } catch (error) {
      logger.error('LinkedIn enrichment failed', { error, linkedInUrl });
      return {
        success: false,
        source: 'linkedin',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async scrapeWebsite(url: string): Promise<string> {
    return withRetry(
      async () => {
        logger.debug('Scraping website', { url });

        const response = await axios.get(url, {
          headers: {
            'User-Agent': this.userAgent,
          },
          timeout: 15000,
          maxRedirects: 5,
        });

        const $ = cheerio.load(response.data);

        // Remove scripts, styles, and other non-content elements
        $('script, style, nav, footer, header, iframe').remove();

        // Extract main content
        const text = $('body').text();

        // Clean up whitespace
        const cleaned = text
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 10000); // Limit content length

        logger.debug('Successfully scraped website', {
          url,
          contentLength: cleaned.length,
        });

        return cleaned;
      },
      { retries: 2 }
    );
  }

  async findWebsite(investorName: string): Promise<string | null> {
    try {
      // Simple Google search simulation
      // In production, use a proper search API like Google Custom Search
      const searchQuery = encodeURIComponent(`${investorName} venture capital`);
      const searchUrl = `https://www.google.com/search?q=${searchQuery}`;

      logger.debug('Searching for website', { investorName });

      // This is a placeholder - in production, implement proper search
      // For now, return null and rely on manual input or other sources
      return null;
    } catch (error) {
      logger.error('Website search failed', { error, investorName });
      return null;
    }
  }

  async getInvestorSocialData(investorName: string): Promise<Partial<InvestorLead>> {
    logger.info('Gathering social data for investor', { investorName });

    const socialData: Partial<InvestorLead> = {};

    // Try to find LinkedIn profile
    const linkedInQuery = `${investorName} LinkedIn`;
    // In production, implement LinkedIn search

    // Try to find Twitter/X profile
    const twitterQuery = `${investorName} Twitter`;
    // In production, implement Twitter search

    return socialData;
  }

  async validateEmail(email: string): Promise<boolean> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  async validateUrl(url: string): Promise<boolean> {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  combineEnrichmentResults(results: EnrichmentResult[]): Partial<InvestorLead> {
    const combined: Partial<InvestorLead> = {};

    results.forEach((result) => {
      if (result.success && result.data) {
        Object.assign(combined, result.data);
      }
    });

    return combined;
  }
}
