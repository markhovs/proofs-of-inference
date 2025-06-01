import { apiClient } from './client';
import { 
  ProofGenerationResponse, 
  ProofListItem, 
  ProofDetails, 
  VerificationResponse 
} from '@/types';

export class ProofsApi {
  /**
   * Generate proof for the most recent prediction
   */
  async generateProof(input_hash?: string, model_hash?: string): Promise<ProofGenerationResponse> {
    const requestData = {
      input_hash: input_hash || "latest_prediction", // Default value for latest prediction
      model_hash: model_hash,
      metadata: {
        source: "frontend_request",
        timestamp: new Date().toISOString()
      }
    };
    
    return apiClient.post<ProofGenerationResponse>('/proofs/request', requestData);
  }

  /**
   * List all proofs, optionally filtered by model
   */
  async listProofs(model_id?: string): Promise<ProofListItem[]> {
    const params = model_id ? { model_id } : undefined;
    return apiClient.get<ProofListItem[]>('/proofs/', params);
  }

  /**
   * Get detailed information about a specific proof
   */
  async getProofDetails(model_id: string, proof_id: string, evmEncoding?: boolean): Promise<ProofDetails> {
    const params = evmEncoding ? { evm_encoding: 'true' } : undefined;
    return apiClient.get<ProofDetails>(`/proofs/${model_id}/${proof_id}`, params);
  }

  /**
   * Verify a specific proof
   */
  async verifyProof(model_id: string, proof_id: string): Promise<VerificationResponse> {
    return apiClient.post<VerificationResponse>(`/proofs/${model_id}/${proof_id}/verify`);
  }

  /**
   * Extract model_id and proof_id from proof key
   * Key format: "proofs/{model_id}/{proof_id}.json"
   */
  parseProofKey(key: string): { model_id: string; proof_id: string } | null {
    // Handle undefined, null, or empty keys
    if (!key || typeof key !== 'string') {
      return null;
    }
    
    const match = key.match(/^proofs\/([^/]+)\/([^/]+)\.json$/);
    if (!match) return null;
    
    return {
      model_id: match[1],
      proof_id: match[2],
    };
  }

  /**
   * Format proof timestamp for display
   */
  formatProofTimestamp(timestamp: string): string {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return timestamp;
    }
  }

  /**
   * Get human-readable model name
   */
  getModelDisplayName(model_id: string): string {
    const modelNames: Record<string, string> = {
      'parity': 'Parity Model',
      'reverse': 'Reverse Model',
    };
    return modelNames[model_id] || model_id;
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Truncate long strings for display
   */
  truncateString(str: string, length: number = 10): string {
    if (str.length <= length) return str;
    return str.substring(0, length) + '...';
  }
}

// Export singleton instance
export const proofsApi = new ProofsApi();
