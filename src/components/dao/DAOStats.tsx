import type { DAO } from 'daocafe-sdk';
import { StatCard } from '../common/StatCard';
import { formatTokenAmount, formatBlocks } from '../../utils/format';

interface DAOStatsProps {
    dao: DAO;
}

export function DAOStats({ dao }: DAOStatsProps) {
    return (
        <div className="stats-grid">
            <StatCard label="Total Supply" value={formatTokenAmount(dao.totalSupply)} gradient />
            <StatCard label="Proposals" value={dao.proposalCount} />
            <StatCard
                label="Voting Delay"
                value={dao.votingDelay ? formatBlocks(dao.votingDelay) : 'N/A'}
            />
            <StatCard
                label="Voting Period"
                value={dao.votingPeriod ? formatBlocks(dao.votingPeriod) : 'N/A'}
            />
            <StatCard
                label="Proposal Threshold"
                value={dao.proposalThreshold ? formatTokenAmount(dao.proposalThreshold) : 'N/A'}
            />
            <StatCard
                label="Quorum"
                value={dao.quorumNumerator ? `${dao.quorumNumerator}%` : 'N/A'}
            />
        </div>
    );
}
