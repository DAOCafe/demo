import { Link, NavLink } from 'react-router-dom';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { formatAddress } from '../../utils/format';

export function Header() {
    const { address, isConnected } = useAccount();
    const { connect, connectors } = useConnect();
    const { disconnect } = useDisconnect();

    const handleConnect = () => {
        const injected = connectors.find((c) => c.id === 'injected');
        if (injected) {
            connect({ connector: injected });
        }
    };

    return (
        <header className="header">
            <div className="header-inner">
                <Link to="/" className="header-logo">
                    <div className="header-logo-icon">☕</div>
                    <span>DAO.CAFE</span>
                </Link>

                <nav className="header-nav">
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            `header-nav-link ${isActive ? 'active' : ''}`
                        }
                    >
                        DAOs
                    </NavLink>
                    {isConnected && (
                        <NavLink
                            to="/profile"
                            className={({ isActive }) =>
                                `header-nav-link ${isActive ? 'active' : ''}`
                            }
                        >
                            Profile
                        </NavLink>
                    )}
                </nav>

                <div className="header-actions">
                    {isConnected ? (
                        <button className="wallet-btn" onClick={() => disconnect()}>
                            <span className="wallet-btn-dot" />
                            {formatAddress(address!)}
                        </button>
                    ) : (
                        <button className="btn btn-primary" onClick={handleConnect}>
                            Connect Wallet
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}
