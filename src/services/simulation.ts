// Tenderly simulation service for proposal action simulation

import type { ProposalAction, SimulationResult, StateChange } from '../types/proposal';
import { encodeFunctionData, keccak256, toHex } from 'viem';

// Tenderly configuration from environment variables
const TENDERLY_API_URL = import.meta.env.VITE_TENDERLY_API_URL;
const TENDERLY_API_KEY = import.meta.env.VITE_TENDERLY_API_KEY;

// Governor execute ABI for full execution simulation
const GOVERNOR_EXECUTE_ABI = [
    {
        type: 'function',
        name: 'execute',
        inputs: [
            { name: 'targets', type: 'address[]' },
            { name: 'values', type: 'uint256[]' },
            { name: 'calldatas', type: 'bytes[]' },
            { name: 'descriptionHash', type: 'bytes32' },
        ],
        outputs: [{ name: 'proposalId', type: 'uint256' }],
        stateMutability: 'payable',
    },
] as const;

interface TenderlySimulationRequest {
    network_id: string;
    from: string;
    to: string;
    input: string;
    value: string;
    save: boolean;
    save_if_fails: boolean;
    simulation_type: 'full' | 'quick';
}

interface TenderlyStateChange {
    address: string;
    key?: string;
    original?: string;
    dirty?: string;
    raw?: {
        address: string;
        key: string;
        original: string;
        dirty: string;
    }[];
}

interface TenderlyAssetChange {
    token_info?: {
        symbol: string;
        decimals: number;
        name: string;
        contract_address: string;
    };
    type: string;
    from: string;
    to: string;
    amount: string;
    dollar_value?: string;
}

interface TenderlySimulationResponse {
    simulation: {
        status: boolean;
        gas_used: number;
        error_message?: string;
    };
    transaction: {
        status: boolean;
        gas_used: number;
        error_message?: string;
        transaction_info?: {
            state_diff?: TenderlyStateChange[];
            asset_changes?: TenderlyAssetChange[];
            logs?: {
                name?: string;
                raw?: { address: string; topics: string[]; data: string };
            }[];
        };
    };
}

/**
 * Map chain ID to Tenderly network ID
 */
function getNetworkId(chainId: number): string {
    const networkMap: Record<number, string> = {
        1: '1',        // Ethereum Mainnet
        8453: '8453',  // Base
        11155111: '11155111', // Sepolia
    };
    return networkMap[chainId] || String(chainId);
}

/**
 * Parse Tenderly state changes into human-readable format
 */
function parseStateChanges(response: TenderlySimulationResponse): StateChange[] {
    const changes: StateChange[] = [];
    const txInfo = response.transaction.transaction_info;

    if (!txInfo) return changes;

    // Parse asset changes (token transfers, ETH transfers)
    if (txInfo.asset_changes) {
        for (const change of txInfo.asset_changes) {
            if (change.type === 'Transfer') {
                const tokenSymbol = change.token_info?.symbol || 'ETH';
                const decimals = change.token_info?.decimals || 18;
                const amount = formatTokenAmount(change.amount, decimals);

                changes.push({
                    type: 'transfer',
                    description: `Transferred ${amount} ${tokenSymbol} from ${shortenAddress(change.from)} to ${shortenAddress(change.to)}`,
                    from: change.from,
                    to: change.to,
                    value: amount,
                    token: tokenSymbol,
                });
            }
        }
    }

    // Parse event logs for manager changes
    if (txInfo.logs) {
        for (const log of txInfo.logs) {
            if (log.name === 'ManagerChanged' && log.raw) {
                // ManagerChanged(address indexed previousManager, address indexed newManager)
                const topics = log.raw.topics;
                if (topics.length >= 3) {
                    const previousManager = '0x' + topics[1].slice(-40);
                    const newManager = '0x' + topics[2].slice(-40);
                    changes.push({
                        type: 'manager',
                        description: `Manager changed from ${shortenAddress(previousManager)} to ${shortenAddress(newManager)}`,
                        from: previousManager,
                        to: newManager,
                    });
                }
            }
        }
    }

    return changes;
}

/**
 * Format token amount with decimals
 */
function formatTokenAmount(amount: string, decimals: number): string {
    const value = BigInt(amount);
    const divisor = BigInt(10 ** decimals);
    const whole = value / divisor;
    const fraction = value % divisor;

    if (fraction === 0n) {
        return whole.toString();
    }

    const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
    return `${whole}.${fractionStr}`;
}

/**
 * Shorten address for display
 */
