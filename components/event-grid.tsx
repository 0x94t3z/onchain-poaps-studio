'use client'
import { useReadContract,useReadContracts } from 'wagmi'; import { poapAbi } from '@/lib/abi'; import { CONTRACT } from '@/lib/constants'; import { decodeMetadata } from '@/lib/metadata'; import { EventCard } from './event-card'
export function EventGrid({owner}:{owner?:`0x${string}`}){
 const total=useReadContract({address:CONTRACT,abi:poapAbi,functionName:'totalEvents'}); const count=Number(total.data??0n); const ids=Array.from({length:count+1},(_,i)=>BigInt(count-i))
 const events=useReadContracts({contracts:ids.map(id=>({address:CONTRACT,abi:poapAbi,functionName:'events',args:[id]} as const))}); const uris=useReadContracts({contracts:ids.map(id=>({address:CONTRACT,abi:poapAbi,functionName:'uri',args:[id]} as const))}); const balances=useReadContracts({contracts:owner?ids.map(id=>({address:CONTRACT,abi:poapAbi,functionName:'balanceOf',args:[owner,id]} as const)):[]})
 if(total.isLoading||events.isLoading||uris.isLoading) return <div className="empty">Reading the collection from Base Sepolia…</div>
 const cards=ids.flatMap((id,i)=>{try{if(owner&&balances.data?.[i]?.result===0n)return[];const e=events.data?.[i]?.result;const uri=uris.data?.[i]?.result;if(!e||!uri)return[];return [<EventCard key={id.toString()} id={id} meta={decodeMetadata(uri as string)} publicMint={(e as any)[10]} soulbound={(e as any)[9]}/>]}catch{return[]}})
 return cards.length?<div className="grid">{cards}</div>:<div className="empty">No POAPs found here yet.</div>
}
