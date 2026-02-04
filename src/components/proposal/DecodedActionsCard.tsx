import { useState, useCallback } from 'react';
import type { DecodedAction, DecodedSuccess, DecodedError } from 'daocafe-sdk';
import { AddressLink } from '../common/AddressLink';

// ============================================================================
// TYPES
// ============================================================================

interface DecodedActionsCardProps {
    decodedActions: DecodedAction[];
    chainId: number;
}

interface ActionItemProps {
    action: DecodedAction;
    chainId: number;
    isExpanded: boolean;
    onToggle: () => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

// Known contract addresses for common protocols (add more as needed)
const KNOWN_CONTRACTS: Record<string, { name: string; type: string }> = {
    // Mainnet
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { name: 'USDC', type: 'token' },
    '0xdac17f958d2ee523a2206206994597c13d831ec7': { name: 'USDT', type: 'token' },
    '0x6b175474e89094c44da98b954eedeac495271d0f': { name: 'DAI', type: 'token' },
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { name: 'WETH', type: 'token' },
    '0x7a250d5630b4cf539739df2c5dacb4c659f2488d': { name: 'Uniswap V2 Router', type: 'dex' },
    '0xe592427a0aece92de3edee1f18e0157c05861564': { name: 'Uniswap V3 Router', type: 'dex' },
    // Sepolia (add test tokens as needed)
};

// Function type categorization based on function name
const FUNCTION_CATEGORIES: Record<string, { color: string; icon: string; label: string }> = {
    transfer: { color: 'var(--color-success)', icon: '💸', label: 'Transfer' },
    approve: { color: 'var(--color-info)', icon: '✅', label: 'Approval' },
    mint: { color: 'var(--accent-secondary)', icon: '🪙', label: 'Mint' },
    burn: { color: 'var(--color-error)', icon: '🔥', label: 'Burn' },
    setFee: { color: 'var(--accent-primary)', icon: '⚙️', label: 'Settings' },
    setManager: { color: 'var(--accent-primary)', icon: '👤', label: 'Admin' },
    setVotingDelay: { color: 'var(--accent-primary)', icon: '⏱️', label: 'Governance' },
    setVotingPeriod: { color: 'var(--accent-primary)', icon: '⏱️', label: 'Governance' },
    setProposalThreshold: { color: 'var(--accent-primary)', icon: '📊', label: 'Governance' },
    updateQuorumNumerator: { color: 'var(--accent-primary)', icon: '📊', label: 'Governance' },
    swap: { color: 'var(--accent-secondary)', icon: '🔄', label: 'Swap' },
    execute: { color: 'var(--color-warning)', icon: '▶️', label: 'Execute' },
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Format wei to ETH with proper decimal places
 */
const formatWeiToEth = (wei: string): string => {
    if (!wei || wei === '0') return '0 ETH';
    try {
        const weiValue = BigInt(wei);
        const ethValue = Number(weiValue) / 1e18;
        
        if (ethValue >= 1) {
            return `${ethValue.toLocaleString('en-US', { maximumFractionDigits: 4 })} ETH`;
        } else if (ethValue >= 0.0001) {
            return `${ethValue.toFixed(6)} ETH`;
        } else {
            return `${wei} wei`;
        }
    } catch {
        return `${wei} wei`;
    }
};

/**
 * Get known contract info if available
 */
const getKnownContract = (address: string): { name: string; type: string } | null => {
    return KNOWN_CONTRACTS[address.toLowerCase()] || null;
};

/**
 * Get function category based on function name
 */
const getFunctionCategory = (functionName: string): { color: string; icon: string; label: string } => {
    // Check exact match first
    if (FUNCTION_CATEGORIES[functionName]) {
        return FUNCTION_CATEGORIES[functionName];
    }
    
    // Check partial matches
    const lowerName = functionName.toLowerCase();
    if (lowerName.includes('transfer')) return FUNCTION_CATEGORIES.transfer;
    if (lowerName.includes('approve')) return FUNCTION_CATEGORIES.approve;
    if (lowerName.includes('mint')) return FUNCTION_CATEGORIES.mint;
    if (lowerName.includes('burn')) return FUNCTION_CATEGORIES.burn;
    if (lowerName.includes('swap')) return FUNCTION_CATEGORIES.swap;
    if (lowerName.includes('set') || lowerName.includes('update')) {
        return { color: 'var(--accent-primary)', icon: '⚙️', label: 'Settings' };
    }
    
    // Default
    return { color: 'var(--text-secondary)', icon: '📝', label: 'Contract Call' };
};

/**
 * Copy text to clipboard with feedback
 */
const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        return false;
    }
};

