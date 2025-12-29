import { Link } from 'react-router-dom';
import { useDAO, type Proposal } from 'daocafe-sdk';
import { useProposalState } from '../../hooks/useProposalState';
import { ProposalStateBadge } from './ProposalStateBadge';
import { VoteProgress } from './VoteProgress';
import { formatTimeUntil } from '../../utils/format';

interface ProposalCardProps {
    proposal: Proposal;
}

export function ProposalCard({ proposal }: ProposalCardProps) {
    // Parse description - often in format "# Title\n\nDescription..."
    const lines = proposal.description.split('\n');
    const title = lines[0].replace(/^#\s*/, '').slice(0, 80) || 'Untitled Proposal';

    // We need DAO data for Quorum calculation in useProposalState
    // This hook is cached so it shouldn't be too expensive for a list
    const { data: dao } = useDAO(proposal.daoId);

    const effectiveState = useProposalState(proposal, dao) || proposal.state;
    const isActive = effectiveState === 'ACTIVE';

    return (
        <Link
            to={`/proposal/${proposal.id}`}
            className="card card-clickable"
            style={{ textDecoration: 'none' }}
        >
            <div className="card-header">
                <div style={{ flex: 1 }}>
                    <h3 className="card-title">{title}{title.length >= 80 ? '...' : ''}</h3>
                    <p className="card-subtitle" style={{ marginTop: 'var(--space-2)' }}>
                        Proposal #{proposal.proposalId.slice(0, 8)}...
                        {isActive && (
                            <span style={{ marginLeft: 'var(--space-2)', color: 'var(--color-info)' }}>
                                • {formatTimeUntil(proposal.voteEnd)}
                            </span>
                        )}
                    </p>
                </div>
                <ProposalStateBadge state={effectiveState} />
            </div>

            <div style={{ marginTop: 'var(--space-4)' }}>
                <VoteProgress
                    votesFor={proposal.votesFor}
                    votesAgainst={proposal.votesAgainst}
                    votesAbstain={proposal.votesAbstain}
                />
            </div>
        </Link>
    );
}
