import React,{useEffect,useMemo,useRef,useState} from "react";
import {SafeAreaView,View,Text,ScrollView,TouchableOpacity,Modal,Alert,StyleSheet,StatusBar} from "react-native";
import {cloud,backupState,restoreState} from "./src/lib/cloud";
import {Contact} from "expo-contacts";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import {loadState,saveState,resetState} from "./src/lib/store";
import {money,documentTotals,jobSummary,yearSummary,round2} from "./src/lib/calc";
import {shareDocument} from "./src/lib/pdf";
import {H1,H2,Small,Card,Button,Field,Chip,Row,Pill,C,s} from "./src/components/ui";

const TABS=["Home","Invoices","Estimates","Expenses","Tax","More"];
const today=()=>new Date().toISOString().slice(0,10);

export default function App(){
  const [state,setState]=useState(null),[tab,setTab]=useState("Home"),[modal,setModal]=useState(null),[cloudStatus,setCloudStatus]=useState("Automatic backup is off"),[cloudIsBusy,setCloudIsBusy]=useState(false);
 const cloudPending=useRef(null),cloudRunning=useRef(false),cloudEnabled=useRef(null);
 cloudEnabled.current=state?.cloudBackupUserId||null;
  useEffect(()=>{loadState().then(setState)},[]);
  useEffect(()=>{if(state)saveState(state).catch(error=>Alert.alert("Could not save on this device",String(error.message||error)))},[state]);
  useEffect(()=>{
   if(!state?.cloudBackupUserId){cloudPending.current=null;setCloudStatus("Automatic backup is off");return;}
   const timer=setTimeout(async()=>{
    cloudPending.current=state;
    if(cloudRunning.current)return;
    cloudRunning.current=true;setCloudIsBusy(true);
    try{while(cloudPending.current){const next=cloudPending.current;cloudPending.current=null;setCloudStatus("Saving cloud backup…");await backupState(next,next.cloudBackupUserId);}setCloudStatus(cloudEnabled.current?"Cloud backup saved":"Automatic backup is off");}
    catch(error){cloudPending.current=null;setCloudStatus("Cloud backup failed: "+String(error.message||error));}
    finally{cloudRunning.current=false;setCloudIsBusy(false);}
   },1000);
   return()=>clearTimeout(timer);
  },[state]);

  if(!state) return <SafeAreaView style={styles.center}><Text>Loading Forsyth Business…</Text></SafeAreaView>;
  const brand=state.brands.find(b=>b.id===state.activeBrandId)||state.brands[0];
  const outstanding=state.documents.filter(d=>d.type==="invoice").reduce((sum,d)=>sum+Math.max(0,documentTotals(d,state.settings).balance),0);
  return <SafeAreaView style={styles.safe}>
    <StatusBar barStyle="dark-content"/>
    <View style={styles.owedBar}><Text style={styles.owedLabel}>TOTAL OWED TO YOU</Text><Text style={styles.owedAmount}>{money(outstanding)}</Text></View>
    <View style={styles.header}><View><Text style={styles.brandTag}>{brand.division}</Text><Text style={styles.brandName}>{brand.displayName}</Text></View>
      <TouchableOpacity onPress={()=>setModal({kind:"brand"})} style={styles.switch}><Text style={styles.switchTxt}>Switch</Text></TouchableOpacity></View>
    <ScrollView contentContainerStyle={styles.content}>
      {tab==="Home"&&<Home state={state} setModal={setModal} setTab={setTab} cloudStatus={cloudStatus}/>}
      {tab==="Jobs"&&<Jobs state={state} setModal={setModal}/>}
      {(tab==="Invoices"||tab==="Estimates")&&<Sales state={state} setState={setState} setModal={setModal} type={tab==="Invoices"?"invoice":"estimate"}/>}
      {tab==="Expenses"&&<Expenses state={state} setModal={setModal}/>}
      {tab==="Mileage"&&<Mileage state={state} setState={setState} setModal={setModal}/>}
      {tab==="Tax"&&<Reports state={state}/>}
      {tab==="More"&&<More state={state} setState={setState} setModal={setModal} setTab={setTab} cloudStatus={cloudStatus} cloudBusy={cloudIsBusy}/>}
    </ScrollView>
    <View style={styles.nav}>{TABS.map(x=><TouchableOpacity key={x} style={styles.navCell} onPress={()=>setTab(x)}><Text style={[styles.navText,tab===x&&styles.navOn]}>{x}</Text></TouchableOpacity>)}</View>
    {modal&&<ModalRouter state={state} setState={setState} modal={modal} close={()=>setModal(null)}/>}
  </SafeAreaView>
}

function Home({state,setModal,setTab}){
 const brand=state.brands.find(b=>b.id===state.activeBrandId)||state.brands[0];
 const brandJobs=new Set(state.jobs.filter(j=>j.brandId===brand.id).map(j=>j.id));
 const invoices=state.documents.filter(d=>d.type==="invoice"&&brandJobs.has(d.jobId));
 const received=invoices.reduce((sum,d)=>sum+documentTotals(d,state.settings).paid,0);
 const expenses=state.expenses.filter(e=>brandJobs.has(e.jobId)).reduce((sum,e)=>sum+(Number(e.netAmount??e.amount??0)+Number(e.gst||0)+Number(e.pst||0)),0);
 return <>
  <H1>{brand.displayName}</H1>
  <Card style={{marginTop:18,borderRadius:18,padding:18}}>
   <Row label="Revenue received" value={money(received)} bold/>
   <Row label="Expenses" value={money(expenses)} bold/>
   <Row label="Net" value={money(received-expenses)} bold/>
  </Card>
  <View style={{gap:18,marginTop:8}}>
   <TouchableOpacity style={styles.primaryHomeAction} onPress={()=>setModal({kind:"doc",type:"invoice"})}><Text style={styles.homeActionText}>+ New Invoice</Text></TouchableOpacity>
   <TouchableOpacity style={styles.secondaryHomeAction} onPress={()=>setModal({kind:"doc",type:"estimate"})}><Text style={styles.homeSecondaryText}>+ New Estimate</Text></TouchableOpacity>
   <TouchableOpacity style={styles.secondaryHomeAction} onPress={()=>setModal({kind:"brand"})}><Text style={styles.homeSecondaryText}>Switch Company</Text></TouchableOpacity>
  </View>
 </>;
}

