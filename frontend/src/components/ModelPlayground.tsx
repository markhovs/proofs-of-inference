'use client';

import { useState, useEffect } from 'react';
import { useInference, useProofGeneration } from '@/hooks/useApi';
import { inferenceApi } from '@/api';
import type { Model, InferenceResponse } from '@/types';

const AVAILABLE_MODELS: Model[] = [
  {
    id: 'parity',
    name: 'Parity Model',
    description: 'Predicts parity patterns for binary inputs (0 or 1)',
    inputExample: [1, 0, 1, 0, 1, 0],
    inputType: 'binary',
    inputRange: '0-1 (binary only)',
  },
  {
    id: 'reverse',
    name: 'Reverse Model',
    description: 'Reverses sequence of digit inputs (0-9)',
    inputExample: [1, 2, 3, 4, 5, 6],
    inputType: 'digits',
    inputRange: '0-9 (digits only)',
  },
];

export default function ModelPlayground() {
  const [selectedModel, setSelectedModel] = useState<Model['id']>(AVAILABLE_MODELS[0].id);
  const [inputVector, setInputVector] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  const [inputError, setInputError] = useState<string>('');
  
  // API hooks
  const { predict, result: inferenceResult, isLoading: inferenceLoading, error: inferenceError, reset: resetInference } = useInference();
  const { generateProof, result: proofResult, isLoading: proofLoading, error: proofError, reset: resetProof } = useProofGeneration();
  
  const currentModel = AVAILABLE_MODELS.find(m => m.id === selectedModel) || AVAILABLE_MODELS[0];
  const canGenerateProof = inferenceResult && !proofResult;
  const showProofSection = canGenerateProof || proofLoading;

  // Reset proof result when model changes or new inference runs
  useEffect(() => {
    resetProof();
  }, [selectedModel, inferenceResult, resetProof]);

  // Update input example when model changes
  useEffect(() => {
    if (currentModel.inputExample) {
      setInputVector([...currentModel.inputExample]);
    }
    setInputError('');
    resetInference();
    resetProof();
  }, [selectedModel, currentModel.inputExample, resetInference, resetProof]);

  const handleInputChange = (index: number, value: string) => {
    const numValue = parseInt(value) || 0;
    const newVector = [...inputVector];
    newVector[index] = numValue;
    setInputVector(newVector);
    
    // Clear error when user starts typing
    if (inputError) {
      setInputError('');
    }
  };

  const handleInference = async (e: React.FormEvent) => {
    e.preventDefault();
    setInputError('');
    
    // Validate input
    const validation = inferenceApi.validateInput(inputVector, selectedModel);
    if (!validation.valid) {
      setInputError(validation.error!);
      return;
    }

    try {
      await predict(inputVector, selectedModel);
    } catch (error) {
      // Error is handled by the hook
      console.error('Inference failed:', error);
    }
  };

  const handleProofGeneration = async () => {
    try {
      await generateProof();
    } catch (error) {
      // Error is handled by the hook
      console.error('Proof generation failed:', error);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-white/80 backdrop-blur-lg rounded-xl shadow-2xl border border-blue-100">
      <h2 className="text-3xl font-extrabold mb-8 text-blue-800 tracking-tight drop-shadow">Model Playground</h2>
      
      <form onSubmit={handleInference} className="space-y-8">
        {/* Model Selection */}
        <div>
          <label className="block text-base font-semibold text-blue-700 mb-2">
            Select Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as Model['id'])}
            className="w-full p-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none text-lg bg-white/90 text-gray-700"
          >
            {AVAILABLE_MODELS.map(model => (
              <option key={model.id} value={model.id} className="text-black">
                {model.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-600 mt-2">{currentModel.description}</p>
          <p className="text-xs text-gray-500">Input range: {currentModel.inputRange}</p>
        </div>

        {/* Input Vector (6 integers) */}
        <div>
          <label className="block text-base font-semibold text-blue-700 mb-2">
            Input Vector (6 numbers)
          </label>
          <div className="grid grid-cols-6 gap-3">
            {inputVector.map((value, index) => (
              <div key={index} className="flex flex-col">
                <input
                  type="number"
                  value={value}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  min={currentModel.inputType === 'binary' ? 0 : 0}
                  max={currentModel.inputType === 'binary' ? 1 : 9}
                  className="w-full p-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none text-lg bg-white/90 text-center text-gray-900"
                  placeholder={`${index + 1}`}
                />
                <span className="text-xs text-gray-400 text-center mt-1">#{index + 1}</span>
              </div>
            ))}
          </div>
          
          {/* Example and Error */}
          <div className="mt-3">
            <button
              type="button"
              onClick={() => currentModel.inputExample && setInputVector([...currentModel.inputExample])}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Use example: [{currentModel.inputExample?.join(', ') || '...'}]
            </button>
          </div>
          
          {inputError && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{inputError}</p>
            </div>
          )}
        </div>

        {/* Inference Button */}
        <button
          type="submit"
          disabled={inferenceLoading}
          className={`w-full py-3 px-4 rounded-lg text-white font-bold text-lg shadow transition-all duration-200
            ${inferenceLoading 
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 hover:from-blue-700 hover:to-purple-700 hover:scale-[1.02]'
            }`}
        >
          {inferenceLoading ? 'Running Inference...' : 'Run Inference'}
        </button>
      </form>

      {/* Inference Error */}
      {inferenceError && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="font-semibold mb-2 text-red-700">Inference Error:</h3>
          <p className="text-sm text-red-600">{inferenceError.message}</p>
          {inferenceError.details && (
            <details className="mt-2">
              <summary className="text-xs text-red-500 cursor-pointer">Details</summary>
              <pre className="text-xs text-red-500 mt-1 overflow-auto">{inferenceError.details}</pre>
            </details>
          )}
        </div>
      )}

      {/* Inference Results */}
      {inferenceResult && (
        <div className="mt-8 space-y-6">
          <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl shadow-lg">
            <h3 className="font-bold mb-6 text-green-800 text-2xl flex items-center gap-3">
              <span className="text-3xl">🎯</span>
              Inference Results
              <span className="ml-auto bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                Success
              </span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-green-100 shadow-sm">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">📥</span>
                  Input Vector
                </h4>
                <div className="font-mono text-xl bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200 text-center">
                  <span className="text-gray-600">[</span>
                  <span className="text-blue-700 font-bold">
                    {inferenceResult.input_vector?.join(', ') || 'No input'}
                  </span>
                  <span className="text-gray-600">]</span>
                </div>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-green-100 shadow-sm">
                <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">📤</span>
                  Predicted Output
                </h4>
                <div className="font-mono text-xl bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-lg border border-emerald-200 text-center">
                  <span className="text-gray-600">[</span>
                  <span className="text-emerald-700 font-bold">
                    {inferenceResult.output?.join(', ') || 'No output'}
                  </span>
                  <span className="text-gray-600">]</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-green-100">
                <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                  <span className="text-lg">🤖</span>
                  Model Information
                </h4>
                <p className="text-green-700 font-medium">
                  {currentModel.name}
                </p>
                <p className="text-green-600 text-sm font-mono">
                  ({inferenceResult.model_id})
                </p>
              </div>

              {inferenceResult.message && (
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-green-100">
                  <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <span className="text-lg">💬</span>
                    Status Message
                  </h4>
                  <p className="text-green-700 text-sm leading-relaxed">
                    {inferenceResult.message}
                  </p>
                </div>
              )}
            </div>

            {/* Visual representation of the transformation */}
            <div className="mt-6 p-4 bg-white/40 backdrop-blur-sm rounded-lg border border-green-100">
              <h4 className="font-semibold text-green-800 mb-3 text-center">
                🔄 Transformation Visualization
              </h4>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <div className="flex gap-1">
                  {inferenceResult.input_vector?.map((val, idx) => (
                    <div
                      key={idx}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-md ${
                        val === 1 ? 'bg-blue-500' : 'bg-gray-400'
                      }`}
                    >
                      {val}
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center gap-2 text-green-600">
                  <span className="text-2xl">➡️</span>
                  <span className="font-semibold">{currentModel.name}</span>
                  <span className="text-2xl">➡️</span>
                </div>
                
                <div className="flex gap-1">
                  {inferenceResult.output?.map((val, idx) => (
                    <div
                      key={idx}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-white shadow-md ${
                        val === 1 ? 'bg-emerald-500' : 'bg-gray-400'
                      }`}
                    >
                      {val}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Proof Generation Section */}
          {showProofSection && (
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl shadow-lg">
              <h3 className="font-bold mb-4 text-blue-800 text-xl flex items-center gap-3">
                <span className="text-2xl">🔐</span>
                Generate Zero-Knowledge Proof
              </h3>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 mb-4 border border-blue-100">
                <p className="text-blue-700 leading-relaxed">
                  Create a cryptographic proof that you performed this inference without revealing the model details.
                  This proof can be verified by others while keeping your computation private.
                </p>
              </div>
              
              <button
                onClick={handleProofGeneration}
                disabled={proofLoading || !canGenerateProof}
                className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg transition-all duration-200 flex items-center justify-center gap-3
                  ${proofLoading || !canGenerateProof
                    ? 'bg-purple-300 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 hover:from-purple-700 hover:via-blue-700 hover:to-indigo-700 hover:scale-[1.02] hover:shadow-xl'
                  }`}
              >
                {proofLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    Generating Proof...
                  </>
                ) : (
                  <>
                    <span className="text-xl">🔐</span>
                    Generate Proof
                  </>
                )}
              </button>
            </div>
          )}

          {/* Proof Generation Error */}
          {proofError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold mb-2 text-red-700">Proof Generation Error:</h3>
              <p className="text-sm text-red-600">{proofError.message}</p>
              {proofError.details && (
                <details className="mt-2">
                  <summary className="text-xs text-red-500 cursor-pointer">Details</summary>
                  <pre className="text-xs text-red-500 mt-1 overflow-auto">{proofError.details}</pre>
                </details>
              )}
            </div>
          )}

          {/* Proof Generation Success */}
          {proofResult && (
            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl shadow-lg">
              <h3 className="font-bold mb-6 text-purple-800 text-2xl flex items-center gap-3">
                <span className="text-3xl">🎉</span>
                Proof Generated Successfully!
                <span className="ml-auto bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                  Complete
                </span>
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-100 shadow-sm">
                    <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                      <span className="text-lg">🆔</span>
                      Proof ID
                    </h4>
                    <p className="font-mono text-sm bg-gradient-to-r from-gray-50 to-slate-50 p-3 rounded-lg border border-gray-200 break-all select-all text-gray-600">
                      {proofResult.proof_id?.replace(/^"|"$/g, '')}
                    </p>
                  </div>
                  
                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-100 shadow-sm">
                    <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                      <span className="text-lg">📍</span>
                      Storage Location
                    </h4>
                    <p className="font-mono text-xs bg-gradient-to-r from-gray-50 to-slate-50 p-3 rounded-lg border border-gray-200 break-all text-gray-600">
                      {proofResult.key}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {proofResult.checksum_sha256 && (
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-100 shadow-sm">
                      <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                        <span className="text-lg">🔐</span>
                        Checksum (SHA256)
                      </h4>
                      <p className="font-mono text-sm bg-gradient-to-r from-gray-50 to-slate-50 p-3 rounded-lg border border-gray-200 break-all text-gray-600">
                        {proofResult.checksum_sha256?.replace(/^"|"$/g, '')}
                      </p>
                    </div>
                  )}

                  <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-purple-100 shadow-sm">
                    <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                      <span className="text-lg">✨</span>
                      What's Next?
                    </h4>
                    <p className="text-purple-700 text-sm leading-relaxed">
                      Your proof is now stored securely and can be verified by anyone. 
                      Visit the marketplace to share or verify proofs!
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <a
                  href="/marketplace"
                  className="flex-1 py-4 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 text-white font-bold rounded-xl text-center hover:from-purple-700 hover:via-pink-700 hover:to-purple-800 transition-all duration-200 hover:scale-[1.02] shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                >
                  <span className="text-xl">📋</span>
                  View in Proof Marketplace
                </a>
                
                <button
                  onClick={() => {
                    resetInference();
                    resetProof();
                  }}
                  className="px-6 py-4 bg-white text-purple-700 font-bold rounded-xl border-2 border-purple-200 hover:bg-purple-50 transition-all duration-200 hover:scale-[1.02] shadow-md hover:shadow-lg flex items-center justify-center gap-3"
                >
                  <span className="text-xl">🔄</span>
                  New Inference
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 