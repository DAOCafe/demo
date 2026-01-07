import { useState } from 'react';
import { isAddress, encodeFunctionData, parseUnits, formatUnits } from 'viem';
import { useReadContract } from 'wagmi';
import type { ProposalAction } from '../../../types/proposal';
import { erc20Abi } from '../../../config/abis';

interface Recipient {
    address: string;
    amount: string;
}

interface BatchTransferErc20FormProps {
    onAdd: (actions: ProposalAction[]) => void;
    timelockAddress: string;
    chainId: number;
}

type SupportedChainId = 8453 | 11155111;

export function BatchTransferErc20Form({ onAdd, timelockAddress, chainId }: BatchTransferErc20FormProps) {
    const [tokenAddress, setTokenAddress] = useState('');
    const [recipients, setRecipients] = useState<Recipient[]>([{ address: '', amount: '' }]);
    const [error, setError] = useState('');

    const isValidTokenAddress = isAddress(tokenAddress);
    const typedChainId = chainId as SupportedChainId;

    // Fetch token info
    const { data: tokenSymbol } = useReadContract({
        address: isValidTokenAddress ? (tokenAddress as `0x${string}`) : undefined,
        abi: erc20Abi,
        functionName: 'symbol',
        chainId: typedChainId,
        query: {
            enabled: isValidTokenAddress,
        },
    });

    const { data: tokenDecimals } = useReadContract({
        address: isValidTokenAddress ? (tokenAddress as `0x${string}`) : undefined,
        abi: erc20Abi,
        functionName: 'decimals',
        chainId: typedChainId,
        query: {
            enabled: isValidTokenAddress,
        },
    });

    const { data: timelockBalance } = useReadContract({
        address: isValidTokenAddress ? (tokenAddress as `0x${string}`) : undefined,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: timelockAddress ? [timelockAddress as `0x${string}`] : undefined,
        chainId: typedChainId,
        query: {
            enabled: isValidTokenAddress && !!timelockAddress,
        },
    });

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

        if (!isAddress(tokenAddress)) {
            setError('Invalid token address');
            return;
        }

        if (tokenDecimals === undefined) {
            setError('Unable to fetch token decimals');
            return;
        }

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
                const amount = parseUnits(recipient.amount, tokenDecimals);
                const calldata = encodeFunctionData({
                    abi: erc20Abi,
                    functionName: 'transfer',
                    args: [recipient.address as `0x${string}`, amount],
                });

                return {
                    target: tokenAddress as `0x${string}`,
                    value: 0n,
                    calldata: calldata as `0x${string}`,
                    description: `Transfer ${recipient.amount} ${tokenSymbol || 'tokens'} to ${recipient.address}`,
                };
            });

            // Calculate total
            const totalTokens = recipients.reduce(
                (sum, r) => sum + parseFloat(r.amount),
                0
            );

            // Update descriptions to indicate batch
            if (actions.length > 1) {
                actions[0].description = `Batch transfer ${tokenSymbol || 'tokens'} (${actions.length} recipients, ${totalTokens.toFixed(4)} total)`;
            }

            onAdd(actions);
            setTokenAddress('');
            setRecipients([{ address: '', amount: '' }]);
        } catch (err) {
            setError('Failed to encode actions');
            console.error(err);
        }
    };

    const totalAmount = recipients.reduce((sum, r) => {
        const amount = parseFloat(r.amount);
        return isNaN(amount) ? sum : sum + amount;
    }, 0);

    return (
        <form onSubmit={handleSubmit} className="action-form">
            <div className="form-group">
                <label htmlFor="token-address">Token Address</label>
                <input
                    id="token-address"
                    type="text"
                    value={tokenAddress}
                    onChange={(e) => setTokenAddress(e.target.value)}
                    placeholder="0x..."
                    className="form-input"
                />
                {tokenSymbol && (
                    <small className="form-help">
                        Token: {tokenSymbol} | Decimals: {tokenDecimals}
                    </small>
                )}
            </div>

            {timelockBalance !== undefined && tokenDecimals !== undefined && (
                <div className="form-hint">
                    Treasury balance: {formatUnits(timelockBalance, tokenDecimals)} {tokenSymbol || 'tokens'}
                </div>
            )}

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
                                <label htmlFor={`recipient-address-${index}`}>Address</label>
                                <input
                                    id={`recipient-address-${index}`}
                                    type="text"
                                    value={recipient.address}
                                    onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                                    placeholder="0x..."
                                    className="form-input"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor={`recipient-amount-${index}`}>
                                    Amount {tokenSymbol ? `(${tokenSymbol})` : ''}
                                </label>
                                <input
                                    id={`recipient-amount-${index}`}
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

            {totalAmount > 0 && tokenSymbol && (
                <div className="form-preview">
                    Total: {totalAmount.toFixed(6)} {tokenSymbol} to {recipients.length} recipient(s)
                </div>
            )}

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="btn btn-primary">
                Add {recipients.length > 1 ? 'Batch ' : ''}Action{recipients.length > 1 ? 's' : ''}
            </button>
        </form>
    );
}
