import { useState, useEffect } from 'react';
import { useAccount, useConnect } from 'wagmi';
import { useVoting, type VoteSupportType } from '../../hooks/useVoting';
import { useProposalExecution, type ExecutionAction } from '../../hooks/useProposalExecution';
import { VoteConfirmModal } from './VoteConfirmModal';
import { ExecuteConfirmModal } from './ExecuteConfirmModal';
import { formatTokenAmount } from '../../utils/format';
import type { Proposal } from 'daocafe-sdk';

interface VotingPanelProps {
    proposalId: string;
    daoId: string;
    governorAddress: `0x${string}`;
    chainId: number;
    onChainProposalId: string;
    proposalState: string;
    proposal?: Proposal;
}

// States where this panel should be visible
const VISIBLE_STATES = ['ACTIVE', 'SUCCEEDED', 'QUEUED', 'PENDING'];

/**
 * Format seconds to human readable time
 */
function formatTimeRemaining(seconds: number): string {
    if (seconds <= 0) return 'Ready now';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 24) {
        const days = Math.floor(hours / 24);
        const remainingHours = hours % 24;
        return `${days}d ${remainingHours}h`;
    }
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
}

export function VotingPanel({
    proposalId,
    daoId,
    governorAddress,
    chainId,
    onChainProposalId,
    proposalState,
    proposal,
}: VotingPanelProps) {
    const { isConnected, address } = useAccount();
    const { connectors, connect } = useConnect();
    const [selectedSupport, setSelectedSupport] = useState<VoteSupportType | null>(null);
    const [reason, setReason] = useState('');
    const [showReasonInput, setShowReasonInput] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showExecuteModal, setShowExecuteModal] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);

    // Voting hook
    const {
        votingPower,
        userVote,
        isLoading,
        isVoting,
        isUploadingReason,
        txHash: voteTxHash,
        vote,
        reset: resetVote,
    } = useVoting(proposalId, daoId, governorAddress, chainId, onChainProposalId);

    // Execution hook
    const {
        isPending: isExecutionPending,
        isConfirming: isExecutionConfirming,
        txHash: executionTxHash,
        currentAction,
        queueProposal,
        executeProposal,
        cancelProposal,
        reset: resetExecution,
    } = useProposalExecution(proposal, proposalState, governorAddress, chainId);

    // Update time remaining countdown
    useEffect(() => {
        if (proposalState !== 'QUEUED' || !proposal?.eta) return;

        const updateTime = () => {
            const now = Math.floor(Date.now() / 1000);
            const eta = Number(proposal.eta);
            setTimeRemaining(Math.max(0, eta - now));
        };

        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [proposalState, proposal?.eta]);

    // Check if user is proposer (for cancel button)
    const isProposer = address && proposal?.proposer.toLowerCase() === address.toLowerCase();

    // Don't show panel for terminal states
    if (!VISIBLE_STATES.includes(proposalState)) {
        return null;
    }

    const handleVoteClick = (support: VoteSupportType) => {
        setSelectedSupport(support);
        setShowConfirmModal(true);
    };

    const handleConfirmVote = async () => {
        if (!selectedSupport) return;
        await vote(selectedSupport, reason.trim() || undefined);
    };

    const handleCloseVoteModal = () => {
        setShowConfirmModal(false);
        setSelectedSupport(null);
        if (voteTxHash) {
            setReason('');
            setShowReasonInput(false);
            resetVote();
        }
    };

    const handleExecutionAction = (action: ExecutionAction) => {
        setShowExecuteModal(true);
        if (action === 'queue') {
            queueProposal();
        } else if (action === 'execute') {
            executeProposal();
        } else if (action === 'cancel') {
            cancelProposal();
        }
    };

    const handleCloseExecuteModal = () => {
        setShowExecuteModal(false);
        if (executionTxHash) {
            resetExecution();
        }
    };

    // Get proposal title for modal
    const proposalTitle = proposal?.description.split('\n')[0].replace(/^#\s*/, '') || 'Proposal';

    // ========================================
    // NOT CONNECTED STATE
    // ========================================
    if (!isConnected) {
        return (
            <div className="card voting-panel">
                <h3 className="section-title" style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>
                    {proposalState === 'ACTIVE' ? 'Cast Your Vote' : 'Proposal Actions'}
                </h3>
                <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
                    Connect your wallet to interact with this proposal
                </p>
                <button
                    className="btn btn-primary"
                    onClick={() => connect({ connector: connectors[0] })}
                    style={{ width: '100%' }}
                >
                    Connect Wallet
                </button>
            </div>
        );
    }

    // ========================================
    // SUCCEEDED STATE - QUEUE BUTTON
    // ========================================
    if (proposalState === 'SUCCEEDED') {
        return (
            <>
                <div className="card voting-panel">
                    <div className="execution-status succeeded">
                        <span className="execution-icon">✅</span>
                        <h3 className="section-title" style={{ margin: 0, fontSize: 'var(--text-base)' }}>
                            Proposal Passed
                        </h3>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                        This proposal passed voting and is ready to be queued for execution.
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => handleExecutionAction('queue')}
                        disabled={isExecutionPending || isExecutionConfirming}
                        style={{ width: '100%' }}
                    >
                        📋 Queue for Execution
                    </button>

                    {isProposer && (
                        <button
                            className="btn btn-ghost"
                            onClick={() => handleExecutionAction('cancel')}
                            disabled={isExecutionPending || isExecutionConfirming}
                            style={{ width: '100%', marginTop: 'var(--space-2)', color: 'var(--color-error)' }}
                        >
                            Cancel Proposal
                        </button>
                    )}
                </div>

                <ExecuteConfirmModal
                    isOpen={showExecuteModal}
                    action={currentAction}
                    proposalTitle={proposalTitle}
                    isPending={isExecutionPending}
                    isConfirming={isExecutionConfirming}
                    txHash={executionTxHash}
                    chainId={chainId}
                    onConfirm={() => { }} // Already triggered
                    onClose={handleCloseExecuteModal}
                />
            </>
        );
    }

    // ========================================
    // QUEUED STATE - EXECUTE BUTTON
    // ========================================
    if (proposalState === 'QUEUED') {
        const isReady = timeRemaining <= 0;

        return (
            <>
                <div className="card voting-panel">
                    <div className="execution-status queued">
                        <span className="execution-icon">⏳</span>
                        <h3 className="section-title" style={{ margin: 0, fontSize: 'var(--text-base)' }}>
                            Queued for Execution
                        </h3>
                    </div>

                    {!isReady ? (
                        <div className="timelock-countdown">
                            <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
                                Ready to execute in
                            </span>
                            <span className="countdown-time">
                                {formatTimeRemaining(timeRemaining)}
                            </span>
                        </div>
                    ) : (
                        <p style={{ color: 'var(--color-success)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                            ✨ Timelock delay passed. Ready to execute!
                        </p>
                    )}

                    <button
                        className="btn btn-success"
                        onClick={() => handleExecutionAction('execute')}
                        disabled={!isReady || isExecutionPending || isExecutionConfirming}
                        style={{
                            width: '100%',
                            backgroundColor: isReady ? 'var(--color-success)' : 'var(--bg-tertiary)',
                            cursor: isReady ? 'pointer' : 'not-allowed'
                        }}
                    >
                        🚀 Execute Proposal
                    </button>

                    {isProposer && (
                        <button
                            className="btn btn-ghost"
                            onClick={() => handleExecutionAction('cancel')}
                            disabled={isExecutionPending || isExecutionConfirming}
                            style={{ width: '100%', marginTop: 'var(--space-2)', color: 'var(--color-error)' }}
                        >
                            Cancel Proposal
                        </button>
                    )}
                </div>

                <ExecuteConfirmModal
                    isOpen={showExecuteModal}
                    action={currentAction}
                    proposalTitle={proposalTitle}
                    isPending={isExecutionPending}
                    isConfirming={isExecutionConfirming}
                    txHash={executionTxHash}
                    chainId={chainId}
                    onConfirm={() => { }}
                    onClose={handleCloseExecuteModal}
                />
            </>
        );
    }

    // ========================================
    // PENDING STATE - SHOW INFO
    // ========================================
    if (proposalState === 'PENDING') {
        return (
            <div className="card voting-panel">
                <div className="execution-status pending">
                    <span className="execution-icon">⏰</span>
                    <h3 className="section-title" style={{ margin: 0, fontSize: 'var(--text-base)' }}>
                        Voting Not Started
                    </h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                    This proposal is waiting for the voting delay to pass.
                </p>

                {isProposer && (
                    <button
                        className="btn btn-ghost"
                        onClick={() => handleExecutionAction('cancel')}
                        disabled={isExecutionPending || isExecutionConfirming}
                        style={{ width: '100%', color: 'var(--color-error)' }}
                    >
                        Cancel Proposal
                    </button>
                )}

                <ExecuteConfirmModal
                    isOpen={showExecuteModal}
                    action={currentAction}
                    proposalTitle={proposalTitle}
                    isPending={isExecutionPending}
                    isConfirming={isExecutionConfirming}
                    txHash={executionTxHash}
                    chainId={chainId}
                    onConfirm={() => { }}
                    onClose={handleCloseExecuteModal}
                />
            </div>
        );
    }

    // ========================================
    // ACTIVE STATE - VOTING UI (original logic below)
    // ========================================

    // Loading state
    if (isLoading) {
        return (
            <div className="card voting-panel">
                <h3 className="section-title" style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>
                    Cast Your Vote
                </h3>
                <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-tertiary)' }}>
                    Loading voting power...
                </div>
            </div>
        );
    }

    // Already voted state
    if (userVote) {
        return (
            <div className="card voting-panel">
                <h3 className="section-title" style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>
                    Your Vote
                </h3>
                <div className="user-vote-display">
                    <div className={`user-vote-badge ${userVote.support.toLowerCase()}`}>
                        {userVote.support === 'FOR' && '✓'}
                        {userVote.support === 'AGAINST' && '✗'}
                        {userVote.support === 'ABSTAIN' && '○'}
                        <span>{userVote.support}</span>
                    </div>
                    <div className="user-vote-details">
                        <span className="user-vote-weight">
                            {formatTokenAmount(userVote.weight)} votes
                        </span>
                        {userVote.reason && (
                            <p className="user-vote-reason">"{userVote.reason}"</p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // No voting power state
    if (votingPower === BigInt(0)) {
        return (
            <div className="card voting-panel">
                <h3 className="section-title" style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>
                    Cast Your Vote
                </h3>
                <div className="voting-no-power">
                    <span className="voting-no-power-icon">⚠️</span>
                    <p>You don't have voting power for this proposal.</p>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        You need to hold and delegate tokens before the proposal snapshot.
                    </p>
                </div>
            </div>
        );
    }

    // Can vote state
    return (
        <>
            <div className="card voting-panel">
                <h3 className="section-title" style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--text-base)' }}>
                    Cast Your Vote
                </h3>

                <div className="voting-power-display">
                    <span style={{ color: 'var(--text-tertiary)' }}>Your voting power:</span>
                    <span className="voting-power-value">{formatTokenAmount(votingPower.toString())}</span>
                </div>

                <div className="vote-buttons">
                    <button
                        className="vote-button for"
                        onClick={() => handleVoteClick('FOR')}
                        disabled={isVoting}
                    >
                        <span className="vote-button-icon">✓</span>
                        <span>For</span>
                    </button>
                    <button
                        className="vote-button against"
                        onClick={() => handleVoteClick('AGAINST')}
                        disabled={isVoting}
                    >
                        <span className="vote-button-icon">✗</span>
                        <span>Against</span>
                    </button>
                    <button
                        className="vote-button abstain"
                        onClick={() => handleVoteClick('ABSTAIN')}
                        disabled={isVoting}
                    >
                        <span className="vote-button-icon">○</span>
                        <span>Abstain</span>
                    </button>
                </div>

                {!showReasonInput ? (
                    <button
                        className="btn btn-ghost add-reason-btn"
                        onClick={() => setShowReasonInput(true)}
                    >
                        + Add a reason (optional)
                    </button>
                ) : (
                    <div className="vote-reason-container">
                        <textarea
                            className="vote-reason-input"
                            placeholder="Why are you voting this way? (stored on IPFS)"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                        />
                        <button
                            className="btn btn-ghost"
                            onClick={() => {
                                setShowReasonInput(false);
                                setReason('');
                            }}
                            style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)' }}
                        >
                            Remove reason
                        </button>
                    </div>
                )}
            </div>

            <VoteConfirmModal
                isOpen={showConfirmModal}
                support={selectedSupport}
                votingPower={votingPower}
                reason={reason}
                isVoting={isVoting}
                isUploadingReason={isUploadingReason}
                txHash={voteTxHash}
                onConfirm={handleConfirmVote}
                onClose={handleCloseVoteModal}
            />
        </>
    );
}
