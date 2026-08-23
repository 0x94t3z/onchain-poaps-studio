'use client'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import type { ContractFunctionArgs, ContractFunctionName } from 'viem'
import { poapAbi } from '@/lib/abi'; import { CONTRACT, explorer } from '@/lib/constants'
export function TxButton<T extends ContractFunctionName<typeof poapAbi,'nonpayable'>>({name,args,label,disabled,onSuccess}:{name:T,args:ContractFunctionArgs<typeof poapAbi,'nonpayable',T>,label:string,disabled?:boolean,onSuccess?:()=>void}){
 const {writeContract,data,error,isPending}=useWriteContract(); const receipt=useWaitForTransactionReceipt({hash:data})
 if(receipt.isSuccess) return <div className="success">Confirmed onchain · <a target="_blank" href={explorer(`tx/${data}`)}>View transaction ↗</a></div>
 return <div><button className="button wide" disabled={disabled||isPending||receipt.isLoading} onClick={()=>writeContract({address:CONTRACT,abi:poapAbi,functionName:name,args} as any,{onSuccess})}>{isPending?'Confirm in wallet':receipt.isLoading?'Confirming…':label}</button>{error&&<p className="error">{error.message.split('\n')[0]}</p>}</div>
}