function Metric({label,value}){return <Card style={styles.metric}><Small>{label}</Small><Text style={styles.metricVal}>{value}</Text></Card>}
function Action({t,f}){return <TouchableOpacity onPress={f} style={styles.action}><Text style={styles.actionTxt}>{t}</Text></TouchableOpacity>}

function Jobs({state,setModal}){
 return <><View style={styles.titleRow}><View><H1>Jobs</H1><Small>Each job keeps its sales, actual costs, payments, mileage and profit together.</Small></View><Button title="+ Job" small onPress={()=>setModal({kind:"job"})}/></View>
  {state.jobs.map(j=><JobCard key={j.id} state={state} job={j} detailed/> )}</>;
}
function JobCard({state,job,detailed}){
 const c=state.customers.find(x=>x.id===job.customerId),q=jobSummary(state,job.id);
 return <Card>
  <View style={styles.space}><View style={{flex:1}}><Text style={styles.cardTitle}>{job.name}</Text><Small>{c?.name}</Small></View><Pill text={job.status}/></View>
  <View style={styles.three}><Mini l="Sales" v={money(q.revenue)}/><Mini l="Costs" v={money(q.directCosts)}/><Mini l="Profit" v={money(q.profit)}/></View>
  {detailed&&<><Row label="Payments received" value={money(q.payments)}/><Row label="Mileage" value={`${round2(state.mileage.filter(m=>m.jobId===job.id).reduce((s,m)=>s+Number(m.km||0),0))} km`}/><Small>{job.notes}</Small></>}
 </Card>
}
const Mini=({l,v})=><View style={{flex:1}}><Small>{l}</Small><Text style={{fontWeight:"900",fontSize:15,marginTop:3}}>{v}</Text></View>;

function Sales({state,setState,setModal,type}){
 return <><H1>{type==="invoice"?"Invoices":"Estimates"}</H1><Small>Estimates → acceptance → deposits → change orders → progress/final invoices.</Small>
 <View style={[styles.actions,{marginTop:14}]}><Action t="+ Invoice" f={()=>setModal({kind:"doc",type:"invoice"})}/><Action t="+ Estimate" f={()=>setModal({kind:"doc",type:"estimate"})}/><Action t="+ Change" f={()=>setModal({kind:"doc",type:"change_order"})}/></View>
 <H2>Documents</H2>
 {state.documents.filter(d=>d.type===type&&d.brandId===state.activeBrandId).slice().reverse().map(d=><DocumentCard key={d.id} d={d} state={state} setState={setState} setModal={setModal}/>)}</>;
}
function DocumentCard({d,state,setState,setModal}){
 const [paymentAmount,setPaymentAmount]=useState("");
 const recordPayment=()=>{const amount=Number(paymentAmount);const balance=documentTotals(d,state.settings).balance;if(!Number.isFinite(amount)||amount<=0||amount>balance)return Alert.alert("Check payment","Enter a positive payment no larger than the balance.");const payments=[...(d.payments||[]),{id:String(Date.now()),date:today(),amount}];const updated={...d,payments,status:amount>=balance?"paid":"partial"};setState({...state,documents:state.documents.map(x=>x.id===d.id?updated:x)});setPaymentAmount("")};
 const job=state.jobs.find(j=>j.id===d.jobId),c=state.customers.find(x=>x.id===job?.customerId),t=documentTotals(d,state.settings);
 const statusTone=d.status==="paid"?"good":d.status==="draft"?"warn":"neutral";
 const doShare=async()=>{try{await shareDocument(state,d)}catch(e){Alert.alert("Could not create PDF",String(e.message||e))}};
 const markSent=()=>setState({...state,documents:state.documents.map(x=>x.id===d.id?{...x,status:x.type==="estimate"?"sent":"sent"}:x)});
 const accept=()=>setState({...state,documents:state.documents.map(x=>x.id===d.id?{...x,status:"accepted"}:x)});
 const invoiceFromEstimate=()=>{
   const next=state.documents.filter(x=>x.type==="invoice").length+1;
   const inv={...JSON.parse(JSON.stringify(d)),id:String(Date.now()),type:"invoice",number:`${state.settings.invoicePrefix}-${String(next).padStart(4,"0")}`,status:"draft",date:today(),payments:[]};
   setState({...state,documents:[...state.documents,inv]});
 };
 return <Card>
  <View style={styles.space}><View><Text style={styles.cardTitle}>{labelType(d.type)} {d.number}</Text><Small>{c?.name} · {job?.name}</Small></View><Pill text={d.status} tone={statusTone}/></View>
  <Text style={styles.bigMoney}>{money(t.total)}</Text><Small>Subtotal {money(t.subtotal)} · GST {money(t.gst)} · PST {money(t.pst)}</Small>
  {d.type==="invoice"&&<Small>Paid {money(t.paid)} · Balance {money(t.balance)}</Small>}
  {d.type==="invoice"&&t.balance>0&&<><Field label="Payment received" value={paymentAmount} onChangeText={setPaymentAmount} keyboardType="decimal-pad"/><Button title="Record payment" kind="soft" onPress={recordPayment}/></>}
  <View style={styles.inlineButtons}><Button title="Edit" kind="soft" small onPress={()=>setModal({kind:"doc",type:d.type,id:d.id})}/><Button title="PDF / Share" kind="soft" small onPress={doShare}/>{d.status==="draft"&&<Button title="Mark sent" small onPress={markSent}/>}
   {d.type==="estimate"&&d.status==="sent"&&<Button title="Accept" small onPress={accept}/>}
   {d.type==="estimate"&&d.status==="accepted"&&<Button title="Make invoice" small onPress={invoiceFromEstimate}/>}</View>
 </Card>
}
const labelType=t=>({invoice:"Invoice",estimate:"Estimate",change_order:"Change Order"}[t]||t);

