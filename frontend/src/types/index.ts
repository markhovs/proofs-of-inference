// API Response Types
export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// Model Types
export interface Model {
  id: 'parity' | 'reverse';
  name: string;
  description: string;
  inputExample: number[];
  inputType: 'binary' | 'digits';
  inputRange: string;
}

// Inference Types
export interface InferenceRequest {
  input_vector: number[];
  model_id: string;
}

export interface InferenceResponse {
  output?: number[];
  input_vector?: number[];
  model_id: string;
  message?: string;
  witness_data?: string;
}

// Proof Types
export interface ProofGenerationResponse {
  proof_id: string;
  model_id: string;
  key: string;
  etag?: string;
  checksum_sha256?: string;
  checksum_crc32?: string;
  checksum_type?: string;
  bucket: string;
  message: string;
}

export interface ProofListItem {
  Key: string;
  LastModified: string;
  ETag: string;
  Size: number;
  StorageClass: string;
  ChecksumCRC32?: string;
  ChecksumSHA256?: string;
}

export interface ProofDetails {
  data: string | Buffer;
  bucket: string;
  key: string;
  metadata: Record<string, unknown>;
  etag?: string;
  checksum_crc32?: string;
  checksum_crc32c?: string;
  checksum_sha1?: string;
  checksum_sha256?: string;
  checksum_type?: string;
  last_modified?: string;
  content_length?: number;
  version_id?: string;
}

export interface VerificationRequest {
  model_id: string;
  proof_id: string;
}

export interface VerificationResponse {
  proof_id: string;
  model_id: string;
  verified: boolean;
  proof_valid: boolean;
  details: string;
  error?: string;
}

// UI State Types
export interface LoadingState {
  inference: boolean;
  proofGeneration: boolean;
  verification: boolean;
  proofList: boolean;
}

export interface AppError {
  message: string;
  details?: string;
  timestamp: Date;
}
