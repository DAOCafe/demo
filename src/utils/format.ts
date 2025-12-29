/**
 * Truncate an address for display
 */
export const formatAddress = (address: string, chars = 4): string => {
    if (!address) return '';
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
};

/**
 * Format a BigInt token amount to a readable number
 */
export const formatTokenAmount = (value: string | bigint, decimals = 18): string => {
    if (!value) return '0';
    const bigValue = typeof value === 'string' ? BigInt(value) : value;
    const divisor = BigInt(10 ** decimals);
    const whole = bigValue / divisor;
    const remainder = bigValue % divisor;

    // Get first 2 decimal places
    const decimalStr = remainder.toString().padStart(decimals, '0').slice(0, 2);

    if (decimalStr === '00' || remainder === 0n) {
        return formatNumber(whole);
    }

    return `${formatNumber(whole)}.${decimalStr}`;
};

/**
 * Format a number with commas
 */
export const formatNumber = (value: number | bigint | string): string => {
    const num = typeof value === 'bigint' ? Number(value) : Number(value);
    return num.toLocaleString('en-US');
};

/**
 * Format a timestamp to relative time
 */
export const formatTimeAgo = (timestamp: string | number): string => {
    const now = Date.now();
    const time = typeof timestamp === 'string' ? Number(timestamp) * 1000 : timestamp;
    const diff = now - time;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
};

/**
 * Format a timestamp to time until
 */
export const formatTimeUntil = (timestamp: string | number): string => {
    const now = Date.now();
    const time = typeof timestamp === 'string' ? Number(timestamp) * 1000 : timestamp;
    const diff = time - now;

    if (diff <= 0) return 'ended';

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d left`;
    if (hours > 0) return `${hours}h left`;
    if (minutes > 0) return `${minutes}m left`;
    return 'ending soon';
};

/**
 * Format seconds to human-readable time
 * Note: DAOGovernor uses CLOCK_MODE=timestamp, so votingDelay/votingPeriod are in seconds
 */
export const formatSeconds = (seconds: string | number): string => {
    const num = Number(seconds);
    const minutes = Math.floor(num / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    if (minutes > 0) return `${minutes}m`;
    return `${num}s`;
};

// Alias for backwards compatibility
export const formatBlocks = formatSeconds;
