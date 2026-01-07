import { useState } from 'react';
import { isAddress, parseEther } from 'viem';
import type { ProposalAction } from '../../../types/proposal';

interface Recipient {
    address: string;
    amount: string;
}

interface BatchTransferEthFormProps {
    onAdd: (actions: ProposalAction[]) => void;
    timelockAddress: string;
}

export function BatchTransferEthForm({ onAdd, timelockAddress }: BatchTransferEthFormProps) {
    const [recipients, setRecipients] = useState<Recipient[]>([{ address: '', amount: '' }]);
    const [error, setError] = useState('');

    const addRecipient = () => {
        setRecipients([...recipients, { address: '', amount: '' }]);
    };

    const removeRecipient = (index: number) => {
        if (recipients.length > 1) {
            setRecipients(recipients.filter((_, i) => i !== index));
        }
    };

    const updateRecipient = (index: number, field: 'address' | 'amount', value: string) => {
        const updated = [...recipients];
        updated[index][field] = value;
        setRecipients(updated);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validate all recipients
        for (let i = 0; i < recipients.length; i++) {
            const recipient = recipients[i];
            
            if (!recipient.address.trim()) {
                setError(`Recipient #${i + 1}: Address is required`);
                return;
            }

            if (!isAddress(recipient.address)) {
                setError(`Recipient #${i + 1}: Invalid address`);
                return;
            }

            if (!recipient.amount || isNaN(parseFloat(recipient.amount)) || parseFloat(recipient.amount) <= 0) {
                setError(`Recipient #${i + 1}: Invalid amount`);
                return;
            }
        }

        try {
            // Create an action for each recipient
            const actions: ProposalAction[] = recipients.map((recipient) => {
                const value = parseEther(recipient.amount);
                return {
                    target: recipient.address as `0x${string}`,
                    value,
                    calldata: '0x',
                    description: `Transfer ${recipient.amount} ETH to ${recipient.address}`,
                };
            });

            // Calculate total
            const totalEth = recipients.reduce(
                (sum, r) => sum + parseFloat(r.amount),
                0
            );

            // Update descriptions to indicate batch
            if (actions.length > 1) {
                actions[0].description = `Batch transfer ETH (${actions.length} recipients, ${totalEth.toFixed(4)} ETH total)`;
            }

            onAdd(actions);
            setRecipients([{ address: '', amount: '' }]);
        } catch (err) {
            setError('Failed to parse amounts');
            console.error(err);
        }
    };

    const totalAmount = recipients.reduce((sum, r) => {
        const amount = parseFloat(r.amount);
        return isNaN(amount) ? sum : sum + amount;
    }, 0);

    return (
        <form onSubmit={handleSubmit} className="action-form">
            <div className="batch-recipients">
                {recipients.map((recipient, index) => (
                    <div key={index} className="batch-recipient-row">
                        <div className="batch-recipient-header">
                            <span className="batch-recipient-number">#{index + 1}</span>
                            {recipients.length > 1 && (
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => removeRecipient(index)}
                                    title="Remove recipient"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                        <div className="batch-recipient-fields">
                            <div className="form-group">
                                <label htmlFor={`eth-address-${index}`}>Address</label>
                                <input
                                    id={`eth-address-${index}`}
                                    type="text"
                                    value={recipient.address}
                                    onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                                    placeholder="0x..."
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor={`eth-amount-${index}`}>Amount (ETH)</label>
                                <input
                                    id={`eth-amount-${index}`}
                                    type="text"
                                    value={recipient.amount}
                                    onChange={(e) => updateRecipient(index, 'amount', e.target.value)}
                                    placeholder="0.0"
                                    className="form-input"
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addRecipient}
            >
                + Add Recipient
            </button>

            {totalAmount > 0 && (
                <div className="form-preview">
                    Total: {totalAmount.toFixed(6)} ETH to {recipients.length} recipient(s)
                </div>
            )}

            {error && <div className="form-error">{error}</div>}

            <div className="form-hint">
                ETH will be sent from the DAO timelock ({timelockAddress.slice(0, 6)}...{timelockAddress.slice(-4)})
            </div>

            <button type="submit" className="btn btn-primary">
                Add {recipients.length > 1 ? 'Batch ' : ''}Action{recipients.length > 1 ? 's' : ''}
            </button>
        </form>
    );
}
