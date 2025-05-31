import { useState } from 'react';
import { proofsApi } from '@/api';
import { VerificationResponse } from '@/types';

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

interface ProofVerifyModalProps {
  proof: ProofDisplayData;
  onClose: () => void;
}

export default function ProofVerifyModal({ proof, onClose }: ProofVerifyModalProps) {
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      setError(null);
      setResult(null);
      
      const verificationResult = await proofsApi.verifyProof(proof.model_id, proof.proof_id);
      setResult(verificationResult);
    } catch (err) {
      console.error('Verification failed:', err);
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const getResultIcon = () => {
    if (!result) return null;
    if (result.verified && result.proof_valid) return '✅';
    if (result.verified && !result.proof_valid) return '❌';
    return '⚠️';
  };

  const getResultMessage = () => {
    if (!result) return null;
    if (result.verified && result.proof_valid) return 'Proof is valid!';
    if (result.verified && !result.proof_valid) return 'Proof is invalid!';
    return 'Verification completed with warnings';
  };

  const getResultColor = () => {
    if (!result) return '';
    if (result.verified && result.proof_valid) return 'text-green-600';
    if (result.verified && !result.proof_valid) return 'text-red-600';
    return 'text-yellow-600';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-2xl font-extrabold text-blue-800">Verify Proof</h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Proof Information */}
          <div className="mb-6 space-y-4">
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
            {proof.checksum && (
              <div>
                <div className="text-base font-semibold text-gray-800 mb-2">Checksum</div>
                <div className="font-mono text-gray-900 text-xs bg-gray-50 p-3 rounded-lg break-all select-all">
                  {proof.checksum}
                </div>
              </div>
            )}
          </div>

          {/* Verification Section */}
          <div className="space-y-4">
            <button
              onClick={handleVerify}
              disabled={isVerifying}
              className={`w-full py-3 px-4 rounded-lg text-white font-bold text-lg shadow transition-all duration-200
                ${isVerifying ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 hover:from-blue-700 hover:to-purple-700 hover:scale-[1.02]'}`}
            >
              {isVerifying ? 'Verifying...' : 'Verify Proof'}
            </button>

            {/* Error Display */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800 font-semibold">Verification Error</div>
                <div className="text-red-600 text-sm mt-1">{error}</div>
              </div>
            )}

            {/* Result Display */}
            {result && (
              <div className={`p-4 rounded-lg border ${
                result.verified && result.proof_valid 
                  ? 'bg-green-50 border-green-200' 
                  : result.verified && !result.proof_valid
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className={`font-semibold text-lg flex items-center gap-2 ${getResultColor()}`}>
                  <span className="text-2xl">{getResultIcon()}</span>
                  {getResultMessage()}
                </div>
                
                {result.details && (
                  <div className="mt-3">
                    <div className="text-sm font-semibold text-gray-700 mb-1">Details:</div>
                    <div className="text-sm text-gray-600">{result.details}</div>
                  </div>
                )}

                {result.error && (
                  <div className="mt-3">
                    <div className="text-sm font-semibold text-red-700 mb-1">Error:</div>
                    <div className="text-sm text-red-600">{result.error}</div>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Verification Status: <span className="font-mono">{result.verified ? 'Completed' : 'Failed'}</span></div>
                    <div>Proof Valid: <span className="font-mono">{result.proof_valid ? 'Yes' : 'No'}</span></div>
                    <div>Model ID: <span className="font-mono">{result.model_id}</span></div>
                    <div>Proof ID: <span className="font-mono">{result.proof_id}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 