import type { ProposalState } from 'daocafe-sdk';

interface ProposalStateBadgeProps {
    state: ProposalState;
}

const stateStyles: Record<ProposalState, string> = {
    PENDING: 'badge-pending',
    ACTIVE: 'badge-active',
    CANCELED: 'badge-canceled',
    DEFEATED: 'badge-defeated',
    SUCCEEDED: 'badge-succeeded',
    QUEUED: 'badge-queued',
    EXPIRED: 'badge-expired',
    EXECUTED: 'badge-executed',
};

export function ProposalStateBadge({ state }: ProposalStateBadgeProps) {
    return (
        <span className={`badge badge-state ${stateStyles[state]}`}>
            {state}
        </span>
    );
}
