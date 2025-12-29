import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import {
    useTokenHoldingsByAddress,
    useVotesByVoter,
    useDelegationsFrom,
} from 'daocafe-sdk';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { AddressLink } from '../components/common/AddressLink';
import { formatAddress, formatTokenAmount, formatTimeAgo } from '../utils/format';

export function ProfilePage() {
    const { address, isConnected } = useAccount();

    const { data: holdingsData, isLoading: holdingsLoading } = useTokenHoldingsByAddress(
        address || '',
        {},
        { enabled: !!address }
    );
    const { data: votesData, isLoading: votesLoading } = useVotesByVoter(
        address || '',
        { limit: 50 },
        { enabled: !!address }
    );
    const { data: delegationsData, isLoading: delegationsLoading } = useDelegationsFrom(
        address || '',
        {},
        { enabled: !!address }
    );

    if (!isConnected || !address) {
        return (
            <div className="empty-state" style={{ minHeight: '60vh' }}>
                <div className="empty-state-icon">🔗</div>
                <div className="empty-state-title">Connect Your Wallet</div>
                <div className="empty-state-description">
                    Connect your wallet to view your DAO holdings, voting history, and delegations.
                </div>
            </div>
        );
    }

    const holdings = holdingsData?.items || [];
    const votes = votesData?.items || [];
    const delegations = delegationsData?.items || [];

    // Calculate voting stats
    const forVotes = votes.filter((v) => v.support === 'FOR').length;
    const againstVotes = votes.filter((v) => v.support === 'AGAINST').length;
    const abstainVotes = votes.filter((v) => v.support === 'ABSTAIN').length;

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Your Profile</h1>
                <p className="page-subtitle" style={{ fontFamily: 'var(--font-mono)' }}>
                    {formatAddress(address, 6)}
                </p>
            </div>

            {/* Holdings */}
            <section style={{ marginBottom: 'var(--space-8)' }}>
                <div className="section-header">
                    <h2 className="section-title">Token Holdings</h2>
                </div>
                {holdingsLoading ? (
                    <LoadingSpinner size="sm" />
                ) : holdings.length === 0 ? (
                    <div className="card">
                        <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                            <div className="empty-state-icon">💰</div>
                            <div className="empty-state-title">No holdings found</div>
                            <div className="empty-state-description">
                                You don't hold any DAO tokens on indexed chains.
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="table-container card">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>DAO</th>
                                    <th style={{ textAlign: 'right' }}>Balance</th>
                                    <th style={{ textAlign: 'right' }}>Voting Power</th>
                                </tr>
                            </thead>
                            <tbody>
                                {holdings.map((holding) => (
                                    <tr key={holding.id}>
                                        <td>
                                            <Link
                                                to={`/dao/${holding.daoId}`}
                                                style={{ color: 'var(--accent-primary)' }}
                                            >
                                                {holding.daoId.split('_')[1]?.slice(0, 10)}...
                                            </Link>
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                            {formatTokenAmount(holding.balance)}
                                        </td>
                                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                                            {formatTokenAmount(holding.votes)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {/* Voting History */}
            <section style={{ marginBottom: 'var(--space-8)' }}>
                <div className="section-header">
                    <h2 className="section-title">Voting History</h2>
                </div>

                {/* Voting Stats */}
                {votes.length > 0 && (
                    <div className="stats-grid" style={{ marginBottom: 'var(--space-4)' }}>
                        <div className="stat-card">
                            <div className="stat-card-label">Total Votes</div>
                            <div className="stat-card-value">{votes.length}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-label" style={{ color: 'var(--color-for)' }}>For</div>
                            <div className="stat-card-value">{forVotes}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-label" style={{ color: 'var(--color-against)' }}>Against</div>
                            <div className="stat-card-value">{againstVotes}</div>
                        </div>
                        <div className="stat-card">
                            <div className="stat-card-label" style={{ color: 'var(--color-abstain)' }}>Abstain</div>
                            <div className="stat-card-value">{abstainVotes}</div>
                        </div>
                    </div>
                )}

                {votesLoading ? (
                    <LoadingSpinner size="sm" />
                ) : votes.length === 0 ? (
                    <div className="card">
                        <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                            <div className="empty-state-icon">🗳️</div>
                            <div className="empty-state-title">No votes yet</div>
                            <div className="empty-state-description">
                                You haven't voted on any proposals yet.
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="vote-list">
                        {votes.map((vote) => (
                            <div key={vote.id} className="vote-item">
                                <div className={`vote-item-indicator ${vote.support.toLowerCase()}`} />
                                <div className="vote-item-content">
                                    <div className="vote-item-header">
                                        <Link
                                            to={`/proposal/${vote.proposalId}`}
                                            style={{ color: 'var(--text-primary)' }}
                                        >
                                            Proposal #{vote.proposalId.split('_').pop()?.slice(0, 8)}...
                                        </Link>
                                        <span className="vote-item-weight">
                                            {formatTokenAmount(vote.weight)} votes
                                        </span>
                                    </div>
                                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                                        Voted <strong style={{ color: getVoteColor(vote.support) }}>{vote.support}</strong>
                                        {' • '}
                                        {formatTimeAgo(vote.createdAt)}
                                    </div>
                                    {vote.reason && (
                                        <div className="vote-item-reason">"{vote.reason}"</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Delegations */}
            <section>
                <div className="section-header">
                    <h2 className="section-title">Your Delegations</h2>
                </div>
                {delegationsLoading ? (
                    <LoadingSpinner size="sm" />
                ) : delegations.length === 0 ? (
                    <div className="card">
                        <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
                            <div className="empty-state-icon">🤝</div>
                            <div className="empty-state-title">No delegations</div>
                            <div className="empty-state-description">
                                You haven't delegated your voting power to anyone.
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="table-container card">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>DAO Token</th>
                                    <th>Delegated To</th>
                                </tr>
                            </thead>
                            <tbody>
                                {delegations.map((delegation) => (
                                    <tr key={delegation.id}>
                                        <td>
                                            <AddressLink address={delegation.token} chainId={delegation.chainId} />
                                        </td>
                                        <td>
                                            <AddressLink address={delegation.toDelegate} chainId={delegation.chainId} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
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
