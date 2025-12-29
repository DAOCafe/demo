import { useMemo, useCallback, useState } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useVotesByProposal, useTokenHoldersByDAO } from 'daocafe-sdk';
import { uploadVoteReason, type VoteReasonMetadata } from '../services/pinata';

// Governor ABI for voting functions
const GOVERNOR_ABI = [
    {
        name: 'castVote',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'proposalId', type: 'uint256' },
            { name: 'support', type: 'uint8' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    },
    {
        name: 'castVoteWithReason',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
            { name: 'proposalId', type: 'uint256' },
            { name: 'support', type: 'uint8' },
            { name: 'reason', type: 'string' },
        ],
        outputs: [{ name: '', type: 'uint256' }],
    },
] as const;

// Vote support values matching OpenZeppelin Governor
export const VoteSupport = {
    AGAINST: 0,
    FOR: 1,
    ABSTAIN: 2,
} as const;

export type VoteSupportType = keyof typeof VoteSupport;

interface UseVotingResult {
    /** User's voting power for this DAO */
    votingPower: bigint;
    /** User's existing vote on this proposal (if any) */
    userVote: { support: string; weight: string; reason: string | null } | null;
    /** Whether the user can vote (has power and hasn't voted) */
    canVote: boolean;
    /** Loading state for SDK data */
    isLoading: boolean;
    /** Whether a vote transaction is pending */
    isVoting: boolean;
    /** Whether uploading to IPFS */
    isUploadingReason: boolean;
    /** Transaction hash if vote submitted */
    txHash: `0x${string}` | undefined;
    /** Cast a vote */
    vote: (support: VoteSupportType, reason?: string) => Promise<void>;
    /** Reset state after successful vote */
    reset: () => void;
}

export function useVoting(
    proposalId: string,
    daoId: string,
    governorAddress: `0x${string}`,
    chainId: number,
    onChainProposalId: string
): UseVotingResult {
    const { address, isConnected } = useAccount();
    const [isUploadingReason, setIsUploadingReason] = useState(false);

    // Fetch user's voting power from SDK
    const { data: tokenHolders, isLoading: holdersLoading } = useTokenHoldersByDAO(daoId, {
        limit: 1000, // Get all holders to find user
    });

    // Fetch existing votes on this proposal from SDK
    const { data: votes, isLoading: votesLoading } = useVotesByProposal(proposalId, {
        limit: 1000,
    });

    // Contract write hook
    const {
        writeContract,
        data: txHash,
        isPending: isWritePending,
        reset: resetWrite,
    } = useWriteContract();

    // Wait for transaction
    const { isLoading: isConfirming } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    // Find user's token holder record
    const userHolder = useMemo(() => {
        if (!address || !tokenHolders?.items) return null;
        return tokenHolders.items.find(
            (h) => h.holder.toLowerCase() === address.toLowerCase()
        );
    }, [address, tokenHolders]);

    // Find user's existing vote
    const userVote = useMemo(() => {
        if (!address || !votes?.items) return null;
        const vote = votes.items.find(
            (v) => v.voter.toLowerCase() === address.toLowerCase()
        );
        if (!vote) return null;
        return {
            support: vote.support,
            weight: vote.weight,
            reason: vote.reason,
        };
    }, [address, votes]);

    // Calculate voting power
    const votingPower = useMemo(() => {
        if (!userHolder) return BigInt(0);
        return BigInt(userHolder.votes);
    }, [userHolder]);

    // Can vote if connected, has voting power, and hasn't voted
    const canVote = isConnected && votingPower > BigInt(0) && !userVote;

    // Cast vote function
    const vote = useCallback(
        async (support: VoteSupportType, reason?: string) => {
            if (!address || !canVote) return;

            let reasonString = '';

            // If reason provided, upload to IPFS first
            if (reason && reason.trim()) {
                setIsUploadingReason(true);
                try {
                    const metadata: VoteReasonMetadata = {
                        voter: address,
                        proposalId,
                        daoId,
                        support,
                        reason: reason.trim(),
                        createdAt: new Date().toISOString(),
                    };
                    const ipfsHash = await uploadVoteReason(metadata);
                    reasonString = `ipfs://${ipfsHash}`;
                } catch (error) {
                    console.error('Failed to upload vote reason to IPFS:', error);
                    // Fall back to using reason directly if IPFS fails
                    reasonString = reason.trim();
                } finally {
                    setIsUploadingReason(false);
                }
            }

            // Call appropriate contract function
            if (reasonString) {
                writeContract({
                    address: governorAddress,
                    abi: GOVERNOR_ABI,
                    functionName: 'castVoteWithReason',
                    args: [BigInt(onChainProposalId), VoteSupport[support], reasonString],
                    chainId: chainId as 8453 | 11155111,
                });
            } else {
                writeContract({
                    address: governorAddress,
                    abi: GOVERNOR_ABI,
                    functionName: 'castVote',
                    args: [BigInt(onChainProposalId), VoteSupport[support]],
                    chainId: chainId as 8453 | 11155111,
                });
            }
        },
        [address, canVote, proposalId, daoId, governorAddress, onChainProposalId, chainId, writeContract]
    );

    const reset = useCallback(() => {
        resetWrite();
    }, [resetWrite]);

    return {
        votingPower,
        userVote,
        canVote,
        isLoading: holdersLoading || votesLoading,
        isVoting: isWritePending || isConfirming,
        isUploadingReason,
        txHash,
        vote,
        reset,
    };
}
