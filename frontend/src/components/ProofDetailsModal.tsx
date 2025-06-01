import { useState, useEffect } from 'react';
import { proofsApi } from '@/api';
import { ProofDetails } from '@/types';

interface ProofDisplayData {
  key: string;
  model_id: string;
  proof_id: string;
  modelName: string;
  timestamp: string;
  size: string;
  etag: string;
  checksum: string | null;
}

interface ProofDetailsModalProps {
  proof: ProofDisplayData;
  onClose: () => void;
}

export default function ProofDetailsModal({ proof, onClose }: ProofDetailsModalProps) {
  const [details, setDetails] = useState<ProofDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProofDetails();
  }, [proof.model_id, proof.proof_id]);

  const loadProofDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const proofDetails = await proofsApi.getProofDetails(proof.model_id, proof.proof_id);
      setDetails(proofDetails);
    } catch (err) {
      console.error('Failed to load proof details:', err);
      setError(err instanceof Error ? err.message : 'Failed to load proof details');
    } finally {
      setIsLoading(false);
    }
  };

  const formatData = (data: string | Buffer): string => {
    try {
      if (typeof data === 'string') {
        // Try to parse and format JSON
        const parsed = JSON.parse(data);
        return JSON.stringify(parsed, null, 2);
      }
      return data.toString();
    } catch {
      return typeof data === 'string' ? data : data.toString();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-extrabold text-blue-800">Proof Details</h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading proof details...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-600 font-semibold mb-2">Failed to load proof details</div>
              <div className="text-red-500 text-sm mb-4">{error}</div>
              <button
                onClick={loadProofDetails}
                className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="text-base font-semibold text-gray-800 mb-2">Proof ID</div>
                  <div className="font-mono text-blue-700 text-sm bg-blue-50 p-3 rounded-lg break-all select-all">
                    {proof.proof_id}
                  </div>
                </div>
                <div>
                  <div className="text-base font-semibold text-gray-800 mb-2">Model</div>
                  <div className="font-mono text-gray-900 text-sm bg-gray-50 p-3 rounded-lg">
                    {proof.modelName} ({proof.model_id})
                  </div>
                </div>
                <div>
                  <div className="text-base font-semibold text-gray-800 mb-2">Timestamp</div>
                  <div className="font-mono text-gray-900 text-sm bg-gray-50 p-3 rounded-lg">
                    {proof.timestamp}
                  </div>
                </div>
                <div>
                  <div className="text-base font-semibold text-gray-800 mb-2">File Size</div>
                  <div className="font-mono text-gray-900 text-sm bg-gray-50 p-3 rounded-lg">
                    {proof.size}
                  </div>
                </div>
              </div>

              {/* Storage Information */}
              {details && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="text-base font-semibold text-gray-800 mb-2">ETag</div>
                      <div className="font-mono text-gray-900 text-xs bg-gray-50 p-3 rounded-lg break-all select-all">
                        {details.etag || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-base font-semibold text-gray-800 mb-2">Storage Bucket</div>
                      <div className="font-mono text-gray-900 text-sm bg-gray-50 p-3 rounded-lg">
                        {details.bucket}
                      </div>
                    </div>
                  </div>

                  {/* Checksums */}
                  {(details.checksum_sha256 || details.checksum_crc32) && (
                    <div>
                      <div className="text-base font-semibold text-gray-800 mb-2">Checksums</div>
                      <div className="space-y-3">
                        {details.checksum_sha256 && (
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-3">
                            <div className="flex items-center mb-1.5">
                              <div className="bg-blue-600 rounded-md p-1 mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <span className="text-sm font-semibold text-blue-800">SHA256 Checksum</span>
                            </div>
                            <div className="font-mono text-xs text-blue-700 bg-white/70 p-2 rounded border border-blue-100 break-all select-all">
                              {details.checksum_sha256}
                            </div>
                          </div>
                        )}
                        {details.checksum_crc32 && (
                          <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-lg p-3">
                            <div className="flex items-center mb-1.5">
                              <div className="bg-purple-600 rounded-md p-1 mr-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                </svg>
                              </div>
                              <span className="text-sm font-semibold text-purple-800">CRC32 Checksum</span>
                            </div>
                            <div className="font-mono text-xs text-purple-700 bg-white/70 p-2 rounded border border-purple-100 break-all select-all">
                              {details.checksum_crc32}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Proof Data */}
                  <div>
                    <div className="text-base font-semibold text-gray-800 mb-2">Proof Data</div>
                    <div className="bg-gray-900 text-green-400 text-xs font-mono p-4 rounded-lg overflow-auto max-h-96">
                      <pre className="whitespace-pre-wrap break-words">
                        {formatData(details.data)}
                      </pre>
                    </div>
                  </div>

                  {/* Metadata */}
                  {details.metadata && Object.keys(details.metadata).length > 0 && (
                    <div>
                      <div className="text-base font-semibold text-gray-800 mb-2">Metadata</div>
                      <div className="bg-gray-50 text-gray-800 text-sm font-mono p-4 rounded-lg overflow-auto">
                        <pre>{JSON.stringify(details.metadata, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 