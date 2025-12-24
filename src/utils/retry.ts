import pRetry, { AbortError } from 'p-retry';
import { logger } from './logger';

export interface RetryOptions {
  retries?: number;
  minTimeout?: number;
  maxTimeout?: number;
  factor?: number;
  onFailedAttempt?: (error: Error, attemptNumber: number) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    minTimeout = 1000,
    maxTimeout = 5000,
    factor = 2,
    onFailedAttempt,
  } = options;

  return pRetry(
    async () => {
      try {
        return await fn();
      } catch (error) {
        // Don't retry if it's a known non-retryable error
        if (error instanceof AbortError) {
          throw error;
        }
        throw error;
      }
    },
    {
      retries,
      minTimeout,
      maxTimeout,
      factor,
      onFailedAttempt: (error) => {
        logger.warn(`Retry attempt ${error.attemptNumber} failed`, {
          error: error.message,
          retriesLeft: error.retriesLeft,
        });
        if (onFailedAttempt) {
          onFailedAttempt(error, error.attemptNumber);
        }
      },
    }
  );
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const retryablePatterns = [
      /timeout/i,
      /ETIMEDOUT/,
      /ECONNRESET/,
      /ENOTFOUND/,
      /ECONNREFUSED/,
      /rate limit/i,
      /429/,
      /503/,
      /504/,
    ];
    return retryablePatterns.some((pattern) => pattern.test(error.message));
  }
  return false;
}
