// V18 imports merge into local records. Repeated imports never duplicate records.
const number=(value,label)=>{const n=Number(value??0);if(!Number.isFinite(n)||n<0)throw new Error(`Invalid ${label}.`);return n;};
const brandFor=(name,state)=>{const id=/sauna/i.test(name||"")?"sauna":"jfe";const brand=state.brands.find(b=>b.id===id);if(!brand)throw new Error("Missing business profile.");return brand.id;};
export function validateNativeBackup(state){
 if(state?.schemaVersion!==2||!state.settings)throw new Error('Incompatible native backup.');
 for(const key of ['brands','customers','jobs','documents','expenses','mileage']){
  if(!Array.isArray(state[key]))throw new Error(`Missing ${key}.`);
  const ids=new Set();for(const row of state[key]){if(!row||typeof row.id!=='string'||ids.has(row.id))throw new Error(`Invalid ${key} record.`);ids.add(row.id);}
 }
 if(!state.brands.length)throw new Error('Missing business profiles.');
 const brands=new Set(state.brands.map(b=>b.id)),jobs=new Set(state.jobs.map(j=>j.id)),customers=new Set(state.customers.map(c=>c.id));
 for(const job of state.jobs)if(!brands.has(job.brandId)||!customers.has(job.customerId))throw new Error('Job has a missing business or client.');
 for(const doc of state.documents){if(!brands.has(doc.brandId)||!jobs.has(doc.jobId)||!Array.isArray(doc.items))throw new Error('Document has missing records.');for(const line of doc.items){number(line.qty,'quantity');number(line.unitPrice,'price');}for(const p of doc.payments||[])number(p.amount,'payment');}
 return {...state,cloudBackupUserId:null};
}
export function migratePrototype(input,current){
 if(!input||!Array.isArray(input.docs)||!Array.isArray(input.clients)||!Array.isArray(input.expenses))throw new Error("Choose a Forsyth v18 JSON backup.");
 const state=JSON.parse(JSON.stringify(current));
 const norm=v=>String(v||"").trim().toLowerCase();
 const customerFor=(name,details={})=>{
  let c=state.customers.find(c=>norm(c.name)===norm(name));
  if(!c){c={id:`v18-client-${encodeURIComponent(norm(name))}`,name:name||"Unnamed client",email:details.clientEmail||details.email||"",phone:details.clientPhone||details.phone||"",address:details.clientAddress||details.address||"",notes:""};state.customers.push(c);}
  return c;
 };
 input.clients.forEach(c=>customerFor(c.name,c));
 const jobFor=(brandId,name,customer)=>{
  let job=state.jobs.find(j=>j.brandId===brandId&&norm(j.name)===norm(name)&&j.customerId===customer.id);
  if(!job){job={id:`v18-job-${brandId}-${encodeURIComponent(norm(name))}-${customer.id}`,brandId,customerId:customer.id,name:name||"Untitled job",status:"active",taxProfile:"GST",notes:"",site:"",budget:0};state.jobs.push(job);}
  return job;
 };
 input.docs.forEach(d=>{
  if(!d.id||!["invoice","estimate"].includes(d.type)||!Array.isArray(d.items))throw new Error("Invalid prototype document.");
  const sourceId=`v18-doc-${d.id}`;if(state.documents.some(x=>x.id===sourceId||x.prototypeId===String(d.id)))return;
  const brandId=brandFor(d.business,state),customer=customerFor(d.client,d),job=jobFor(brandId,d.jobName,customer);
  const gstRate=number(d.gstRate,"GST rate")/100,pstRate=number(d.pstRate,"PST rate")/100;
  const payments=Array.isArray(d.payments)?d.payments.map((p,i)=>({...p,id:p.id||`${sourceId}-payment-${i}`,amount:number(p.amount,"payment")})):number(d.paid,"payment")?[{id:`${sourceId}-payment`,amount:Number(d.paid),date:d.date}]:[];
  state.documents.push({...d,id:sourceId,prototypeId:String(d.id),lateFeeEnabled:d.lateFeeEnabled!==false,jobId:job.id,brandId,status:String(d.status||"draft").toLowerCase().replace("partially paid","partial"),title:d.jobName||d.number,notes:d.notes||"",contacts:d.contacts||[],gstRate,pstRate,paymentPlan:d.paymentPlan?.length?d.paymentPlan:[100],payments,items:d.items.map((i,index)=>({...i,id:i.id||`${sourceId}-line-${index}`,description:i.desc||i.description||"",qty:number(i.qty,"quantity"),unit:i.unit||"item",unitPrice:number(i.rate??i.unitPrice,"price"),internalCost:number(i.cost??i.internalCost,"cost"),taxCode:d.taxExempt?"EXEMPT":gstRate&&pstRate?"GST_PST":gstRate?"GST":pstRate?"PST":"EXEMPT"}))});
 });
 input.expenses.forEach(e=>{
  if(!e.id)throw new Error("Invalid prototype expense.");
  const id=`v18-expense-${e.id}`;if(state.expenses.some(x=>x.id===id))return;
  const brandId=brandFor(e.business,state),amount=number(e.amount,"expense"),gst=number(e.gst,"expense GST"),pst=number(e.pst,"expense PST");
  if(gst+pst>amount)throw new Error("Expense tax exceeds amount paid.");
  let job=state.jobs.find(j=>j.brandId===brandId&&norm(j.name)===norm(e.jobName));
  if(e.jobName&&!job)job=jobFor(brandId,e.jobName,customerFor("Unassigned client"));
  state.expenses.push({...e,id,brandId,jobId:job?.id||"",vendor:e.desc||"Expense",netAmount:amount-gst-pst,gst,pst,receiptUri:e.receipt||null,businessUse:true});
 });
 return state;
}
