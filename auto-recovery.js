import {getAll,replaceAllStoresAtomic,STORES} from './db.js';

const RECOVERY_DB='little-moments-recovery';
const RECOVERY_VERSION=1;
const SNAPSHOT_STORE='snapshots';
const MAX_SNAPSHOTS=5;
const SNAPSHOT_DELAY=1800;
const STORE_NAMES=Object.values(STORES);
let timer=null,creating=false,lastSignature='';

function openRecoveryDB(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(RECOVERY_DB,RECOVERY_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      if(!db.objectStoreNames.contains(SNAPSHOT_STORE)){
        const s=db.createObjectStore(SNAPSHOT_STORE,{keyPath:'id'});
        s.createIndex('createdAt','createdAt',{unique:false});
      }
    };
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}

async function readMain(){
  const entries=await Promise.all(STORE_NAMES.map(async name=>[name,await getAll(name)]));
  return Object.fromEntries(entries);
}
function countsOf(stores){
  return {
    students:stores.students?.length||0,
    moments:stores.moments?.length||0,
    photos:stores.photos?.length||0,
    enrollments:stores.enrollments?.length||0,
    years:stores.schoolYears?.length||0
  };
}
function meaningful(c){return c.students>0||c.moments>0||c.photos>0||c.enrollments>0}
function signature(c){return `${c.students}/${c.moments}/${c.photos}/${c.enrollments}/${c.years}`}

async function listSnapshots(){
  const db=await openRecoveryDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(SNAPSHOT_STORE,'readonly');
    const req=tx.objectStore(SNAPSHOT_STORE).getAll();
    req.onsuccess=()=>resolve((req.result||[]).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt))));
    req.onerror=()=>reject(req.error);
  });
}

async function saveSnapshot(snapshot){
  const db=await openRecoveryDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(SNAPSHOT_STORE,'readwrite');
    tx.objectStore(SNAPSHOT_STORE).put(snapshot);
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error);
  });
}

async function pruneSnapshots(){
  const all=await listSnapshots();
  if(all.length<=MAX_SNAPSHOTS)return;
  const db=await openRecoveryDB();
  await new Promise((resolve,reject)=>{
    const tx=db.transaction(SNAPSHOT_STORE,'readwrite');
    const store=tx.objectStore(SNAPSHOT_STORE);
    for(const old of all.slice(MAX_SNAPSHOTS))store.delete(old.id);
    tx.oncomplete=resolve;
    tx.onerror=()=>reject(tx.error);
  });
}

async function createSnapshot(reason='automatic'){
  if(creating)return null;
  creating=true;
  try{
    const stores=await readMain();
    const counts=countsOf(stores);
    if(!meaningful(counts))return null;
    const sig=signature(counts);
    const latest=(await listSnapshots())[0];
    if(latest&&latest.signature===sig&&reason==='automatic')return latest;
    const now=new Date().toISOString();
    const snapshot={id:`snapshot-${Date.now()}-${Math.random().toString(16).slice(2)}`,createdAt:now,reason,counts,signature:sig,stores};
    await saveSnapshot(snapshot);
    await pruneSnapshots();
    lastSignature=sig;
    window.dispatchEvent(new CustomEvent('lm:recovery-snapshot-created',{detail:{createdAt:now,counts}}));
    refreshRecoveryUI();
    return snapshot;
  }catch(err){
    console.error('Little Moments automatic recovery snapshot failed',err);
    return null;
  }finally{creating=false}
}

function scheduleSnapshot(){
  clearTimeout(timer);
  timer=setTimeout(()=>createSnapshot('automatic'),SNAPSHOT_DELAY);
}

async function restoreSnapshot(id){
  const all=await listSnapshots();
  const snap=all.find(x=>x.id===id);
  if(!snap)throw new Error('Recovery snapshot not found.');
  if(!meaningful(snap.counts||{}))throw new Error('Recovery snapshot is empty.');
  await replaceAllStoresAtomic(snap.stores||{});
  await createSnapshot('post-recovery');
  return snap;
}

function formatWhen(iso){
  try{return new Date(iso).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}catch{return iso||''}
}

async function addRecoveryToWarning(){
  const card=document.querySelector('.lm-data-warning-card');
  if(!card||card.dataset.autoRecoveryReady==='1')return;
  card.dataset.autoRecoveryReady='1';
  const snaps=(await listSnapshots()).filter(s=>meaningful(s.counts||{}));
  if(!snaps.length)return;
  const best=snaps[0];
  const actions=card.querySelector('.lm-warning-actions');
  if(!actions)return;
  const box=document.createElement('div');
  box.className='lm-auto-recovery-box';
  box.style.cssText='margin:14px 0 4px;padding:14px;border:1px solid #d9cabb;border-radius:16px;background:#fffaf2;text-align:left';
  box.innerHTML=`<strong style="display:block;margin-bottom:6px">Automatic recovery copy found ♡</strong><span style="display:block;margin-bottom:10px">${best.counts.students} students · ${best.counts.moments} moments · ${best.counts.photos} photos<br><small>Saved ${formatWhen(best.createdAt)}</small></span><button type="button" class="primary" id="lm-auto-recover" style="width:100%">Restore Automatic Recovery</button>`;
  actions.insertAdjacentElement('beforebegin',box);
  box.querySelector('#lm-auto-recover').onclick=async()=>{
    const btn=box.querySelector('#lm-auto-recover');
    if(!confirm(`Restore the automatic recovery copy with ${best.counts.students} students, ${best.counts.moments} moments, and ${best.counts.photos} photos?\n\nThe restore will use one protected transaction and roll back if anything fails.`))return;
    btn.disabled=true;btn.textContent='Restoring safely…';
    try{await restoreSnapshot(best.id);location.reload()}catch(err){console.error(err);btn.disabled=false;btn.textContent='Restore Automatic Recovery';alert('Automatic recovery could not be restored. Your current database was not changed.')}
  };
}

async function refreshRecoveryUI(){
  const card=document.querySelector('.data-safety-card');
  if(!card)return;
  let line=card.querySelector('#lm-auto-recovery-status');
  if(!line){
    const wrap=card.querySelector('.data-safety-lines');
    if(!wrap)return;
    const div=document.createElement('div');
    div.innerHTML='<span>Automatic recovery</span><strong id="lm-auto-recovery-status">Checking…</strong>';
    wrap.appendChild(div);line=div.querySelector('strong');
  }
  const snap=(await listSnapshots())[0];
  line.textContent=snap?`${snap.counts.moments} Moments · ${formatWhen(snap.createdAt)}`:'Waiting for first saved Moment';
}

const observer=new MutationObserver(()=>{addRecoveryToWarning().catch(console.error);refreshRecoveryUI().catch(console.error)});
observer.observe(document.body,{childList:true,subtree:true});
window.addEventListener('lm:data-changed',scheduleSnapshot);
window.addEventListener('focus',()=>refreshRecoveryUI().catch(console.error));
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')createSnapshot('background').catch(console.error)});
window.addEventListener('pagehide',()=>createSnapshot('background').catch(()=>{}));
window.__lmCreateRecoverySnapshot=createSnapshot;
window.__lmListRecoverySnapshots=listSnapshots;
window.__lmRestoreRecoverySnapshot=restoreSnapshot;

setTimeout(async()=>{
  try{
    const current=countsOf(await readMain());
    lastSignature=signature(current);
    if(meaningful(current))await createSnapshot('startup');
    await addRecoveryToWarning();
    await refreshRecoveryUI();
  }catch(err){console.error('Little Moments automatic recovery init failed',err)}
},1000);
