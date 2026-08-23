import {NextResponse} from 'next/server'
export function GET(){
 const url=(process.env.NEXT_PUBLIC_APP_URL||'http://localhost:3000').replace(/\/$/,'')
 const association=process.env.FARCASTER_HEADER&&process.env.FARCASTER_PAYLOAD&&process.env.FARCASTER_SIGNATURE?{accountAssociation:{header:process.env.FARCASTER_HEADER,payload:process.env.FARCASTER_PAYLOAD,signature:process.env.FARCASTER_SIGNATURE}}:{}
 return NextResponse.json({...association,miniapp:{version:'1',name:'Onchain POAPs',homeUrl:url,iconUrl:`${url}/icon.png`,splashImageUrl:`${url}/splash.png`,splashBackgroundColor:'#eeff41',subtitle:'Memories that live forever',description:'Create, distribute and collect fully onchain POAPs on Base.',primaryCategory:'art-creativity',tags:['poap','base','events','onchain'],heroImageUrl:`${url}/api/og`,tagline:'Keep the moment onchain',ogTitle:'Onchain POAPs',ogDescription:'Every pixel. Every memory. Forever.',ogImageUrl:`${url}/api/og`,canonicalDomain:new URL(url).hostname,requiredChains:['eip155:84532'],requiredCapabilities:['wallet.getEthereumProvider']}})
}
