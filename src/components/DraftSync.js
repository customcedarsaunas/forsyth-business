import React,{useEffect,useRef,useState} from 'react';
import {AppState} from 'react-native';
import {cloud,authenticatedUser} from '../lib/cloud';
import {mergeAssistantDraftsResult} from '../lib/assistantDrafts';
import {Small} from './ui';
export function DraftSync({setState}){
 const [status,setStatus]=useState('Sign in under More to receive assistant drafts.');
 const owner=useRef(null),inFlight=useRef(false),alive=useRef(true);
 useEffect(()=>{
  alive.current=true;let timer;
  const sync=async()=>{
   if(!alive.current||inFlight.current||!owner.current||AppState.currentState&&AppState.currentState!=='active')return;
   const expected=owner.current;inFlight.current=true;
   try{
    const user=await authenticatedUser();if(user.id!==expected)return;
    // The owner-only SELECT policy is the authorization boundary.
    const {data,error}=await cloud.from('assistant_drafts').select('id,user_id,payload,created_at').eq('user_id',expected).order('created_at',{ascending:true});if(error)throw error;
    const latest=await cloud.auth.getSession();if(!alive.current||owner.current!==expected||latest.data.session?.user.id!==expected)return;
    setState(current=>{
     if(!current||owner.current!==expected||!alive.current)return current;
     return mergeAssistantDraftsResult(current,data||[],expected).state;
    });
    const invalid=(data||[]).some(row=>{try{return mergeAssistantDraftsResult({schemaVersion:2,brands:[{id:'jfe'},{id:'sauna'}],settings:{invoicePrefix:'INV',estimatePrefix:'EST'},customers:[],jobs:[],documents:[]},[row],expected).errors.length>0}catch{return true}});
    setStatus(invalid?'Some assistant drafts need correction. Valid drafts have been received.':'Assistant drafts checked. New drafts appear in Invoices or Estimates.');
   }catch(error){if(alive.current&&owner.current===expected)setStatus('Draft sync paused: '+String(error.message||error));}
   finally{inFlight.current=false;}
  };
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(sync,0)};
  let authChanged=false;
  cloud.auth.getSession().then(({data})=>{if(alive.current&&!authChanged){owner.current=data.session?.user.id||null;if(owner.current)schedule()}});
  const {data:{subscription}}=cloud.auth.onAuthStateChange((_event,session)=>{authChanged=true;owner.current=session?.user.id||null;if(owner.current)schedule();else setStatus('Sign in under More to receive assistant drafts.')});
  const foreground=AppState.addEventListener('change',s=>{if(s==='active')schedule()});
  const interval=setInterval(sync,30000);
  return()=>{alive.current=false;owner.current=null;clearTimeout(timer);clearInterval(interval);subscription.unsubscribe();foreground.remove()};
 },[setState]);
 return <Small style={{paddingHorizontal:20,paddingVertical:6}}>{status}</Small>;
}
