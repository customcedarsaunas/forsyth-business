export function round2(n){ return Math.round((Number(n)+Number.EPSILON)*100)/100; }
export function money(n){ return "$"+round2(n||0).toLocaleString("en-CA",{minimumFractionDigits:2,maximumFractionDigits:2}); }
export function nextDocumentNumber(state,type){
 const prefix=type==="invoice"?state.settings.invoicePrefix:type==="estimate"?state.settings.estimatePrefix:state.settings.changePrefix;
 const numbers=state.documents.filter(d=>d.type===type).map(d=>Number(String(d.number||"").match(/(\d+)$/)?.[1]||0));
 return `${prefix}-${String(Math.max(0,...numbers)+1).padStart(4,"0")}`;
}

export function lineTax(line, settings){
  const gross = Number(line.qty||0)*Number(line.unitPrice||0);
  const rates=(line.taxCode==="GST"||line.taxCode==="GST_PST"?settings.gstRate:0)+(line.taxCode==="PST"||line.taxCode==="GST_PST"?settings.pstRate:0);
  const base = settings.taxInclusive ? gross/(1+rates) : gross;
  switch(line.taxCode){
    case "GST_PST": return {gst:round2(base*settings.gstRate), pst:round2(base*settings.pstRate)};
    case "GST": return {gst:round2(base*settings.gstRate), pst:0};
    case "PST": return {gst:0, pst:round2(base*settings.pstRate)};
    default: return {gst:0,pst:0};
  }
}
export function documentTotals(doc, settings, now=new Date()){
  const taxSettings={...settings,gstRate:doc.gstRate??settings.gstRate,pstRate:doc.pstRate??settings.pstRate,taxInclusive:doc.taxInclusive||false};
  const entered=round2((doc.items||[]).reduce((s,x)=>s+Number(x.qty||0)*Number(x.unitPrice||0),0));
  const taxes=(doc.items||[]).reduce((a,x)=>{const t=lineTax(x,taxSettings);a.gst+=t.gst;a.pst+=t.pst;return a;},{gst:0,pst:0});
  taxes.gst=round2(taxes.gst); taxes.pst=round2(taxes.pst);
  const subtotal=taxSettings.taxInclusive?round2(entered-taxes.gst-taxes.pst):entered;
  const total=round2(subtotal+taxes.gst+taxes.pst);
  const paid=round2((doc.payments||[]).reduce((s,p)=>s+Number(p.amount||0),0));
  const plan=doc.paymentPlan?.length?doc.paymentPlan:[100];
  let cumulative=0,dueNow=0,stage=plan.length;
  for(let index=0;index<plan.length;index++){cumulative=round2(cumulative+total*Number(plan[index])/100);if(paid<cumulative-.005){dueNow=round2(cumulative-paid);stage=index+1;break;}}
  const baseBalance=Math.max(0,round2(total-paid));
  const end=doc.dueDate?new Date(doc.dueDate+'T23:59:59'):now;
  const daysLate=Math.max(0,Math.floor((now-end)/86400000));
  const lateFee=doc.type==='invoice'&&doc.lateFeeEnabled&&daysLate>0?round2(baseBalance*(Number(doc.lateFeeRate??2)/100)*Math.ceil(daysLate/30)):0;
  return {subtotal,...taxes,total,paid,baseBalance,lateFee,balance:round2(baseBalance+lateFee),dueNow,stage};
}
export function itemCost(doc){
  return round2((doc.items||[]).reduce((s,x)=>s+Number(x.qty||0)*Number(x.internalCost||0),0));
}
export function jobSummary(state, jobId){
  const docs=state.documents.filter(d=>d.jobId===jobId && d.type==="invoice" && !["void","draft"].includes(d.status));
  const revenue=round2(docs.reduce((s,d)=>s+documentTotals(d,state.settings).subtotal,0));
  const invoiced=round2(state.documents.filter(d=>d.jobId===jobId && d.type==="invoice").reduce((s,d)=>s+documentTotals(d,state.settings).subtotal,0));
  const directCosts=round2(state.expenses.filter(e=>e.jobId===jobId && e.businessUse!==false).reduce((s,e)=>s+Number(e.netAmount??e.amount??0)+Number(e.gst||0)+Number(e.pst||0),0));
  const estimatedCosts=round2(docs.reduce((s,d)=>s+itemCost(d),0));
  const payments=round2(docs.reduce((s,d)=>s+(d.payments||[]).reduce((a,p)=>a+Number(p.amount||0),0),0));
  return {revenue,invoiced,directCosts,estimatedCosts,payments,profit:round2(payments-directCosts)};
}
export function yearSummary(state){
  const invoiceDocs=state.documents.filter(d=>d.type==="invoice" && !["void","draft"].includes(d.status));
  let revenue=0,gstCollected=0,pstCollected=0,ar=0;
  invoiceDocs.forEach(d=>{const t=documentTotals(d,state.settings); revenue+=t.subtotal;gstCollected+=t.gst;pstCollected+=t.pst;ar+=t.balance;});
  const expenses=state.expenses.filter(e=>e.businessUse!==false).reduce((s,e)=>s+Number(e.netAmount||e.amount||0),0);
  const gstITC=state.expenses.filter(e=>e.businessUse!==false).reduce((s,e)=>s+Number(e.gst||0),0);
  const pstPaid=state.expenses.filter(e=>e.businessUse!==false).reduce((s,e)=>s+Number(e.pst||0),0);
  const km=state.mileage.reduce((s,m)=>s+Number(m.km||0),0);
  return {revenue:round2(revenue),expenses:round2(expenses),net:round2(revenue-expenses),gstCollected:round2(gstCollected),gstITC:round2(gstITC),gstNet:round2(gstCollected-gstITC),pstCollected:round2(pstCollected),pstPaid:round2(pstPaid),ar:round2(ar),km:round2(km)};
}
