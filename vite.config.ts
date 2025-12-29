import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Web3 libraries (largest dependencies)
          'web3-core': ['viem'],
          'web3-wagmi': ['wagmi', '@wagmi/core', '@wagmi/connectors'],
          // Data layer
          'query': ['@tanstack/react-query'],
          // Charts (only loaded on pages that use them)
          'charts': ['recharts'],
          // Markdown rendering
          'markdown': ['react-markdown', 'remark-gfm'],
        },
      },
    },
  },
})
