import { formatAddress } from '../../utils/format';
import { getExplorerUrl } from '../../utils/constants';

interface AddressLinkProps {
    address: string;
    chainId: number;
    type?: 'address' | 'tx';
    showFull?: boolean;
}

export function AddressLink({
    address,
    chainId,
    type = 'address',
    showFull = false,
}: AddressLinkProps) {
    const url = getExplorerUrl(chainId, type, address);
    const displayAddress = showFull ? address : formatAddress(address);

    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="address-link"
            title={address}
        >
            {displayAddress}
            <svg
                className="address-link-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
            >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
        </a>
    );
}
