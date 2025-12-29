import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from '../config';
import { logger } from '../utils/logger';
import apiRoutes from './routes';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for now - restrict in production
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.path}`, {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  next();
});

// API routes
app.use('/api', apiRoutes);

// Root endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'BlockDrive Investor Scoring API',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      health: 'GET /api/health',
      scoreInvestor: 'POST /api/score-investor',
      batchScore: 'POST /api/batch-score',
      scoringCriteria: 'GET /api/scoring-criteria',
    },
    documentation: 'https://github.com/2Rds/investor-database-agent',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error', { error: err, path: req.path });
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`🚀 BlockDrive Scoring API running on port ${PORT}`);
    logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
    logger.info(`🎯 Score endpoint: http://localhost:${PORT}/api/score-investor`);
    console.log(`\n✅ BlockDrive Scoring API is live!`);
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`🔍 API Docs: http://localhost:${PORT}/\n`);
  });
}

export default app;
