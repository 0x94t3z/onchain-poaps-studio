'use client'
import { QueryClient,QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { config } from '@/lib/wagmi'
import { useState } from 'react'
export function Providers({children}:{children:React.ReactNode}){const [client]=useState(()=>new QueryClient());return <WagmiProvider config={config}><QueryClientProvider client={client}>{children}</QueryClientProvider></WagmiProvider>}
