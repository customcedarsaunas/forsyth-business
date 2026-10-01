const cell=value=>{let text=String(value??'');if(typeof value==='string'&&/^[=+@\-\t\r]/.test(text))text="'"+text;return '"'+text.replaceAll('"','""')+'"';};
export function accountantCsv(state){
 const rows=[['Type','Date','Business','Document','Customer / description','Category','Amount received / paid','GST','PST']];
 const brand=id=>state.brands.find(b=>b.id===id)?.displayName||'';
 for(const doc of state.documents.filter(d=>d.type==='invoice'&&d.status!=='void')){const job=state.jobs.find(j=>j.id===doc.jobId),customer=doc.billTo||state.customers.find(c=>c.id===job?.customerId);for(const p of doc.payments||[])rows.push(['Payment',p.date,brand(doc.brandId),doc.number,customer?.name,'Invoice payment',Number(p.amount||0),'','']);}
 for(const e of state.expenses){const job=state.jobs.find(j=>j.id===e.jobId);rows.push(['Expense',e.date,brand(e.brandId||job?.brandId),'',e.vendor,e.category,Number(e.netAmount??e.amount??0)+Number(e.gst||0)+Number(e.pst||0),Number(e.gst||0),Number(e.pst||0)]);}
 return rows.map(row=>row.map(cell).join(',')).join('\r\n');
}
