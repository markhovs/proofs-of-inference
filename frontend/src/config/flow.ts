import { http, createConfig } from '@wagmi/core';
import { flowTestnet } from '@wagmi/core/chains';

export const flowConfig = createConfig({
  chains: [flowTestnet],
  transports: {
    [flowTestnet.id]: http(),
  },
});
