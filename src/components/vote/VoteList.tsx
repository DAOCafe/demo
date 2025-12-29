import type { Vote } from 'daocafe-sdk';
import { AddressLink } from '../common/AddressLink';
import { formatTokenAmount } from '../../utils/format';

interface VoteListProps {
    votes: Vote[];
    chainId: number;
}

export function VoteList({ votes, chainId }: VoteListProps) {
    if (votes.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">🗳️</div>
                <div className="empty-state-title">No votes yet</div>
                <div className="empty-state-description">
                    Be the first to cast a vote on this proposal
                </div>
            </div>
        );
    }

    return (
        <div className="vote-list">
            {votes.map((vote) => (
                <div key={vote.id} className="vote-item">
                    <div
                        className={`vote-item-indicator ${vote.support.toLowerCase()}`}
                    />
                    <div className="vote-item-content">
                        <div className="vote-item-header">
                            <AddressLink address={vote.voter} chainId={chainId} />
                            <span className="vote-item-weight">
                                {formatTokenAmount(vote.weight)} votes
                            </span>
                        </div>
                        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                            Voted <strong style={{ color: getVoteColor(vote.support) }}>{vote.support}</strong>
                        </div>
                        {vote.reason && (
                            <div className="vote-item-reason">"{vote.reason}"</div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}

function getVoteColor(support: string): string {
    switch (support) {
        case 'FOR':
            return 'var(--color-for)';
        case 'AGAINST':
            return 'var(--color-against)';
        default:
            return 'var(--color-abstain)';
    }
}
