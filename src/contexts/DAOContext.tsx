import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useDAO, type DAO } from 'daocafe-sdk';

interface DAOContextType {
    /** The DAO data from SDK */
    dao: DAO | undefined;
    /** Loading state */
    isLoading: boolean;
    /** Error if fetch failed */
    error: Error | null;
    /** Timelock minimum delay in seconds (for execution countdown) */
    timelockMinDelay: bigint;
    /** Quorum numerator (percentage) */
    quorumNumerator: bigint;
    /** Total token supply */
    totalSupply: bigint;
}

const DAOContext = createContext<DAOContextType | null>(null);

interface DAOProviderProps {
    daoId: string;
    children: ReactNode;
}

/**
 * Provider component to share DAO data across components
 * Use this to wrap DAO-related pages to avoid prop drilling
 */
export function DAOProvider({ daoId, children }: DAOProviderProps) {
    const { data: dao, isLoading, error } = useDAO(daoId);

    const value = useMemo<DAOContextType>(() => ({
        dao: dao ?? undefined,
        isLoading,
        error: error as Error | null,
        // Safe defaults - these will be used if DAO hasn't loaded yet
        timelockMinDelay: (dao as DAO & { timelockMinDelay?: string })?.timelockMinDelay
            ? BigInt((dao as DAO & { timelockMinDelay?: string }).timelockMinDelay!)
            : 86400n, // Default 1 day
        quorumNumerator: dao?.quorumNumerator ? BigInt(dao.quorumNumerator) : 1n, // Default 1%
        totalSupply: dao?.totalSupply ? BigInt(dao.totalSupply) : 0n,
    }), [dao, isLoading, error]);

    return (
        <DAOContext.Provider value={value}>
            {children}
        </DAOContext.Provider>
    );
}

/**
 * Hook to access DAO context data
 * Must be used within a DAOProvider
 */
export function useDAOContext(): DAOContextType {
    const context = useContext(DAOContext);
    if (!context) {
        throw new Error('useDAOContext must be used within a DAOProvider');
    }
    return context;
}

/**
 * Hook to access DAO context data safely (returns null if not in provider)
 * Use this for optional DAO context access
 */
export function useDAOContextSafe(): DAOContextType | null {
    return useContext(DAOContext);
}