/**
 * Truncate long strings for display
 */
const truncateString = (str: string, maxLength: number = 20): string => {
    if (str.length <= maxLength) return str;
    return `${str.slice(0, maxLength / 2)}...${str.slice(-maxLength / 2)}`;
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/**
 * Copy button component with feedback
 */
function CopyButton({ text, label }: { text: string; label?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = useCallback(async (e: React.MouseEvent) => {
        e.stopPropagation();
        const success = await copyToClipboard(text);
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    }, [text]);

    return (
        <button
            onClick={handleCopy}
            className="copy-button"
            title={label ? `Copy ${label}` : 'Copy to clipboard'}
            style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 'var(--radius-sm)',
                color: copied ? 'var(--color-success)' : 'var(--text-tertiary)',
                fontSize: 'var(--text-xs)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all var(--transition-fast)',
            }}
        >
            {copied ? '✓' : '📋'}
            {copied && <span style={{ fontSize: '10px' }}>Copied!</span>}
        </button>
    );
}

/**
 * Syntax highlighted value display
 */
function HighlightedValue({ value, type }: { value: string; type: string }) {
    const getTypeColor = () => {
        if (type === 'address') return 'var(--accent-primary)';
        if (type.includes('uint') || type.includes('int')) return 'var(--accent-secondary)';
        if (type === 'bool') return 'var(--color-warning)';
        if (type.includes('bytes')) return 'var(--color-info)';
        return 'var(--text-secondary)';
    };

    return (
        <span
            style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-sm)',
                color: getTypeColor(),
                wordBreak: 'break-all',
            }}
        >
            {type === 'address' ? truncateString(value, 16) : value}
        </span>
    );
}

/**
 * Submit to 4bytes button for unknown selectors
 */
function SubmitTo4BytesButton({ selector }: { selector: string }) {
    const handleSubmit = useCallback(() => {
        const url = `https://www.4byte.directory/signatures/?bytes4_signature=${selector}`;
        window.open(url, '_blank', 'noopener,noreferrer');
    }, [selector]);

    return (
        <button
            onClick={handleSubmit}
            className="btn btn-sm btn-secondary"
            style={{
                marginTop: 'var(--space-2)',
                fontSize: 'var(--text-xs)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
            }}
        >
            <span>🔍</span>
            Submit to 4bytes
        </button>
    );
}

/**
 * Decoded success content
 */
function DecodedSuccessContent({ 
    decoded, 
    chainId 
}: { 
    decoded: DecodedSuccess; 
    chainId: number;
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            {/* Function Signature */}
            <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 'var(--space-2)',
                flexWrap: 'wrap'
            }}>
                <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 'var(--text-sm)',
                    color: 'var(--text-primary)',
                    padding: '4px 8px',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-primary)',
                }}>
                    {decoded.signature}
                </span>
                <CopyButton text={decoded.signature} label="signature" />
            </div>

            {/* Arguments */}
            {decoded.args.length > 0 && (
                <div style={{
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--space-3)',
                    border: '1px solid var(--border-primary)',
                }}>
                    <div style={{
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-tertiary)',
                        marginBottom: 'var(--space-2)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}>
                        Arguments
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                        {decoded.args.map((arg, idx) => (
                            <div
                                key={idx}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 'var(--space-2)',
                                    padding: 'var(--space-2)',
                                    background: 'var(--bg-secondary)',
                                    borderRadius: 'var(--radius-sm)',
                                }}
                            >
                                <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--text-tertiary)',
                                    minWidth: '50px',
                                }}>
                                    {arg.name}
                                </span>
                                <span style={{
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--text-muted)',
                                    padding: '2px 6px',
                                    background: 'var(--bg-glass)',
                                    borderRadius: 'var(--radius-sm)',
                                }}>
                                    {arg.type}
                                </span>
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
                                    {arg.type === 'address' ? (
                                        <AddressLink address={arg.value as `0x${string}`} chainId={chainId} />
                                    ) : (
                                        <HighlightedValue value={arg.value} type={arg.type} />
                                    )}
                                    <CopyButton text={arg.value} label={arg.name} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * Decoded error content
 */
function DecodedErrorContent({ decoded }: { decoded: DecodedError }) {
    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-3)',
        }}>
            <div style={{
                padding: 'var(--space-3)',
                background: 'var(--color-warning-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
            }}>
                <div style={{
                    fontSize: 'var(--text-sm)',
                    color: 'var(--color-warning)',
                    marginBottom: 'var(--space-2)',
                }}>
                    ⚠️ {decoded.error}
                </div>
                <div style={{
                    fontSize: 'var(--text-xs)',
                    color: 'var(--text-secondary)',
                }}>
                    Selector: <code style={{ 
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 6px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-sm)',
                    }}>{decoded.selector}</code>
                </div>
            </div>
            
            <div style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
            }}>
                💡 {decoded.hint}
            </div>

            <SubmitTo4BytesButton selector={decoded.selector} />
        </div>
    );
}