function Expenses({state,setModal}){
 const totals={net:0,gst:0,pst:0}; state.expenses.forEach(e=>{totals.net+=Number(e.netAmount||e.amount||0);totals.gst+=Number(e.gst||0);totals.pst+=Number(e.pst||0)});
 return <><View style={styles.titleRow}><View><H1>Expenses</H1><Small>Attach every cost to a job when possible so profit stays real.</Small></View><Button title="+ Expense" small onPress={()=>setModal({kind:"expense"})}/></View>
 <Card><Row label="Net business expense" value={money(totals.net)}/><Row label="GST paid / potential ITC" value={money(totals.gst)}/><Row label="PST paid" value={money(totals.pst)}/></Card>
 {state.expenses.slice().reverse().map(e=><Card key={e.id}><View style={styles.space}><View><Text style={styles.cardTitle}>{e.vendor}</Text><Small>{e.category} · {e.date}</Small></View><Text style={styles.cardTitle}>{money(Number(e.netAmount||e.amount||0)+Number(e.gst||0)+Number(e.pst||0))}</Text></View><Small>{state.jobs.find(j=>j.id===e.jobId)?.name||"General business"}</Small></Card>)}</>;
}

function Mileage({state,setState,setModal}){
 const [tracking,setTracking]=useState(false), points=useRef([]), sub=useRef(null);
 const total=state.mileage.reduce((s,m)=>s+Number(m.km||0),0);
 const start=async()=>{
  const p=await Location.requestForegroundPermissionsAsync(); if(p.status!=="granted")return Alert.alert("Location permission needed");
  points.current=[]; setTracking(true);
  sub.current=await Location.watchPositionAsync({accuracy:Location.Accuracy.High,distanceInterval:20,timeInterval:10000},x=>points.current.push(x.coords));
 };
 const stop=()=>{
  sub.current?.remove(); sub.current=null; setTracking(false);
  let km=0; for(let i=1;i<points.current.length;i++) km+=hav(points.current[i-1],points.current[i]);
  if(km<=0)return Alert.alert("No trip distance recorded","You can add the trip manually.");
  setModal({kind:"mileage",prefill:round2(km)});
 };
 return <><H1>Mileage</H1><Small>Manual mileage works now. Start/stop tracking records a foreground trip while the app is open; production background tracking is separated for battery/privacy review.</Small>
 <Card><Text style={styles.bigMoney}>{round2(total)} km</Text><Small>Logged business mileage · value at your stored rate: {money(total*state.settings.mileageRate)}</Small><View style={{height:10}}/>{tracking?<Button title="Stop trip" kind="danger" onPress={stop}/>:<Button title="Start trip" onPress={start}/>}<View style={{height:8}}/><Button title="Add manual trip" kind="soft" onPress={()=>setModal({kind:"mileage"})}/></Card>
 {state.mileage.slice().reverse().map(m=><Card key={m.id}><View style={styles.space}><View><Text style={styles.cardTitle}>{m.purpose}</Text><Small>{m.date} · {state.jobs.find(j=>j.id===m.jobId)?.name||"General"}</Small></View><Text style={styles.cardTitle}>{m.km} km</Text></View></Card>)}</>;
}
function hav(a,b){const R=6371,rad=x=>x*Math.PI/180,dlat=rad(b.latitude-a.latitude),dlon=rad(b.longitude-a.longitude),x=Math.sin(dlat/2)**2+Math.cos(rad(a.latitude))*Math.cos(rad(b.latitude))*Math.sin(dlon/2)**2;return 2*R*Math.asin(Math.sqrt(x));}

function Reports({state}){
 const y=yearSummary(state);
 const cats={};state.expenses.forEach(e=>cats[e.category]=(cats[e.category]||0)+Number(e.netAmount||e.amount||0));
 return <><H1>Reports</H1><Small>Year-end dashboard designed for your accountant and tax prep, while keeping job-level numbers visible all year.</Small>
 <H2>Profit & loss</H2><Card><Row label="Revenue" value={money(y.revenue)}/><Row label="Business expenses" value={money(y.expenses)}/><Row label="Net income before tax" value={money(y.net)} bold/></Card>
 <H2>Sales tax</H2><Card><Row label="GST collected" value={money(y.gstCollected)}/><Row label="GST paid / potential ITCs" value={money(y.gstITC)}/><Row label="GST net snapshot" value={money(y.gstNet)} bold/><Row label="PST collected" value={money(y.pstCollected)}/><Row label="PST paid on expenses" value={money(y.pstPaid)}/></Card>
 <H2>Expenses by category</H2><Card>{Object.keys(cats).length?Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([k,v])=><Row key={k} label={k} value={money(v)}/>):<Small>No expenses entered yet.</Small>}</Card>
 <H2>Mileage & receivables</H2><Card><Row label="Business kilometres" value={`${y.km} km`}/><Row label="A/R outstanding" value={money(y.ar)}/></Card>
 <Card><Small>This is an operational tax summary. Before relying on the app as the only set of books, bank reconciliation, opening balances, asset/debt accounts, posting rules, and accountant-reviewed tax mappings need to be completed and tested.</Small></Card></>;
}

