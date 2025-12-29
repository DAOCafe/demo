import { getChainName, getChainColor } from '../../utils/constants';

interface ChainBadgeProps {
    chainId: number;
}

export function ChainBadge({ chainId }: ChainBadgeProps) {
    const name = getChainName(chainId);
    const color = getChainColor(chainId);

    return (
        <span
            className="badge badge-chain"
            style={{ borderColor: color, color: color }}
        >
            {name}
        </span>
    );
}
