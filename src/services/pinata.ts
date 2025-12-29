// Pinata IPFS service for storing proposal metadata

import type { ProposalMetadata } from '../types/proposal';

// Pinata configuration from environment variables
const PINATA_JWT = import.meta.env.VITE_PINATA_JWT;
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY;

interface PinataUploadResponse {
    IpfsHash: string;
    PinSize: number;
    Timestamp: string;
}

// Vote reason metadata stored on IPFS
export interface VoteReasonMetadata {
    /** Voter address */
    voter: string;
    /** Proposal ID (format: chainId_governor_proposalId) */
    proposalId: string;
    /** DAO ID (format: chainId_governor) */
    daoId: string;
    /** Vote support: FOR, AGAINST, or ABSTAIN */
    support: 'FOR' | 'AGAINST' | 'ABSTAIN';
    /** Full reason text */
    reason: string;
    /** ISO timestamp when vote was cast */
    createdAt: string;
}

/**
 * Upload vote reason metadata to IPFS via Pinata
 * @param metadata - The vote reason metadata to upload
 * @returns The IPFS CID (Content Identifier)
 */
export async function uploadVoteReason(metadata: VoteReasonMetadata): Promise<string> {
    if (!PINATA_JWT) {
        throw new Error('VITE_PINATA_JWT environment variable is not set');
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PINATA_JWT}`,
        },
        body: JSON.stringify({
            pinataContent: metadata,
            pinataMetadata: {
                name: `vote-${metadata.proposalId}-${metadata.voter.slice(0, 8)}`,
                keyvalues: {
                    type: 'vote-reason',
                    proposalId: metadata.proposalId,
                    voter: metadata.voter,
                    support: metadata.support,
                },
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to upload vote reason to IPFS: ${error}`);
    }

    const result: PinataUploadResponse = await response.json();
    return result.IpfsHash;
}

/**
 * Upload proposal metadata to IPFS via Pinata
 * @param metadata - The proposal metadata to upload
 * @returns The IPFS CID (Content Identifier)
 */
export async function uploadProposalMetadata(metadata: ProposalMetadata): Promise<string> {
    if (!PINATA_JWT) {
        throw new Error('VITE_PINATA_JWT environment variable is not set');
    }

    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${PINATA_JWT}`,
        },
        body: JSON.stringify({
            pinataContent: metadata,
            pinataMetadata: {
                name: `proposal-${metadata.dao.id}-${Date.now()}`,
                keyvalues: {
                    daoId: metadata.dao.id,
                    daoName: metadata.dao.name,
                    title: metadata.title.substring(0, 100),
                },
            },
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to upload to IPFS: ${error}`);
    }

    const result: PinataUploadResponse = await response.json();
    return result.IpfsHash;
}

/**
 * Get the gateway URL for an IPFS CID
 * @param cid - The IPFS CID
 * @returns The full gateway URL
 */
export function getIpfsUrl(cid: string): string {
    return `https://${PINATA_GATEWAY}/ipfs/${cid}`;
}

/**
 * Fetch proposal metadata from IPFS
 * @param cid - The IPFS CID
 * @returns The proposal metadata
 */
export async function fetchProposalMetadata(cid: string): Promise<ProposalMetadata> {
    const response = await fetch(getIpfsUrl(cid));

    if (!response.ok) {
        throw new Error(`Failed to fetch from IPFS: ${response.statusText}`);
    }

    return response.json();
}