function More({state,setState,setModal,setTab,cloudStatus,cloudBusy}){
 return <><H1>More</H1><View style={styles.actions}><Action t="Jobs" f={()=>setTab("Jobs")}/><Action t="Mileage" f={()=>setTab("Mileage")}/><Action t="Assistant" f={()=>setModal({kind:"assistant"})}/></View>
 <H2>Business profiles</H2>{state.brands.map(b=><Card key={b.id}><View style={styles.space}><View style={{flex:1}}><Text style={styles.cardTitle}>{b.displayName}</Text><Small>{b.legalName}</Small><Small>GST/HST {b.gstNumber||"—"} · PST {b.pstNumber||"not entered"}</Small></View><Button title="Edit" kind="soft" small onPress={()=>setModal({kind:"brandEdit",id:b.id})}/></View></Card>)}
 <H2>Pricing defaults</H2><Card><Row label="Your labour" value={`${money(state.settings.labourRate)}/hr`}/><Row label="Helper" value={`${money(state.settings.helperRate)}/hr`}/><Row label="Material markup" value={`${state.settings.defaultMaterialMarkupPct}%`}/><Row label="Mileage value" value={`${money(state.settings.mileageRate)}/km`}/></Card>
 <H2>Catalog & vendors</H2><Card><Row label="Reusable products/services" value={String(state.catalog.length)}/><Row label="Vendors" value={String(state.vendors.length)}/><Small>Catalog stores selling price, internal cost, tax treatment and supplier separately so customer PDFs never expose your cost.</Small></Card>
 <H2>Banking</H2><Card><Text style={styles.cardTitle}>Secure bank feed adapter</Text><Small>The UI/data model is ready for imported bank transactions and reconciliation. A live Canadian bank connection requires a server-side banking provider and your consent; credentials will never be stored in the app source.</Small></Card>
 <CloudPanel state={state} setState={setState} cloudStatus={cloudStatus} cloudBusy={cloudBusy}/><H2>Backups & safety</H2><Card><Button title="Reset demo/local data" kind="danger" onPress={()=>Alert.alert("Reset app?","This deletes local app data.",[{text:"Cancel"},{text:"Reset",style:"destructive",onPress:async()=>{await resetState(); const x=await loadState();setState(x)}}])}/></Card>
 </>;
}

function CloudPanel({state,setState,cloudStatus,cloudBusy}){
 const [email,setEmail]=useState(""),[password,setPassword]=useState(""),[user,setUser]=useState(null),[busy,setBusy]=useState(false),[status,setStatus]=useState("");
 useEffect(()=>{let active=true;cloud.auth.getSession().then(({data})=>{if(active)setUser(data.session?.user||null)});const {data:{subscription}}=cloud.auth.onAuthStateChange((_event,session)=>setUser(session?.user||null));return()=>{active=false;subscription.unsubscribe()}},[]);
 const run=async(fn)=>{setBusy(true);try{await fn()}catch(error){setStatus(String(error.message||error));Alert.alert("Cloud action failed",String(error.message||error))}finally{setBusy(false)}};
 const login=()=>run(async()=>{const {error}=await cloud.auth.signInWithPassword({email:email.trim(),password});if(error)throw error;setPassword("");setStatus("Signed in. Local records stay on this device until you choose Backup or Restore.")});
 const signup=()=>run(async()=>{const {data,error}=await cloud.auth.signUp({email:email.trim(),password});if(error)throw error;setPassword("");setStatus(data.session?"Account created and signed in.":"Check your email to confirm your account, then sign in.")});
 const backup=()=>{if(cloudBusy)return;run(async()=>{await backupState(state);setStatus("Native app backup saved.")});};
 const restore=()=>{if(cloudBusy||state.cloudBackupUserId||cloudStatus==="Saving cloud backup…")return Alert.alert("Turn off automatic backup first","Wait until the save finishes before restoring.");Alert.alert("Restore cloud backup?","This replaces the records currently on this device. Existing prototype records are stored separately.",[{text:"Cancel",style:"cancel"},{text:"Restore",onPress:()=>run(async()=>{const restored=await restoreState();await saveState(restored);setState(restored);setStatus("Native app backup restored.")})}]);};
 return <><H2>Cloud account</H2><Card>{user?<><Small>Signed in as {user.email}</Small><Small>{cloudStatus}</Small><View style={{height:10}}/><Button title={state.cloudBackupUserId===user.id?"Turn off automatic backup":"Turn on automatic backup"} kind="soft" disabled={busy} onPress={()=>{if(state.cloudBackupUserId===user.id)setState({...state,cloudBackupUserId:null});else Alert.alert("Enable automatic backup?","The records on this device will replace this account’s native cloud backup. Restore an existing backup first if you need it.",[{text:"Cancel",style:"cancel"},{text:"Enable",onPress:()=>setState({...state,cloudBackupUserId:user.id})}])}}/><View style={{height:12}}/><Button title="Back up to cloud" disabled={busy} onPress={backup}/><View style={{height:10}}/><Button title="Restore cloud backup" kind="soft" disabled={busy} onPress={restore}/><View style={{height:10}}/><Button title="Sign out" kind="soft" disabled={busy} onPress={()=>run(async()=>{setState({...state,cloudBackupUserId:null});const {error}=await cloud.auth.signOut();if(error)throw error;setStatus("Signed out. Local app records remain on this device.")})}/></>:<><Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"/><Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none"/><Button title="Sign in" disabled={busy} onPress={login}/><View style={{height:10}}/><Button title="Create account" kind="soft" disabled={busy} onPress={signup}/></>}{status?<Small style={{marginTop:12}}>{status}</Small>:null}<Small style={{marginTop:12}}>Automatic backup uploads this device’s records when enabled. Restore is manual. Prototype records are separate.</Small></Card></>;
}

