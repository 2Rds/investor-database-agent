import { logger } from '../../utils/logger';

export interface BlockDriveMatchScore {
  totalScore: number;
  maxScore: number;
  percentageMatch: number;
  breakdown: {
    web3Blockchain: number;
    infrastructure: number;
    privacySecurity: number;
    seedStageActive: number;
    checkSizeMatch: number;
    recentActivity: number;
  };
  matchReason: string;
  tier: 'S-Tier' | 'A-Tier' | 'B-Tier' | 'C-Tier' | 'Not a Match';
}

export interface CSVInvestorRow {
  firmName: string;
  investorType: string;
  investmentFocus: string;
  firstName: string;
  lastName: string;
  contactTitle: string;
  email: string;
  preferredGeography: string;
  linkedInProfile: string;
  firmDescription: string;
  stage: string;
  avgCheckSize: string;
  totalInvestments: string;
  totalExits: string;
  website: string;
  additionalNotes: string;
}

/**
 * BlockDrive-Specific Match Scoring Algorithm
 *
 * Scoring Criteria (100 points max):
 * - Web3/Blockchain Focus (30 pts): Solana, blockchain, crypto, web3, DeFi
 * - Infrastructure Investments (20 pts): Cloud, storage, infrastructure, SaaS, enterprise
 * - Privacy/Security Focus (15 pts): Cybersecurity, privacy, zero-knowledge, encryption
 * - Seed Stage Active (15 pts): Explicitly invests in seed/pre-seed
 * - Check Size Match (10 pts): $500K-$5M range
 * - Recent Activity (10 pts): Recent deals/active portfolio (if data available)
 *
 * Tier Definitions:
 * - S-Tier: 90-100% - Perfect fit, immediate priority outreach
 * - A-Tier: 80-89% - Strong fit, high priority outreach
 * - B-Tier: 70-79% - Good fit, solid candidate for outreach
 * - C-Tier: 60-69% - Viable fit, consider for broader campaign
 * - Not a Match: <60% - Not viable, skip
 */
export class BlockDriveScorer {
  // Web3/Blockchain keywords (30 points max)
  private web3Keywords = [
    'blockchain',
    'crypto',
    'cryptocurrency',
    'web3',
    'defi',
    'solana',
    'ethereum',
    'bitcoin',
    'nft',
    'dao',
    'l1',
    'l2',
    'layer 1',
    'layer 2',
    'decentralized',
    'distributed ledger',
    'smart contract',
    'tokenization',
  ];

  // Infrastructure keywords (20 points max)
  private infrastructureKeywords = [
    'infrastructure',
    'cloud',
    'storage',
    'saas',
    'enterprise',
    'b2b',
    'platform',
    'devtools',
    'developer tools',
    'data infrastructure',
    'cloud infrastructure',
    'enterprise software',
    'enterprise saas',
  ];

  // Privacy/Security keywords (15 points max)
  private privacySecurityKeywords = [
    'cybersecurity',
    'security',
    'privacy',
    'encryption',
    'zero-knowledge',
    'zk',
    'zero knowledge',
    'data security',
    'data protection',
    'compliance',
    'gdpr',
    'hipaa',
    'secure',
    'authentication',
  ];

  // Seed stage keywords (15 points max)
  private seedStageKeywords = [
    'seed',
    'pre-seed',
    'pre seed',
    'early stage',
    'early-stage',
    'series a',
  ];

  calculateMatchScore(investor: CSVInvestorRow): BlockDriveMatchScore {
    const breakdown = {
      web3Blockchain: this.scoreWeb3Blockchain(investor),
      infrastructure: this.scoreInfrastructure(investor),
      privacySecurity: this.scorePrivacySecurity(investor),
      seedStageActive: this.scoreSeedStage(investor),
      checkSizeMatch: this.scoreCheckSize(investor),
      recentActivity: this.scoreRecentActivity(investor),
    };

    const totalScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0);
    const maxScore = 100;
    const percentageMatch = Math.round((totalScore / maxScore) * 100);

    const tier = this.determineTier(percentageMatch);
    const matchReason = this.generateMatchReason(breakdown, investor);

