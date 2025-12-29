import { useState } from 'react';
import { isAddress, encodeFunctionData, parseUnits } from 'viem';
import { useReadContract } from 'wagmi';
import { erc20Abi } from '../../../config/abis';
import type { ProposalAction } from '../../../types/proposal';

interface TransferErc20FormProps {
    onAdd: (action: ProposalAction) => void;
    timelockAddress: string;
    chainId: number;
}

type SupportedChainId = 8453 | 11155111;

export function TransferErc20Form({ onAdd, timelockAddress, chainId }: TransferErc20FormProps) {
    const [tokenAddress, setTokenAddress] = useState('');
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [error, setError] = useState('');

    const isValidTokenAddress = isAddress(tokenAddress);
    const typedChainId = chainId as SupportedChainId;

    // Fetch token info
    const { data: symbol } = useReadContract({
        address: isValidTokenAddress ? (tokenAddress as `0x${string}`) : undefined,
        abi: erc20Abi,
        functionName: 'symbol',
        chainId: typedChainId,
        query: {
            enabled: isValidTokenAddress,
        },
    });

    const { data: decimals } = useReadContract({
        address: isValidTokenAddress ? (tokenAddress as `0x${string}`) : undefined,
        abi: erc20Abi,
        functionName: 'decimals',
        chainId: typedChainId,
        query: {
            enabled: isValidTokenAddress,
        },
    });

    const { data: balance } = useReadContract({
        address: isValidTokenAddress ? (tokenAddress as `0x${string}`) : undefined,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [timelockAddress as `0x${string}`],
        chainId: typedChainId,
        query: {
            enabled: isValidTokenAddress && !!timelockAddress,
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!isAddress(tokenAddress)) {
            setError('Invalid token address');
            return;
        }

        if (!isAddress(recipient)) {
            setError('Invalid recipient address');
            return;
        }

        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            setError('Invalid amount');
            return;
        }

        if (decimals === undefined) {
            setError('Could not fetch token decimals');
            return;
        }

        try {
            const parsedAmount = parseUnits(amount, decimals);

            const calldata = encodeFunctionData({
                abi: erc20Abi,
                functionName: 'transfer',
                args: [recipient as `0x${string}`, parsedAmount],
            });

            const action: ProposalAction = {
                target: tokenAddress as `0x${string}`,
                value: 0n,
                calldata,
                description: `Transfer ${amount} ${symbol || 'tokens'} to ${recipient}`,
            };

            onAdd(action);
            setTokenAddress('');
            setRecipient('');
            setAmount('');
        } catch {
            setError('Failed to encode transfer');
        }
    };

    const formatBalance = () => {
        if (balance === undefined || decimals === undefined) return null;
        const formatted = Number(balance) / (10 ** decimals);
        return formatted.toLocaleString(undefined, { maximumFractionDigits: 4 });
    };

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
                {symbol && (
                    <div className="form-hint">
                        Token: {symbol}
                        {balance !== undefined && ` • Treasury Balance: ${formatBalance()}`}
                    </div>
                )}
            </div>

            <div className="form-group">
                <label htmlFor="erc20-recipient">Recipient Address</label>
                <input
                    id="erc20-recipient"
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="0x..."
                    className="form-input"
                />
            </div>

            <div className="form-group">
                <label htmlFor="erc20-amount">Amount {symbol && `(${symbol})`}</label>
                <input
                    id="erc20-amount"
                    type="text"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.0"
                    className="form-input"
                />
            </div>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="btn btn-primary" disabled={!symbol}>
                Add Action
            </button>
        </form>
    );
}