function ModalRouter({state,setState,modal,close}){
 const title={brand:"Choose business",doc:`New ${labelType(modal.type)}`,expense:"Add expense",mileage:"Log mileage",job:"New job",assistant:"Assistant",brandEdit:"Business profile"}[modal.kind]||"";
 return <Modal transparent animationType="slide" onRequestClose={close}><View style={styles.back}><View style={styles.sheet}><View style={styles.sheetHead}><Text style={styles.sheetTitle}>{title}</Text><TouchableOpacity onPress={close}><Text style={{fontWeight:"900"}}>Close</Text></TouchableOpacity></View><ScrollView contentContainerStyle={{paddingBottom:40}}>
  {modal.kind==="brand"&&<BrandPicker state={state} setState={setState} close={close}/>}
  {modal.kind==="doc"&&<DocForm state={state} setState={setState} type={modal.type} existing={state.documents.find(d=>d.id===modal.id)} close={close}/>}
  {modal.kind==="expense"&&<ExpenseForm state={state} setState={setState} close={close}/>}
  {modal.kind==="mileage"&&<MileageForm state={state} setState={setState} close={close} prefill={modal.prefill}/>}
  {modal.kind==="job"&&<JobForm state={state} setState={setState} close={close}/>}
  {modal.kind==="assistant"&&<AssistantForm state={state} setState={setState} close={close}/>}
  {modal.kind==="brandEdit"&&<BrandEdit state={state} setState={setState} id={modal.id} close={close}/>}
 </ScrollView></View></View></Modal>;
}
function BrandPicker({state,setState,close}){return <>{state.brands.map(b=><TouchableOpacity key={b.id} style={styles.pickCard} onPress={()=>{setState({...state,activeBrandId:b.id});close()}}><View style={styles.fakeLogo}><Text style={{color:"#fff",fontWeight:"900"}}>{b.division==="Contracting"?"JFE":"CCS"}</Text></View><View><Text style={styles.cardTitle}>{b.displayName}</Text><Small>{b.division}</Small></View></TouchableOpacity>)}</>}

