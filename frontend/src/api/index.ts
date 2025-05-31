// Import the client for internal use
import { apiClient } from './client';

// Main API exports
export { apiClient, ApiError } from './client';
export { inferenceApi } from './inference';
export { proofsApi } from './proofs';

// Re-export types for convenience
export type {
  ApiResponse,
  Model,
  InferenceRequest,
  InferenceResponse,
  ProofGenerationResponse,
  ProofListItem,
  ProofDetails,
  VerificationResponse,
  LoadingState,
  AppError,
} from '@/types';

// Utility function to check if backend is reachable
export async function checkBackendHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    await apiClient.healthCheck();
    return { healthy: true };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
