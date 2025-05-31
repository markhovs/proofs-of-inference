interface Proof {
  id: string;
  modelName: string;
  timestamp: string;
}

interface ProofDetailsModalProps {
  proof: Proof;
  onClose: () => void;
}

export default function ProofDetailsModal({ proof, onClose }: ProofDetailsModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl">×</button>
        <h3 className="text-2xl font-extrabold mb-6 text-blue-800">Proof Details</h3>
        <div className="mb-4 space-y-4">
          <div>
            <div className="text-base font-semibold text-gray-800 mb-1">Proof ID:</div>
            <div className="font-mono text-blue-700 text-lg font-bold mb-2 cursor-pointer select-all">{proof.id}</div>
          </div>
          <div>
            <div className="text-base font-semibold text-gray-800 mb-1">Model:</div>
            <div className="font-mono text-gray-900 text-lg mb-2">{proof.modelName}</div>
          </div>
          <div>
            <div className="text-base font-semibold text-gray-800 mb-1">Timestamp:</div>
            <div className="font-mono text-gray-900 text-lg mb-2">{new Date(proof.timestamp).toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
} 