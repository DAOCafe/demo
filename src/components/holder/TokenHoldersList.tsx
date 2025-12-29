import type { TokenHolder } from 'daocafe-sdk';
import { AddressLink } from '../common/AddressLink';
import { formatTokenAmount } from '../../utils/format';

interface TokenHoldersListProps {
    holders: TokenHolder[];
    chainId: number;
}

export function TokenHoldersList({ holders, chainId }: TokenHoldersListProps) {
    if (holders.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <div className="empty-state-title">No token holders</div>
                <div className="empty-state-description">
                    No token holders have been indexed yet
                </div>
            </div>
        );
    }

    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Holder</th>
                        <th style={{ textAlign: 'right' }}>Balance</th>
                        <th style={{ textAlign: 'right' }}>Voting Power</th>
                    </tr>
                </thead>
                <tbody>
                    {holders.map((holder, index) => (
                        <tr key={holder.id}>
                            <td style={{ color: 'var(--text-tertiary)' }}>#{index + 1}</td>
                            <td>
                                <AddressLink address={holder.holder} chainId={chainId} />
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                {formatTokenAmount(holder.balance)}
                            </td>
                            <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                                {formatTokenAmount(holder.votes)}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
