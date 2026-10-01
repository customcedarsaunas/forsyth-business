// Append-only delivery: never replace a phone record or turn a draft into a sent document.
import {nextDocumentNumber} from './calc';
const copy=value=>JSON.parse(JSON.stringify(value));
const text=(value,label,max=20000)=>{if(typeof value!=='string'||value.length>max)throw Error(`Invalid ${label}.`);return value;};
const amount=(value,label)=>{if(typeof value!=='number'||!Number.isFinite(value)||value<0)throw Error(`Invalid ${label}.`);return value;};
export function mergeAssistantDraftsResult(current,rows,userId){
 const owner=current.assistantSyncUserId||current.cloudBackupUserId;
 if(owner&&owner!==userId)return {state:current,added:0,errors:[{message:"Draft account differs from this device. Sign in with your original account."}]};
 const state=copy(current),applied=new Set(state.receivedAssistantDrafts||[]),errors=[];let added=0;
 for(const row of rows){
  const key=`${userId}:${row.id}`;if(applied.has(key)||(current.assistantAppliedDraftIds||[]).includes(row.id))continue;
  try{
   if(row.user_id!==userId||typeof row.id!=='string'||!row.id)throw Error('Draft belongs to a different account.');
   const {customer,job,document:d}=row.payload||{};
   if(!customer||!job||!d||d.status!=='draft'||!['invoice','estimate'].includes(d.type))throw Error('Only draft invoices and estimates can be delivered.');
   const brandId=text(d.brandId,'business');if(job.brandId!==brandId||!state.brands.some(b=>b.id===brandId))throw Error('Unknown business.');
   const name=text(customer.name,'client name',250).trim(),title=text(d.title||job.name,'title',500);if(!name)throw Error('Client name is required.');
   if(!Array.isArray(d.items)||!d.items.length||d.items.length>200)throw Error('Invalid line items.');
   const docId=`remote-${userId}-${row.id}`;
   const items=d.items.map((i,n)=>({id:`${docId}-line-${n}`,description:text(i.description,'description'),notes:text(i.notes||'','line notes'),qty:amount(i.qty,'quantity'),unit:text(i.unit||'item','unit',100),unitPrice:amount(i.unitPrice,'price'),internalCost:amount(i.internalCost??0,'cost'),taxCode:['GST','PST','GST_PST','EXEMPT'].includes(i.taxCode)?i.taxCode:(()=>{throw Error('Invalid tax code.');})()}));
   const plan=d.paymentPlan||[100];if(!Array.isArray(plan)||!plan.length||plan.some(n=>typeof n!=='number'||!Number.isFinite(n)||n<=0)||Math.abs(plan.reduce((a,b)=>a+b,0)-100)>.001)throw Error('Invalid payment plan.');
   const depositPct=amount(d.depositPct??0,'deposit');if(depositPct>100)throw Error('Invalid deposit.');
   const cleanCustomer={id:`${docId}-client`,name,email:text(customer.email||'','email',500),phone:text(customer.phone||'','phone',100),address:text(customer.address||'','address',2000),notes:text(customer.notes||'','client notes')};
   const cleanJob={id:`${docId}-job`,name:text(job.name,'job name',500),brandId,status:'active',taxProfile:items[0].taxCode,site:text(job.site||'','site',2000),notes:text(job.notes||'','job notes'),budget:amount(job.budget??0,'budget')};
   const date=text(d.date,'date',10);if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date)))throw Error('Invalid date.');
   const doc={id:docId,type:d.type,brandId,title,status:'draft',date,items,notes:text(d.notes||'','notes'),paymentInstructions:text(d.paymentInstructions||'','payment instructions'),paymentPlan:plan,depositPct,taxInclusive:d.taxInclusive===true,photos:[],contacts:[],payments:[],lateFeeEnabled:false,assistantDraftId:row.id,assistantAccountId:userId};
   if(d.gstRate!==undefined)doc.gstRate=amount(d.gstRate,'GST rate');if(d.pstRate!==undefined)doc.pstRate=amount(d.pstRate,'PST rate');
   // Validate the entire incoming payload before any arrays are changed.
   if(state.documents.some(x=>x.id===docId||d.id&&x.id===d.id||x.assistantRequestId===row.id||x.assistantDraftId===row.id&&x.assistantAccountId===userId)){applied.add(key);continue;}
   const matching=state.customers.filter(c=>c.name.trim().toLowerCase()===name.toLowerCase());
   const byId=customer.id&&state.customers.find(c=>c.id===customer.id);
   if(!byId&&matching.length>1)throw Error('Multiple clients match the draft. A specific client ID is needed.');
   const existing=byId||(matching.length===1?matching[0]:null);const c=existing||cleanCustomer;
   cleanJob.customerId=c.id;doc.jobId=cleanJob.id;doc.number=nextDocumentNumber(state,d.type);doc.billTo={name:c.name,email:c.email||cleanCustomer.email,phone:c.phone||cleanCustomer.phone,address:c.address||cleanCustomer.address};
   const sameJobs=state.jobs.filter(j=>j.customerId===c.id&&j.brandId===brandId&&j.name===cleanJob.name);
   if(sameJobs.length>1)throw Error('Multiple jobs match the draft. A specific job ID is needed.');
   const previousJob=job.id&&state.jobs.find(j=>j.id===job.id);
   if(previousJob&&(previousJob.customerId!==c.id||previousJob.brandId!==brandId))throw Error('Draft job owner mismatch.');
   const targetJob=previousJob||sameJobs[0]||cleanJob;doc.jobId=targetJob.id;
   if(!existing)state.customers.push(cleanCustomer);if(targetJob===cleanJob)state.jobs.push(cleanJob);state.documents.push(doc);applied.add(key);state.assistantSyncUserId=userId;added++;
  }catch(error){errors.push({id:row.id,message:error.message});}
 }
 state.receivedAssistantDrafts=[...applied];
 return {state:added||applied.size!==(current.receivedAssistantDrafts||[]).length?state:current,added,errors};
}

// Compatibility for callers expecting a state rather than a delivery report.
export function mergeAssistantDrafts(current,rows,userId){const result=mergeAssistantDraftsResult(current,rows,userId);if(result.errors.length)throw Error(result.errors[0].message);return result.state;}