function DocForm({state,setState,type,close,existing}){
 const activeJobs=state.jobs.filter(j=>j.brandId===state.activeBrandId);
 const [jobId,setJobId]=useState(existing?.jobId||activeJobs[0]?.id||""),[title,setTitle]=useState(existing?.title||""),[notes,setNotes]=useState(existing?.notes||""),[contacts,setContacts]=useState((existing?.contacts||[]).map(c=>[c.name,c.role,c.email].filter(Boolean).join(" — ")).join("\n"));
 const [items,setItems]=useState(existing?.items?.map(i=>({...i,qty:String(i.qty),unitPrice:String(i.unitPrice),internalCost:String(i.internalCost||0)}))||[{id:"1",description:"",qty:"1",unit:"ea",unitPrice:"",internalCost:"0",taxCode:activeJobs[0]?.taxProfile||"GST",notes:""}]);
 const [plan,setPlan]=useState(existing?.paymentPlan||[100]),[customPlan,setCustomPlan]=useState(""),[deposit,setDeposit]=useState(String(existing?.depositPct??(type==="estimate"?50:0)));
 const job=state.jobs.find(j=>j.id===jobId);
 const update=(id,key,value)=>setItems(items.map(i=>i.id===id?{...i,[key]:value}:i));
 const chooseJob=id=>{setJobId(id);const j=state.jobs.find(x=>x.id===id);setItems(items.map(i=>({...i,taxCode:j?.taxProfile||"GST"})))};
 const save=()=>{
  if(!job)return Alert.alert("Choose a job","Create a job under More first.");
  if(items.some(i=>!i.description.trim()||!Number.isFinite(Number(i.qty))||Number(i.qty)<=0||!i.unitPrice.trim()||!Number.isFinite(Number(i.unitPrice))||Number(i.unitPrice)<0))return Alert.alert("Check line items","Each line needs a description, positive quantity and a valid price.");
  let paymentPlan=plan;if(plan===null){paymentPlan=customPlan.split(/[\s,\/]+/).filter(Boolean).map(Number)}
  if(!paymentPlan?.length||paymentPlan.some(n=>!Number.isFinite(n)||n<=0)||Math.abs(paymentPlan.reduce((a,b)=>a+b,0)-100)>.001)return Alert.alert("Check payment plan","Percentages must be positive and add up to 100.");
  if(!Number.isFinite(Number(deposit))||Number(deposit)<0||Number(deposit)>100)return Alert.alert("Check deposit","Enter a percentage from 0 to 100.");
  const n=state.documents.filter(d=>d.type===type).length+1,prefix=type==="invoice"?state.settings.invoicePrefix:type==="estimate"?state.settings.estimatePrefix:state.settings.changePrefix;
  const document={...existing,id:existing?.id||String(Date.now()),type,number:existing?.number||`${prefix}-${String(n).padStart(4,"0")}`,jobId,brandId:job.brandId,status:existing?.status||"draft",date:existing?.date||today(),depositPct:Number(deposit),paymentPlan,title:title||items[0].description,notes,contacts:contacts.split("\n").filter(x=>x.trim()).map(line=>{const p=line.split(/\s+[—-]\s+/);return {name:p[0]||"",role:p.length>2?p[1]:"",email:p.length>1?p[p.length-1]:""}}),items:items.map(i=>({...i,qty:Number(i.qty),unitPrice:Number(i.unitPrice),internalCost:Number(i.internalCost)||0})),payments:existing?.payments||[]};
  setState({...state,documents:existing?state.documents.map(d=>d.id===existing.id?document:d):[...state.documents,document]});close();
 };
 return <><Text style={s.label}>Job</Text><View style={styles.wrap}>{activeJobs.map(j=><Chip key={j.id} text={j.name} active={jobId===j.id} onPress={()=>chooseJob(j.id)}/>)}</View>
 <Field label="Document title" value={title} onChangeText={setTitle}/>
 {items.map((i,index)=><Card key={i.id}><H2>Line {index+1}</H2>
 <Field label="Description" value={i.description} onChangeText={v=>update(i.id,"description",v)}/>
 <Field label="Quantity" value={i.qty} keyboardType="decimal-pad" onChangeText={v=>update(i.id,"qty",v)}/>
 <Field label="Unit" value={i.unit} placeholder="ea, km, hours, days" onChangeText={v=>update(i.id,"unit",v)}/>
 <Field label="Price per unit" value={i.unitPrice} keyboardType="decimal-pad" onChangeText={v=>update(i.id,"unitPrice",v)}/>
 <View style={styles.wrap}><Chip text="Hourly default" onPress={()=>setItems(items.map(x=>x.id===i.id?{...x,unit:"hours",unitPrice:String(state.settings.labourRate)}:x))}/><Chip text="Mileage default" onPress={()=>setItems(items.map(x=>x.id===i.id?{...x,unit:"km",unitPrice:String(state.settings.mileageRate)}:x))}/></View>
 <Field label="Internal cost per unit" value={i.internalCost} keyboardType="decimal-pad" onChangeText={v=>update(i.id,"internalCost",v)}/>
 <Field label="Line notes" value={i.notes||""} multiline onChangeText={v=>update(i.id,"notes",v)}/>
 <View style={styles.wrap}>{["GST","GST_PST","PST","EXEMPT"].map(t=><Chip key={t} text={t==="GST_PST"?"GST + PST":t} active={i.taxCode===t} onPress={()=>update(i.id,"taxCode",t)}/>)}</View>
 {items.length>1&&<Button title="Remove line" kind="danger" onPress={()=>setItems(items.filter(x=>x.id!==i.id))}/>}</Card>)}
 <Button title="Add line" kind="soft" onPress={()=>setItems([...items,{id:String(Date.now()),description:"",qty:"1",unit:"ea",unitPrice:"",internalCost:"0",notes:"",taxCode:job?.taxProfile||"GST"}])}/>
 <H2>Payment plan</H2><View style={styles.wrap}>{[[100],[50,50],[35,35,30],[50,40,10]].map(p=><Chip key={p.join("/")} text={p.join("/")} active={JSON.stringify(plan)===JSON.stringify(p)} onPress={()=>setPlan(p)}/>)}<Chip text="Custom" active={plan===null} onPress={()=>{setCustomPlan((plan||[100]).join("/"));setPlan(null)}}/></View>
 {plan===null&&<Field label="Payment percentages" value={customPlan} placeholder="50/40/10" onChangeText={setCustomPlan}/>}
 <Field label="Deposit requested %" value={deposit} keyboardType="decimal-pad" onChangeText={setDeposit}/>
 <Field label="Additional contacts" value={contacts} multiline placeholder="Name — Role — email" onChangeText={setContacts}/>
 <Field label="Document notes" value={notes} multiline onChangeText={setNotes}/>
 <Button title={existing?"Save changes":"Save draft"} onPress={save}/></>;
}

