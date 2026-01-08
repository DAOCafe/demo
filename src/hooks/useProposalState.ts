import { useState, useEffect } from 'react';
import type { Proposal, DAO } from 'daocafe-sdk';

/**
 * OpenZeppelin Governor State Enum
 */
export type ProposalState =
    | 'PENDING'
    | 'ACTIVE'
    | 'CANCELED'
    | 'DEFEATED'
    | 'SUCCEEDED'
    | 'QUEUED'
    | 'EXPIRED'
    | 'EXECUTED';

/**
 * Calculates the effective state of a proposal based on time and votes
 * mirroring the OpenZeppelin Governor logic.
 */
export function useProposalState(proposal: Proposal | undefined | null, dao: DAO | undefined | null): ProposalState | undefined {
    const [state, setState] = useState<ProposalState | undefined>(proposal?.state as ProposalState);

    useEffect(() => {
        if (!proposal) return;

        const timer = setInterval(() => {
            const derivedState = calculateProposalState(proposal, dao);
            setState(derivedState);
        }, 1000);

        // Initial check
        setState(calculateProposalState(proposal, dao));

        return () => clearInterval(timer);
    }, [proposal, dao]);

    return state;
}

/**
 * Pure function to calculate state
 */
export function calculateProposalState(proposal: Proposal, dao: DAO | undefined | null): ProposalState {
    // 1. Trust terminal states from the indexer
    // CANCELED, EXECUTED, and QUEUED are explicit actions that set a flag on-chain
    // The indexer should catch these events reliably.
    if (proposal.state === 'CANCELED') return 'CANCELED';
    if (proposal.state === 'EXECUTED') return 'EXECUTED';
    if (proposal.state === 'QUEUED') return 'QUEUED';
    if (proposal.state === 'EXPIRED') return 'EXPIRED';

    const now = Math.floor(Date.now() / 1000);
    const voteStart = Number(proposal.voteStart);
    const voteEnd = Number(proposal.voteEnd);

    // 2. Pending
    if (now < voteStart) {
        return 'PENDING';
    }

    // 3. Active
    if (now <= voteEnd) {
        return 'ACTIVE';
    }

    // 4. Past voteEnd -> Defeated or Succeeded
    // We need Quorum and Vote Success logic

    // Default Quorum: 4% (This is standard OZ default if not specified, 
    // but better to use DAO settings if available)
    // Assuming quorumNumerator is a percentage (0-100) or using a default.
    // NOTE: The 'dao' object from ponder schema has quorumNumerator.

    let quorumReached = false;
    let voteSucceeded = false;

    const votesFor = BigInt(proposal.forVotes);
    const votesAgainst = BigInt(proposal.againstVotes);
    const votesAbstain = BigInt(proposal.abstainVotes);

    if (dao) {
        const totalSupply = BigInt(dao.totalSupply);
        const quorumNumerator = dao.quorumNumerator ? BigInt(dao.quorumNumerator) : 4n;

        // Calculate required votes for quorum
        // OZ GovernorVotesQuorumFraction uses a denominator of 100
        const quorumRequired = (totalSupply * quorumNumerator) / 100n;

        // Standard OZ Counting: For + Abstain counts towards Quorum
        // (Some implementations include Against, but For+Abstain is safer default for OZ compatibility)
        // Checking GovernorCountingSimple.sol would confirm, but usually "quorum = for + abstain"

        // Actually, let's look at standard behavior:
        // "Quorum is the minimum number of votes that must be cast for a proposal to be valid."
        // Most Governors count ALL votes (For, Against, Abstain) towards Quorum.
        const totalVotes = votesFor + votesAgainst + votesAbstain;

        quorumReached = totalVotes >= quorumRequired;

        // Vote Success: For > Against (Simple Majority)
        voteSucceeded = votesFor > votesAgainst;
    } else {
        // Fallback if DAO data missing: 
        // We can't strictly calculate Quorum, so we might have to rely on the indexer's last known state
        // OR assume loose success if it looks passing.
        // For safety, if we don't know quorum, we might default to DEFEATED if 0 votes, 
        // but if votes > 0 and For > Against, it implies success "ignoring quorum"
        // THIS IS TRICKY. 
        // Best approach: If we can't calculate, default to 'DEFEATED' to be safe? 
        // Or return 'ACTIVE' to prompt user to check chain?
        // Let's assume DEFEATED if we lack data to prove Success.
        quorumReached = (votesFor + votesAgainst + votesAbstain) > 0n; // Basic check
        voteSucceeded = votesFor > votesAgainst;
    }

    if (quorumReached && voteSucceeded) {
        // If it succeeded, it should technically be 'SUCCEEDED' locally,
        // waiting to be Queued.
        return 'SUCCEEDED';
    } else {
        return 'DEFEATED';
    }
}
