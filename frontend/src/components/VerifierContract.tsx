'use client';

import { useState, useEffect } from 'react';
import {
  useAccount,
  useConnect,
  useConnectors,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import contractABI from '../app/contract.json'; // Import contract's ABI

const contractAddress = process.env.NEXT_PUBLIC_FLOW_CONTRACT_ADDRESS;

interface VerifierContractProps {
  proofData?: string;
  akaveKey?: string;
  onVerificationResult?: (result: { success: boolean; message: string; txHash?: string }) => void;
}

const VerifierContract = ({ 
  proofData: initialProofData = '', 
  akaveKey: initialAkaveKey = '',
  onVerificationResult 
}: VerifierContractProps) => {
  const [proofData, setProofData] = useState(initialProofData);
  const [akaveKey, setAkaveKey] = useState(initialAkaveKey);
  const [verificationResult, setVerificationResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();
  const connectors = useConnectors();
  
  const { 
    writeContract, 
    data: hash, 
    isPending: isContractPending, 
    error: contractError 
  } = useWriteContract();

  const { 
    isLoading: isConfirming, 
    isSuccess: isConfirmed,
    error: receiptError 
  } = useWaitForTransactionReceipt({
    hash,
  });

  // Update processing state based on transaction status
  useEffect(() => {
    if (isContractPending || isConfirming) {
      setIsProcessing(true);
    } else {
      setIsProcessing(false);
    }
  }, [isContractPending, isConfirming]);

  // Handle transaction completion
  useEffect(() => {
    if (isConfirmed) {
      const message = 'Proof processed successfully on-chain!';
      setVerificationResult(message);
      onVerificationResult?.({ success: true, message, txHash: hash });
    }
  }, [isConfirmed, onVerificationResult, hash]);

  // Handle errors
  useEffect(() => {
    if (contractError || receiptError) {
      const errorMessage = `Processing failed: ${(contractError || receiptError)?.message}`;
      setVerificationResult(errorMessage);
      onVerificationResult?.({ success: false, message: errorMessage });
    }
  }, [contractError, receiptError, onVerificationResult]);

  const handleProcessProof = async () => {
    if (!proofData || !akaveKey) {
      setVerificationResult('Please provide both proof data and Akave key');
      return;
    }

    if (!contractAddress) {
      setVerificationResult('Contract address not configured. Please set NEXT_PUBLIC_FLOW_CONTRACT_ADDRESS');
      return;
    }

    try {
      setVerificationResult(null);
      
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'processProof',
        args: [proofData as `0x${string}`, akaveKey],
      });
    } catch (error) {
      const message = `Invalid input: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setVerificationResult(message);
      onVerificationResult?.({ success: false, message });
    }
  };

  const handleConnect = () => {
    if (connectors.length > 0) {
      connect({ connector: connectors[0] });
    }
  };

  if (!isConnected) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-4">Proof Processor</h2>
        <p className="mb-4 text-gray-600">Connect your wallet to process proofs on Flow blockchain</p>
        <button 
          onClick={handleConnect}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">On-Chain Proof Processor</h2>
      <p className="text-sm text-gray-600 mb-4">Connected: {address}</p>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Proof Data (bytes)
          </label>
          <textarea
            value={proofData}
            onChange={(e) => setProofData(e.target.value)}
            placeholder="0x..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Akave Storage Key
          </label>
          <input
            type="text"
            value={akaveKey}
            onChange={(e) => setAkaveKey(e.target.value)}
            placeholder="proofs/model_id/proof_id.json"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          onClick={handleProcessProof}
          disabled={isProcessing || !proofData || !akaveKey}
          className={`w-full font-bold py-3 px-4 rounded-lg text-white transition-all duration-200 ${
            isProcessing || !proofData || !akaveKey
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-700 hover:scale-[1.02] shadow-lg hover:shadow-xl'
          }`}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {isContractPending ? 'Submitting...' : 'Confirming...'}
            </div>
          ) : (
            'Process Proof On-Chain'
          )}
        </button>
        
        {verificationResult && (
          <div className={`p-4 rounded-md ${
            verificationResult.includes('successfully') 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {verificationResult.includes('successfully') ? '✅' : '❌'}
              </span>
              {verificationResult}
            </div>
          </div>
        )}

        {hash && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <div className="text-sm font-medium text-blue-800 mb-1">Transaction Hash:</div>
            <div className="font-mono text-xs text-blue-700 break-all select-all">
              {hash}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifierContract;
