import { useState } from 'react';
import { encodeFunctionData, parseUnits } from 'viem';
import type { ProposalAction } from '../../../types/proposal';

interface UpdateProposalThresholdFormProps {
    onAdd: (action: ProposalAction) => void;
    governorAddress: string;
    currentProposalThreshold?: bigint;
    tokenSymbol?: string;
    tokenDecimals?: number;
}

const GOVERNOR_ABI = [
    {
        type: 'function',
        name: 'setProposalThreshold',
        inputs: [{ name: 'newProposalThreshold', type: 'uint256' }],
        outputs: [],
        stateMutability: 'nonpayable',
    },
] as const;

export function UpdateProposalThresholdForm({
    onAdd,
    governorAddress,
    currentProposalThreshold,
    tokenSymbol = 'tokens',
    tokenDecimals = 18,
}: UpdateProposalThresholdFormProps) {
    const [threshold, setThreshold] = useState('');
    const [error, setError] = useState('');

    const formatTokenAmount = (amount: bigint) => {
        const formatted = Number(amount) / 10 ** tokenDecimals;
        return formatted.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!threshold || isNaN(parseFloat(threshold)) || parseFloat(threshold) < 0) {
            setError('Invalid threshold. Must be a non-negative number.');
            return;
        }

        try {
            const thresholdWei = parseUnits(threshold, tokenDecimals);

            const calldata = encodeFunctionData({
                abi: GOVERNOR_ABI,
                functionName: 'setProposalThreshold',
                args: [thresholdWei],
            });

            const action: ProposalAction = {
                target: governorAddress as `0x${string}`,
                value: 0n,
                calldata: calldata as `0x${string}`,
                description: `Update proposal threshold to ${threshold} ${tokenSymbol}`,
            };

            onAdd(action);
            setThreshold('');
        } catch (err) {
            setError('Failed to encode action');
            console.error(err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="action-form">
            <div className="form-group">
                <label htmlFor="proposal-threshold">
                    New Proposal Threshold ({tokenSymbol})
                </label>
                <input
                    id="proposal-threshold"
                    type="text"
                    value={threshold}
                    onChange={(e) => setThreshold(e.target.value)}
                    placeholder="10000"
                    className="form-input"
                />
                <small className="form-help">
                    Minimum tokens required to create a proposal
                </small>
            </div>

            {currentProposalThreshold !== undefined && (
                <div className="form-hint">
                    Current threshold: {formatTokenAmount(currentProposalThreshold)} {tokenSymbol}
                </div>
            )}

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="btn btn-primary">
                Add Action
            </button>
        </form>
    );
}
