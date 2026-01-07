import { useState } from 'react';
import { encodeFunctionData } from 'viem';
import type { ProposalAction } from '../../../types/proposal';

interface UpdateQuorumFormProps {
    onAdd: (action: ProposalAction) => void;
    governorAddress: string;
    currentQuorumNumerator?: number;
}

const GOVERNOR_ABI = [
    {
        type: 'function',
        name: 'updateQuorumNumerator',
        inputs: [{ name: 'newQuorumNumerator', type: 'uint256' }],
        outputs: [],
        stateMutability: 'nonpayable',
    },
] as const;

export function UpdateQuorumForm({
    onAdd,
    governorAddress,
    currentQuorumNumerator,
}: UpdateQuorumFormProps) {
    const [quorumPercent, setQuorumPercent] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const percentNum = parseFloat(quorumPercent);
        if (isNaN(percentNum) || percentNum < 0 || percentNum > 100) {
            setError('Invalid quorum. Must be between 0 and 100.');
            return;
        }

        try {
            // OpenZeppelin uses numerator out of 100, so 1% = numerator of 1
            const numerator = BigInt(Math.floor(percentNum));

            const calldata = encodeFunctionData({
                abi: GOVERNOR_ABI,
                functionName: 'updateQuorumNumerator',
                args: [numerator],
            });

            const action: ProposalAction = {
                target: governorAddress as `0x${string}`,
                value: 0n,
                calldata: calldata as `0x${string}`,
                description: `Update quorum to ${percentNum}% of total supply`,
            };

            onAdd(action);
            setQuorumPercent('');
        } catch (err) {
            setError('Failed to encode action');
            console.error(err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="action-form">
            <div className="form-group">
                <label htmlFor="quorum-percent">New Quorum Percentage</label>
                <input
                    id="quorum-percent"
                    type="number"
                    value={quorumPercent}
                    onChange={(e) => setQuorumPercent(e.target.value)}
                    placeholder="4"
                    className="form-input"
                    min="0"
                    max="100"
                    step="0.1"
                />
                <small className="form-help">
                    Percentage of total supply required for proposal to succeed (0-100%)
                </small>
            </div>

            {currentQuorumNumerator !== undefined && (
                <div className="form-hint">
                    Current quorum: {currentQuorumNumerator}%
                </div>
            )}

            {error && <div className="form-error">{error}</div>}

            <div className="form-info">
                <strong>Note:</strong> Setting quorum too low may allow minority control.
                Setting it too high may prevent proposals from passing.
            </div>

            <button type="submit" className="btn btn-primary">
                Add Action
            </button>
        </form>
    );
}
