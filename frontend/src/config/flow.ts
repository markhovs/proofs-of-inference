import { http, createConfig } from '@wagmi/core';
import { flowTestnet, hederaTestnet } from '@wagmi/core/chains';

export const flowConfig = createConfig({
  chains: [flowTestnet, hederaTestnet],
  transports: {
    [flowTestnet.id]: http(),
    [hederaTestnet.id]: http(),
  },
});
