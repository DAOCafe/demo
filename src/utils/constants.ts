export const CHAIN_CONFIG = {
    8453: {
        name: 'Ethereum',
        explorer: 'https://etherscan.io',
        color: '#497493',
    },
    11155111: {
        name: 'Sepolia',
        explorer: 'https://sepolia.etherscan.io',
        color: '#627eea',
    },
} as const;

export type SupportedChainId = keyof typeof CHAIN_CONFIG;

export const getExplorerUrl = (chainId: number, type: 'address' | 'tx', hash: string): string => {
    const chain = CHAIN_CONFIG[chainId as SupportedChainId];
    if (!chain) return '#';
    return `${chain.explorer}/${type}/${hash}`;
};

export const getChainName = (chainId: number): string => {
    return CHAIN_CONFIG[chainId as SupportedChainId]?.name || `Chain ${chainId}`;
};

export const getChainColor = (chainId: number): string => {
    return CHAIN_CONFIG[chainId as SupportedChainId]?.color || '#888888';
};
