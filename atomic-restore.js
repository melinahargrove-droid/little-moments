import {STORES,replaceAllStoresAtomic} from './db.js';

const STORE_NAMES=Object.values(STORES);
const PREF_KEY='lm-preferences-v1';
const defaultPrefs={keepFriendsPrompt:true,showRecent:true,confirmDelete:true};

function dataURLToBlob(dataUrl){
  const [head,body]=String(dataUrl).split(',');
  const mime=(head.match(/data:([^;]+)/)||[])[1]||'application/octet-stream';
  const bin=atob(body||'');
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  return new Blob([bytes],{type:mime});
}

function reviveRecord(record){
  if(!record||typeof record!=='object'||Array.isArray(record))throw new Error('A backup record is malformed.');
  const out={...record};
  for(const [k,v] of Object.entries(out)){
    if(v&&typeof v==='object'&&v.__lmBlob){
      if(typeof v.data!=='string'||!v.data.startsWith('data:'))throw new Error('A photo in this backup is malformed.');
      out[k]=dataURLToBlob(v.data);
    }
  }
  return out;
}

function prepareBackup(data){
  if(data?.format!=='little-moments-backup'||Number(data?.version)!==1||!data.stores||typeof data.stores!=='object'){
    throw new Error('This is not a valid Little Moments backup file.');
  }
  const prepared={};
  for(const name of STORE_NAMES){
    const rows=data.stores[name];
    if(rows!==undefined&&!Array.isArray(rows))throw new Error(`The ${name} section of this backup is damaged.`);
    prepared[name]=(rows||[]).map(reviveRecord);
  }
  const classroomCount=prepared.students.length+prepared.enrollments.length+prepared.moments.length+prepared.photos.length;
  if(classroomCount===0)throw new Error('This backup contains no classroom data, so Little Moments will not use it to replace your database.');
  if(prepared.students.some(r=>!r.id)||prepared.enrollments.some(r=>!r.id)||prepared.moments.some(r=>!r.id)||prepared.photos.some(r=>!r.id)){
    throw new Error('This backup is missing one or more required record IDs.');
  }
  if(prepared.schoolYears.some(r=>!r.id)||prepared.books.some(r=>!r.id)||prepared.settings.some(r=>!r.key)){
    throw new Error('This backup contains an invalid supporting record.');
  }
  return prepared;
}

function chooseBackupFile(){
  return new Promise(resolve=>{
    const input=document.createElement('input');
    input.type='file';input.accept='application/json,.json';input.style.position='fixed';input.style.left='-9999px';
    document.body.appendChild(input);
    input.addEventListener('change',()=>{const file=input.files?.[0]||null;input.remove();resolve(file)},{once:true});
    input.click();
  });
}

function showMessage(message,isError=false){
  const old=document.querySelector('.lm-atomic-restore-status');old?.remove();
  const box=document.createElement('div');box.className='lm-atomic-restore-status';
  Object.assign(box.style,{position:'fixed',left:'20px',right:'20px',bottom:'24px',zIndex:'20050',padding:'16px 18px',borderRadius:'18px',background:isError?'#fff4f1':'#f7fbf4',border:`1px solid ${isError?'#d88377':'#9aae8b'}`,boxShadow:'0 8px 28px rgba(55,45,35,.18)',font:'600 15px/1.35 system-ui,sans-serif',color:'#544c45',textAlign:'center'});
  box.textContent=message;document.body.appendChild(box);
  if(isError)setTimeout(()=>box.remove(),7000);
}

async function runSafeRestore(){
  const file=await chooseBackupFile();
  if(!file)return;
  try{
    showMessage('Checking your backup before changing anything…');
    const data=JSON.parse(await file.text());
    const prepared=prepareBackup(data);
    const counts=`${prepared.students.length} students, ${prepared.moments.length} moments, and ${prepared.photos.length} photos`;
    if(!confirm(`This backup contains ${counts}. Restore it now?\n\nLittle Moments will replace the current database in one protected transaction. If anything fails, the database change will roll back.`)){
      showMessage('Restore canceled. Nothing was changed.');return;
    }
    showMessage('Restoring your Little Moments safely…');
    await replaceAllStoresAtomic(prepared);
    if(data.preferences){
      try{localStorage.setItem(PREF_KEY,JSON.stringify({...defaultPrefs,...data.preferences}))}catch{}
    }
    showMessage('Restore complete ♡ Reloading…');
    setTimeout(()=>location.reload(),800);
  }catch(err){
    console.error('Safe restore stopped:',err);
    showMessage(`Restore stopped safely. ${err?.message||'The backup could not be restored.'} No partial restore was committed.`,true);
  }
}

// Intercept the missing-data warning's restore request before the older restore flow.
window.addEventListener('lm:open-settings-for-restore',e=>{
  e.stopImmediatePropagation();
  runSafeRestore();
},true);

// Also protect the Restore Backup button inside Settings.
document.addEventListener('click',e=>{
  const btn=e.target.closest?.('#restore-backup');
  if(!btn)return;
  e.preventDefault();e.stopImmediatePropagation();
  runSafeRestore();
},true);

window.__lmRunSafeRestore=runSafeRestore;
