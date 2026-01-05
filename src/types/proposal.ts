// Proposal-related TypeScript types

export interface ProposalAction {
    /** Target contract address */
    target: `0x${string}`;
    /** ETH value to send (in wei) */
    value: bigint;
    /** Encoded function calldata */
    calldata: `0x${string}`;
    /** Human-readable description of the action */
    description: string;
}

export type ActionTemplateType =
    | 'transfer-eth'
    | 'transfer-erc20'
    | 'set-manager'
    | 'custom';

export interface ActionTemplateOption {
    type: ActionTemplateType;
    label: string;
    description: string;
    icon: string;
}

// Simulation result types
export interface SimulationResult {
    success: boolean;
    gasUsed: string;
    error?: string;
    stateChanges: StateChange[];
}

export interface StateChange {
    type: 'balance' | 'storage' | 'manager' | 'transfer';
    description: string;
    from?: string;
    to?: string;
    value?: string;
    token?: string;
}

// Form state for proposal creation
export interface ProposalFormState {
    title: string;
    description: string;
    actions: ProposalAction[];
}

// Step in the proposal creation wizard
export type ProposalStep = 'details' | 'actions' | 'review' | 'submit';
