import { useState } from 'react';

interface Proof {
  id: string;
  modelName: string;
  timestamp: string;
}

interface ProofVerifyModalProps {
  proof: Proof;
  onClose: () => void;
}

export default function ProofVerifyModal({ proof, onClose }: ProofVerifyModalProps) {
  const [verificationKey, setVerificationKey] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    // TODO: Integrate with backend verification
    setTimeout(() => {
      setResult('✔️ Proof is valid!');
      setIsVerifying(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl">×</button>
        <h3 className="text-2xl font-extrabold mb-6 text-blue-800">Verify Proof</h3>
        <div className="mb-4 space-y-4">
          <div>
            <div className="text-base font-semibold text-gray-800 mb-1">Proof ID:</div>
            <div className="font-mono text-blue-700 text-lg font-bold mb-2 cursor-pointer select-all">{proof.id}</div>
          </div>
          <div>
            <div className="text-base font-semibold text-gray-800 mb-1">Model:</div>
            <div className="font-mono text-gray-900 text-lg mb-2">{proof.modelName}</div>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-base font-semibold text-gray-800 mb-2">Verification Key</label>
          <input
            type="text"
            value={verificationKey}
            onChange={e => setVerificationKey(e.target.value)}
            className="w-full p-2 border rounded-md text-gray-900 placeholder-gray-500"
            placeholder="Enter verification key..."
          />
        </div>
        <button
          onClick={handleVerify}
          disabled={isVerifying || !verificationKey.trim()}
          className={`w-full py-2 px-4 rounded-md text-white font-bold text-lg shadow transition-all duration-200
            ${isVerifying || !verificationKey.trim() ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 hover:from-blue-700 hover:to-purple-700 hover:scale-[1.02]'}`}
        >
          {isVerifying ? 'Verifying...' : 'Verify'}
        </button>
        {result && (
          <div className="mt-4 text-green-600 text-center font-semibold text-lg">{result}</div>
        )}
      </div>
    </div>
  );
} 