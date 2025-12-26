import axios from 'axios';
import * as cheerio from 'cheerio';
import { WebClient } from '@slack/web-api';
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config';
import { KnowledgeItem } from '../../types';
import { logger } from '../../utils/logger';
import { withRetry } from '../../utils/retry';

export class FileProcessor {
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });
  }

  async processSlackFile(
    file: any,
    slackClient: WebClient
  ): Promise<Partial<KnowledgeItem>> {
    logger.info('Processing Slack file', {
      fileType: file.mimetype,
      fileName: file.name,
    });

    const item: Partial<KnowledgeItem> = {
      type: this.determineFileType(file.mimetype),
      title: file.name || file.title || 'Untitled File',
      fileUrl: file.url_private,
      addedAt: new Date(),
      source: 'slack_message',
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.mimetype,
        slackFileId: file.id,
      },
    };

    // Download and process file content
    try {
      const content = await this.downloadSlackFile(file.url_private, slackClient);

      // Extract text from different file types
      if (file.mimetype?.includes('text') || file.mimetype?.includes('json')) {
        item.content = content.toString('utf-8').substring(0, 10000);
        item.summary = await this.generateSummary(item.content);
      } else if (file.mimetype?.includes('pdf')) {
        // For PDFs, we'd need a PDF parser library
        item.summary = 'PDF document uploaded';
      } else if (file.mimetype?.startsWith('image/')) {
        // For images, use Claude's vision capabilities
        item.summary = await this.analyzeImage(file.url_private, slackClient);
      }

      // Extract tags and categorize
      if (item.content || item.summary) {
        const tags = await this.extractTags(item.content || item.summary || '');
        item.tags = tags;
        item.category = await this.categorizeContent(item.content || item.summary || '');
      }
    } catch (error) {
      logger.error('Failed to process file content', { error, fileName: file.name });
    }

    return item;
  }

  async processLink(url: string, title?: string): Promise<Partial<KnowledgeItem>> {
    logger.info('Processing link', { url });

    const item: Partial<KnowledgeItem> = {
      type: 'link',
      title: title || url,
      url,
      addedAt: new Date(),
      source: 'user_upload',
    };

    try {
      // Fetch and parse webpage content
      const content = await this.fetchWebpage(url);
      item.content = content.substring(0, 10000);

      // Generate summary
      item.summary = await this.generateSummary(content);

      // Extract tags and categorize
      const tags = await this.extractTags(content);
      item.tags = tags;
      item.category = await this.categorizeContent(content);
    } catch (error) {
      logger.error('Failed to process link', { error, url });
      item.summary = 'Link content could not be fetched';
    }

    return item;
  }

  async processText(text: string, title?: string): Promise<Partial<KnowledgeItem>> {
    logger.info('Processing text content', { length: text.length });

    const item: Partial<KnowledgeItem> = {
      type: 'text',
      title: title || this.generateTitleFromText(text),
      content: text,
      addedAt: new Date(),
      source: 'user_upload',
    };

    // Generate summary if text is long
    if (text.length > 500) {
      item.summary = await this.generateSummary(text);
    }

    // Extract tags and categorize
    const tags = await this.extractTags(text);
    item.tags = tags;
    item.category = await this.categorizeContent(text);

    return item;
  }

  async processVideo(url: string, title?: string): Promise<Partial<KnowledgeItem>> {
    logger.info('Processing video', { url });

    const item: Partial<KnowledgeItem> = {
      type: 'video',
      title: title || 'Video',
      url,
      addedAt: new Date(),
      source: 'user_upload',
    };

    // For videos, we can try to extract metadata from the URL
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      item.summary = 'YouTube video';
      item.tags = ['video', 'youtube'];
    } else if (url.includes('vimeo.com')) {
      item.summary = 'Vimeo video';
      item.tags = ['video', 'vimeo'];
    } else if (url.includes('loom.com')) {
      item.summary = 'Loom video';
      item.tags = ['video', 'loom'];
    }

    return item;
  }

  private async downloadSlackFile(url: string, slackClient: WebClient): Promise<Buffer> {
    return withRetry(async () => {
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${config.slack.botToken}`,
        },
        responseType: 'arraybuffer',
        timeout: 30000,
      });

      return Buffer.from(response.data);
    });
  }

  private async fetchWebpage(url: string): Promise<string> {
    return withRetry(async () => {
      const response = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        timeout: 15000,
      });

      const $ = cheerio.load(response.data);

      // Remove unwanted elements
      $('script, style, nav, footer, header, iframe').remove();

      // Extract main content
      const text = $('body').text().replace(/\s+/g, ' ').trim();

      return text;
    });
  }

  private async generateSummary(content: string): Promise<string> {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 300,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: `Summarize the following content in 2-3 concise sentences, focusing on key information relevant to understanding a startup:\n\n${content.substring(0, 5000)}`,
          },
        ],
      });

      const textContent = response.content[0];
      if (textContent.type === 'text') {
        return textContent.text.trim();
      }

      return 'Summary generation failed';
    } catch (error) {
      logger.error('Failed to generate summary', { error });
      return content.substring(0, 200) + '...';
    }
  }

  private async extractTags(content: string): Promise<string[]> {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 200,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: `Extract 3-5 relevant tags from this content. Return ONLY a JSON array of strings.

Content: ${content.substring(0, 2000)}`,
          },
        ],
      });

      const textContent = response.content[0];
      if (textContent.type === 'text') {
        const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const tags = JSON.parse(jsonMatch[0]);
          return Array.isArray(tags) ? tags.slice(0, 5) : [];
        }
      }

      return [];
    } catch (error) {
      logger.error('Failed to extract tags', { error });
      return [];
    }
  }

  private async categorizeContent(content: string): Promise<string> {
    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 50,
        temperature: 0.2,
        messages: [
          {
            role: 'user',
            content: `Categorize this content into ONE of these categories: Product, Team, Traction, Market, Funding, Strategy, Other. Return ONLY the category name.

Content: ${content.substring(0, 1000)}`,
          },
        ],
      });

      const textContent = response.content[0];
      if (textContent.type === 'text') {
        const category = textContent.text.trim();
        const validCategories = [
          'Product',
          'Team',
          'Traction',
          'Market',
          'Funding',
          'Strategy',
          'Other',
        ];
        return validCategories.includes(category) ? category : 'Other';
      }

      return 'Other';
    } catch (error) {
      logger.error('Failed to categorize content', { error });
      return 'Other';
    }
  }

  private async analyzeImage(url: string, _slackClient: WebClient): Promise<string> {
    try {
      // Download image
      const imageBuffer = await this.downloadSlackFile(url, _slackClient);
      const base64Image = imageBuffer.toString('base64');

      // Use Claude's vision capabilities
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Image,
                },
              },
              {
                type: 'text',
                text: 'Describe this image in 2-3 sentences, focusing on any startup-related information (e.g., pitch deck slides, product screenshots, team photos, charts, etc.)',
              },
            ],
          },
        ],
      });

      const textContent = response.content[0];
      if (textContent.type === 'text') {
        return textContent.text.trim();
      }

      return 'Image uploaded';
    } catch (error) {
      logger.error('Failed to analyze image', { error });
      return 'Image uploaded';
    }
  }

  private determineFileType(mimetype: string): KnowledgeItem['type'] {
    if (mimetype?.startsWith('image/')) return 'image';
    if (mimetype?.startsWith('video/')) return 'video';
    if (mimetype?.includes('pdf') || mimetype?.includes('document')) return 'document';
    if (mimetype?.includes('text')) return 'text';
    return 'file';
  }

  private generateTitleFromText(text: string): string {
    // Use first sentence or first 50 chars as title
    const firstSentence = text.split(/[.!?]/)[0];
    return firstSentence.substring(0, 100).trim() || 'Text Note';
  }
}
