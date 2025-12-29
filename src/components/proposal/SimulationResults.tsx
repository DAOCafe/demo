import type { SimulationResult } from '../../types/proposal';

interface SimulationResultsProps {
    results: SimulationResult[];
    isLoading: boolean;
    actionDescriptions: string[];
}

export function SimulationResults({ results, isLoading, actionDescriptions }: SimulationResultsProps) {
    if (isLoading) {
        return (
            <div className="simulation-loading">
                <div className="spinner-animation" />
                <span>Simulating transactions...</span>
            </div>
        );
    }

    if (results.length === 0) {
        return null;
    }

    const allSuccessful = results.every((r) => r.success);
    const totalGas = results.reduce((sum, r) => sum + BigInt(r.gasUsed), 0n);

    return (
        <div className="simulation-results">
            <div className={`simulation-summary ${allSuccessful ? 'success' : 'warning'}`}>
                <div className="summary-icon">{allSuccessful ? '✓' : '⚠'}</div>
                <div className="summary-content">
                    <div className="summary-title">
                        {allSuccessful
                            ? 'All actions simulated successfully'
                            : `${results.filter((r) => !r.success).length} action(s) failed simulation`}
                    </div>
                    <div className="summary-detail">
                        Estimated gas: {totalGas.toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="simulation-details">
                {results.map((result, index) => (
                    <div
                        key={index}
                        className={`simulation-item ${result.success ? 'success' : 'error'}`}
                    >
                        <div className="simulation-item-header">
                            <span className="simulation-item-status">
                                {result.success ? '✓' : '✕'}
                            </span>
                            <span className="simulation-item-title">
                                Action #{index + 1}: {actionDescriptions[index] || 'Unknown action'}
                            </span>
                            <span className="simulation-item-gas">
                                Gas: {parseInt(result.gasUsed).toLocaleString()}
                            </span>
                        </div>

                        {result.error && (
                            <div className="simulation-error">
                                <strong>Error:</strong> {result.error}
                            </div>
                        )}

                        {result.stateChanges.length > 0 && (
                            <div className="state-changes">
                                <div className="state-changes-title">State Changes:</div>
                                <ul className="state-changes-list">
                                    {result.stateChanges.map((change, i) => (
                                        <li key={i} className="state-change-item">
                                            <span className={`change-type change-type-${change.type}`}>
                                                {change.type === 'transfer' && '💸'}
                                                {change.type === 'manager' && '👤'}
                                                {change.type === 'balance' && '💰'}
                                                {change.type === 'storage' && '📦'}
                                            </span>
                                            <span className="change-description">{change.description}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
