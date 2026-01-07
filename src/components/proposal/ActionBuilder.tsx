import { useState } from 'react';
import type { ProposalAction, ActionTemplateType, ActionTemplateOption } from '../../types/proposal';
import { TransferEthForm } from './ActionTemplates/TransferEthForm';
import { TransferErc20Form } from './ActionTemplates/TransferErc20Form';
import { SetManagerForm } from './ActionTemplates/SetManagerForm';
import { CustomActionForm } from './ActionTemplates/CustomActionForm';
import { UpdateVotingDelayForm } from './ActionTemplates/UpdateVotingDelayForm';
import { UpdateVotingPeriodForm } from './ActionTemplates/UpdateVotingPeriodForm';
import { UpdateProposalThresholdForm } from './ActionTemplates/UpdateProposalThresholdForm';
import { UpdateQuorumForm } from './ActionTemplates/UpdateQuorumForm';
import { BatchTransferEthForm } from './ActionTemplates/BatchTransferEthForm';
import { BatchTransferErc20Form } from './ActionTemplates/BatchTransferErc20Form';

const ACTION_TEMPLATES: ActionTemplateOption[] = [
    {
        type: 'transfer-eth',
        label: 'Transfer ETH',
        description: 'Send ETH from the treasury to an address',
        icon: '💎',
    },
    {
        type: 'transfer-erc20',
        label: 'Transfer ERC20',
        description: 'Send tokens from the treasury to an address',
        icon: '🪙',
    },
    {
        type: 'batch-transfer-eth',
        label: 'Batch Transfer ETH',
        description: 'Send ETH to multiple recipients',
        icon: '💸',
    },
    {
        type: 'batch-transfer-erc20',
        label: 'Batch Transfer ERC20',
        description: 'Send tokens to multiple recipients',
        icon: '📦',
    },
    {
        type: 'update-voting-delay',
        label: 'Update Voting Delay',
        description: 'Change delay before voting starts',
        icon: '⏱️',
    },
    {
        type: 'update-voting-period',
        label: 'Update Voting Period',
        description: 'Change duration of voting period',
        icon: '📅',
    },
    {
        type: 'update-proposal-threshold',
        label: 'Update Proposal Threshold',
        description: 'Change minimum tokens to propose',
        icon: '🎯',
    },
    {
        type: 'update-quorum',
        label: 'Update Quorum',
        description: 'Change quorum percentage required',
        icon: '📊',
    },
    {
        type: 'set-manager',
        label: 'Set Manager',
        description: 'Change the DAO manager address',
        icon: '👤',
    },
    {
        type: 'custom',
        label: 'Custom Action',
        description: 'Create a custom contract call',
        icon: '⚙️',
    },
];

interface ActionBuilderProps {
    actions: ProposalAction[];
    onAddAction: (action: ProposalAction) => void;
    onRemoveAction: (index: number) => void;
    governorAddress: string;
    timelockAddress: string;
    currentManager?: string | null;
    chainId: number;
}

