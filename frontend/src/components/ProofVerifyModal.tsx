import { useState, useEffect } from 'react';
import {
  useAccount,
  useConnect,
  useConnectors,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';
import { proofsApi } from '@/api';
import { VerificationResponse } from '@/types';
import contractABI from '../app/contract.json';

const contractAddress = process.env.NEXT_PUBLIC_FLOW_CONTRACT_ADDRESS;

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
  const [onChainResult, setOnChainResult] = useState<string | null>(null);
  const [isProcessingOnChain, setIsProcessingOnChain] = useState(false);
  
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

  const handleVerifyOnChain = async () => {
    if (!isConnected) {
      if (connectors.length > 0) {
        connect({ connector: connectors[0] });
      }
      return;
    }

    if (!contractAddress) {
      setOnChainResult('Contract address not configured');
      return;
    }
    
    try {
      setIsProcessingOnChain(true);
      setOnChainResult(null);
      setError(null);
      
      // Get proof details with EVM encoding enabled
      const proofDetails = await proofsApi.getProofDetails(proof.model_id, proof.proof_id, true); // true for EVM encoding
      const evmEncodedProofData = proofDetails.data;
      
      // Log detailed information about the proof data
      console.log('ProofVerifyModal - EVM-encoded proof data:');
      console.log('Model ID:', proof.model_id);
      console.log('Proof ID:', proof.proof_id);
      console.log('Akave Key:', proof.key);
      console.log('Contract Address:', contractAddress);
      
      // Check if the data exists and has the correct format
      if (!evmEncodedProofData) {
        console.error('Error: No proof data received from API');
        throw new Error('No proof data received from API');
      }
      
      // Detailed logging of proof data
      const dataStr = evmEncodedProofData.toString();
      console.log('EVM-encoded data type:', typeof evmEncodedProofData);
      console.log('EVM-encoded data length:', dataStr.length);
      console.log('EVM-encoded data starts with 0x:', dataStr.startsWith('0x'));
      console.log('EVM-encoded data (first 200 chars):', dataStr.substring(0, 200) + '...');
      
      // Validate proof data format
      if (!dataStr.startsWith('0x')) {
        console.warn('Warning: Proof data does not start with 0x prefix');
      }
      
      // Submit to blockchain using EVM-encoded proof data
      await writeContract({
        address: contractAddress as `0x${string}`,
        abi: contractABI,
        functionName: 'processProof',
        args: [evmEncodedProofData as `0x${string}`, proof.key],
      });
      
    } catch (err) {
      console.error('On-chain verification failed:', err);
      
      // Format error message to be more readable and prevent overflow
      let errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // For long error messages, truncate and make more readable
      if (errorMessage.length > 150) {
        errorMessage = `${errorMessage.substring(0, 150)}...`;
      }
      
      setOnChainResult(`❌ Failed: ${errorMessage}`);
      setIsProcessingOnChain(false);
    }
  };

  // Handle transaction status updates
  useEffect(() => {
    if (isContractPending || isConfirming) {
      setIsProcessingOnChain(true);
    } else {
      setIsProcessingOnChain(false);
    }
  }, [isContractPending, isConfirming]);

  useEffect(() => {
    if (isConfirmed) {
      setOnChainResult(`✅ Proof processed successfully on-chain! Tx: ${hash}`);
    }
  }, [isConfirmed, hash]);

  useEffect(() => {
    if (contractError || receiptError) {
      const error = contractError || receiptError;
      console.error('Contract verification error:', error);
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        code: (error as any)?.code,
        data: (error as any)?.data,
        cause: (error as any)?.cause
      });
      
      // Extract the most important part of the error message
      let errorMessage = error?.message || 'Unknown error';
      
      // If it's the "Invalid proof" error, provide a clearer message
      if (errorMessage.includes('Invalid proof')) {
        errorMessage = 'Transaction reverted: Invalid proof data';
      }
      
      setOnChainResult(`❌ Transaction failed: ${errorMessage}`);
    }
  }, [contractError, receiptError]);

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
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-3">
                  <div className="flex items-center mb-1.5">
                    <div className="bg-blue-600 rounded-md p-1 mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-blue-800">SHA256</span>
                  </div>
                  <div className="font-mono text-xs text-blue-700 bg-white/70 p-2 rounded border border-blue-100 break-all select-all">
                    {proof.checksum}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Verification Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                onClick={handleVerify}
                disabled={isVerifying}
                className={`py-3 px-4 rounded-lg text-white font-bold text-sm shadow transition-all duration-200
                  ${isVerifying ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 hover:scale-[1.02]'}`}
              >
                {isVerifying ? 'Verifying...' : 'Verify Off-Chain'}
              </button>
              
              <button
                onClick={handleVerifyOnChain}
                disabled={isProcessingOnChain}
                className={`py-3 px-4 rounded-lg text-white font-bold text-sm shadow transition-all duration-200
                  ${isProcessingOnChain ? 'bg-gray-400 cursor-not-allowed' : 
                    !isConnected ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800' :
                    'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 hover:scale-[1.02]'}`}
              >
                {isProcessingOnChain ? 'Processing...' : 
                 !isConnected ? 'Connect & Verify On-Chain' : 'Verify On-Chain'}
              </button>
            </div>

            {/* Wallet Connection Status */}
            {isConnected && (
              <div className="text-xs text-gray-500 text-center">
                Connected: {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown'}
              </div>
            )}

            {/* On-Chain Result Display */}
            {onChainResult && (
              <div className={`p-4 rounded-lg border ${
                onChainResult.includes('✅') 
                  ? 'bg-green-50 border-green-200' 
                  : onChainResult.includes('❌')
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="font-semibold text-sm break-words overflow-hidden">
                  {onChainResult.length > 300 
                    ? `${onChainResult.substring(0, 300)}...` 
                    : onChainResult}
                </div>
                {hash && (
                  <div className="mt-2 text-xs text-gray-600">
                    <span className="font-mono break-all">Transaction Hash: {hash}</span>
                  </div>
                )}
              </div>
            )}

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