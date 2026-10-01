import {nextDocumentNumber} from './calc';

// Inbox rows are retained: a failed device write can retry without losing a draft.
export function mergeAssistantDrafts(state, rows, userId) {
  const owner = state.assistantSyncUserId || state.cloudBackupUserId;
  if (owner && owner !== userId) throw new Error('Draft account differs from this device. Sign in with your original account.');
  let next = state;
  for (const row of rows) {
    if (row.user_id !== userId) throw new Error('Draft owner mismatch.');
    if ((next.assistantAppliedDraftIds || []).includes(row.id)) continue;
    const p = row.payload, d = p?.document, c = p?.customer, j = p?.job;
    if (!c?.id || !c.name?.trim() || !j?.id || !j.name?.trim() || !d?.id ||
        !['invoice','estimate'].includes(d.type) || d.status !== 'draft' ||
        !next.brands.some(b => b.id === d.brandId) || j.brandId !== d.brandId ||
        !Array.isArray(d.items) || !d.items.length || !/^\d{4}-\d{2}-\d{2}$/.test(d.date)) {
      throw new Error('Invalid assistant draft. Existing records were kept.');
    }
    for (const item of d.items) {
      if (!item.description?.trim() || !Number.isFinite(item.qty) || item.qty <= 0 ||
          !Number.isFinite(item.unitPrice) || item.unitPrice < 0 ||
          !['GST','GST_PST','PST','EXEMPT'].includes(item.taxCode)) throw new Error('Invalid draft line.');
    }
    // An already imported document must never be overwritten, even after edits.
    if (next.documents.some(x => x.id === d.id || x.assistantRequestId === row.id)) {
      next = {...next, assistantSyncUserId:userId, assistantAppliedDraftIds:[...(next.assistantAppliedDraftIds || []),row.id]};
      continue;
    }
    const sameName = next.customers.filter(x => x.name.trim().toLowerCase() === c.name.trim().toLowerCase());
    let customer = next.customers.find(x => x.id === c.id);
    if (!customer && sameName.length > 1) throw new Error('Multiple clients match the draft. A specific client ID is needed.');
    customer = customer || sameName[0] || {...c};
    const matches = next.jobs.filter(x => x.customerId === customer.id && x.brandId === d.brandId && x.name === j.name);
    let job = next.jobs.find(x => x.id === j.id);
    if (job && (job.customerId !== customer.id || job.brandId !== d.brandId)) throw new Error('Draft job owner mismatch.');
    if (!job && matches.length > 1) throw new Error('Multiple jobs match the draft. A specific job ID is needed.');
    job = job || matches[0] || {...j,customerId:customer.id};
    const document = {...d, jobId:job.id, number:nextDocumentNumber(next,d.type),
      billTo:{name:customer.name,email:customer.email||'',phone:customer.phone||'',address:customer.address||''},
      status:'draft',payments:[],archived:false,assistantRequestId:row.id};
    next = {...next,assistantSyncUserId:userId,
      customers:next.customers.some(x=>x.id===customer.id)?next.customers:[...next.customers,customer],
      jobs:next.jobs.some(x=>x.id===job.id)?next.jobs:[...next.jobs,job],
      documents:[...next.documents,document],
      assistantAppliedDraftIds:[...(next.assistantAppliedDraftIds||[]),row.id]};
  }
  return next;
}
