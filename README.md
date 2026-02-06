# dao.cafe Demo

A demonstration application showcasing the capabilities of [daocafe-sdk](https://dao.cafe/docs/sdk) and the [DAO Indexer](https://dao.cafe/docs).

**🌐 Live Demo:** [demo.dao.cafe](https://demo.dao.cafe)

## Features

- **DAO Discovery** - Browse all indexed DAOs across Ethereum and Sepolia networks
- **Proposal Management** - View proposals, vote distribution, and voting history
- **Proposal Creation** - Create proposals with IPFS metadata storage
- **Voting Interface** - Cast votes with optional on-chain reasons
- **Wallet Integration** - Connect via injected wallets (MetaMask, etc.)
- **Transaction Simulation** - Preview proposal actions via Tenderly before submission

## Tech Stack

- React 19 + TypeScript + Vite
- [daocafe-sdk](https://www.npmjs.com/package/daocafe-sdk) - GraphQL SDK for DAO data
- [wagmi](https://wagmi.sh/) + [viem](https://viem.sh/) - Ethereum interactions
- [TanStack Query](https://tanstack.com/query) - Data fetching and caching

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your environment variables (see below)
# Then start the development server
npm run dev
```

## Environment Variables

Create a `.env` file based on `.env.example`:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_TENDERLY_API_URL` | No | Tenderly API URL for transaction simulation |
| `VITE_TENDERLY_API_KEY` | No | Tenderly API key |

## Docker Deployment

For production deployment alongside the [DAO Indexer](https://github.com/dikobay/daocafe-indexer):

```bash
# Clone the repo
git clone https://github.com/dikobay/daocafe-demo.git demo
cd demo

# Create .env with your production values
cp .env.example .env
# Edit .env with your Tenderly credentials

# Build and start (requires indexer network to be running)
docker compose up -d --build
```

> **Note:** The demo container connects to the indexer's Docker network (`indexer_app-network`). Make sure the indexer is running first.

## Documentation


- **SDK Docs:** [dao.cafe/docs/sdk](https://dao.cafe/docs/sdk)
- **Indexer API:** [dao.cafe/docs](https://dao.cafe/docs)
- **GraphQL Playground:** [dao.cafe/graphql](https://dao.cafe/graphql)

## License

MIT
