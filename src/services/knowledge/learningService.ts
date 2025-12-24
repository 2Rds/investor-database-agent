import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config';
import { LearningSession, ConversationEntry } from '../../types';
import { KnowledgeBaseService } from './knowledgeBase';
import { logger } from '../../utils/logger';
import { withRetry } from '../../utils/retry';
import { v4 as uuidv4 } from 'uuid';

export class LearningService {
  private client: Anthropic;
  private activeSessions: Map<string, LearningSession> = new Map();
  private maxQuestionsPerSession = 10;

  constructor(private knowledgeBase: KnowledgeBaseService) {
    this.client = new Anthropic({ apiKey: config.anthropic.apiKey });
  }

  async startLearningSession(
    userId: string,
    channel: string,
    threadTs: string
  ): Promise<LearningSession> {
    const sessionId = uuidv4();
    const session: LearningSession = {
      id: sessionId,
      userId,
      channel,
      threadTs,
      status: 'active',
      questionsAsked: 0,
      startedAt: new Date(),
      insights: [],
    };

    this.activeSessions.set(sessionId, session);

    logger.info('Started learning session', { sessionId, userId });

    return session;
  }

  async getNextQuestion(sessionId: string): Promise<string | null> {
    const session = this.activeSessions.get(sessionId);

    if (!session || session.status !== 'active') {
      return null;
    }

    if (session.questionsAsked >= this.maxQuestionsPerSession) {
      await this.completeSession(sessionId);
      return null;
    }

    // Get current knowledge context
    const knowledgeContext = await this.knowledgeBase.getAllKnowledgeContext(session.userId);

    // Generate intelligent next question
    const question = await this.generateNextQuestion(knowledgeContext, session);

    session.questionsAsked++;

    logger.info('Generated learning question', {
      sessionId,
      questionNumber: session.questionsAsked,
    });

    return question;
  }

  async processAnswer(sessionId: string, answer: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      throw new Error('Learning session not found');
    }

    // Extract insights from the answer
    const insights = await this.extractInsights(answer, session.userId);

    // Store insights
    for (const insight of insights) {
      await this.knowledgeBase.addInsight(session.userId, insight);
      session.insights.push(insight);
    }

    // Store the conversation
    const userKnowledge = await this.knowledgeBase.getUserKnowledge(session.userId);
    const lastQuestion = this.getLastQuestionFromContext(session.questionsAsked);

    const conversationEntry: ConversationEntry = {
      id: uuidv4(),
      timestamp: new Date(),
      question: lastQuestion || 'Question',
      answer,
      extractedInfo: { insights },
    };

    userKnowledge.conversationHistory.push(conversationEntry);

    logger.info('Processed learning answer', {
      sessionId,
      insightsExtracted: insights.length,
    });
  }

  async completeSession(sessionId: string): Promise<LearningSession | null> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      return null;
    }

    session.status = 'completed';
    session.completedAt = new Date();

    logger.info('Completed learning session', {
      sessionId,
      questionsAsked: session.questionsAsked,
      insightsGathered: session.insights.length,
    });

    this.activeSessions.delete(sessionId);

    return session;
  }

  async pauseSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);

    if (session) {
      session.status = 'paused';
      logger.info('Paused learning session', { sessionId });
    }
  }

  getActiveSession(userId: string): LearningSession | null {
    for (const session of this.activeSessions.values()) {
      if (session.userId === userId && session.status === 'active') {
        return session;
      }
    }
    return null;
  }

  private async generateNextQuestion(
    knowledgeContext: string,
    session: LearningSession
  ): Promise<string> {
    return withRetry(async () => {
      const prompt = `You are an intelligent AI assistant helping to learn about a founder's startup to optimize investor matching.

Current Knowledge Context:
${knowledgeContext}

Questions Asked So Far: ${session.questionsAsked}/${this.maxQuestionsPerSession}

Your task is to generate the next most valuable question to ask the founder. The question should:
1. Fill gaps in critical information for investor matching
2. Be specific and actionable
3. Build on information already gathered
4. Focus on aspects that investors care about (market, traction, team, vision, etc.)
5. Be conversational and not repetitive

Priority areas to explore (if not already covered):
- Problem being solved and target customer
- Unique value proposition and competitive advantage
- Market size and opportunity
- Current traction (revenue, users, growth rate)
- Team background and why they're uniquely positioned
- Funding history and current raise details
- Go-to-market strategy
- Vision and long-term goals
- Key challenges and how they're addressing them

Generate ONE clear, conversational question that will elicit valuable information. Return ONLY the question, nothing else.`;

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        temperature: 0.7,
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

      return content.text.trim();
    });
  }

  private async extractInsights(answer: string, userId: string): Promise<string[]> {
    return withRetry(async () => {
      const knowledgeContext = await this.knowledgeBase.getAllKnowledgeContext(userId);

      const prompt = `You are extracting key insights from a founder's answer to store in a knowledge base for investor matching.

Existing Knowledge:
${knowledgeContext}

Founder's Answer:
${answer}

Extract 1-3 concise, actionable insights from this answer that would be valuable for:
1. Understanding the startup better
2. Matching with appropriate investors
3. Future reference

Format: Return a JSON array of strings, each being a specific insight.
Example: ["Raised $500K in pre-seed from angels", "30% MoM growth for last 6 months", "Former Google engineers on founding team"]

Return ONLY the JSON array, nothing else.`;

      const response = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
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

      try {
        const jsonMatch = content.text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          return [];
        }

        const insights = JSON.parse(jsonMatch[0]);
        return Array.isArray(insights) ? insights : [];
      } catch (error) {
        logger.error('Failed to parse insights', { error });
        return [];
      }
    });
  }

  async generateLearningReport(sessionId: string): Promise<string> {
    const session = this.activeSessions.get(sessionId);

    if (!session) {
      return 'Session not found.';
    }

    const knowledgeBase = await this.knowledgeBase.getUserKnowledge(session.userId);

    let report = `📚 **Learning Session Complete**\n\n`;
    report += `Questions Asked: ${session.questionsAsked}\n`;
    report += `Insights Gathered: ${session.insights.length}\n\n`;

    if (session.insights.length > 0) {
      report += `**Key Insights:**\n`;
      session.insights.forEach((insight, idx) => {
        report += `${idx + 1}. ${insight}\n`;
      });
      report += '\n';
    }

    report += `**Total Knowledge Base:**\n`;
    report += `- Knowledge Items: ${knowledgeBase.knowledgeItems.length}\n`;
    report += `- Conversation Entries: ${knowledgeBase.conversationHistory.length}\n`;
    report += `- Total Insights: ${knowledgeBase.learnedInsights.length}\n\n`;

    report += `I now have a much better understanding of your startup and can provide more accurate investor matches! 🎯`;

    return report;
  }

  private getLastQuestionFromContext(questionNumber: number): string {
    // This would typically be stored with the session
    // For now, return a placeholder
    return `Question ${questionNumber}`;
  }
}