export function ActionBuilder({
    actions,
    onAddAction,
    onRemoveAction,
    governorAddress,
    timelockAddress,
    currentManager,
    chainId,
}: ActionBuilderProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<ActionTemplateType | null>(null);

    // Handler for batch operations (multiple actions)
    const handleBatchAdd = (batchActions: ProposalAction[]) => {
        batchActions.forEach((action) => onAddAction(action));
        setSelectedTemplate(null);
    };

    const renderTemplateForm = () => {
        switch (selectedTemplate) {
            case 'transfer-eth':
                return (
                    <TransferEthForm
                        onAdd={(action) => {
                            onAddAction(action);
                            setSelectedTemplate(null);
                        }}
                        timelockAddress={timelockAddress}
                    />
                );
            case 'transfer-erc20':
                return (
                    <TransferErc20Form
                        onAdd={(action) => {
                            onAddAction(action);
                            setSelectedTemplate(null);
                        }}
                        timelockAddress={timelockAddress}
                        chainId={chainId}
                    />
                );
            case 'batch-transfer-eth':
                return (
                    <BatchTransferEthForm
                        onAdd={handleBatchAdd}
                        timelockAddress={timelockAddress}
                    />
                );
            case 'batch-transfer-erc20':
                return (
                    <BatchTransferErc20Form
                        onAdd={handleBatchAdd}
                        timelockAddress={timelockAddress}
                        chainId={chainId}
                    />
                );
            case 'update-voting-delay':
                return (
                    <UpdateVotingDelayForm
                        onAdd={(action) => {
                            onAddAction(action);
                            setSelectedTemplate(null);
                        }}
                        governorAddress={governorAddress}
                    />
                );
            case 'update-voting-period':
                return (
                    <UpdateVotingPeriodForm
                        onAdd={(action) => {
                            onAddAction(action);
                            setSelectedTemplate(null);
                        }}
                        governorAddress={governorAddress}
                    />
                );
            case 'update-proposal-threshold':
                return (
                    <UpdateProposalThresholdForm
                        onAdd={(action) => {
                            onAddAction(action);
                            setSelectedTemplate(null);
                        }}
                        governorAddress={governorAddress}
                    />
                );
            case 'update-quorum':
                return (
                    <UpdateQuorumForm
                        onAdd={(action) => {
                            onAddAction(action);
                            setSelectedTemplate(null);
                        }}
                        governorAddress={governorAddress}
                    />
                );
            case 'set-manager':
                return (
                    <SetManagerForm
                        onAdd={(action) => {
                            onAddAction(action);
                            setSelectedTemplate(null);
                        }}
                        governorAddress={governorAddress}
                        currentManager={currentManager}
                    />
                );
            case 'custom':
                return (
                    <CustomActionForm
                        onAdd={(action) => {
                            onAddAction(action);
                            setSelectedTemplate(null);
                        }}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="action-builder">
            {/* Existing Actions */}
            {actions.length > 0 && (
                <div className="action-list">
                    <h4 className="action-list-title">Proposal Actions ({actions.length})</h4>
                    {actions.map((action, index) => (
                        <div key={index} className="action-item">
                            <div className="action-item-header">
                                <span className="action-index">#{index + 1}</span>
                                <span className="action-description">{action.description}</span>
                                <button
                                    type="button"
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => onRemoveAction(index)}
                                    title="Remove action"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="action-item-details">
                                <div className="detail-row">
                                    <span className="detail-label">Target:</span>
                                    <code className="detail-value">{action.target}</code>
                                </div>
                                {action.value > 0n && (
                                    <div className="detail-row">
                                        <span className="detail-label">Value:</span>
                                        <span className="detail-value">{(Number(action.value) / 1e18).toFixed(6)} ETH</span>
                                    </div>
                                )}
                                {action.calldata !== '0x' && (
                                    <div className="detail-row">
                                        <span className="detail-label">Calldata:</span>
                                        <code className="detail-value calldata-preview">
                                            {action.calldata.length > 66
                                                ? `${action.calldata.slice(0, 66)}...`
                                                : action.calldata}
                                        </code>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Template Selector or Form */}
            {selectedTemplate ? (
                <div className="template-form-container">
                    <div className="template-form-header">
                        <h4>
                            {ACTION_TEMPLATES.find((t) => t.type === selectedTemplate)?.icon}{' '}
                            {ACTION_TEMPLATES.find((t) => t.type === selectedTemplate)?.label}
                        </h4>
                        <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSelectedTemplate(null)}
                        >
                            Cancel
                        </button>
                    </div>
                    {renderTemplateForm()}
                </div>
            ) : (
                <div className="template-selector">
                    <h4 className="template-selector-title">Add Action</h4>
                    <div className="template-grid">
                        {ACTION_TEMPLATES.map((template) => (
                            <button
                                key={template.type}
                                type="button"
                                className="template-card"
                                onClick={() => setSelectedTemplate(template.type)}
                            >
                                <span className="template-icon">{template.icon}</span>
                                <span className="template-label">{template.label}</span>
                                <span className="template-description">{template.description}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
