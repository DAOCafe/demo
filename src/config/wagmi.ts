import { http, createConfig } from 'wagmi';
import { base, sepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

export const config = createConfig({
    chains: [base, sepolia],
    connectors: [
        injected(),
    ],
    transports: {
        [base.id]: http(),
        [sepolia.id]: http(),
    },
});

declare module 'wagmi' {
    interface Register {
        config: typeof config;
    }
}
