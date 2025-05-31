'use client';

import { useState } from 'react';
import ProofVerifyModal from './ProofVerifyModal';
import ProofDetailsModal from './ProofDetailsModal';

interface Proof {
  id: string;
  modelName: string;
  timestamp: string;
}

// Mock data for development
const MOCK_PROOFS: Proof[] = [
  {
    id: 'proof-1',
    modelName: 'Text Reverser',
    timestamp: '2024-03-23T10:30:00Z',
  },
  {
    id: 'proof-2',
    modelName: 'Next Character Predictor',
    timestamp: '2024-03-23T10:35:00Z',
  }
];

export default function ProofList() {
  const [proofs] = useState<Proof[]>(MOCK_PROOFS);
  const [verifyModalProof, setVerifyModalProof] = useState<Proof | null>(null);
  const [detailsModalProof, setDetailsModalProof] = useState<Proof | null>(null);

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <h2 className="text-3xl font-extrabold mb-8 text-blue-800 tracking-tight drop-shadow">Proof Marketplace</h2>
      <div className="grid gap-8">
        {proofs.map((proof) => (
          <div 
            key={proof.id}
            className="bg-white/80 backdrop-blur-lg rounded-xl shadow-2xl border border-blue-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 hover:scale-[1.01] transition-transform duration-150"
          >
            <div>
              <h3 className="text-xl font-bold text-blue-700 mb-1">{proof.modelName}</h3>
              <p className="text-sm text-gray-500">{new Date(proof.timestamp).toLocaleString()}</p>
              <p className="text-xs text-gray-400 mt-1">Proof ID: <span className="font-mono">{proof.id}</span></p>
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