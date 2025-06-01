'use client';

import { useAccount, useConnect, useDisconnect } from 'wagmi';

export default function WalletConnection() {
  const { address, isConnected, chainId } = useAccount();
  const { connectors, connect, status, error } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-white text-sm">
          <div className="font-medium">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
          <div className="text-xs opacity-75">
            Chain: {chainId}
          </div>
        </div>
        <button
          onClick={() => disconnect()}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          disabled={status === 'pending'}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-3 py-1 rounded-md text-sm font-medium transition-colors"
        >
          {status === 'pending' ? 'Connecting...' : `Connect ${connector.name}`}
        </button>
      ))}
      {error && (
        <div className="text-red-300 text-xs max-w-xs truncate">
          {error.message}
        </div>
      )}
    </div>
  );
}
