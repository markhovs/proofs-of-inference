'use client';

import { useState, useEffect } from 'react';
import ProofVerifyModal from './ProofVerifyModal';
import ProofDetailsModal from './ProofDetailsModal';
import { proofsApi } from '@/api';
import { ProofListItem } from '@/types';

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

export default function ProofList() {
  const [proofs, setProofs] = useState<ProofDisplayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [verifyModalProof, setVerifyModalProof] = useState<ProofDisplayData | null>(null);
  const [detailsModalProof, setDetailsModalProof] = useState<ProofDisplayData | null>(null);

  useEffect(() => {
    loadProofs();
  }, []);

  const loadProofs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const proofsData = await proofsApi.listProofs();
      
      // Transform API data to display format
      const displayProofs: ProofDisplayData[] = proofsData
        .map((proof: ProofListItem) => {
          const parsed = proofsApi.parseProofKey(proof.Key);
          if (!parsed) return null;
          
          return {
            key: proof.Key,
            model_id: parsed.model_id,
            proof_id: parsed.proof_id,
            modelName: proofsApi.getModelDisplayName(parsed.model_id),
            timestamp: proofsApi.formatProofTimestamp(proof.LastModified),
            size: proofsApi.formatFileSize(proof.Size),
            etag: proof.ETag,
            checksum: proof.ChecksumSHA256 || proof.ChecksumCRC32 || null,
          };
        })
        .filter((proof): proof is ProofDisplayData => proof !== null)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setProofs(displayProofs);
    } catch (err) {
      console.error('Failed to load proofs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load proofs');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-extrabold text-blue-800 tracking-tight drop-shadow">Proof Marketplace</h2>
        <button
          onClick={loadProofs}
          disabled={isLoading}
          className="px-4 py-2 text-sm font-semibold text-blue-700 bg-white/80 border border-blue-200 rounded-lg shadow hover:bg-blue-50 hover:text-blue-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-semibold">Error loading proofs:</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading proofs...</span>
        </div>
      ) : proofs.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg mb-4">No proofs found</div>
          <p className="text-gray-400 text-sm">
            Generate some proofs using the Model Playground to see them here.
          </p>
        </div>
      ) : (
        <div className="grid gap-8">
          {proofs.map((proof) => (
            <div 
              key={proof.key}
              className="bg-white/80 backdrop-blur-lg rounded-xl shadow-2xl border border-blue-100 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6 hover:scale-[1.01] transition-transform duration-150"
            >
              <div className="flex-1">
                <h3 className="text-xl font-bold text-blue-700 mb-1">{proof.modelName}</h3>
                <p className="text-sm text-gray-500 mb-2">{proof.timestamp}</p>
                <div className="flex flex-wrap gap-4 text-xs text-gray-400">
                  <span>Proof ID: <span className="font-mono">{proofsApi.truncateString(proof.proof_id)}</span></span>
                  <span>Size: <span className="font-mono">{proof.size}</span></span>
                  {proof.checksum && (
                    <span>Checksum: <span className="font-mono">{proofsApi.truncateString(proof.checksum)}</span></span>
                  )}
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setDetailsModalProof(proof)}
                  className="px-4 py-2 text-sm font-semibold text-blue-700 bg-white/80 border border-blue-200 rounded-lg shadow hover:bg-blue-50 hover:text-blue-900 transition-all"
                >
                  View Details
                </button>
                <button
                  onClick={() => setVerifyModalProof(proof)}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 text-white shadow hover:from-blue-700 hover:to-purple-700 hover:scale-[1.03] transition-all"
                >
                  Verify
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {verifyModalProof && (
        <ProofVerifyModal
          proof={verifyModalProof}
          onClose={() => setVerifyModalProof(null)}
        />
      )}
      {detailsModalProof && (
        <ProofDetailsModal
          proof={detailsModalProof}
          onClose={() => setDetailsModalProof(null)}
        />
      )}
    </div>
  );
} 