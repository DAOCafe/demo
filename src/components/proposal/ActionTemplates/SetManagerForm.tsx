import { useState } from 'react';
import { isAddress, encodeFunctionData } from 'viem';
import type { ProposalAction } from '../../../types/proposal';

// Minimal ABI for setManager
const setManagerAbi = [
    {
        type: 'function',
        name: 'setManager',
        inputs: [{ name: 'newManager', type: 'address' }],
        outputs: [],
        stateMutability: 'nonpayable',
    },
] as const;

interface SetManagerFormProps {
    onAdd: (action: ProposalAction) => void;
    governorAddress: string;
    currentManager?: string | null;
}

export function SetManagerForm({ onAdd, governorAddress, currentManager }: SetManagerFormProps) {
    const [newManager, setNewManager] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isAddress(newManager)) {
            setError('Invalid manager address');
            return;
        }

        if (currentManager && newManager.toLowerCase() === currentManager.toLowerCase()) {
            setError('New manager is the same as current manager');
            return;
        }

        try {
            const calldata = encodeFunctionData({
                abi: setManagerAbi,
                functionName: 'setManager',
                args: [newManager as `0x${string}`],
            });

            const action: ProposalAction = {
                target: governorAddress as `0x${string}`,
                value: 0n,
                calldata,
                description: `Set manager to ${newManager}`,
            };

            onAdd(action);
            setNewManager('');
        } catch {
            setError('Failed to encode setManager call');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="action-form">
            {currentManager && (
                <div className="form-info">
                    <span className="info-label">Current Manager:</span>
                    <span className="info-value">{currentManager}</span>
                </div>
            )}

            <div className="form-group">
                <label htmlFor="new-manager">New Manager Address</label>
                <input
                    id="new-manager"
                    type="text"
                    value={newManager}
                    onChange={(e) => setNewManager(e.target.value)}
                    placeholder="0x..."
                    className="form-input"
                />
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="form-hint">
                This will change the DAO manager to the specified address. The manager role can be used
                for backend authorization checks.
            </div>

            <button type="submit" className="btn btn-primary">
                Add Action
            </button>
        </form>
    );
}
