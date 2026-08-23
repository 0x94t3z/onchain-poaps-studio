'use client'
import { createConfig, http } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { coinbaseWallet, injected } from 'wagmi/connectors'
import { farcasterMiniApp } from '@farcaster/miniapp-wagmi-connector'

// The host wallet must be first so Farcaster can connect without a browser
// wallet picker. Injected and Coinbase connectors keep the standalone app useful.
const connectors = [
  farcasterMiniApp(),
  injected(),
  coinbaseWallet({ appName: 'Onchain POAPs Studio' }),
]

export const config=createConfig({chains:[baseSepolia],connectors,transports:{[baseSepolia.id]:http(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org')},ssr:true})
