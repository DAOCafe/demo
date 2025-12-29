import { useState } from 'react';
import { isAddress, parseEther } from 'viem';
import type { ProposalAction } from '../../../types/proposal';

interface TransferEthFormProps {
    onAdd: (action: ProposalAction) => void;
    timelockAddress: string;
}

export function TransferEthForm({ onAdd, timelockAddress }: TransferEthFormProps) {
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isAddress(recipient)) {
            setError('Invalid recipient address');
            return;
        }

        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            setError('Invalid amount');
            return;
        }

        try {
            const value = parseEther(amount);

            const action: ProposalAction = {
                target: recipient as `0x${string}`,
                value,
                calldata: '0x',
                description: `Transfer ${amount} ETH to ${recipient}`,
            };

            onAdd(action);
            setRecipient('');
            setAmount('');
        } catch {
            setError('Failed to parse amount');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="action-form">
            <div className="form-group">
                <label htmlFor="eth-recipient">Recipient Address</label>
                <input
                    id="eth-recipient"
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label htmlFor="eth-amount">Amount (ETH)</label>
                <input
                    id="eth-amount"
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="form-input"
                />
            </div>

            {error && <div className="form-error">{error}</div>}

            <div className="form-hint">
                ETH will be sent from the DAO timelock ({timelockAddress.slice(0, 6)}...{timelockAddress.slice(-4)})
            </div>

            <button type="submit" className="btn btn-primary">
                Add Action
            </button>
        </form>
    );
}
