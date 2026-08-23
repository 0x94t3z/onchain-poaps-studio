import { baseSepolia } from 'viem/chains'
import type { Address } from 'viem'

export const chain = baseSepolia
export const CONTRACT = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0xC3249356a483fbe17d5355D39105D2eA666d9de6') as Address
export const ZERO_ROOT = `0x${'0'.repeat(64)}` as const
export const CREATOR_WINDOW = 30 * 24 * 60 * 60
export const SIGNATURE_WINDOW = 37 * 24 * 60 * 60
export const explorer = (path: string) => `https://sepolia.basescan.org/${path}`
export const opensea = (id: bigint | string) => `https://testnets.opensea.io/assets/base_sepolia/${CONTRACT}/${id}`
