'use client';

import { useState } from 'react';

const AVAILABLE_MODELS = [
  { id: 'text-reverser', name: 'Text Reverser' },
  { id: 'next-char', name: 'Next Character Predictor' }
];

export default function ModelPlayground() {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [generateProof, setGenerateProof] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Call backend API
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-white/80 backdrop-blur-lg rounded-xl shadow-2xl border border-blue-100">
      <h2 className="text-3xl font-extrabold mb-8 text-blue-800 tracking-tight drop-shadow">Model Playground</h2>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Model Selection */}
        <div>
          <label className="block text-base font-semibold text-blue-700 mb-2">
            Select Model
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full p-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none text-lg bg-white/90 text-gray-700"
          >
            {AVAILABLE_MODELS.map(model => (
              <option key={model.id} value={model.id} className="text-black">
                {model.name}
              </option>
            ))}
          </select>
        </div>

        {/* Input Text */}
        <div>
          <label className="block text-base font-semibold text-blue-700 mb-2">
            Input Text
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full p-3 border-2 border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none text-lg bg-white/90 h-28 placeholder-gray-500 text-gray-900"
            placeholder="Enter your text here..."
          />
        </div>

        {/* Generate Proof Toggle */}
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={generateProof}
            onChange={(e) => setGenerateProof(e.target.checked)}
            className="h-5 w-5 text-blue-600 accent-blue-600 focus:ring-blue-400 border-2 border-blue-300 rounded-md"
          />
          <label className="ml-3 text-base text-blue-800 font-medium">
            Generate Proof
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className={`w-full py-3 px-4 rounded-lg text-white font-bold text-lg shadow transition-all duration-200
            ${isLoading || !input.trim() 
              ? 'bg-blue-200 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 hover:from-blue-700 hover:to-purple-700 hover:scale-[1.02]'
            }`}
        >
          {isLoading ? 'Processing...' : 'Run Model'}
        </button>
      </form>

      {/* Results */}
      {result && (
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <h3 className="font-semibold mb-2 text-blue-700">Result:</h3>
          <p className="font-mono text-lg">{result}</p>
        </div>
      )}
    </div>
  );
} 