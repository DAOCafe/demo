import { useState } from 'react';
import { encodeFunctionData } from 'viem';
import type { ProposalAction } from '../../../types/proposal';

interface UpdateVotingPeriodFormProps {
    onAdd: (action: ProposalAction) => void;
    governorAddress: string;
    currentVotingPeriod?: number;
}

const GOVERNOR_ABI = [
    {
        type: 'function',
        name: 'setVotingPeriod',
        inputs: [{ name: 'newVotingPeriod', type: 'uint32' }],
        outputs: [],
        stateMutability: 'nonpayable',
    },
] as const;

export function UpdateVotingPeriodForm({
    onAdd,
    governorAddress,
    currentVotingPeriod,
}: UpdateVotingPeriodFormProps) {
    const [votingPeriod, setVotingPeriod] = useState('');
    const [error, setError] = useState('');

    // Convert seconds to human-readable format
    const formatPeriod = (seconds: number) => {
        if (seconds < 60) return `${seconds} seconds`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours`;
        return `${Math.floor(seconds / 86400)} days`;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const periodNum = parseInt(votingPeriod);
        if (isNaN(periodNum) || periodNum <= 0) {
            setError('Invalid voting period. Must be a positive number.');
            return;
        }

        if (periodNum > 2 ** 32 - 1) {
            setError('Voting period too large');
            return;
        }

        try {
            const calldata = encodeFunctionData({
                abi: GOVERNOR_ABI,
                functionName: 'setVotingPeriod',
                args: [periodNum],
            });

            const action: ProposalAction = {
                target: governorAddress as `0x${string}`,
                value: 0n,
                calldata: calldata as `0x${string}`,
                description: `Update voting period to ${formatPeriod(periodNum)} (${periodNum}s)`,
            };

            onAdd(action);
            setVotingPeriod('');
        } catch (err) {
            setError('Failed to encode action');
            console.error(err);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="action-form">
            <div className="form-group">
                <label htmlFor="voting-period">New Voting Period (seconds)</label>
                <input
                    id="voting-period"
                    type="number"
                    value={votingPeriod}
                    onChange={(e) => setVotingPeriod(e.target.value)}
                    placeholder="604800"
                    className="form-input"
                    min="1"
                />
                <small className="form-help">
                    Duration of the voting period once voting begins
                </small>
            </div>

            {currentVotingPeriod !== undefined && (
                <div className="form-hint">
                    Current voting period: {formatPeriod(currentVotingPeriod)} ({currentVotingPeriod}s)
                </div>
            )}

            {votingPeriod && !isNaN(parseInt(votingPeriod)) && parseInt(votingPeriod) > 0 && (
                <div className="form-preview">
                    New period: {formatPeriod(parseInt(votingPeriod))}
                </div>
            )}

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="btn btn-primary">
                Add Action
            </button>
        </form>
    );
}
