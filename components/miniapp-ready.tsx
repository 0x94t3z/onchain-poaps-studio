'use client'
import {useEffect} from 'react'
export function MiniAppReady(){useEffect(()=>{import('@farcaster/miniapp-sdk').then(({sdk})=>sdk.actions.ready()).catch(()=>{})},[]);return null}
