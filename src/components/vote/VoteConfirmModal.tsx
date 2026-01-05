import { type VoteSupportType } from '../../hooks/useVoting';
import { formatTokenAmount } from '../../utils/format';

interface VoteConfirmModalProps {
    isOpen: boolean;
    support: VoteSupportType | null;
    votingPower: bigint;
    reason: string;
    isVoting: boolean;
    txHash: `0x${string}` | undefined;
    onConfirm: () => void;
    onClose: () => void;
}

export function VoteConfirmModal({
    isOpen,
    support,
    votingPower,
    reason,
    isVoting,
    txHash,
    onConfirm,
    onClose,
}: VoteConfirmModalProps) {
    if (!isOpen || !support) return null;

    const getSupportColor = () => {
        switch (support) {
            case 'FOR':
                return 'var(--color-for)';
            case 'AGAINST':
                return 'var(--color-against)';
            default:
                return 'var(--color-abstain)';
        }
    };

    const getSupportIcon = () => {
        switch (support) {
            case 'FOR':
                return '✓';
            case 'AGAINST':
                return '✗';
            default:
                return '○';
        }
    };

    const getStatusMessage = () => {
        if (txHash) {
            return 'Vote submitted! Waiting for confirmation...';
        }
        if (isVoting) {
            return 'Confirm in your wallet...';
        }
        return null;
    };

    const statusMessage = getStatusMessage();

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content vote-confirm-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Confirm Your Vote</h2>
                    <button className="modal-close" onClick={onClose} disabled={isVoting}>
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    <div className="vote-confirm-summary">
                        <div
                            className="vote-confirm-badge"
                            style={{ backgroundColor: `${getSupportColor()}20`, color: getSupportColor() }}
                        >
                            <span className="vote-confirm-icon">{getSupportIcon()}</span>
                            <span className="vote-confirm-support">{support}</span>
                        </div>

                        <div className="vote-confirm-details">
                            <div className="vote-confirm-row">
                                <span>Voting Power</span>
                                <span className="vote-confirm-value">
                                    {formatTokenAmount(votingPower.toString())} votes
                                </span>
                            </div>
                            {reason && (
                                <div className="vote-confirm-reason">
                                    <span style={{ color: 'var(--text-tertiary)' }}>Reason:</span>
                                    <p>"{reason}"</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {statusMessage && (
                        <div className="vote-confirm-status">
                            <div className="vote-confirm-spinner" />
                            <span>{statusMessage}</span>
                        </div>
                    )}

                    {txHash && (
                        <div className="vote-confirm-success">
                            <span className="vote-confirm-success-icon">🎉</span>
                            <span>Vote successfully submitted!</span>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    {txHash ? (
                        <button className="btn btn-primary" onClick={onClose} style={{ width: '100%' }}>
                            Done
                        </button>
                    ) : (
                        <>
                            <button
                                className="btn btn-ghost"
                                onClick={onClose}
                                disabled={isVoting}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={onConfirm}
                                disabled={isVoting}
                                style={{ backgroundColor: getSupportColor() }}
                            >
                                {isVoting ? 'Submitting...' : 'Submit Vote'}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
