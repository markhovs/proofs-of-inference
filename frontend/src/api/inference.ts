import { apiClient } from './client';
import { InferenceRequest, InferenceResponse } from '@/types';

export class InferenceApi {
  /**
   * Run model inference on input vector
   */
  async predict(input_vector: number[], model_id: string): Promise<InferenceResponse> {
    const request: InferenceRequest = {
      input_vector,
      model_id,
    };

    return apiClient.post<InferenceResponse>('/inference', request);
  }

  /**
   * Get available models with their configurations
   */
  async getAvailableModels() {
    // This could be a future endpoint, for now return static config
    return [
      {
        id: 'parity' as const,
        name: 'Parity Model',
        description: 'Predicts parity patterns for binary inputs (0 or 1)',
        inputExample: [1, 0, 1, 0, 1, 0],
        inputType: 'binary' as const,
        inputRange: '0-1 (binary only)',
      },
      {
        id: 'reverse' as const,
        name: 'Reverse Model',
        description: 'Reverses sequence of digit inputs (0-9)',
        inputExample: [1, 2, 3, 4, 5, 6],
        inputType: 'digits' as const,
        inputRange: '0-9 (digits only)',
      },
    ];
  }

  /**
   * Validate input vector for a specific model
   */
  validateInput(input_vector: number[], model_id: string): { valid: boolean; error?: string } {
    if (!Array.isArray(input_vector)) {
      return { valid: false, error: 'Input must be an array' };
    }

    if (input_vector.length !== 6) {
      return { valid: false, error: 'Input must contain exactly 6 numbers' };
    }

    if (model_id === 'parity') {
      const allBinary = input_vector.every(x => x === 0 || x === 1);
      if (!allBinary) {
        return { 
          valid: false, 
          error: 'Parity model requires binary inputs (0 or 1 only). Example: [1, 0, 1, 0, 1, 0]' 
        };
      }
    } else if (model_id === 'reverse') {
      const allDigits = input_vector.every(x => Number.isInteger(x) && x >= 0 && x <= 9);
      if (!allDigits) {
        return { 
          valid: false, 
          error: 'Reverse model requires digit inputs (0-9 only). Example: [1, 2, 3, 4, 5, 6]' 
        };
      }
    } else {
      return { valid: false, error: `Unknown model: ${model_id}` };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const inferenceApi = new InferenceApi();
