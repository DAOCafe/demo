import { useDAOs } from 'daocafe-sdk';
import { DAOCard } from '../components/dao/DAOCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function DAOListPage() {
    const { data, isLoading, error } = useDAOs({
        limit: 50,
        orderBy: 'proposalCount',
        orderDirection: 'desc',
    });

    if (isLoading) {
        return <LoadingSpinner message="Loading DAOs..." />;
    }

    if (error) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <div className="empty-state-title">Error loading DAOs</div>
                <div className="empty-state-description">{error.message}</div>
            </div>
        );
    }

    const daos = data?.items || [];

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">Explore DAOs</h1>
                <p className="page-subtitle">
                    Browse governance organizations built with CreateDAO on Base & Sepolia
                </p>
            </div>

            {daos.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state-icon">🏛️</div>
                    <div className="empty-state-title">No DAOs found</div>
                    <div className="empty-state-description">
                        No DAOs have been indexed yet. Check back later!
                    </div>
                </div>
            ) : (
                <div className="dao-grid">
                    {daos.map((dao) => (
                        <DAOCard key={dao.id} dao={dao} />
                    ))}
                </div>
            )}
        </div>
    );
}
