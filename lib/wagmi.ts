'use client'
import { createConfig, http } from 'wagmi'
import { baseSepolia } from 'wagmi/chains'
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors'
const connectors:any[]=[injected(),coinbaseWallet({appName:'Onchain POAPs Studio'})]
if(process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID) connectors.push(walletConnect({projectId:process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID}))
export const config=createConfig({chains:[baseSepolia],connectors,transports:{[baseSepolia.id]:http(process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org')},ssr:true})
