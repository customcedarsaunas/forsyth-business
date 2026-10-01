// Local app simulation only. No real account credentials or Supabase requests.
const fs=require('fs'),http=require('http'),path=require('path'),assert=require('assert');const {chromium}=require('playwright');
(async()=>{
 const root=path.resolve('dist-web');const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost'),f=path.join(root,url.pathname==='/'?'index.html':decodeURIComponent(url.pathname));try{res.setHeader('Content-Type',f.endsWith('.js')?'text/javascript':f.endsWith('.png')?'image/png':'text/html');res.end(fs.readFileSync(f))}catch{res.statusCode=404;res.end()}});await new Promise(r=>server.listen(8767,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'],headless:true});
 try{
 const page=await browser.newPage({viewport:{width:393,height:852}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const user={id:'00000000-0000-0000-0000-000000000123',email:'test@example.invalid',aud:'authenticated',role:'authenticated'};
 const token=[{alg:'HS256',typ:'JWT'},{sub:user.id,exp:4102444800,iat:1790870000},'test-signature'].map(x=>typeof x==='string'?x:Buffer.from(JSON.stringify(x)).toString('base64url')).join('.');
 const session={access_token:token,refresh_token:'fabricated-test-token',token_type:'bearer',expires_in:3600,expires_at:4102444800,user};
 await page.addInitScript(session=>{if(!localStorage.getItem('sb-tcgkgzwsvsoebuquhbws-auth-token'))localStorage.setItem('sb-tcgkgzwsvsoebuquhbws-auth-token',JSON.stringify(session))},session);
 const row={id:'00000000-0000-0000-0000-000000000456',user_id:user.id,created_at:'2026-10-01T00:00:00Z',payload:{customer:{name:'Test Customer'},job:{name:'Test deck',brandId:'jfe'},document:{title:'Test deck',status:'draft',type:'estimate',brandId:'jfe',date:'2026-10-01',items:[{description:'Deck replacement',qty:1,unit:'job',unitPrice:3300,taxCode:'EXEMPT'}],paymentPlan:[100]}}};
 let requests=0;await page.route('https://tcgkgzwsvsoebuquhbws.supabase.co/**',route=>{const url=route.request().url();if(url.includes('/rest/v1/assistant_drafts')){requests++;return route.fulfill({json:[row]})}if(url.includes('/auth/v1/user'))return route.fulfill({json:user});return route.fulfill({status:400,json:{message:'Unexpected simulated request'}})});
 await page.goto('http://127.0.0.1:8767');await page.waitForFunction(()=>JSON.parse(localStorage.getItem('forsyth-business-v2')||'{}').documents?.length===1);
 await page.getByText('Estimates',{exact:true}).click();await page.getByText('Estimate EST-0001',{exact:true}).waitFor();assert((await page.locator('body').innerText()).includes('$3,300.00'));
 await page.reload();await page.getByText('+ New Invoice',{exact:true}).waitFor();await page.waitForFunction(()=>document.body.innerText.includes('Assistant drafts checked'));
 const state=await page.evaluate(()=>JSON.parse(localStorage.getItem('forsyth-business-v2')));assert.equal(state.documents.length,1);assert.equal(state.documents[0].status,'draft');assert.equal(state.documents[0].items[0].unitPrice,3300);assert(requests>=2);assert.deepEqual(errors,[]);
 console.log('PASS: simulated signed-in app automatically receives estimate, renders it, persists it and skips repeat delivery after reload.');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exit(1)});
