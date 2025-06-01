import { ApiError } from './client';
import { AppError } from '@/types';

/**
 * Convert API errors to user-friendly messages
 */
export function handleApiError(error: unknown): AppError {
  if (error instanceof ApiError) {
    return {
      message: error.message,
      details: error.details ? JSON.stringify(error.details, null, 2) : undefined,
      timestamp: new Date(),
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      timestamp: new Date(),
    };
  }

  return {
    message: 'An unknown error occurred',
    details: String(error),
    timestamp: new Date(),
  };
}

/**
 * User-friendly error messages for common scenarios
 */
export const ErrorMessages = {
  NETWORK_ERROR: 'Unable to connect to the backend. Please check if the server is running.',
  INVALID_INPUT: 'Invalid input provided. Please check your data and try again.',
  PROOF_NOT_FOUND: 'The requested proof could not be found.',
  VERIFICATION_FAILED: 'Proof verification failed. The proof may be invalid.',
  GENERATION_FAILED: 'Failed to generate proof. Please ensure you have run a prediction first.',
  BACKEND_UNAVAILABLE: 'Backend service is currently unavailable. Please try again later.',
} as const;

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      return ErrorMessages.PROOF_NOT_FOUND;
    }
    if (error.status === 400) {
      return ErrorMessages.INVALID_INPUT;
    }
    if (error.status === 0) {
      return ErrorMessages.NETWORK_ERROR;
    }
    if (error.status && error.status >= 500) {
      return ErrorMessages.BACKEND_UNAVAILABLE;
    }
  }

  return error instanceof Error ? error.message : ErrorMessages.BACKEND_UNAVAILABLE;
}
