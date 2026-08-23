'use client'
import { useAccount,useConnect,useDisconnect,useSwitchChain } from 'wagmi'
import { chain } from '@/lib/constants'
import { short } from '@/lib/metadata'
export function WalletButton(){
 const {address,isConnected,chainId}=useAccount(); const {connect,connectors,isPending}=useConnect(); const {disconnect}=useDisconnect(); const {switchChain}=useSwitchChain()
 if(isConnected&&address) return chainId!==chain.id?<button className="button warn" onClick={()=>switchChain({chainId:chain.id})}>Switch to Base Sepolia</button>:<button className="button secondary" onClick={()=>disconnect()}>{short(address)}</button>
 return <button className="button" disabled={isPending} onClick={()=>connect({connector:connectors[0]})}>{isPending?'Connecting…':'Connect wallet'}</button>
}