function shortenAddress(address: string): string {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Check if Tenderly simulation is configured
 */
export function isSimulationConfigured(): boolean {
    return !!(TENDERLY_API_URL && TENDERLY_API_KEY);
}

/**
 * Simulate a single transaction
 */
export async function simulateTransaction(
    chainId: number,
    from: string,
    to: string,
    value: bigint,
    data: string
): Promise<SimulationResult> {
    if (!TENDERLY_API_URL || !TENDERLY_API_KEY) {
        return {
            success: false,
            gasUsed: '0',
            error: 'Tenderly simulation is not configured. Set VITE_TENDERLY_API_URL and VITE_TENDERLY_API_KEY environment variables.',
            stateChanges: [],
        };
    }

    const request: TenderlySimulationRequest = {
        network_id: getNetworkId(chainId),
        from,
        to,
        input: data,
        value: value.toString(),
        save: false,
        save_if_fails: false,
        simulation_type: 'full',
    };

    try {
        const response = await fetch(`${TENDERLY_API_URL}/simulate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Access-Key': TENDERLY_API_KEY,
            },
            body: JSON.stringify(request),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Simulation request failed: ${error}`);
        }

        const result: TenderlySimulationResponse = await response.json();

        return {
            success: result.transaction.status,
            gasUsed: result.transaction.gas_used.toString(),
            error: result.transaction.error_message,
            stateChanges: parseStateChanges(result),
        };
    } catch (error) {
        return {
            success: false,
            gasUsed: '0',
            error: error instanceof Error ? error.message : 'Unknown error',
            stateChanges: [],
        };
    }
}

/**
 * Check if any actions are calling back into the governor (self-modifying actions)
 * These need special simulation through Governor.execute() to populate the governance call queue
 */
function hasGovernorSelfCalls(actions: ProposalAction[], governorAddress: string): boolean {
    return actions.some(action => 
        action.target.toLowerCase() === governorAddress.toLowerCase()
    );
}

/**
 * Simulate all proposal actions through the full Governor.execute() flow
 * This properly initializes the governance call queue for onlyGovernance functions
 */
export async function simulateProposalExecute(
    chainId: number,
    governorAddress: string,
    timelockAddress: string,
    actions: ProposalAction[],
    description: string
): Promise<SimulationResult> {
    // Encode the Governor.execute() call
    const targets = actions.map(a => a.target);
    const values = actions.map(a => a.value);
    const calldatas = actions.map(a => a.calldata);
    const descriptionHash = keccak256(toHex(description));

    const executeCalldata = encodeFunctionData({
        abi: GOVERNOR_EXECUTE_ABI,
        functionName: 'execute',
        args: [targets, values, calldatas, descriptionHash],
    });

    // Simulate from timelock calling Governor.execute()
    // The timelock is the one that would actually call execute() after the delay
    return await simulateTransaction(
        chainId,
        timelockAddress,
        governorAddress,
        0n,
        executeCalldata
    );
}

/**
 * Simulate all proposal actions as if executed by the timelock
 * 
 * This function intelligently detects if actions are calling back into the Governor
 * (self-modifying actions like governance parameter updates) and simulates them
 * through the proper Governor.execute() flow to avoid the onlyGovernance queue error.
 * 
 * For regular actions (transfers, external calls), it simulates them individually.
 */
export async function simulateProposalActions(
    chainId: number,
    governorAddress: string,
    timelockAddress: string,
    actions: ProposalAction[],
    description: string = 'Simulation Test'
): Promise<SimulationResult[]> {
    // Check if any actions are self-modifying (calling back into the governor)
    if (hasGovernorSelfCalls(actions, governorAddress)) {
        // Simulate through full Governor.execute() to populate governance call queue
        const fullExecutionResult = await simulateProposalExecute(
            chainId,
            governorAddress,
            timelockAddress,
            actions,
            description
        );

        // Return one result per action with the same outcome
        // (since they all execute together in one transaction)
        return actions.map(() => ({
            ...fullExecutionResult,
            // Distribute gas evenly across actions for display purposes
            gasUsed: Math.floor(Number(fullExecutionResult.gasUsed) / actions.length).toString(),
        }));
    }

    // For non-self-modifying actions, simulate individually as before
    const results: SimulationResult[] = [];
    for (const action of actions) {
        const result = await simulateTransaction(
            chainId,
            timelockAddress,
            action.target,
            action.value,
            action.calldata
        );
        results.push(result);
    }

    return results;
}

/**
 * Get overall simulation status
 */
export function getOverallSimulationStatus(results: SimulationResult[]): {
    allSuccessful: boolean;
    totalGas: string;
    failedCount: number;
} {
    let allSuccessful = true;
    let totalGas = 0n;
    let failedCount = 0;

    for (const result of results) {
        if (!result.success) {
            allSuccessful = false;
            failedCount++;
        }
        totalGas += BigInt(result.gasUsed);
    }

    return {
        allSuccessful,
        totalGas: totalGas.toString(),
        failedCount,
    };
}
