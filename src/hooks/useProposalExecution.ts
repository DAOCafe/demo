import { useMemo, useCallback, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { keccak256, toBytes } from 'viem';
import type { Proposal } from 'daocafe-sdk';

// Governor ABI for queue, execute, and cancel functions
const GOVERNOR_EXECUTION_ABI = [
    {
        name: 'queue',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'targets', type: 'address[]' },
            { name: 'values', type: 'uint256[]' },
            { name: 'calldatas', type: 'bytes[]' },
            { name: 'descriptionHash', type: 'bytes32' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'execute',
        type: 'function',
        stateMutability: 'payable',
        inputs: [
            { name: 'targets', type: 'address[]' },
            { name: 'values', type: 'uint256[]' },
            { name: 'calldatas', type: 'bytes[]' },
            { name: 'descriptionHash', type: 'bytes32' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'cancel',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'targets', type: 'address[]' },
            { name: 'values', type: 'uint256[]' },
            { name: 'calldatas', type: 'bytes[]' },
            { name: 'descriptionHash', type: 'bytes32' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    },
] as const;

export type ExecutionAction = 'queue' | 'execute' | 'cancel';

interface UseProposalExecutionResult {
    /** Whether the proposal can be queued (SUCCEEDED state) */
    canQueue: boolean;
    /** Whether the proposal can be executed (QUEUED + eta passed) */
    canExecute: boolean;
    /** Whether the current user can cancel (is proposer) */
    canCancel: boolean;
    /** Time remaining until execution is available (seconds) */
    timeUntilExecutable: number;
    /** Whether a transaction is pending */
    isPending: boolean;
    /** Whether waiting for transaction confirmation */
    isConfirming: boolean;
    /** Transaction hash if submitted */
    txHash: `0x${string}` | undefined;
    /** Current action being performed */
    currentAction: ExecutionAction | null;
    /** Set the action to be performed (opens modal) */
    setAction: (action: ExecutionAction) => void;
    /** Confirm and execute the selected action */
    confirmExecution: () => void;
    /** Reset transaction state */
    reset: () => void;
}

/**
 * Hook for proposal queue, execute, and cancel operations
 */
export function useProposalExecution(
    proposal: Proposal | undefined,
    proposalState: string,
    governorAddress: `0x${string}`,
    chainId: number
): UseProposalExecutionResult {
    const { address } = useAccount();
    const [currentAction, setCurrentAction] = useState<ExecutionAction | null>(null);

    // Contract write hook
    const {
        writeContract,
        data: txHash,
        isPending,
        reset: resetWrite,
    } = useWriteContract();

    // Wait for transaction confirmation
    const { isLoading: isConfirming } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    // Calculate if user is the proposer
    const isProposer = useMemo(() => {
        if (!address || !proposal) return false;
        return proposal.proposer.toLowerCase() === address.toLowerCase();
    }, [address, proposal]);

    // Calculate derived states
    const canQueue = proposalState === 'SUCCEEDED';

    // Can execute if QUEUED and eta has passed
    const { canExecute, timeUntilExecutable } = useMemo(() => {
        if (proposalState !== 'QUEUED' || !proposal?.eta) {
            return { canExecute: false, timeUntilExecutable: 0 };
        }
        const now = Math.floor(Date.now() / 1000);
        const eta = Number(proposal.eta);
        const timeLeft = eta - now;
        return {
            canExecute: timeLeft <= 0,
            timeUntilExecutable: Math.max(0, timeLeft),
        };
    }, [proposalState, proposal?.eta]);

    // Can cancel if proposer and proposal is not yet executed
    const canCancel = isProposer &&
        ['PENDING', 'ACTIVE', 'SUCCEEDED', 'QUEUED'].includes(proposalState);

    // Helper to get proposal parameters for contract calls
    const getProposalParams = useCallback(() => {
        if (!proposal) return null;

        // Convert stored arrays back to proper types
        const targets = proposal.targets.map(t => t as `0x${string}`);
        const values = proposal.values.map(v => BigInt(v));
        const calldatas = proposal.calldatas.map(c => c as `0x${string}`);
        const descriptionHash = keccak256(toBytes(proposal.description));

        return { targets, values, calldatas, descriptionHash };
    }, [proposal]);

    // Set the action to perform (called when button clicked, before modal confirmation)
    const setAction = useCallback((action: ExecutionAction) => {
        setCurrentAction(action);
    }, []);

    // Confirm and execute the selected action (called from modal confirmation)
    const confirmExecution = useCallback(() => {
        if (!currentAction) return;

        const params = getProposalParams();
        if (!params) return;

        // Validate permissions based on action
        if (currentAction === 'queue' && !canQueue) return;
        if (currentAction === 'execute' && !canExecute) return;
        if (currentAction === 'cancel' && !canCancel) return;

        // Execute the appropriate contract function
        writeContract({
            address: governorAddress,
            abi: GOVERNOR_EXECUTION_ABI,
            functionName: currentAction,
            args: [params.targets, params.values, params.calldatas, params.descriptionHash],
            chainId: chainId as 1 | 11155111,
        });
    }, [currentAction, getProposalParams, canQueue, canExecute, canCancel, governorAddress, chainId, writeContract]);

    // Reset state
    const reset = useCallback(() => {
        resetWrite();
        setCurrentAction(null);
    }, [resetWrite]);

    return {
        canQueue,
        canExecute,
        canCancel,
        timeUntilExecutable,
        isPending,
        isConfirming,
        txHash,
        currentAction,
        setAction,
        confirmExecution,
        reset,
    };
}
