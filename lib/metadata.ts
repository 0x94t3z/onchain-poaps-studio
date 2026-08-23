export type Metadata = { name:string; description:string; image:string; external_url?:string; attributes?:Array<{trait_type:string;value:string|number}> }
export function decodeMetadata(uri:string): Metadata {
  const prefix='data:application/json;base64,'
  if (!uri.startsWith(prefix)) throw new Error('Unsupported token metadata URI')
  return JSON.parse(atob(uri.slice(prefix.length)))
}
export const short = (value:string, n=5) => `${value.slice(0,n+2)}…${value.slice(-n)}`
export function deadline(createdAt:bigint, days:number){ return Number(createdAt) + days*86400 }
export function remaining(until:number){
  const seconds=until-Math.floor(Date.now()/1000)
  if(seconds<=0) return 'Expired'
  const d=Math.floor(seconds/86400), h=Math.floor((seconds%86400)/3600)
  return d ? `${d}d ${h}h left` : `${h}h left`
}
