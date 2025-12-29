import { useEffect } from 'react';
import type { ExecutionAction } from '../../hooks/useProposalExecution';

interface ExecuteConfirmModalProps {
    isOpen: boolean;
    action: ExecutionAction | null;
    proposalTitle: string;
    isPending: boolean;
    isConfirming: boolean;
    txHash: `0x${string}` | undefined;
    chainId: number;
    onConfirm: () => void;
    onClose: () => void;
}

const ACTION_CONFIG = {
    queue: {
        title: 'Queue Proposal',
        description: 'Queue this proposal for execution after the timelock delay.',
        buttonText: 'Queue Proposal',
        icon: '📋',
        color: 'var(--color-info)',
    },
    execute: {
        title: 'Execute Proposal',
        description: 'Execute this proposal and apply its changes on-chain.',
        buttonText: 'Execute Proposal',
        icon: '🚀',
        color: 'var(--color-success)',
    },
    cancel: {
        title: 'Cancel Proposal',
        description: 'Cancel this proposal. This action cannot be undone.',
        buttonText: 'Cancel Proposal',
        icon: '❌',
        color: 'var(--color-error)',
    },
};

function getExplorerUrl(chainId: number, txHash: string): string {
    if (chainId === 8453) {
        return `https://basescan.org/tx/${txHash}`;
    }
    return `https://sepolia.etherscan.io/tx/${txHash}`;
}

export function ExecuteConfirmModal({
    isOpen,
    action,
    proposalTitle,
    isPending,
    isConfirming,
    txHash,
    chainId,
    onConfirm,
    onClose,
}: ExecuteConfirmModalProps) {
    // Close modal on escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !isPending && !isConfirming) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [isPending, isConfirming, onClose]);

    if (!isOpen || !action) return null;

    const config = ACTION_CONFIG[action];
    const isProcessing = isPending || isConfirming;
    const isSuccess = txHash && !isConfirming;

    return (
        <div className="modal-overlay" onClick={!isProcessing ? onClose : undefined}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <span style={{ fontSize: 'var(--text-2xl)' }}>{config.icon}</span>
                    <h2 className="modal-title">{config.title}</h2>
                </div>

                <div className="modal-body">
                    {!txHash ? (
                        <>
                            <p className="modal-description">{config.description}</p>
                            <div className="modal-proposal-info">
                                <span style={{ color: 'var(--text-tertiary)' }}>Proposal:</span>
                                <span style={{ fontWeight: 500 }}>{proposalTitle}</span>
                            </div>
                        </>
                    ) : (
                        <div className="modal-success">
                            {isConfirming ? (
                                <>
                                    <div className="modal-spinner" />
                                    <p>Waiting for confirmation...</p>
                                </>
                            ) : (
                                <>
                                    <span className="modal-success-icon">✓</span>
                                    <p>Transaction submitted successfully!</p>
                                </>
                            )}
                            <a
                                href={getExplorerUrl(chainId, txHash)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="modal-tx-link"
                            >
                                View on Explorer →
                            </a>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    {!txHash ? (
                        <>
                            <button
                                className="btn btn-ghost"
                                onClick={onClose}
                                disabled={isProcessing}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn"
                                onClick={onConfirm}
                                disabled={isProcessing}
                                style={{
                                    backgroundColor: config.color,
                                    color: 'white',
                                }}
                            >
                                {isPending ? 'Confirm in Wallet...' : config.buttonText}
                            </button>
                        </>
                    ) : (
                        <button className="btn btn-primary" onClick={onClose}>
                            {isSuccess ? 'Done' : 'Close'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