/**
 * Single action item with expand/collapse
 */
function ActionItem({ action, chainId, isExpanded, onToggle }: ActionItemProps) {
    const isSuccess = action.decoded.status === 'success';
    const decoded = action.decoded;
    
    const category = isSuccess 
        ? getFunctionCategory((decoded as DecodedSuccess).functionName)
        : { color: 'var(--color-warning)', icon: '❓', label: 'Unknown' };
    
    const knownContract = getKnownContract(action.target);
    const ethValue = formatWeiToEth(action.value);
    const hasValue = action.value !== '0';

    return (
        <div
            className="decoded-action-item"
            style={{
                background: 'var(--gradient-card)',
                border: '1px solid var(--border-primary)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                transition: 'all var(--transition-base)',
            }}
        >
            {/* Header (always visible) */}
            <button
                onClick={onToggle}
                style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-4)',
                    background: isExpanded ? 'var(--bg-tertiary)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background var(--transition-fast)',
                }}
            >
                {/* Action Index Badge */}
                <div style={{
                    width: '28px',
                    height: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--gradient-primary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-bold)',
                    color: 'white',
                    flexShrink: 0,
                }}>
                    {action.index + 1}
                </div>

                {/* Category Icon */}
                <span style={{ fontSize: 'var(--text-lg)' }}>
                    {category.icon}
                </span>

                {/* Summary */}
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        flexWrap: 'wrap',
                    }}>
                        {isSuccess ? (
                            <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: 'var(--text-sm)',
                                fontWeight: 'var(--font-medium)',
                                color: category.color,
                            }}>
                                {(decoded as DecodedSuccess).summary}
                            </span>
                        ) : (
                            <span style={{
                                fontSize: 'var(--text-sm)',
                                color: 'var(--color-warning)',
                            }}>
                                Unknown Function ({(decoded as DecodedError).selector})
                            </span>
                        )}
                        
                        {/* Value badge if non-zero */}
                        {hasValue && (
                            <span style={{
                                padding: '2px 8px',
                                background: 'var(--color-success-bg)',
                                color: 'var(--color-success)',
                                borderRadius: 'var(--radius-full)',
                                fontSize: 'var(--text-xs)',
                                fontWeight: 'var(--font-medium)',
                            }}>
                                {ethValue}
                            </span>
                        )}
                    </div>
                    
                    {/* Target info */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-2)',
                        marginTop: '4px',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-tertiary)',
                    }}>
                        <span>→</span>
                        {knownContract ? (
                            <span style={{
                                padding: '2px 6px',
                                background: 'var(--bg-tertiary)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-secondary)',
                            }}>
                                {knownContract.name}
                            </span>
                        ) : (
                            <span style={{ fontFamily: 'var(--font-mono)' }}>
                                {truncateString(action.target, 16)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Category Label */}
                <span style={{
                    padding: '4px 10px',
                    background: `${category.color}20`,
                    color: category.color,
                    borderRadius: 'var(--radius-full)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 'var(--font-medium)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                }}>
                    {category.label}
                </span>

                {/* Expand/Collapse Arrow */}
                <span style={{
                    color: 'var(--text-tertiary)',
                    transition: 'transform var(--transition-fast)',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                }}>
                    ▼
                </span>
            </button>

            {/* Expanded Content */}
            <div
                style={{
                    maxHeight: isExpanded ? '1000px' : '0',
                    opacity: isExpanded ? 1 : 0,
                    overflow: 'hidden',
                    transition: 'all var(--transition-slow)',
                }}
            >
                <div style={{
                    padding: 'var(--space-4)',
                    paddingTop: 0,
                    borderTop: isExpanded ? '1px solid var(--border-primary)' : 'none',
                }}>
                    {/* Details Grid */}
                    <div style={{
                        display: 'grid',
                        gap: 'var(--space-3)',
                        marginBottom: 'var(--space-4)',
                        fontSize: 'var(--text-sm)',
                    }}>
                        {/* Target */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{ color: 'var(--text-tertiary)', minWidth: '60px' }}>Target:</span>
                            <AddressLink address={action.target as `0x${string}`} chainId={chainId} />
                            {knownContract && (
                                <span style={{
                                    padding: '2px 8px',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--text-secondary)',
                                }}>
                                    {knownContract.name}
                                </span>
                            )}
                            <CopyButton text={action.target} label="target" />
                        </div>

                        {/* Value */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{ color: 'var(--text-tertiary)', minWidth: '60px' }}>Value:</span>
                            <span style={{
                                fontFamily: 'var(--font-mono)',
                                color: hasValue ? 'var(--color-success)' : 'var(--text-secondary)',
                            }}>
                                {ethValue}
                            </span>
                            {hasValue && (
                                <span style={{ 
                                    fontSize: 'var(--text-xs)', 
                                    color: 'var(--text-muted)' 
                                }}>
                                    ({action.value} wei)
                                </span>
                            )}
                        </div>

                        {/* Calldata */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                            <span style={{ color: 'var(--text-tertiary)', minWidth: '60px' }}>Calldata:</span>
                            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', gap: 'var(--space-1)' }}>
                                <code style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: 'var(--text-xs)',
                                    color: 'var(--text-secondary)',
                                    wordBreak: 'break-all',
                                    padding: 'var(--space-2)',
                                    background: 'var(--bg-tertiary)',
                                    borderRadius: 'var(--radius-sm)',
                                    maxHeight: '100px',
                                    overflow: 'auto',
                                    display: 'block',
                                    flex: 1,
                                }}>
                                    {action.calldata}
                                </code>
                                <CopyButton text={action.calldata} label="calldata" />
                            </div>
                        </div>
                    </div>

                    {/* Decoded Content */}
                    {isSuccess ? (
                        <DecodedSuccessContent 
                            decoded={decoded as DecodedSuccess} 
                            chainId={chainId} 
                        />
                    ) : (
                        <DecodedErrorContent decoded={decoded as DecodedError} />
                    )}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * DecodedActionsCard - Displays decoded proposal actions with rich UI
 */
