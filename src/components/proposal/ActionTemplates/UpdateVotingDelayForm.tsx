import { useState } from 'react';
import { encodeFunctionData } from 'viem';
import type { ProposalAction } from '../../../types/proposal';

interface UpdateVotingDelayFormProps {
    onAdd: (action: ProposalAction) => void;
    governorAddress: string;
    currentVotingDelay?: number;
}

const GOVERNOR_ABI = [
    {
        type: 'function',
        name: 'setVotingDelay',
        inputs: [{ name: 'newVotingDelay', type: 'uint48' }],
        outputs: [],
        stateMutability: 'nonpayable',
    },
] as const;

export function UpdateVotingDelayForm({
    onAdd,
    governorAddress,
    currentVotingDelay,
}: UpdateVotingDelayFormProps) {
    const [votingDelay, setVotingDelay] = useState('');
    const [error, setError] = useState('');

    // Convert seconds to human-readable format
    const formatDelay = (seconds: number) => {
        if (seconds < 60) return `${seconds} seconds`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
        return `${Math.floor(seconds / 86400)} days`;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const delayNum = parseInt(votingDelay);
        if (isNaN(delayNum) || delayNum < 0) {
            setError('Invalid voting delay. Must be a non-negative number.');
            return;
        }

        if (delayNum > 2 ** 48 - 1) {
            setError('Voting delay too large');
            return;
        }

        try {
            const calldata = encodeFunctionData({
                abi: GOVERNOR_ABI,
                functionName: 'setVotingDelay',
                args: [delayNum],
            });

            const action: ProposalAction = {
                target: governorAddress as `0x${string}`,
                value: 0n,
                calldata: calldata as `0x${string}`,
                description: `Update voting delay to ${formatDelay(delayNum)} (${delayNum}s)`,
            };

            onAdd(action);
            setVotingDelay('');
        } catch (err) {
            setError('Failed to encode action');
            console.error(err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="action-form">
            <div className="form-group">
                <label htmlFor="voting-delay">New Voting Delay (seconds)</label>
                <input
                    id="voting-delay"
                    type="number"
                    value={votingDelay}
                    onChange={(e) => setVotingDelay(e.target.value)}
                    placeholder="86400"
                    className="form-input"
                    min="0"
                />
                <small className="form-help">
                    Delay before voting starts after proposal creation
                </small>
            </div>

            {currentVotingDelay !== undefined && (
                <div className="form-hint">
                    Current voting delay: {formatDelay(currentVotingDelay)} ({currentVotingDelay}s)
                </div>
            )}

            {votingDelay && !isNaN(parseInt(votingDelay)) && (
                <div className="form-preview">
                    New delay: {formatDelay(parseInt(votingDelay))}
                </div>
            )}

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="btn btn-primary">
                Add Action
            </button>
        </form>
    );
}