    return {
      totalScore,
      maxScore,
      percentageMatch,
      breakdown,
      matchReason,
      tier,
    };
  }

  private scoreWeb3Blockchain(investor: CSVInvestorRow): number {
    const searchText = `${investor.investmentFocus} ${investor.firmDescription} ${investor.additionalNotes}`.toLowerCase();
    let score = 0;

    // Perfect match: explicitly mentions blockchain/crypto
    if (
      searchText.includes('blockchain') ||
      searchText.includes('crypto') ||
      searchText.includes('web3')
    ) {
      score = 30;
    }
    // Strong match: mentions Solana specifically
    else if (searchText.includes('solana')) {
      score = 30;
    }
    // Good match: mentions other web3 keywords
    else if (this.countKeywordMatches(searchText, this.web3Keywords) >= 2) {
      score = 20;
    }
    // Weak match: one web3 keyword
    else if (this.countKeywordMatches(searchText, this.web3Keywords) === 1) {
      score = 10;
    }

    return score;
  }

  private scoreInfrastructure(investor: CSVInvestorRow): number {
    const searchText = `${investor.investmentFocus} ${investor.firmDescription} ${investor.additionalNotes}`.toLowerCase();
    let score = 0;

    // Perfect match: explicitly mentions infrastructure
    if (
      searchText.includes('infrastructure') ||
      searchText.includes('cloud infrastructure') ||
      searchText.includes('data infrastructure')
    ) {
      score = 20;
    }
    // Good match: mentions enterprise SaaS
    else if (
      searchText.includes('enterprise') ||
      searchText.includes('saas') ||
      searchText.includes('b2b')
    ) {
      score = 15;
    }
    // Weak match: other infrastructure keywords
    else if (this.countKeywordMatches(searchText, this.infrastructureKeywords) >= 2) {
      score = 10;
    }
    // Minimal match: one infrastructure keyword
    else if (this.countKeywordMatches(searchText, this.infrastructureKeywords) === 1) {
      score = 5;
    }

    return score;
  }

  private scorePrivacySecurity(investor: CSVInvestorRow): number {
    const searchText = `${investor.investmentFocus} ${investor.firmDescription} ${investor.additionalNotes}`.toLowerCase();
    let score = 0;

    // Perfect match: explicitly mentions privacy/security
    if (
      searchText.includes('privacy') ||
      searchText.includes('cybersecurity') ||
      searchText.includes('zero-knowledge') ||
      searchText.includes('zero knowledge')
    ) {
      score = 15;
    }
    // Good match: mentions security or encryption
    else if (searchText.includes('security') || searchText.includes('encryption')) {
      score = 10;
    }
    // Weak match: other privacy/security keywords
    else if (this.countKeywordMatches(searchText, this.privacySecurityKeywords) >= 2) {
      score = 5;
    }

    return score;
  }

  private scoreSeedStage(investor: CSVInvestorRow): number {
    const stageText = investor.stage.toLowerCase();
    let score = 0;

    // Perfect match: explicitly seed or pre-seed
    if (stageText.includes('seed') || stageText.includes('pre-seed')) {
      score = 15;
    }
    // Good match: early stage or series A
    else if (stageText.includes('early') || stageText.includes('series a')) {
      score = 10;
    }
    // Weak match: agnostic (might do seed)
    else if (stageText.includes('agnostic')) {
      score = 5;
    }

    return score;
  }

  private scoreCheckSize(investor: CSVInvestorRow): number {
    const checkSizeText = investor.avgCheckSize.toLowerCase();
    let score = 0;

    // Target range: $500K-$5M
    // Try to extract numeric values from the check size string
    const numericMatches = checkSizeText.match(/\$?(\d+\.?\d*)\s*([km])?/gi);

    if (!numericMatches || checkSizeText === 'na' || checkSizeText === 'n/a') {
      // No check size data, give partial credit
      return 3;
    }

    // Parse check size ranges
    const values: number[] = [];
    numericMatches.forEach((match) => {
      const cleanMatch = match.replace(/\$/g, '');
      const multiplier = cleanMatch.includes('m') ? 1_000_000 : cleanMatch.includes('k') ? 1_000 : 1;
      const value = parseFloat(cleanMatch.replace(/[km]/gi, '')) * multiplier;
      if (!isNaN(value)) {
        values.push(value);
      }
    });

    if (values.length > 0) {
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);

      // Perfect match: range overlaps with $500K-$5M
      if (
        (minValue >= 500_000 && minValue <= 5_000_000) ||
        (maxValue >= 500_000 && maxValue <= 5_000_000) ||
        (minValue <= 500_000 && maxValue >= 5_000_000)
      ) {
        score = 10;
      }
      // Good match: close to range
      else if (maxValue >= 250_000 && minValue <= 10_000_000) {
        score = 5;
      }
    }

    return score;
  }

  private scoreRecentActivity(investor: CSVInvestorRow): number {
    // This would require timestamp data which isn't in the CSV
    // For now, give points based on total investments as a proxy for activity
    const totalInvestments = parseInt(investor.totalInvestments) || 0;

    if (totalInvestments >= 50) {
      return 10; // Very active
    } else if (totalInvestments >= 20) {
      return 7; // Active
    } else if (totalInvestments >= 10) {
      return 5; // Moderately active
    } else if (totalInvestments >= 5) {
      return 3; // Some activity
    }

    return 0; // Not enough data
  }

  private countKeywordMatches(text: string, keywords: string[]): number {
    return keywords.filter((keyword) => text.includes(keyword.toLowerCase())).length;
  }

  private determineTier(percentageMatch: number): BlockDriveMatchScore['tier'] {
    if (percentageMatch >= 90) return 'S-Tier';
    if (percentageMatch >= 80) return 'A-Tier';
    if (percentageMatch >= 70) return 'B-Tier';
    if (percentageMatch >= 60) return 'C-Tier';
    return 'Not a Match';
  }

  private generateMatchReason(
    breakdown: BlockDriveMatchScore['breakdown'],
    investor: CSVInvestorRow
  ): string {
    const reasons: string[] = [];

    if (breakdown.web3Blockchain >= 20) {
      reasons.push('Strong web3/blockchain focus');
    } else if (breakdown.web3Blockchain >= 10) {
      reasons.push('Some web3/blockchain interest');
    }

    if (breakdown.infrastructure >= 15) {
      reasons.push('Infrastructure/enterprise investor');
    } else if (breakdown.infrastructure >= 10) {
      reasons.push('Some infrastructure focus');
    }

    if (breakdown.privacySecurity >= 10) {
      reasons.push('Privacy/security focus');
    }

    if (breakdown.seedStageActive >= 10) {
      reasons.push('Active seed-stage investor');
    } else if (breakdown.seedStageActive >= 5) {
      reasons.push('Considers seed-stage deals');
    }

    if (breakdown.checkSizeMatch >= 8) {
      reasons.push('Perfect check size match ($500K-$5M)');
    } else if (breakdown.checkSizeMatch >= 5) {
      reasons.push('Check size in range');
    }

    if (breakdown.recentActivity >= 7) {
      reasons.push('Highly active portfolio');
    }

    if (reasons.length === 0) {
      return 'Limited fit with BlockDrive criteria';
    }

    return reasons.join(' • ');
  }

  /**
   * Batch score multiple investors
   */
  batchScore(investors: CSVInvestorRow[]): Map<string, BlockDriveMatchScore> {
    const results = new Map<string, BlockDriveMatchScore>();

    investors.forEach((investor) => {
      const score = this.calculateMatchScore(investor);
      const key = `${investor.firmName}|${investor.firstName} ${investor.lastName}`;
      results.set(key, score);
    });

    logger.info(`Batch scored ${investors.length} investors`);
    return results;
  }

  /**
   * Get top N investors by match score
   */
  getTopMatches(
    investors: CSVInvestorRow[],
    topN: number = 100,
    minTier: BlockDriveMatchScore['tier'] = 'B-Tier'
  ): Array<{ investor: CSVInvestorRow; score: BlockDriveMatchScore }> {
    const scored = investors.map((investor) => ({
      investor,
      score: this.calculateMatchScore(investor),
    }));

    // Filter by minimum tier
    const tierRanking = { 'S-Tier': 5, 'A-Tier': 4, 'B-Tier': 3, 'C-Tier': 2, 'Not a Match': 1 };
    const minTierRank = tierRanking[minTier];

    const filtered = scored.filter((item) => tierRanking[item.score.tier] >= minTierRank);

    // Sort by total score descending
    const sorted = filtered.sort((a, b) => b.score.totalScore - a.score.totalScore);

    return sorted.slice(0, topN);
  }
}
