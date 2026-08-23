'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletButton } from './wallet-button'
const links=[['/explore','Explore'],['/create','Create'],['/gallery','Gallery'],['/docs','Docs']]
export function Header(){const path=usePathname();return <header><Link href="/" className="brand"><span className="brandmark">O</span><span>ONCHAIN<br/>POAPS</span></Link><nav>{links.map(([href,label])=><Link className={path.startsWith(href)?'active':''} key={href} href={href}>{label}</Link>)}</nav><WalletButton/></header>}
