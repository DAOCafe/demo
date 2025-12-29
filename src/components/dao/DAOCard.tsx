import { Link } from 'react-router-dom';
import type { DAO } from 'daocafe-sdk';
import { ChainBadge } from '../common/ChainBadge';
import { formatTokenAmount, formatSeconds } from '../../utils/format';

interface DAOCardProps {
    dao: DAO;
}

export function DAOCard({ dao }: DAOCardProps) {
    return (
        <Link to={`/dao/${dao.id}`} className="card card-clickable" style={{ textDecoration: 'none' }}>
            <div className="card-header">
                <div>
                    <h3 className="card-title">{dao.name}</h3>
                    <p className="card-subtitle">${dao.tokenSymbol}</p>
                </div>
                <ChainBadge chainId={dao.chainId} />
            </div>

            <div className="stats-grid" style={{ marginTop: 'var(--space-4)' }}>
                <div className="stat-card">
                    <div className="stat-card-label">Proposals</div>
                    <div className="stat-card-value">{dao.proposalCount}</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-label">Total Supply</div>
                    <div className="stat-card-value">{formatTokenAmount(dao.totalSupply)}</div>
                </div>
            </div>

            {dao.votingPeriod && (
                <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                    <span>Voting Period: {formatSeconds(dao.votingPeriod)}</span>
                </div>
            )}
        </Link>
    );
}
