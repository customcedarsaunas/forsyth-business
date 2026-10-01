import {Asset} from "expo-asset";
import {photoData} from "./photos";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import {documentTotals, money} from "./calc";

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const typeLabel=t=>({invoice:"INVOICE",estimate:"ESTIMATE",change_order:"CHANGE ORDER"}[t]||t.toUpperCase());

export function documentHtml(state, doc){
  const brand=state.brands.find(b=>b.id===doc.brandId);
  const job=state.jobs.find(j=>j.id===doc.jobId);
  const customer=doc.billTo||state.customers.find(c=>c.id===job?.customerId);
  const t=documentTotals(doc,state.settings);
  const rows=(doc.items||[]).map(i=>`<tr><td>${esc(i.description)}${i.notes?`<div class="muted">${esc(i.notes)}</div>`:""}</td><td>${esc(i.qty)} ${esc(i.unit||"")}</td><td>${money(i.unitPrice)}</td><td>${money(Number(i.qty)*Number(i.unitPrice))}</td><td>${esc(i.taxCode||"EXEMPT")}</td></tr>`).join("");
  const logo=brand.logoUri ? `<img class="logo" src="${esc(brand.logoUri)}"/>` : "";
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#17202a;padding:34px;font-size:12px}
  h1{font-size:30px;margin:0}.top{display:flex;justify-content:space-between;gap:30px}.muted{color:#65717d}
  .logo{max-width:180px;max-height:90px;object-fit:contain}.brand{font-size:20px;font-weight:800}.box{margin-top:26px}
  table{width:100%;border-collapse:collapse;margin-top:22px}th,td{padding:9px;border-bottom:1px solid #dfe4e8;text-align:left}th{font-size:10px;color:#65717d}
  .totals{width:290px;margin-left:auto;margin-top:22px}.totals div{display:flex;justify-content:space-between;padding:5px 0}.grand{font-size:18px;font-weight:800;border-top:2px solid #17202a;margin-top:6px;padding-top:9px!important}
  .footer{margin-top:32px;padding-top:14px;border-top:1px solid #dfe4e8;white-space:pre-line}.small{font-size:10px}
  </style></head><body>
  <div class="top"><div>${logo}<div class="brand">${esc(brand.displayName)}</div><div>${esc(brand.email)} · ${esc(brand.phone)}</div><div>${esc(brand.website)}</div><div class="small">GST/HST: ${esc(brand.gstNumber||"")}${brand.pstNumber?` · PST: ${esc(brand.pstNumber)}`:""}</div></div>
  <div><h1>${typeLabel(doc.type)}</h1><div><strong>${esc(doc.number)}</strong></div><div class="muted">${esc(doc.date)}</div>${doc.dueDate?`<div>Due: ${esc(doc.dueDate)}</div>`:""}</div></div>
  <div class="box"><strong>Bill to</strong><div>${esc(customer?.name||"")}</div><div>${esc(customer?.email||"")}</div><div>${esc(customer?.phone||"")}</div><div>${esc(customer?.address||"")}</div>${(doc.contacts||[]).map(c=>`<div>${esc(c.name)}${c.role?` · ${esc(c.role)}`:""}${c.email?` · ${esc(c.email)}`:""}</div>`).join("")}</div>
  <div class="box"><strong>${esc(doc.title||"")}</strong>${doc.notes?`<div class="muted">${esc(doc.notes)}</div>`:""}</div>
  <table><thead><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th><th>Tax</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="totals"><div><span>Subtotal</span><strong>${money(t.subtotal)}</strong></div><div><span>GST</span><span>${money(t.gst)}</span></div><div><span>PST</span><span>${money(t.pst)}</span></div><div class="grand"><span>Total</span><span>${money(t.total)}</span></div>${doc.type==="invoice"?`<div><span>Paid</span><span>${money(t.paid)}</span></div><div><span>Total remaining</span><strong>${money(t.balance)}</strong></div><div><span>Payment ${t.stage} due now</span><strong>${money(t.dueNow)}</strong></div>`:""}</div>
  ${doc.taxExemptNumber?`<div class="box">Tax exemption reference: ${esc(doc.taxExemptNumber)}</div>`:""}${t.lateFee?`<div>Late fee: ${money(t.lateFee)}</div>`:""}<div class="footer"><strong>Payment terms</strong><br>${doc.paymentPlan?.length?`Payment stages: ${esc(doc.paymentPlan.map(p=>p+"%").join(" / "))}<br>`:""}${doc.depositPct?`Deposit requested: ${esc(doc.depositPct)}<br>`:""}${esc(brand.defaultPaymentTerms||"")}<br><br><strong>Payment instructions</strong><br>${esc(doc.paymentInstructions??brand.defaultPaymentInstructions??"")}</div>
  ${(doc.photos||[]).map(uri=>`<div style="page-break-inside:avoid;margin-top:20px"><img src="${esc(uri)}" style="max-width:100%;max-height:500px;object-fit:contain"/></div>`).join("")}
  </body></html>`;
}
async function printHtml(state,doc){
 const brand=state.brands.find(b=>b.id===doc.brandId);let logoUri=brand.logoUri;
 if(!logoUri){const asset=Asset.fromModule(brand.id==="sauna"?require("../../assets/sauna.png"):require("../../assets/jfe.png"));await asset.downloadAsync();logoUri=asset.localUri||asset.uri;}
 const prepared={...state,brands:state.brands.map(b=>b.id===brand.id?{...b,logoUri:null}:b)};
 prepared.brands.find(b=>b.id===brand.id).logoUri=await photoData(logoUri);
 const photos=await Promise.all((doc.photos||[]).map(photoData));return documentHtml(prepared,{...doc,photos});
}
export async function shareDocument(state, doc){
  const {uri}=await Print.printToFileAsync({html:await printHtml(state,doc)});
  if(await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri,{mimeType:"application/pdf",dialogTitle:`Share ${doc.number}`});
  return uri;
}

export async function previewDocument(state,doc){await Print.printAsync({html:await printHtml(state,doc)});}
