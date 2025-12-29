import { Router, Request, Response } from 'express';
import { BlockDriveScorer, CSVInvestorRow } from '../services/research/blockdrive-scorer';
import { logger } from '../utils/logger';

const router = Router();
const scorer = new BlockDriveScorer();

/**
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    service: 'BlockDrive Scoring API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/score-investor
 *
 * Score a single investor using BlockDrive algorithm
 *
 * Request body should match CSVInvestorRow structure:
 * {
 *   firmName: string,
 *   investorType?: string,
 *   investmentFocus?: string,
 *   stage?: string,
 *   avgCheckSize?: string,
 *   totalInvestments?: string,
 *   // ... other fields
 * }
 *
 * Response:
 * {
 *   success: true,
 *   investor: { firmName: "..." },
 *   score: {
 *     tier: "A-Tier",
 *     percentageMatch: 85,
 *     totalScore: 85,
 *     maxScore: 100,
 *     matchReason: "Strong web3 focus • Active seed investor",
 *     breakdown: {
 *       web3Blockchain: 30,
 *       infrastructure: 20,
 *       privacySecurity: 10,
 *       seedStageActive: 15,
 *       checkSizeMatch: 10,
 *       recentActivity: 0
 *     }
 *   },
 *   addToNotion: true  // true if >= 60% (C-Tier or above)
 * }
 */
router.post('/score-investor', (req: Request, res: Response) => {
  try {
    const investorData: CSVInvestorRow = req.body;

    // Validate required field
    if (!investorData.firmName) {
      return res.status(400).json({
        success: false,
        error: 'firmName is required',
      });
    }

    // Score the investor
    const score = scorer.calculateMatchScore(investorData);

    // Log scoring result
    logger.info('Scored investor', {
      firmName: investorData.firmName,
      tier: score.tier,
      percentageMatch: score.percentageMatch,
    });

    res.json({
      success: true,
      investor: {
        firmName: investorData.firmName,
      },
      score: {
        tier: score.tier,
        percentageMatch: score.percentageMatch,
        totalScore: score.totalScore,
        maxScore: score.maxScore,
        matchReason: score.matchReason,
        breakdown: score.breakdown,
      },
      addToNotion: score.percentageMatch >= 60, // C-Tier or above
    });
  } catch (error) {
    logger.error('Error scoring investor', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /api/batch-score
 *
 * Score multiple investors in a single request
 *
 * Request body:
 * {
 *   investors: [
 *     { firmName: "...", investmentFocus: "...", ... },
 *     { firmName: "...", investmentFocus: "...", ... }
 *   ]
 * }
 *
 * Response:
 * {
 *   success: true,
 *   results: [
 *     {
 *       firmName: "...",
 *       tier: "A-Tier",
 *       percentageMatch: 85,
 *       addToNotion: true,
 *       score: { ... }
 *     },
 *     ...
 *   ],
 *   summary: {
 *     total: 100,
 *     qualified: 45,  // >= 60%
 *     tierCounts: {
 *       "S-Tier": 5,
 *       "A-Tier": 15,
 *       "B-Tier": 15,
 *       "C-Tier": 10,
 *       "Not a Match": 55
 *     }
 *   }
 * }
 */
router.post('/batch-score', (req: Request, res: Response) => {
  try {
    const { investors } = req.body;

    if (!Array.isArray(investors)) {
      return res.status(400).json({
        success: false,
        error: 'investors must be an array',
      });
    }

    const results = investors.map((investor: CSVInvestorRow) => {
      const score = scorer.calculateMatchScore(investor);
      return {
        firmName: investor.firmName,
        tier: score.tier,
        percentageMatch: score.percentageMatch,
        addToNotion: score.percentageMatch >= 60,
        score: {
          totalScore: score.totalScore,
          maxScore: score.maxScore,
          matchReason: score.matchReason,
          breakdown: score.breakdown,
        },
      };
    });

    // Calculate summary statistics
    const tierCounts = {
      'S-Tier': 0,
      'A-Tier': 0,
      'B-Tier': 0,
      'C-Tier': 0,
      'Not a Match': 0,
    };

    results.forEach((result) => {
      tierCounts[result.tier]++;
    });

    const qualified = results.filter((r) => r.addToNotion).length;

    logger.info('Batch scored investors', {
      total: investors.length,
      qualified,
      tierCounts,
    });

    res.json({
      success: true,
      results,
      summary: {
        total: investors.length,
        qualified,
        tierCounts,
      },
    });
  } catch (error) {
    logger.error('Error in batch scoring', { error });
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/scoring-criteria
 *
 * Returns the BlockDrive scoring criteria and tier definitions
 */
router.get('/scoring-criteria', (req: Request, res: Response) => {
  res.json({
    success: true,
    criteria: {
      web3Blockchain: {
        maxPoints: 30,
        description: 'Web3/Blockchain Focus - Solana, blockchain, crypto, web3, DeFi',
      },
      infrastructure: {
        maxPoints: 20,
        description: 'Infrastructure Investments - Cloud, storage, infrastructure, SaaS, enterprise',
      },
      privacySecurity: {
        maxPoints: 15,
        description: 'Privacy/Security Focus - Cybersecurity, privacy, zero-knowledge, encryption',
      },
      seedStageActive: {
        maxPoints: 15,
        description: 'Seed Stage Active - Explicitly invests in seed/pre-seed',
      },
      checkSizeMatch: {
        maxPoints: 10,
        description: 'Check Size Match - $500K-$5M range',
      },
      recentActivity: {
        maxPoints: 10,
        description: 'Recent Activity - Based on total investments as proxy',
      },
    },
    tiers: {
      'S-Tier': {
        range: '90-100%',
        description: 'Perfect fit, immediate priority outreach',
      },
      'A-Tier': {
        range: '80-89%',
        description: 'Strong fit, high priority outreach',
      },
      'B-Tier': {
        range: '70-79%',
        description: 'Good fit, solid candidate for outreach',
      },
      'C-Tier': {
        range: '60-69%',
        description: 'Viable fit, consider for broader campaign',
      },
      'Not a Match': {
        range: '<60%',
        description: 'Not viable, skip',
      },
    },
    minimumViableScore: 60,
  });
});

export default router;