export function DecodedActionsCard({ decodedActions, chainId }: DecodedActionsCardProps) {
    const [expandedActions, setExpandedActions] = useState<Set<number>>(new Set());
    const [allExpanded, setAllExpanded] = useState(false);

    const sortedActions = [...decodedActions].sort((a, b) => a.index - b.index);
    
    const successCount = sortedActions.filter(a => a.decoded.status === 'success').length;
    const errorCount = sortedActions.length - successCount;

    const toggleAction = useCallback((index: number) => {
        setExpandedActions(prev => {
            const next = new Set(prev);
            if (next.has(index)) {
                next.delete(index);
            } else {
                next.add(index);
            }
            return next;
        });
    }, []);

    const toggleAll = useCallback(() => {
        if (allExpanded) {
            setExpandedActions(new Set());
        } else {
            setExpandedActions(new Set(sortedActions.map(a => a.index)));
        }
        setAllExpanded(!allExpanded);
    }, [allExpanded, sortedActions]);

    if (decodedActions.length === 0) {
        return (
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>
                    Proposal Actions
                </h2>
                <div style={{ 
                    textAlign: 'center', 
                    padding: 'var(--space-8)',
                    color: 'var(--text-secondary)',
                }}>
                    <span style={{ fontSize: 'var(--text-2xl)', display: 'block', marginBottom: 'var(--space-2)' }}>
                        📭
                    </span>
                    No actions in this proposal
                </div>
            </div>
        );
    }

    return (
        <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-4)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <h2 className="section-title" style={{ margin: 0 }}>
                        Proposal Actions
                    </h2>
                    <span style={{
                        padding: '4px 10px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-secondary)',
                    }}>
                        {sortedActions.length} action{sortedActions.length !== 1 ? 's' : ''}
                    </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    {/* Status indicators */}
                    {successCount > 0 && (
                        <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--color-success)',
                        }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: 'var(--color-success)',
                            }} />
                            {successCount} decoded
                        </span>
                    )}
                    {errorCount > 0 && (
                        <span style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: 'var(--text-xs)',
                            color: 'var(--color-warning)',
                        }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: 'var(--color-warning)',
                            }} />
                            {errorCount} unknown
                        </span>
                    )}

                    {/* Expand/Collapse All Button */}
                    <button
                        onClick={toggleAll}
                        className="btn btn-ghost btn-sm"
                        style={{
                            fontSize: 'var(--text-xs)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-1)',
                        }}
                    >
                        {allExpanded ? '▲ Collapse All' : '▼ Expand All'}
                    </button>
                </div>
            </div>

            {/* Actions List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {sortedActions.map((action) => (
                    <ActionItem
                        key={action.index}
                        action={action}
                        chainId={chainId}
                        isExpanded={expandedActions.has(action.index)}
                        onToggle={() => toggleAction(action.index)}
                    />
                ))}
            </div>
        </div>
    );
}

export default DecodedActionsCard;
