import { useState, useCallback } from 'react';
import { inferenceApi, proofsApi } from '@/api';
import { handleApiError } from '@/api/errors';
import type { 
  InferenceResponse, 
  ProofGenerationResponse, 
  ProofListItem, 
  VerificationResponse,
  AppError,
  LoadingState 
} from '@/types';

/**
 * Hook for model inference operations
 */
export function useInference() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<InferenceResponse | null>(null);
  const [error, setError] = useState<AppError | null>(null);

  const predict = useCallback(async (input_vector: number[], model_id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate input first
      const validation = inferenceApi.validateInput(input_vector, model_id);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      const response = await inferenceApi.predict(input_vector, model_id);
      setResult(response);
      return response;
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    predict,
    result,
    isLoading,
    error,
    reset,
  };
}

/**
 * Hook for proof generation operations
 */
export function useProofGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ProofGenerationResponse | null>(null);
  const [error, setError] = useState<AppError | null>(null);

  const generateProof = useCallback(async (input_hash?: string, model_hash?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await proofsApi.generateProof(input_hash, model_hash);
      setResult(response);
      return response;
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    generateProof,
    result,
    isLoading,
    error,
    reset,
  };
}

/**
 * Hook for proof list operations
 */
export function useProofList() {
  const [isLoading, setIsLoading] = useState(false);
  const [proofs, setProofs] = useState<ProofListItem[]>([]);
  const [error, setError] = useState<AppError | null>(null);

  const loadProofs = useCallback(async (model_id?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await proofsApi.listProofs(model_id);
      setProofs(response);
      return response;
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(() => loadProofs(), [loadProofs]);

  return {
    loadProofs,
    refresh,
    proofs,
    isLoading,
    error,
  };
}

/**
 * Hook for proof verification operations
 */
export function useProofVerification() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [error, setError] = useState<AppError | null>(null);

  const verifyProof = useCallback(async (model_id: string, proof_id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await proofsApi.verifyProof(model_id, proof_id);
      setResult(response);
      return response;
    } catch (err) {
      const appError = handleApiError(err);
      setError(appError);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return {
    verifyProof,
    result,
    isLoading,
    error,
    reset,
  };
}

/**
 * Hook for managing global loading states
 */
export function useLoadingState() {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    inference: false,
    proofGeneration: false,
    verification: false,
    proofList: false,
  });

  const setLoading = useCallback((operation: keyof LoadingState, loading: boolean) => {
    setLoadingState(prev => ({
      ...prev,
      [operation]: loading,
    }));
  }, []);

  const isAnyLoading = Object.values(loadingState).some(Boolean);

  return {
    loadingState,
    setLoading,
    isAnyLoading,
  };
}
