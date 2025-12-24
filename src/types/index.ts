export interface InvestorLead {
  id?: string;
  name: string;
  type: 'vc' | 'family_office' | 'angel';
  firmName?: string;
  investmentThesis: string;
  recentInvestments: Investment[];
  industries: string[];
  stages: InvestmentStage[];
  checkSize?: {
    min: number;
    max: number;
    currency: string;
  };
  geography: string[];
  website?: string;
  linkedIn?: string;
  email?: string;
  phone?: string;
  matchScore?: number;
  matchReason?: string;
  lastUpdated: Date;
  source: string;
  notes?: string;
}

export interface Investment {
  company: string;
  date: string;
  amount?: string;
  round?: string;
  industry?: string;
  description?: string;
}

export type InvestmentStage =
  | 'pre_seed'
  | 'seed'
  | 'series_a'
  | 'series_b'
  | 'series_c'
  | 'series_d_plus'
  | 'growth'
  | 'late_stage';

export interface StartupProfile {
  name: string;
  industry: string;
  stage: InvestmentStage;
  description: string;
  fundingGoal?: number;
  geography?: string;
  uniqueValueProp?: string;
  targetInvestorTraits?: string[];
}

export interface ResearchTask {
  id: string;
  type: 'specific_investor' | 'autonomous_search';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  investorName?: string;
  searchCriteria?: Partial<InvestorLead>;
  startupProfile?: StartupProfile;
  result?: InvestorLead[];
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  slackThreadTs: string;
  slackChannel: string;
}

export interface EnrichmentResult {
  success: boolean;
  data?: Partial<InvestorLead>;
  source: string;
  error?: string;
}

export interface SlackCommand {
  type: 'add_investor' | 'find_investors' | 'set_profile' | 'list_investors' | 'help';
  params: Record<string, unknown>;
}

export interface NotionDatabaseSchema {
  Name: { title: Array<{ text: { content: string } }> };
  Type: { select: { name: string } };
  'Firm Name'?: { rich_text: Array<{ text: { content: string } }> };
  'Investment Thesis': { rich_text: Array<{ text: { content: string } }> };
  Industries: { multi_select: Array<{ name: string }> };
  Stages: { multi_select: Array<{ name: string }> };
  'Check Size': { rich_text: Array<{ text: { content: string } }> };
  Geography: { multi_select: Array<{ name: string }> };
  Website?: { url: string };
  LinkedIn?: { url: string };
  Email?: { email: string };
  'Match Score'?: { number: number };
  'Match Reason'?: { rich_text: Array<{ text: { content: string } }> };
  'Last Updated': { date: { start: string } };
  Source: { select: { name: string } };
  Notes?: { rich_text: Array<{ text: { content: string } }> };
}

export interface AgentConfig {
  maxConcurrentResearch: number;
  researchTimeoutMs: number;
  enableWebScraping: boolean;
  enableExternalAPIs: boolean;
}

// Knowledge Base Types
export interface KnowledgeItem {
  id?: string;
  type: 'file' | 'link' | 'text' | 'image' | 'video' | 'document';
  title: string;
  content?: string;
  url?: string;
  fileUrl?: string;
  summary?: string;
  extractedInfo?: Record<string, any>;
  tags?: string[];
  category?: string;
  addedAt: Date;
  lastUpdated?: Date;
  source: 'user_upload' | 'slack_message' | 'conversation';
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    slackFileId?: string;
  };
}

export interface StartupKnowledgeBase {
  userId: string;
  startupProfile?: StartupProfile;
  knowledgeItems: KnowledgeItem[];
  conversationHistory: ConversationEntry[];
  learnedInsights: string[];
  lastUpdated: Date;
}

export interface ConversationEntry {
  id: string;
  timestamp: Date;
  question: string;
  answer: string;
  extractedInfo?: Record<string, any>;
}

export interface LearningSession {
  id: string;
  userId: string;
  channel: string;
  threadTs: string;
  status: 'active' | 'completed' | 'paused';
  questionsAsked: number;
  startedAt: Date;
  completedAt?: Date;
  insights: string[];
}
