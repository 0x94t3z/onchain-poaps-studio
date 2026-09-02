import { concat, getAddress, keccak256, type Address, type Hex } from 'viem'

export const addressLeaf=(address:Address)=>keccak256(address)
const pair=(a:Hex,b:Hex)=>keccak256(concat([a.toLowerCase()<b.toLowerCase()?a:b,a.toLowerCase()<b.toLowerCase()?b:a]))
export function normalizeAddresses(input:string): Address[]{
  const values=input.split(/[\s,;]+/).map(x=>x.trim()).filter(Boolean)
  const unique=new Map<string,Address>()
  for(const value of values){ const address=getAddress(value); unique.set(address.toLowerCase(),address) }
  return [...unique.values()]
}
export function buildTree(addresses:Address[]){
  if(!addresses.length) throw new Error('Add at least one address')
  const leaves=addresses.map(addressLeaf).sort((a,b)=>a.localeCompare(b))
  const levels:Hex[][]=[leaves]
  while(levels.at(-1)!.length>1){
    const prev=levels.at(-1)!; const next:Hex[]=[]
    for(let i=0;i<prev.length;i+=2) next.push(i+1<prev.length?pair(prev[i],prev[i+1]):prev[i])
    levels.push(next)
  }
  const proofFor=(address:Address)=>{
    let index=leaves.indexOf(addressLeaf(address)); if(index<0) throw new Error('Address is not in this list')
    const proof:Hex[]=[]
    for(let l=0;l<levels.length-1;l++){ const sibling=index%2?index-1:index+1; if(sibling<levels[l].length) proof.push(levels[l][sibling]); index=Math.floor(index/2) }
    return proof
  }
  return {root:levels.at(-1)![0],proofFor,entries:addresses.map(address=>({address,proof:proofFor(address)}))}
}

export function verifyProof(address:Address,proof:Hex[],root:Hex){
  try {
    if(!/^0x[0-9a-fA-F]{64}$/.test(root)) return false
    let node=addressLeaf(getAddress(address))
    for(const sibling of proof){
      if(!/^0x[0-9a-fA-F]{64}$/.test(sibling)) return false
      node=pair(node,sibling)
    }
    return node.toLowerCase()===root.toLowerCase()
  } catch {
    return false
  }
}
