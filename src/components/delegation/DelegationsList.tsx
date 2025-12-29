import type { Delegate } from 'daocafe-sdk';
import { AddressLink } from '../common/AddressLink';

interface DelegationsListProps {
    delegations: Delegate[];
    chainId: number;
}

export function DelegationsList({ delegations, chainId }: DelegationsListProps) {
    if (delegations.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">🤝</div>
                <div className="empty-state-title">No delegations</div>
                <div className="empty-state-description">
                    No delegations have been made in this DAO yet
                </div>
            </div>
        );
    }

    return (
        <div className="table-container">
            <table className="table">
                <thead>
                    <tr>
                        <th>Delegator</th>
                        <th>Delegate</th>
                    </tr>
                </thead>
                <tbody>
                    {delegations.map((delegation) => (
                        <tr key={delegation.id}>
                            <td>
                                <AddressLink address={delegation.delegator} chainId={chainId} />
                            </td>
                            <td>
                                <AddressLink address={delegation.toDelegate} chainId={chainId} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