function ExpenseForm({state,setState,close}){
 const [vendor,setVendor]=useState(""),[jobId,setJobId]=useState(state.jobs[0]?.id||""),[cat,setCat]=useState("Materials"),[net,setNet]=useState(""),[gst,setGst]=useState(""),[pst,setPst]=useState(""),[receipt,setReceipt]=useState(null);
 const pick=async()=>{const r=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],quality:.8});if(!r.canceled)setReceipt(r.assets[0].uri)};
 const save=()=>{if(!Number(net))return Alert.alert("Enter the expense amount");setState({...state,expenses:[...state.expenses,{id:String(Date.now()),date:today(),vendor:vendor||"Expense",jobId,category:cat,netAmount:Number(net),gst:Number(gst)||0,pst:Number(pst)||0,receiptUri:receipt,businessUse:true}]});close()};
 return <><Field label="Vendor / description" value={vendor} onChangeText={setVendor}/><Text style={s.label}>Job</Text><View style={styles.wrap}><Chip text="General" active={!jobId} onPress={()=>setJobId("")}/>{state.jobs.map(j=><Chip key={j.id} text={j.name} active={jobId===j.id} onPress={()=>setJobId(j.id)}/>)}</View>
 <Text style={s.label}>Category</Text><View style={styles.wrap}>{["Materials","Subcontractors","Fuel & auto","Tools & supplies","Travel","Insurance","Office & software","Other"].map(x=><Chip key={x} text={x} active={cat===x} onPress={()=>setCat(x)}/>)}</View>
 <Field label="Net amount before tax" value={net} onChangeText={setNet} keyboardType="decimal-pad"/><View style={styles.two}><View style={{flex:1}}><Field label="GST paid" value={gst} onChangeText={setGst} keyboardType="decimal-pad"/></View><View style={{flex:1}}><Field label="PST paid" value={pst} onChangeText={setPst} keyboardType="decimal-pad"/></View></View>
 <Button title={receipt?"Receipt attached":"Attach receipt photo"} kind="soft" onPress={pick}/><View style={{height:10}}/><Button title="Save expense" onPress={save}/></>;
}
function MileageForm({state,setState,close,prefill}){
 const [km,setKm]=useState(prefill?String(prefill):""),[jobId,setJobId]=useState(state.jobs[0]?.id||""),[purpose,setPurpose]=useState("Job travel");
 const save=()=>{if(!Number(km))return Alert.alert("Enter kilometres");setState({...state,mileage:[...state.mileage,{id:String(Date.now()),date:today(),km:Number(km),jobId,purpose}]});close()};
 return <><Field label="Kilometres" value={km} onChangeText={setKm} keyboardType="decimal-pad"/><Field label="Purpose" value={purpose} onChangeText={setPurpose}/><Text style={s.label}>Job</Text><View style={styles.wrap}>{state.jobs.map(j=><Chip key={j.id} text={j.name} active={jobId===j.id} onPress={()=>setJobId(j.id)}/>)}</View><Button title="Save trip" onPress={save}/></>;
}
function JobForm({state,setState,close}){
 const [email,setEmail]=useState(""),[phone,setPhone]=useState(""),[address,setAddress]=useState(""),[sourceContactId,setSourceContactId]=useState(null);
 const importContact=async()=>{try{const c=await Contact.presentPicker();if(!c)return;const [name,emails,phones,addresses]=await Promise.all([c.getFullName(),c.getEmails(),c.getPhones(),c.getAddresses()]);setCustomer(name);setEmail(emails[0]?.address||"");setPhone(phones[0]?.number||"");const a=addresses[0];setAddress(a?[a.street,a.city,a.state||a.region,a.postcode,a.country].filter(Boolean).join(", "):"");setSourceContactId(c.id)}catch(error){Alert.alert("Contact import unavailable",String(error.message||error))}};
 const [name,setName]=useState(""),[customer,setCustomer]=useState(""),[brandId,setBrandId]=useState(state.activeBrandId),[taxProfile,setTaxProfile]=useState("GST");
 const save=()=>{if(!name||!customer)return Alert.alert("Enter a job and customer");const cid=String(Date.now())+"c",jid=String(Date.now())+"j";setState({...state,customers:[...state.customers,{id:cid,name:customer,email,phone,address,sourceContactId,notes:""}],jobs:[...state.jobs,{id:jid,customerId:cid,brandId,name,status:"active",taxProfile,site:"",notes:"",budget:0,startDate:today()}]});close()};
 return <><Field label="Job name" value={name} onChangeText={setName} placeholder="e.g. Smith deck"/><Button title="Import from phone contacts" kind="soft" onPress={importContact}/><Field label="Customer" value={customer} onChangeText={setCustomer}/><Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/><Field label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad"/><Field label="Address" value={address} onChangeText={setAddress} multiline/><Text style={s.label}>Business</Text><View style={styles.wrap}>{state.brands.map(b=><Chip key={b.id} text={b.displayName} active={brandId===b.id} onPress={()=>setBrandId(b.id)}/>)}</View><Text style={s.label}>Tax profile</Text><View style={styles.wrap}>{["GST","GST_PST","EXEMPT"].map(x=><Chip key={x} text={x==="GST_PST"?"GST + PST":x} active={taxProfile===x} onPress={()=>setTaxProfile(x)}/>)}</View><Button title="Create job" onPress={save}/></>;
}
function AssistantForm({state,setState,close}){
 const [cmd,setCmd]=useState(""),[preview,setPreview]=useState(null);
 const parse=()=>{
  const lc=cmd.toLowerCase();
  const job=state.jobs.find(j=>lc.includes(j.name.toLowerCase().split("—")[0].trim()) || lc.includes(state.customers.find(c=>c.id===j.customerId)?.name.toLowerCase()));
  const amt=(cmd.match(/\$?\s*([\d,]+(?:\.\d{1,2})?)/)||[])[1];
  if(lc.includes("invoice")&&job&&amt){setPreview({kind:"invoice",job,amount:Number(amt.replace(",",""))});return}
  setPreview({kind:"note",text:"The local parser only handles a few safe actions. The production ChatGPT connection will use secured app actions and still require your review before anything is sent."});
 };
 const apply=()=>{if(preview?.kind!=="invoice")return;const n=state.documents.filter(d=>d.type==="invoice").length+1;const d={id:String(Date.now()),type:"invoice",number:`${state.settings.invoicePrefix}-${String(n).padStart(4,"0")}`,jobId:preview.job.id,brandId:preview.job.brandId,status:"draft",date:today(),title:"Progress invoice",notes:"Prepared from assistant command. Review before sending.",depositPct:0,items:[{id:"1",description:"Progress billing",qty:1,unit:"ea",unitPrice:preview.amount,internalCost:0,taxCode:preview.job.taxProfile==="EXEMPT"?"EXEMPT":"GST"}],payments:[]};setState({...state,documents:[...state.documents,d]});close()};
 return <><Field label="Tell the app what you need" multiline value={cmd} onChangeText={setCmd} placeholder='Example: "Make a customer an invoice for $500"'/><Button title="Prepare" kind="soft" onPress={parse}/>{preview&&<Card style={{marginTop:12}}>{preview.kind==="invoice"?<><Text style={styles.cardTitle}>Draft invoice</Text><Small>{preview.job.name}</Small><Text style={styles.bigMoney}>{money(preview.amount)}</Text><Small>Nothing is sent automatically.</Small><View style={{height:10}}/><Button title="Create draft for review" onPress={apply}/></>:<Small>{preview.text}</Small>}</Card>}</>;
}
function BrandEdit({state,setState,id,close}){
 const orig=state.brands.find(b=>b.id===id),[b,setB]=useState({...orig});
 const pickLogo=async()=>{const r=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],quality:1});if(!r.canceled)setB({...b,logoUri:r.assets[0].uri})};
 const save=()=>{setState({...state,brands:state.brands.map(x=>x.id===id?b:x)});close()};
 return <><Field label="Customer-facing name" value={b.displayName} onChangeText={v=>setB({...b,displayName:v})}/><Field label="Legal name" value={b.legalName} onChangeText={v=>setB({...b,legalName:v})}/><Field label="Email" value={b.email} onChangeText={v=>setB({...b,email:v})}/><Field label="Phone" value={b.phone} onChangeText={v=>setB({...b,phone:v})}/><Field label="Website" value={b.website} onChangeText={v=>setB({...b,website:v})}/><Field label="GST/HST registration" value={b.gstNumber} onChangeText={v=>setB({...b,gstNumber:v})}/><Field label="PST registration" value={b.pstNumber} onChangeText={v=>setB({...b,pstNumber:v})}/><Field label="Payment terms" multiline value={b.defaultPaymentTerms} onChangeText={v=>setB({...b,defaultPaymentTerms:v})}/><Field label="Payment instructions" multiline value={b.defaultPaymentInstructions} onChangeText={v=>setB({...b,defaultPaymentInstructions:v})}/><Button title={b.logoUri?"Change exact logo":"Choose exact logo file"} kind="soft" onPress={pickLogo}/><View style={{height:10}}/><Button title="Save business profile" onPress={save}/></>;
}

