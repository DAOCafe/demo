import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    useDAO,
    useProposalsByDAO,
    useVotes,
    useTokenHoldersByDAO,
    useDelegatesByDAO,
} from 'daocafe-sdk';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ChainBadge } from '../components/common/ChainBadge';
import { AddressLink } from '../components/common/AddressLink';
import { DAOStats } from '../components/dao/DAOStats';
import { ProposalCard } from '../components/proposal/ProposalCard';
import { VoteList } from '../components/vote/VoteList';
import { TokenHoldersList } from '../components/holder/TokenHoldersList';
import { DelegationsList } from '../components/delegation/DelegationsList';

type TabType = 'overview' | 'proposals' | 'votes' | 'holders' | 'delegations';

export function DAODetailPage() {
    const { id } = useParams<{ id: string }>();
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    const { data: dao, isLoading: daoLoading, error: daoError } = useDAO(id!);
    const { data: proposalsData, isLoading: proposalsLoading } = useProposalsByDAO(id!, {
        limit: 20,
        orderBy: 'createdAt',
        orderDirection: 'desc',
    });
    const { data: votesData, isLoading: votesLoading } = useVotes({
        daoId: id!,
        limit: 50,
        orderBy: 'createdAt',
        orderDirection: 'desc',
    });
    const { data: holdersData, isLoading: holdersLoading } = useTokenHoldersByDAO(id!, {
        limit: 50,
        orderBy: 'votes',
        orderDirection: 'desc',
    });
    const { data: delegatesData, isLoading: delegatesLoading } = useDelegatesByDAO(id!);

    if (daoLoading) {
        return <LoadingSpinner message="Loading DAO..." />;
    }

    if (daoError || !dao) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <div className="empty-state-title">DAO not found</div>
                <div className="empty-state-description">
                    The requested DAO could not be found.
                </div>
                <Link to="/" className="btn btn-secondary" style={{ marginTop: 'var(--space-4)' }}>
                    Back to DAOs
                </Link>
            </div>
        );
    }

    const tabs: { id: TabType; label: string }[] = [
        { id: 'overview', label: 'Overview' },
        { id: 'proposals', label: `Proposals (${dao.proposalCount})` },
        { id: 'votes', label: 'Votes' },
        { id: 'holders', label: 'Token Holders' },
        { id: 'delegations', label: 'Delegations' },
    ];

    return (
        <div>
            {/* Header */}
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
                    <Link to="/" className="btn btn-ghost" style={{ padding: 'var(--space-1)' }}>
                        ← Back
                    </Link>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                    <div>
                        <h1 className="page-title">{dao.name}</h1>
                        <p className="page-subtitle" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                            <span>${dao.tokenSymbol}</span>
                            <span style={{ color: 'var(--text-muted)' }}>•</span>
                            <AddressLink address={dao.governor} chainId={dao.chainId} />
                        </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <Link to={`/dao/${id}/create-proposal`} className="btn btn-primary">
                            + Create Proposal
                        </Link>
                        <ChainBadge chainId={dao.chainId} />
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div>
                    <div className="section-header">
                        <h2 className="section-title">Governance Settings</h2>
                    </div>
                    <DAOStats dao={dao} />

                    <div style={{ marginTop: 'var(--space-8)' }}>
                        <div className="section-header">
                            <h2 className="section-title">Contract Addresses</h2>
                        </div>
                        <div className="card">
                            <div style={{ display: 'grid', gap: 'var(--space-4)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Governor</span>
                                    <AddressLink address={dao.governor} chainId={dao.chainId} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Token</span>
                                    <AddressLink address={dao.token} chainId={dao.chainId} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: 'var(--text-secondary)' }}>Timelock</span>
                                    <AddressLink address={dao.timelock} chainId={dao.chainId} />
                                </div>
                                {dao.manager && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ color: 'var(--text-secondary)' }}>Manager</span>
                                        <AddressLink address={dao.manager} chainId={dao.chainId} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'proposals' && (
                <div>
                    {proposalsLoading ? (
                        <LoadingSpinner message="Loading proposals..." />
                    ) : proposalsData?.items.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">📜</div>
                            <div className="empty-state-title">No proposals yet</div>
                            <div className="empty-state-description">
                                This DAO hasn't created any proposals yet
                            </div>
                        </div>
                    ) : (
                        <div className="proposal-list">
                            {proposalsData?.items.map((proposal) => (
                                <ProposalCard key={proposal.id} proposal={proposal} />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'votes' && (
                <div>
                    {votesLoading ? (
                        <LoadingSpinner message="Loading votes..." />
                    ) : (
                        <VoteList votes={votesData?.items || []} chainId={dao.chainId} />
                    )}
                </div>
            )}

            {activeTab === 'holders' && (
                <div>
                    {holdersLoading ? (
                        <LoadingSpinner message="Loading token holders..." />
                    ) : (
                        <TokenHoldersList holders={holdersData?.items || []} chainId={dao.chainId} />
                    )}
                </div>
            )}

            {activeTab === 'delegations' && (
                <div>
                    {delegatesLoading ? (
                        <LoadingSpinner message="Loading delegations..." />
                    ) : (
                        <DelegationsList delegations={delegatesData?.items || []} chainId={dao.chainId} />
                    )}
                </div>
            )}
        </div>
    );
}
