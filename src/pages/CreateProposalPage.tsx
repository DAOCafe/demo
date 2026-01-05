import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAccount, useReadContract, useWriteContract, useSwitchChain, useWaitForTransactionReceipt } from 'wagmi';
import { useDAO } from 'daocafe-sdk';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ChainBadge } from '../components/common/ChainBadge';
import { MarkdownEditor } from '../components/common/MarkdownEditor';
import { ActionBuilder } from '../components/proposal/ActionBuilder';
import { SimulationResults } from '../components/proposal/SimulationResults';
import { governorAbi, tokenAbi } from '../config/abis';
import { simulateProposalActions } from '../services/simulation';
import type { ProposalAction, ProposalStep, SimulationResult } from '../types/proposal';

type SupportedChainId = 8453 | 11155111;

export function CreateProposalPage() {
    const { id: daoId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { address, chainId: connectedChainId, isConnected } = useAccount();
    const { switchChain } = useSwitchChain();

    // Form state
    const [step, setStep] = useState<ProposalStep>('details');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [actions, setActions] = useState<ProposalAction[]>([]);

    // Simulation state
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
    const [hasSimulated, setHasSimulated] = useState(false);

    // Submission state
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Fetch DAO data
    const { data: dao, isLoading: daoLoading, error: daoError } = useDAO(daoId!);

    // Check if on correct chain
    const daoChainId = dao?.chainId;
    const typedDaoChainId = daoChainId as SupportedChainId | undefined;
    const isCorrectChain = daoChainId === connectedChainId;

    // Fetch user's voting power
    const { data: votingPower } = useReadContract({
        address: dao?.token as `0x${string}`,
        abi: tokenAbi,
        functionName: 'getVotes',
        args: address ? [address] : undefined,
        chainId: typedDaoChainId,
        query: {
            enabled: !!dao?.token && !!address && !!daoChainId,
        },
    });

    // Fetch proposal threshold
    const { data: proposalThreshold } = useReadContract({
        address: dao?.governor as `0x${string}`,
        abi: governorAbi,
        functionName: 'proposalThreshold',
        chainId: typedDaoChainId,
        query: {
            enabled: !!dao?.governor && !!daoChainId,
        },
    });

    // Write contract hook for proposal submission
    const { writeContract, data: txHash, isPending: isSubmitting, error: writeError } = useWriteContract();

    // Wait for transaction confirmation
    const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
        hash: txHash,
    });

    // Redirect after successful submission
    useEffect(() => {
        if (isConfirmed && txHash) {
            // Redirect to DAO page with proposals tab
            navigate(`/dao/${daoId}`, { state: { activeTab: 'proposals' } });
        }
    }, [isConfirmed, txHash, daoId, navigate]);

    const hasEnoughVotingPower =
        votingPower !== undefined &&
        proposalThreshold !== undefined &&
        votingPower >= proposalThreshold;

    const formatVotes = (votes: bigint | undefined): string => {
        if (votes === undefined) return '...';
        const formatted = Number(votes) / 1e18;
        return formatted.toLocaleString(undefined, { maximumFractionDigits: 2 });
    };

    const canProceedToActions = title.trim().length > 0;
    const canProceedToReview = actions.length > 0;
    const canSubmit =
        isConnected &&
        hasEnoughVotingPower &&
        isCorrectChain &&
        title.trim().length > 0 &&
        actions.length > 0 &&
        hasSimulated;

    const handleSwitchChain = async () => {
        if (typedDaoChainId) {
            try {
                switchChain({ chainId: typedDaoChainId });
            } catch (error) {
                console.error('Failed to switch chain:', error);
            }
        }
    };

    const handleSimulate = async () => {
        if (!dao?.timelock || !daoChainId) return;

        setIsSimulating(true);
        setSimulationResults([]);

        try {
            const results = await simulateProposalActions(daoChainId, dao.timelock, actions);
            setSimulationResults(results);
            setHasSimulated(true);
        } catch (error) {
            console.error('Simulation failed:', error);
        } finally {
            setIsSimulating(false);
        }
    };

    const handleSubmit = async () => {
        if (!dao || !address || !typedDaoChainId) return;

        setSubmitError(null);

        try {
            // Build on-chain description
            const onChainDescription = `# ${title}\n\n${description}`;

            // Submit to blockchain
            const targets = actions.map((a) => a.target);
            const values = actions.map((a) => a.value);
            const calldatas = actions.map((a) => a.calldata);

            writeContract({
                address: dao.governor as `0x${string}`,
                abi: governorAbi,
                functionName: 'propose',
                args: [targets, values, calldatas, onChainDescription],
                chainId: typedDaoChainId,
            });

        } catch (error) {
            console.error('Submit failed:', error);
            setSubmitError(error instanceof Error ? error.message : 'Failed to submit proposal');
        }
    };

    if (daoLoading) {
        return <LoadingSpinner message="Loading DAO..." />;
    }

    if (daoError || !dao) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">⚠️</div>
                <div className="empty-state-title">DAO not found</div>
                <div className="empty-state-description">
                    The requested DAO could not be found.
                </div>
                <Link to="/" className="btn btn-secondary" style={{ marginTop: 'var(--space-4)' }}>
                    Back to DAOs
                </Link>
            </div>
        );
    }

    return (
        <div className="create-proposal-page">
            {/* Header */}
            <div className="page-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-2)' }}>
                    <Link to={`/dao/${daoId}`} className="btn btn-ghost" style={{ padding: 'var(--space-1)' }}>
                        ← Back to {dao.name}
                    </Link>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-4)' }}>
                    <div>
                        <h1 className="page-title">Create Proposal</h1>
                        <p className="page-subtitle" style={{ marginTop: 'var(--space-2)' }}>
                            {dao.name}
                        </p>
                    </div>
                    <ChainBadge chainId={dao.chainId} />
                </div>
            </div>

            {/* Voting Power Check */}
            <div className="voting-power-card">
                <div className="voting-power-info">
                    <div className="voting-power-item">
                        <span className="voting-power-label">Your Voting Power</span>
                        <span className={`voting-power-value ${hasEnoughVotingPower ? 'sufficient' : 'insufficient'}`}>
                            {formatVotes(votingPower)} {dao.tokenSymbol}
                        </span>
                    </div>
                    <div className="voting-power-divider" />
                    <div className="voting-power-item">
                        <span className="voting-power-label">Required to Propose</span>
                        <span className="voting-power-value">
                            {formatVotes(proposalThreshold)} {dao.tokenSymbol}
                        </span>
                    </div>
                </div>
                {!isConnected && (
                    <div className="voting-power-warning">
                        ⚠️ Please connect your wallet to create a proposal
                    </div>
                )}
                {isConnected && !hasEnoughVotingPower && votingPower !== undefined && (
                    <div className="voting-power-warning">
                        ⚠️ You don't have enough voting power to create a proposal
                    </div>
                )}
                {isConnected && !isCorrectChain && (
                    <div className="voting-power-warning">
                        ⚠️ Please switch to the correct network
                        <button className="btn btn-primary btn-sm" onClick={handleSwitchChain} style={{ marginLeft: 'var(--space-3)' }}>
                            Switch Network
                        </button>
                    </div>
                )}
            </div>

            {/* Step Indicators */}
            <div className="step-indicators">
                <button
                    className={`step-indicator ${step === 'details' ? 'active' : ''} ${canProceedToActions ? 'completed' : ''}`}
                    onClick={() => setStep('details')}
                >
                    <span className="step-number">1</span>
                    <span className="step-label">Details</span>
                </button>
                <div className="step-line" />
                <button
                    className={`step-indicator ${step === 'actions' ? 'active' : ''} ${canProceedToReview ? 'completed' : ''}`}
                    onClick={() => canProceedToActions && setStep('actions')}
                    disabled={!canProceedToActions}
                >
                    <span className="step-number">2</span>
                    <span className="step-label">Actions</span>
                </button>
                <div className="step-line" />
                <button
                    className={`step-indicator ${step === 'review' ? 'active' : ''}`}
                    onClick={() => canProceedToReview && setStep('review')}
                    disabled={!canProceedToReview}
                >
                    <span className="step-number">3</span>
                    <span className="step-label">Review & Submit</span>
                </button>
            </div>

            {/* Step Content */}
            <div className="step-content">
                {step === 'details' && (
                    <div className="step-details">
                        <div className="form-group">
                            <label htmlFor="proposal-title">Proposal Title</label>
                            <input
                                id="proposal-title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter a clear, concise title for your proposal"
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label>Description</label>
                            <MarkdownEditor
                                value={description}
                                onChange={setDescription}
                                placeholder="Describe your proposal in detail. You can use Markdown formatting."
                            />
                        </div>

                        <div className="step-actions">
                            <button
                                className="btn btn-primary"
                                onClick={() => setStep('actions')}
                                disabled={!canProceedToActions}
                            >
                                Continue to Actions →
                            </button>
                        </div>
                    </div>
                )}

                {step === 'actions' && (
                    <div className="step-actions-content">
                        <ActionBuilder
                            actions={actions}
                            onAddAction={(action) => {
                                setActions([...actions, action]);
                                setHasSimulated(false);
                            }}
                            onRemoveAction={(index) => {
                                setActions(actions.filter((_, i) => i !== index));
                                setHasSimulated(false);
                            }}
                            governorAddress={dao.governor}
                            timelockAddress={dao.timelock}
                            currentManager={dao.manager}
                            chainId={dao.chainId}
                        />

                        <div className="step-actions">
                            <button className="btn btn-secondary" onClick={() => setStep('details')}>
                                ← Back
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => setStep('review')}
                                disabled={!canProceedToReview}
                            >
                                Continue to Review →
                            </button>
                        </div>
                    </div>
                )}

                {step === 'review' && (
                    <div className="step-review">
                        {/* Proposal Summary */}
                        <div className="review-section">
                            <h3 className="review-section-title">Proposal Summary</h3>
                            <div className="review-card">
                                <div className="review-field">
                                    <span className="review-label">Title</span>
                                    <span className="review-value">{title}</span>
                                </div>
                                {description && (
                                    <div className="review-field">
                                        <span className="review-label">Description</span>
                                        <div className="review-description">{description.substring(0, 200)}{description.length > 200 ? '...' : ''}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions Summary */}
                        <div className="review-section">
                            <h3 className="review-section-title">Actions ({actions.length})</h3>
                            <div className="review-actions">
                                {actions.map((action, i) => (
                                    <div key={i} className="review-action-item">
                                        <span className="review-action-number">#{i + 1}</span>
                                        <span className="review-action-description">{action.description}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Simulation */}
                        <div className="review-section">
                            <h3 className="review-section-title">Simulation</h3>
                            {!hasSimulated ? (
                                <div className="simulation-prompt">
                                    <p>Simulate your proposal actions to check for potential issues before submitting.</p>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={handleSimulate}
                                        disabled={isSimulating}
                                    >
                                        {isSimulating ? 'Simulating...' : '🔬 Run Simulation'}
                                    </button>
                                </div>
                            ) : (
                                <SimulationResults
                                    results={simulationResults}
                                    isLoading={isSimulating}
                                    actionDescriptions={actions.map((a) => a.description)}
                                />
                            )}
                        </div>

                        {/* Submit Section */}
                        <div className="review-section submit-section">
                        {submitError && (
                            <div className="submit-error">
                                <strong>Error:</strong> {submitError}
                            </div>
                        )}

                        {writeError && (
                                <div className="submit-error">
                                    <strong>Transaction Error:</strong> {writeError.message}
                                </div>
                            )}

                            {isConfirming && (
                                <div className="submit-pending">
                                    <div className="spinner-animation" />
                                    <span>Waiting for confirmation...</span>
                                </div>
                            )}

                            <div className="step-actions">
                                <button className="btn btn-secondary" onClick={() => setStep('actions')}>
                                    ← Back
                                </button>
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={handleSubmit}
                                    disabled={!canSubmit || isSubmitting || isConfirming}
                                >
                                    {isSubmitting
                                        ? 'Confirm in Wallet...'
                                        : isConfirming
                                            ? 'Confirming...'
                                            : '🚀 Submit Proposal'}
                                </button>
                            </div>

                            {!hasSimulated && canProceedToReview && (
                                <div className="submit-hint">
                                    Run simulation before submitting to check for potential issues
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
