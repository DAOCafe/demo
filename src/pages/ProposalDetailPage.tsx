import { useParams, Link } from 'react-router-dom';
import { useProposal, useVotesByProposal, useDAO } from 'daocafe-sdk';
import { useProposalState } from '../hooks/useProposalState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { AddressLink } from '../components/common/AddressLink';
import { ChainBadge } from '../components/common/ChainBadge';
import { ProposalStateBadge } from '../components/proposal/ProposalStateBadge';
import { VoteProgress } from '../components/proposal/VoteProgress';
import { DecodedActionsCard } from '../components/proposal/DecodedActionsCard';
import { VotingChart } from '../components/common/VotingChart';
import { VoteList } from '../components/vote/VoteList';
import { VotingPanel } from '../components/vote/VotingPanel';
import { formatTimeAgo, formatTimeUntil } from '../utils/format';

export function ProposalDetailPage() {
    const { id } = useParams<{ id: string }>();

    const { data: proposal, isLoading: proposalLoading, error: proposalError } = useProposal(id!);
    const { data: votesData, isLoading: votesLoading } = useVotesByProposal(id!);

    // Extract DAO ID from proposal ID (format: chainId_governor_proposalId)
    const daoId = id ? id.split('_').slice(0, 2).join('_') : '';
    const { data: dao } = useDAO(daoId);

    // Use derived state to ensure UI is in sync with time and votes
    // MOVED: This hook call is now before conditional returns to avoid "Rendered more hooks" error
    const effectiveState = useProposalState(proposal, dao) || proposal?.state;

    if (proposalLoading) {
        return <LoadingSpinner message="Loading proposal..." />;
    }

    if (proposalError || !proposal) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <div className="empty-state-title">Proposal not found</div>
                <div className="empty-state-description">
                    The requested proposal could not be found.
                </div>
                <Link to="/" className="btn btn-secondary" style={{ marginTop: 'var(--space-4)' }}>
                    Back to DAOs
                </Link>
            </div>
        );
    }

    // Parse description
    const lines = proposal.description.split('\n');
    const title = lines[0].replace(/^#\s*/, '') || 'Untitled Proposal';
    const description = lines.slice(1).join('\n').trim();

    // effectiveState is guaranteed to be defined here because proposal is defined
    const stateToDisplay = effectiveState || proposal.state;

    const isActive = stateToDisplay === 'ACTIVE';
    const isPending = stateToDisplay === 'PENDING';

    const decodedActions = proposal.decodedActions || [];

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
                    <Link to={`/dao/${proposal.daoId}`} className="btn btn-ghost" style={{ padding: 'var(--space-1)' }}>
                        ← Back to DAO
                    </Link>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                    <div style={{ flex: 1 }}>
                        <h1 className="page-title">{title}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)', flexWrap: 'wrap' }}>
                            <ProposalStateBadge state={stateToDisplay} />
                            <ChainBadge chainId={proposal.chainId} />
                            {isActive && (
                                <span style={{ color: 'var(--color-info)', fontSize: 'var(--text-sm)' }}>
                                    {formatTimeUntil(proposal.voteEnd)}
                                </span>
                            )}
                            {isPending && (
                                <span style={{ color: 'var(--color-warning)', fontSize: 'var(--text-sm)' }}>
                                    Voting starts in {formatTimeUntil(proposal.voteStart).replace(' left', '')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 'var(--space-6)' }}>
                {/* Main Content */}
                <div>
                    {/* Description */}
                    {description && (
                        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                            <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>Description</h2>
                            <div style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                                {description}
                            </div>
                        </div>
                    )}

                    {/* Vote Progress */}
                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>Voting Results</h2>
                        <VoteProgress
                            forVotes={proposal.forVotes}
                            againstVotes={proposal.againstVotes}
                            abstainVotes={proposal.abstainVotes}
                        />
                    </div>

                    {/* Decoded Actions */}
                    <DecodedActionsCard 
                        decodedActions={decodedActions} 
                        chainId={proposal.chainId} 
                    />

                    {/* Votes List */}
                    <div className="card">
                        <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>
                            Votes ({votesData?.items.length || 0})
                        </h2>
                        {votesLoading ? (
                            <LoadingSpinner size="sm" />
                        ) : (
                            <VoteList votes={votesData?.items || []} chainId={proposal.chainId} />
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div>
                    {/* Voting/Execution Panel */}
                    <VotingPanel
                        proposalId={id!}
                        daoId={proposal.daoId}
                        governorAddress={proposal.governor as `0x${string}`}
                        chainId={proposal.chainId}
                        onChainProposalId={proposal.proposalId}
                        proposalState={stateToDisplay}
                        proposal={proposal}
                    />

                    {/* Voting Chart */}
                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <h3 className="section-title" style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>
                            Vote Distribution
                        </h3>
                        <VotingChart
                            forVotes={proposal.forVotes}
                            againstVotes={proposal.againstVotes}
                            abstainVotes={proposal.abstainVotes}
                        />
                    </div>

                    {/* Proposal Info */}
                    <div className="card">
                        <h3 className="section-title" style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>
                            Details
                        </h3>
                        <div style={{ display: 'grid', gap: 'var(--space-3)', fontSize: 'var(--text-sm)' }}>
                            <div>
                                <div style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>Proposer</div>
                                <AddressLink address={proposal.proposer} chainId={proposal.chainId} />
                            </div>
                            {dao && (
                                <div>
                                    <div style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>DAO</div>
                                    <Link to={`/dao/${proposal.daoId}`} style={{ color: 'var(--accent-primary)' }}>
                                        {dao.name}
                                    </Link>
                                </div>
                            )}
                            <div>
                                <div style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>Created</div>
                                <span style={{ color: 'var(--text-secondary)' }}>{formatTimeAgo(proposal.createdAt)}</span>
                            </div>
                            <div>
                                <div style={{ color: 'var(--text-tertiary)', marginBottom: 'var(--space-1)' }}>Transaction</div>
                                <AddressLink address={proposal.transactionHash} chainId={proposal.chainId} type="tx" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
