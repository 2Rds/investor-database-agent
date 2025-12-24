import PQueue from 'p-queue';
import { ResearchTask, InvestorLead, StartupProfile } from '../types';
import { AIAgent } from './ai/agent';
import { NotionService } from './notion/client';
import { EnrichmentService } from './research/enrichment';
import { logger } from '../utils/logger';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

export class Orchestrator {
  private taskQueue: PQueue;
  private activeTasks: Map<string, ResearchTask> = new Map();
  private notificationCallbacks: Map<
    string,
    (message: string, isComplete: boolean) => Promise<void>
  > = new Map();

  constructor(
    private aiAgent: AIAgent,
    private notionService: NotionService,
    private enrichmentService: EnrichmentService
  ) {
    this.taskQueue = new PQueue({
      concurrency: config.agent.maxConcurrentResearch,
      timeout: config.agent.researchTimeoutMs,
    });

    logger.info('Orchestrator initialized', {
      maxConcurrency: config.agent.maxConcurrentResearch,
      timeout: config.agent.researchTimeoutMs,
    });
  }

  async researchAndAddInvestor(
    investorName: string,
    channel: string,
    threadTs: string,
    notificationCallback: (message: string, isComplete: boolean) => Promise<void>
  ): Promise<InvestorLead> {
    const taskId = uuidv4();
    const task: ResearchTask = {
      id: taskId,
      type: 'specific_investor',
      status: 'pending',
      investorName,
      slackChannel: channel,
      slackThreadTs: threadTs,
      createdAt: new Date(),
    };

    this.activeTasks.set(taskId, task);
    this.notificationCallbacks.set(taskId, notificationCallback);

    logger.info('Queuing research task', { taskId, investorName });

    return this.taskQueue.add(async () => {
      try {
        task.status = 'in_progress';
        await this.notify(taskId, `🔍 Researching ${investorName}...`, false);

        // Step 1: AI Research
        logger.info('Starting AI research', { taskId, investorName });
        const investorData = await this.aiAgent.researchInvestor(investorName);

        await this.notify(
          taskId,
          `📊 Found basic information for ${investorName}. Enriching data...`,
          false
        );

        // Step 2: Enrichment
        logger.info('Starting enrichment', { taskId, investorName });
        const enrichmentResults = await this.performEnrichment(
          investorName,
          investorData.website
        );

        const enrichedData = this.enrichmentService.combineEnrichmentResults(
          enrichmentResults.filter((r) => r.success)
        );

        // Step 3: Merge data
        const finalData: InvestorLead = {
          ...investorData,
          ...enrichedData,
          lastUpdated: new Date(),
        };

        await this.notify(taskId, `💾 Adding ${investorName} to Notion database...`, false);

        // Step 4: Add to Notion
        const pageId = await this.notionService.addInvestor(finalData);

        logger.info('Successfully added investor', {
          taskId,
          investorName,
          pageId,
        });

        task.status = 'completed';
        task.result = [finalData];
        task.completedAt = new Date();

        await this.notify(
          taskId,
          `✅ Successfully added *${investorName}* to your database!\n\n` +
            `📍 Industries: ${finalData.industries.join(', ')}\n` +
            `🎯 Stages: ${finalData.stages.join(', ')}\n` +
            `🌍 Geography: ${finalData.geography.join(', ')}`,
          true
        );

        return finalData;
      } catch (error) {
        logger.error('Research task failed', { taskId, error });
        task.status = 'failed';
        task.error = error instanceof Error ? error.message : 'Unknown error';

        await this.notify(
          taskId,
          `❌ Failed to research ${investorName}: ${task.error}`,
          true
        );

        throw error;
      } finally {
        this.activeTasks.delete(taskId);
        this.notificationCallbacks.delete(taskId);
      }
    }) as Promise<InvestorLead>;
  }