const styles=StyleSheet.create({
 owedBar:{backgroundColor:"#172033",paddingHorizontal:18,paddingVertical:10,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},owedLabel:{color:"#fff",fontSize:12,fontWeight:"700"},owedAmount:{color:"#fff",fontSize:16,fontWeight:"800"},primaryHomeAction:{backgroundColor:"#315ce8",borderRadius:14,padding:16,alignItems:"center"},secondaryHomeAction:{backgroundColor:"#e8eaee",borderRadius:14,padding:16,alignItems:"center"},homeActionText:{color:"#fff",fontSize:16,fontWeight:"700"},homeSecondaryText:{color:"#303844",fontSize:16,fontWeight:"700"},safe:{flex:1,backgroundColor:C.bg},center:{flex:1,alignItems:"center",justifyContent:"center"},
 header:{backgroundColor:"#e8eaee",paddingHorizontal:17,paddingVertical:11,borderBottomWidth:1,borderBottomColor:C.line,flexDirection:"row",justifyContent:"space-between",alignItems:"center"},
 brandTag:{fontSize:10,fontWeight:"900",letterSpacing:1.1,color:C.muted,textTransform:"uppercase"},brandName:{fontSize:17,fontWeight:"900",color:C.ink},
 switch:{backgroundColor:C.soft,paddingHorizontal:12,paddingVertical:8,borderRadius:10},switchTxt:{fontWeight:"900",fontSize:12},
 content:{padding:17,paddingBottom:105},metricGrid:{flexDirection:"row",flexWrap:"wrap",gap:9,marginTop:15},metric:{width:"48%",marginBottom:0},metricVal:{fontSize:20,fontWeight:"900",marginTop:5},
 actions:{flexDirection:"row",flexWrap:"wrap",gap:8},action:{backgroundColor:C.ink,borderRadius:12,paddingHorizontal:13,paddingVertical:12},actionTxt:{color:"#fff",fontWeight:"900",fontSize:13},
 cardTitle:{fontSize:16,fontWeight:"900",color:C.ink},bigMoney:{fontSize:26,fontWeight:"900",marginTop:12,marginBottom:3},space:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",gap:10},three:{flexDirection:"row",gap:8,marginTop:14},
 titleRow:{flexDirection:"row",justifyContent:"space-between",alignItems:"flex-start",gap:10},inlineButtons:{flexDirection:"row",flexWrap:"wrap",gap:7,marginTop:12},
 nav:{position:"absolute",bottom:0,left:0,right:0,backgroundColor:"#fff",borderTopWidth:1,borderTopColor:C.line,flexDirection:"row",paddingTop:7,paddingBottom:7},
 navCell:{flex:1,alignItems:"center",paddingVertical:7},navText:{fontSize:9.5,fontWeight:"800",color:"#7A838C"},navOn:{color:C.ink,fontWeight:"900"},
 back:{flex:1,justifyContent:"flex-end",backgroundColor:"rgba(0,0,0,.3)"},sheet:{maxHeight:"90%",backgroundColor:C.bg,borderTopLeftRadius:22,borderTopRightRadius:22,padding:17},sheetHead:{flexDirection:"row",justifyContent:"space-between",alignItems:"center",marginBottom:15},sheetTitle:{fontSize:20,fontWeight:"900"},
 pickCard:{backgroundColor:"#fff",borderWidth:1,borderColor:C.line,borderRadius:14,padding:13,marginBottom:9,flexDirection:"row",alignItems:"center",gap:12},fakeLogo:{width:46,height:46,borderRadius:11,backgroundColor:C.ink,alignItems:"center",justifyContent:"center"},
 wrap:{flexDirection:"row",flexWrap:"wrap",marginBottom:7},two:{flexDirection:"row",gap:10}
});
