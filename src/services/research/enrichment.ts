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
    // Use Google Custom Search if API key is configured
    if (config.externalApis.googleSearch) {
      return this.findWebsiteWithGoogleSearch(investorName);
    }

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

  async findWebsiteWithGoogleSearch(investorName: string): Promise<string | null> {
    if (!config.externalApis.googleSearch || !config.externalApis.googleSearchCx) {
      return null;
    }

    try {
      logger.info('Searching for website with Google Custom Search', { investorName });

      const searchQuery = encodeURIComponent(`${investorName} venture capital`);
      const response = await withRetry(async () => {
        return axios.get(
          `https://www.googleapis.com/customsearch/v1`,
          {
            params: {
              key: config.externalApis.googleSearch,
              cx: config.externalApis.googleSearchCx,
              q: searchQuery,
              num: 1, // Only need first result
            },
            timeout: 10000,
          }
        );
      });

      if (response.data.items && response.data.items.length > 0) {
        const firstResult = response.data.items[0];
        logger.info('Found website via Google Search', {
          investorName,
          website: firstResult.link
        });
        return firstResult.link;
      }

      return null;
    } catch (error) {
      logger.error('Google Search failed', { error, investorName });
      return null;
    }
  }

  async enrichFromApollo(name: string, domain?: string, company?: string): Promise<EnrichmentResult> {
    if (!config.externalApis.apollo) {
      return {
        success: false,
        source: 'apollo',
        error: 'Apollo API key not configured',
      };
    }

    try {
      logger.info('Enriching contact from Apollo.io', { name, domain, company });

      // Apollo.io People Search API
      const response = await withRetry(async () => {
        return axios.post(
          'https://api.apollo.io/v1/people/match',
          {
            first_name: name.split(' ')[0],
            last_name: name.split(' ').slice(1).join(' '),
            domain: domain,
            organization_name: company,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'X-Api-Key': config.externalApis.apollo,
            },
            timeout: 10000,
          }
        );
      });

      const person = response.data.person;

      if (!person) {
        return {
          success: false,
          source: 'apollo',
          error: 'No match found',
        };
      }

      const enrichedData: Partial<InvestorLead> = {
        email: person.email,
        linkedIn: person.linkedin_url,
        firmName: person.organization?.name,
        website: person.organization?.website_url,
      };

      logger.info('Successfully enriched from Apollo', {
        name,
        hasEmail: !!person.email,
        hasLinkedIn: !!person.linkedin_url,
      });

      return {
        success: true,
        data: enrichedData,
        source: 'apollo',
      };
    } catch (error) {
      logger.error('Apollo enrichment failed', { error, name });
      return {
        success: false,
        source: 'apollo',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async enrichFromClearbit(domain: string): Promise<EnrichmentResult> {
    if (!config.externalApis.clearbit) {
      return {
        success: false,
        source: 'clearbit',
        error: 'Clearbit API key not configured',
      };
    }

    try {
      logger.info('Enriching company from Clearbit', { domain });

      // Clearbit Company API
      const response = await withRetry(async () => {
        return axios.get(
          `https://company.clearbit.com/v2/companies/find?domain=${encodeURIComponent(domain)}`,
          {
            headers: {
              Authorization: `Bearer ${config.externalApis.clearbit}`,
            },
            timeout: 10000,
          }
        );
      });

      const company = response.data;

      const enrichedData: Partial<InvestorLead> = {
        firmName: company.name,
        website: company.domain,
        investmentThesis: company.description,
        linkedIn: company.linkedin?.handle ? `https://linkedin.com/company/${company.linkedin.handle}` : undefined,
        geography: company.geo?.city && company.geo?.state
          ? [`${company.geo.city}, ${company.geo.state}, ${company.geo.country}`]
          : undefined,
      };

      // Extract employee count and tags for additional context
      const additionalInfo = [];
      if (company.metrics?.employees) {
        additionalInfo.push(`Employees: ${company.metrics.employees}`);
      }
      if (company.tags && company.tags.length > 0) {
        additionalInfo.push(`Tags: ${company.tags.join(', ')}`);
      }
      if (company.tech && company.tech.length > 0) {
        additionalInfo.push(`Tech: ${company.tech.slice(0, 5).join(', ')}`);
      }

      if (additionalInfo.length > 0 && enrichedData.investmentThesis) {
        enrichedData.investmentThesis += `\n\n${additionalInfo.join('\n')}`;
      }

      logger.info('Successfully enriched from Clearbit', { domain, hasData: !!company.name });

      return {
        success: true,
        data: enrichedData,
        source: 'clearbit',
      };
    } catch (error) {
      logger.error('Clearbit enrichment failed', { error, domain });
      return {
        success: false,
        source: 'clearbit',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async getRecentActivity(investorName: string, domain?: string): Promise<EnrichmentResult> {
    if (!config.externalApis.googleSearch || !config.externalApis.googleSearchCx) {
      return {
        success: false,
        source: 'news_search',
        error: 'Google Search API not configured',
      };
    }

    try {
      logger.info('Searching for recent activity', { investorName });

      // Search for recent news/investments
      const searchQuery = encodeURIComponent(`${investorName} investment OR funding OR portfolio`);
      const response = await withRetry(async () => {
        return axios.get(
          'https://www.googleapis.com/customsearch/v1',
          {
            params: {
              key: config.externalApis.googleSearch,
              cx: config.externalApis.googleSearchCx,
              q: searchQuery,
              num: 5,
              dateRestrict: 'm6', // Last 6 months
              sort: 'date',
            },
            timeout: 10000,
          }
        );
      });

      const results = response.data.items || [];
      const recentActivity = results.map((item: any) => ({
        title: item.title,
        snippet: item.snippet,
        url: item.link,
        date: item.pagemap?.metatags?.[0]?.['article:published_time'],
      }));

      // Determine if investor is active based on recent news
      const isActive = results.length >= 2;

      return {
        success: true,
        data: {
          notes: `Recent activity: ${recentActivity.length} articles found in last 6 months (${isActive ? 'ACTIVE' : 'inactive'}).\n\n${recentActivity.map((a: any) => `- ${a.title}: ${a.snippet}`).join('\n')}`,
        },
        source: 'news_search',
      };
    } catch (error) {
      logger.error('Recent activity search failed', { error, investorName });
      return {
        success: false,
        source: 'news_search',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async bulkEnrich(investors: Array<{ name: string; email?: string; firmName?: string; website?: string }>): Promise<Array<Partial<InvestorLead> & { originalName: string }>> {
    logger.info('Starting bulk enrichment', { count: investors.length });

    const enrichedResults = [];

    for (const investor of investors) {
      try {
        logger.info('Enriching investor', { name: investor.name });

        const enrichmentResults: EnrichmentResult[] = [];

        // 1. Try Apollo (if we have name/domain)
        if (investor.name) {
          const apolloResult = await this.enrichFromApollo(
            investor.name,
            investor.website || undefined,
            investor.firmName || undefined
          );
          enrichmentResults.push(apolloResult);
        }

        // 2. Try Clearbit (if we have domain/website)
        const domain = investor.website?.replace(/^https?:\/\//, '').replace(/\/$/, '');
        if (domain) {
          const clearbitResult = await this.enrichFromClearbit(domain);
          enrichmentResults.push(clearbitResult);
        }

        // 3. Try Crunchbase (if we have firm name)
        if (investor.firmName) {
          const crunchbaseResult = await this.enrichFromCrunchbase(investor.firmName);
          enrichmentResults.push(crunchbaseResult);
        }

        // 4. Get recent activity
        const activityResult = await this.getRecentActivity(
          investor.firmName || investor.name,
          domain
        );
        enrichmentResults.push(activityResult);

        // Combine all results
        const combinedData = this.combineEnrichmentResults(enrichmentResults);

        enrichedResults.push({
          ...combinedData,
          originalName: investor.name,
          name: investor.name, // Preserve original name
        });

        // Rate limiting: wait 100ms between requests to avoid hitting API limits
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        logger.error('Failed to enrich investor', { error, investor: investor.name });
        enrichedResults.push({
          originalName: investor.name,
          name: investor.name,
        });
      }
    }

    logger.info('Bulk enrichment completed', {
      total: investors.length,
      enriched: enrichedResults.length,
    });

    return enrichedResults;
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