  async findAndAddMatchingInvestors(
    startupProfile: StartupProfile,
    count: number,
    channel: string,
    threadTs: string,
    notificationCallback: (message: string, isComplete: boolean) => Promise<void>
  ): Promise<InvestorLead[]> {
    const taskId = uuidv4();
    const task: ResearchTask = {
      id: taskId,
      type: 'autonomous_search',
      status: 'pending',
      startupProfile,
      slackChannel: channel,
      slackThreadTs: threadTs,
      createdAt: new Date(),
    };

    this.activeTasks.set(taskId, task);
    this.notificationCallbacks.set(taskId, notificationCallback);

    logger.info('Queuing autonomous search task', {
      taskId,
      startup: startupProfile.name,
      count,
    });

    return this.taskQueue.add(async () => {
      try {
        task.status = 'in_progress';
        await this.notify(
          taskId,
          `🔍 Searching for ${count} investors matching ${startupProfile.name}...`,
          false
        );

        // Find matches with AI
        const matches = await this.aiAgent.findMatchingInvestors(startupProfile, count);

        await this.notify(
          taskId,
          `📊 Found ${matches.length} potential matches. Adding to database...`,
          false
        );

        // Add all matches to Notion
        const addedInvestors: InvestorLead[] = [];
        let successCount = 0;

        for (let i = 0; i < matches.length; i++) {
          try {
            await this.notionService.addInvestor(matches[i]);
            addedInvestors.push(matches[i]);
            successCount++;

            if ((i + 1) % 3 === 0) {
              await this.notify(
                taskId,
                `📝 Progress: ${i + 1}/${matches.length} investors added...`,
                false
              );
            }
          } catch (error) {
            logger.error('Failed to add matched investor', {
              error,
              investor: matches[i].name,
            });
          }
        }

        task.status = 'completed';
        task.result = addedInvestors;
        task.completedAt = new Date();

        const topMatches = addedInvestors
          .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
          .slice(0, 5);

        await this.notify(
          taskId,
          `✅ Successfully added ${successCount} investors to your database!\n\n` +
            `*Top Matches:*\n` +
            topMatches
              .map(
                (m, i) =>
                  `${i + 1}. *${m.name}* (${m.matchScore}% match)\n   ${m.matchReason?.substring(0, 100)}...`
              )
              .join('\n\n'),
          true
        );

        logger.info('Autonomous search completed', {
          taskId,
          addedCount: successCount,
        });

        return addedInvestors;
      } catch (error) {
        logger.error('Autonomous search failed', { taskId, error });
        task.status = 'failed';
        task.error = error instanceof Error ? error.message : 'Unknown error';

        await this.notify(
          taskId,
          `❌ Failed to find matching investors: ${task.error}`,
          true
        );

        throw error;
      } finally {
        this.activeTasks.delete(taskId);
        this.notificationCallbacks.delete(taskId);
      }
    }) as Promise<InvestorLead[]>;
  }

  private async performEnrichment(
    investorName: string,
    website?: string
  ): Promise<any[]> {
    const enrichmentPromises = [
      this.enrichmentService.enrichFromWeb(investorName, website),
    ];

    if (config.externalApis.crunchbase) {
      enrichmentPromises.push(this.enrichmentService.enrichFromCrunchbase(investorName));
    }

    const results = await Promise.allSettled(enrichmentPromises);

    return results
      .filter((r) => r.status === 'fulfilled')
      .map((r: any) => r.value);
  }

  private async notify(taskId: string, message: string, isComplete: boolean) {
    const callback = this.notificationCallbacks.get(taskId);
    if (callback) {
      try {
        await callback(message, isComplete);
      } catch (error) {
        logger.error('Failed to send notification', { error, taskId });
      }
    }
  }

  getActiveTaskCount(): number {
    return this.activeTasks.size;
  }

  getQueueSize(): number {
    return this.taskQueue.size;
  }

  getPendingTaskCount(): number {
    return this.taskQueue.pending;
  }
}
