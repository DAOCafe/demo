import { useState } from 'react';
import { isAddress, isHex } from 'viem';
import type { ProposalAction } from '../../../types/proposal';

interface CustomActionFormProps {
    onAdd: (action: ProposalAction) => void;
}

export function CustomActionForm({ onAdd }: CustomActionFormProps) {
    const [target, setTarget] = useState('');
    const [value, setValue] = useState('');
    const [calldata, setCalldata] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isAddress(target)) {
            setError('Invalid target address');
            return;
        }

        if (value && (isNaN(parseFloat(value)) || parseFloat(value) < 0)) {
            setError('Invalid value (must be >= 0)');
            return;
        }

        // Validate calldata is valid hex or empty
        const normalizedCalldata = calldata.trim() || '0x';
        if (normalizedCalldata !== '0x' && !isHex(normalizedCalldata)) {
            setError('Invalid calldata (must be hex starting with 0x)');
            return;
        }

        if (!description.trim()) {
            setError('Please provide a description for this action');
            return;
        }

        try {
            const parsedValue = value ? BigInt(Math.floor(parseFloat(value) * 1e18)) : 0n;

            const action: ProposalAction = {
                target: target as `0x${string}`,
                value: parsedValue,
                calldata: normalizedCalldata as `0x${string}`,
                description: description.trim(),
            };

            onAdd(action);
            setTarget('');
            setValue('');
            setCalldata('');
            setDescription('');
        } catch {
            setError('Failed to create action');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="action-form">
            <div className="form-group">
                <label htmlFor="custom-target">Target Contract Address</label>
                <input
                    id="custom-target"
                    type="text"
                    value={target}
                    onChange={(e) => setTarget(e.target.value)}
                    placeholder="0x..."
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label htmlFor="custom-value">ETH Value (optional)</label>
                <input
                    id="custom-value"
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="0.0"
                    className="form-input"
                />
                <div className="form-hint">Amount of ETH to send with this call (in ETH, not wei)</div>
            </div>

            <div className="form-group">
                <label htmlFor="custom-calldata">Calldata (hex)</label>
                <textarea
                    id="custom-calldata"
                    value={calldata}
                    onChange={(e) => setCalldata(e.target.value)}
                    placeholder="0x..."
                    className="form-input form-textarea"
                    rows={3}
                />
                <div className="form-hint">
                    The encoded function call data. Leave empty for a simple ETH transfer.
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="custom-description">Action Description</label>
                <input
                    id="custom-description"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does this action do?"
                    className="form-input"
                />
            </div>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="btn btn-primary">
                Add Action
            </button>
        </form>
    );
}
