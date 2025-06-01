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
                      <div className="space-y-2">
                        {details.checksum_sha256 && (
                          <div className="font-mono text-xs bg-gray-50 p-3 rounded-lg break-all select-all">
                            <span className="text-gray-600">SHA256:</span> {details.checksum_sha256}
                          </div>
                        )}
                        {details.checksum_crc32 && (
                          <div className="font-mono text-xs bg-gray-50 p-3 rounded-lg break-all select-all">
                            <span className="text-gray-600">CRC32:</span> {details.checksum_crc32}
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