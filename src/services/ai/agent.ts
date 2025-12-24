import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config';
import { InvestorLead, StartupProfile, Investment } from '../../types';
import { logger } from '../../utils/logger';
import { withRetry } from '../../utils/retry';

export class AIAgent {
  private client: Anthropic;
  private knowledgeContext: Map<string, string> = new Map();

  constructor() {
    this.client = new Anthropic({ apiKey: config.anthropic.apiKey });
  }

  setKnowledgeContext(userId: string, context: string): void {
    this.knowledgeContext.set(userId, context);
    logger.info('Updated knowledge context for user', {
      userId,
      contextLength: context.length,
    });
  }

  async researchInvestor(investorName: string, context: string = ''): Promise<InvestorLead> {
    logger.info('Researching investor with AI', { investorName });

    const prompt = `You are an expert VC/investor research analyst. Research the following investor/firm and provide comprehensive details in a structured format.

Investor/Firm Name: ${investorName}
${context ? `Additional Context: ${context}` : ''}

Please provide the following information in valid JSON format:
{
  "name": "Full name of investor or firm",
  "type": "vc" | "family_office" | "angel",
  "firmName": "Firm name (if applicable)",
  "investmentThesis": "Detailed investment thesis and focus areas",
  "recentInvestments": [
    {
      "company": "Company name",
      "date": "YYYY-MM-DD",
      "amount": "Investment amount",
      "round": "Round type",
      "industry": "Industry",
      "description": "Brief description"
    }
  ],
  "industries": ["List of industries/sectors they invest in"],
  "stages": ["pre_seed", "seed", "series_a", etc.],
  "checkSize": {
    "min": 100000,
    "max": 5000000,
    "currency": "USD"
  },
  "geography": ["Geographic regions they invest in"],
  "website": "Website URL",
  "linkedIn": "LinkedIn URL",
  "email": "Contact email if available",
  "notes": "Any additional relevant information"
}

Focus on accuracy and recent information. If you cannot find certain information, omit those fields or use null.`;

    return withRetry(async () => {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from AI response');
      }

      const data = JSON.parse(jsonMatch[0]);

      // Transform to InvestorLead
      const lead: InvestorLead = {
        name: data.name || investorName,
        type: data.type || 'vc',
        firmName: data.firmName,
        investmentThesis: data.investmentThesis || 'No thesis information available',
        recentInvestments: data.recentInvestments || [],
        industries: data.industries || [],
        stages: data.stages || [],
        checkSize: data.checkSize,
        geography: data.geography || [],
        website: data.website,
        linkedIn: data.linkedIn,
        email: data.email,
        notes: data.notes,
        lastUpdated: new Date(),
        source: 'AI Research',
      };

      logger.info('Successfully researched investor', { investorName });
      return lead;
    });
  }

  async findMatchingInvestors(
    startupProfile: StartupProfile,
    count: number = 10,
    userId?: string
  ): Promise<InvestorLead[]> {
    logger.info('Finding matching investors with AI', {
      startup: startupProfile.name,
      count,
      hasKnowledgeContext: userId ? this.knowledgeContext.has(userId) : false,
    });

    // Get knowledge context if available
    const knowledgeContext = userId ? this.knowledgeContext.get(userId) : undefined;

    const prompt = `You are an expert at matching startups with ideal investors. Based on the following startup profile, identify ${count} highly relevant investors (VCs, family offices, or angels) that would be excellent matches.

Startup Profile:
- Name: ${startupProfile.name}
- Industry: ${startupProfile.industry}
- Stage: ${startupProfile.stage}
- Description: ${startupProfile.description}
${startupProfile.fundingGoal ? `- Funding Goal: $${startupProfile.fundingGoal.toLocaleString()}` : ''}
${startupProfile.geography ? `- Geography: ${startupProfile.geography}` : ''}
${startupProfile.uniqueValueProp ? `- Unique Value Prop: ${startupProfile.uniqueValueProp}` : ''}
${startupProfile.targetInvestorTraits ? `- Desired Investor Traits: ${startupProfile.targetInvestorTraits.join(', ')}` : ''}

${knowledgeContext ? `Additional Context from Knowledge Base:\n${knowledgeContext.substring(0, 3000)}\n` : ''}

Please provide ${count} matching investors in valid JSON array format. For each investor, provide:
[
  {
    "name": "Investor/Firm name",
    "type": "vc" | "family_office" | "angel",
    "firmName": "Firm name if applicable",
    "investmentThesis": "Why they invest and their focus",
    "recentInvestments": [
      {
        "company": "Portfolio company",
        "date": "YYYY-MM-DD",
        "amount": "Amount",
        "round": "Round type",
        "industry": "Industry"
      }
    ],
    "industries": ["Industries they focus on"],
    "stages": ["Stages they invest in"],
    "checkSize": {
      "min": 100000,
      "max": 5000000,
      "currency": "USD"
    },
    "geography": ["Geographic regions"],
    "website": "URL",
    "linkedIn": "LinkedIn URL",
    "matchReason": "Detailed explanation of why this is a strong match for the startup"
  }
]

Prioritize investors who:
1. Have invested in similar industries/sectors
2. Operate at the right funding stage
3. Have geographic alignment
4. Have written checks in the appropriate size range
5. Have investment thesis alignment

Provide accurate, real investors with verifiable information.`;

    return withRetry(async () => {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 8192,
        temperature: 0.4,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      // Extract JSON array from response
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON array from AI response');
      }

      const data = JSON.parse(jsonMatch[0]);

      const leads: InvestorLead[] = data.map((item: any) => ({
        name: item.name,
        type: item.type || 'vc',
        firmName: item.firmName,
        investmentThesis: item.investmentThesis || '',
        recentInvestments: item.recentInvestments || [],
        industries: item.industries || [],
        stages: item.stages || [],
        checkSize: item.checkSize,
        geography: item.geography || [],
        website: item.website,
        linkedIn: item.linkedIn,
        email: item.email,
        matchScore: this.calculateMatchScore(item, startupProfile),
        matchReason: item.matchReason || '',
        lastUpdated: new Date(),
        source: 'AI Match',
        notes: item.notes,
      }));

      logger.info('Successfully found matching investors', {
        count: leads.length,
      });

      return leads;
    });
  }

  async enrichInvestorData(
    partialData: Partial<InvestorLead>,
    webContent?: string
  ): Promise<Partial<InvestorLead>> {
    logger.info('Enriching investor data with AI', { name: partialData.name });

    const prompt = `You are enriching data about an investor/firm. Based on the existing data and any web content provided, fill in missing fields and enhance the information.

Existing Data:
${JSON.stringify(partialData, null, 2)}

${webContent ? `Additional Web Content:\n${webContent.substring(0, 5000)}` : ''}

Please provide enriched data in valid JSON format with the same structure as InvestorLead type. Only include fields where you have confidence in the accuracy. Focus on:
- Investment thesis
- Recent investments
- Industries and stages
- Check size ranges
- Geographic focus
- Contact information

Return only the JSON object.`;

    return withRetry(async () => {
      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4096,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse JSON from AI response');
      }

      const enrichedData = JSON.parse(jsonMatch[0]);

      logger.info('Successfully enriched investor data', {
        name: partialData.name,
      });

      return enrichedData;
    });
  }

  private calculateMatchScore(investor: any, startup: StartupProfile): number {
    let score = 0;

    // Industry match (0-30 points)
    if (investor.industries?.some((ind: string) =>
      startup.industry.toLowerCase().includes(ind.toLowerCase())
    )) {
      score += 30;
    }

    // Stage match (0-25 points)
    if (investor.stages?.includes(startup.stage)) {
      score += 25;
    }

    // Geography match (0-15 points)
    if (startup.geography &&
      investor.geography?.some((geo: string) =>
        startup.geography?.toLowerCase().includes(geo.toLowerCase())
      )
    ) {
      score += 15;
    }

    // Check size match (0-20 points)
    if (startup.fundingGoal && investor.checkSize) {
      if (
        startup.fundingGoal >= investor.checkSize.min &&
        startup.fundingGoal <= investor.checkSize.max
      ) {
        score += 20;
      }
    }

    // Recent activity (0-10 points)
    if (investor.recentInvestments?.length > 0) {
      score += Math.min(investor.recentInvestments.length * 2, 10);
    }

    return Math.min(score, 100);
  }
}
