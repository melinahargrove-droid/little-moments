import {getAll,put,clearStore,STORES} from './db.js';

const app=document.querySelector('#app');
const STORE_NAMES=Object.values(STORES);
const PREF_KEY='lm-preferences-v1';
const RESTORE_FLAG='lm-restore-in-progress';
const defaultPrefs={keepFriendsPrompt:true,showRecent:true,confirmDelete:true};
let settingsReturn={route:'home',scrollY:0};
let settingsHistoryActive=false;

function prefs(){try{return {...defaultPrefs,...JSON.parse(localStorage.getItem(PREF_KEY)||'{}')}}catch{return {...defaultPrefs}}}
function savePrefs(p){localStorage.setItem(PREF_KEY,JSON.stringify(p))}
function detectReturnRoute(){
  if(app.querySelector('.detail-screen')&&window.__lmDisplayMoment)return {route:'detail',moment:window.__lmDisplayMoment,scrollY};
  if(app.querySelector('.moments-screen'))return {route:'moments',scrollY};
  return {route:'home',scrollY};
}
async function returnFromSettings(){
  const target=settingsReturn;
  settingsHistoryActive=false;
  if(target.route==='detail'&&target.moment){
    const mod=await import('./moments-view.js');
    await mod.showDetail(target.moment,false,0,window.__lmOpenMoments);
  }else if(target.route==='moments'&&typeof window.__lmOpenMoments==='function'){
    await window.__lmOpenMoments();
  }else if(typeof window.__lmHome==='function'){
    await window.__lmHome();
  }
  requestAnimationFrame(()=>scrollTo({top:target.scrollY||0,behavior:'instant'}));
}

function blobToDataURL(blob){return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=()=>reject(r.error);r.onload=()=>resolve(r.result);r.readAsDataURL(blob)})}
function dataURLToBlob(dataUrl){const [head,body]=String(dataUrl).split(',');const mime=(head.match(/data:([^;]+)/)||[])[1]||'application/octet-stream';const bin=atob(body||'');const bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);return new Blob([bytes],{type:mime})}
async function serializeRecord(record){const out={...record};for(const [k,v] of Object.entries(out)){if(v instanceof Blob)out[k]={__lmBlob:true,data:await blobToDataURL(v)}}return out}
function reviveRecord(record){const out={...record};for(const [k,v] of Object.entries(out)){if(v&&typeof v==='object'&&v.__lmBlob&&v.data)out[k]=dataURLToBlob(v.data)}return out}
async function buildBackup(){const stores={};for(const name of STORE_NAMES){const rows=await getAll(name);stores[name]=[];for(const row of rows)stores[name].push(await serializeRecord(row))}return {format:'little-moments-backup',version:1,createdAt:new Date().toISOString(),preferences:prefs(),stores}}
function backupStamp(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function triggerBackupDownload(backup,filename){const blob=new Blob([JSON.stringify(backup)],{type:'application/json'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000)}
function backupHasClassroomData(backup){const s=backup?.stores||{};return ['students','enrollments','moments','photos'].some(name=>Array.isArray(s[name])&&s[name].length>0)}
async function downloadBackup(status){try{status.textContent='Preparing your backup…';const backup=await buildBackup();triggerBackupDownload(backup,`Little-Moments-Backup-${backupStamp()}.json`);window.__lmBackupPrepared?.();status.innerHTML='Backup file prepared ♡ <button type="button" id="confirm-backup-saved" class="backup-confirm-link">Yes, I saved the file</button>';const confirmBtn=document.querySelector('#confirm-backup-saved');if(confirmBtn)confirmBtn.onclick=()=>{window.__lmConfirmBackupSaved?.();status.textContent='Backup confirmed ♡ Your second copy is saved.'}}catch(err){console.error(err);status.textContent='The backup could not be created.'}}
async function restoreBackup(file,status){let restoreStarted=false;try{status.textContent='Checking backup…';const data=JSON.parse(await file.text());if(data?.format!=='little-moments-backup'||!data.stores)throw new Error('Invalid backup');if(!confirm('Restore this Little Moments backup? This will replace the data currently saved on this device.')){status.textContent='Restore canceled.';return}const current=await buildBackup();if(backupHasClassroomData(current)){status.textContent='Creating an emergency pre-restore backup…';triggerBackupDownload(current,`Little-Moments-Emergency-Pre-Restore-${backupStamp()}.json`)}sessionStorage.setItem(RESTORE_FLAG,'1');restoreStarted=true;status.textContent='Restoring your memories…';for(const name of STORE_NAMES)await clearStore(name);for(const name of STORE_NAMES){const rows=Array.isArray(data.stores[name])?data.stores[name]:[];for(const row of rows)await put(name,reviveRecord(row))}if(data.preferences)savePrefs({...defaultPrefs,...data.preferences});sessionStorage.removeItem(RESTORE_FLAG);restoreStarted=false;window.dispatchEvent(new Event('lm:data-changed'));status.textContent='Restore complete ♡ Reloading Little Moments…';setTimeout(()=>location.reload(),700)}catch(err){console.error(err);if(restoreStarted)sessionStorage.removeItem(RESTORE_FLAG);status.textContent='Restore stopped. Your current data was not intentionally cleared unless the restore had already begun.'}}

function bytesOf(value){if(value instanceof Blob)return value.size;if(typeof value==='string')return new Blob([value]).size;if(value==null)return 0;try{return new Blob([JSON.stringify(value)]).size}catch{return 0}}
function formatBytes(n){if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;return `${(n/1048576).toFixed(n<10485760?1:0)} MB`}
async function storageStats(){const [students,moments,photos]=await Promise.all([getAll(STORES.students),getAll(STORES.moments),getAll(STORES.photos)]);let profileBytes=0,photoBytes=0,recordBytes=0;for(const s of students){profileBytes+=bytesOf(s.profilePhoto||'');recordBytes+=bytesOf({...s,profilePhoto:null})}for(const m of moments)recordBytes+=bytesOf(m);for(const p of photos){photoBytes+=bytesOf(p.blob);recordBytes+=bytesOf({...p,blob:null})}return {students,moments,photos,profileBytes,photoBytes,recordBytes,total:profileBytes+photoBytes+recordBytes}}
async function loadStorage(){const s=await storageStats(),usage=app.querySelector('#storage-summary'),pill=app.querySelector('#storage-pill'),details=app.querySelector('#storage-details');if(usage)usage.textContent=`${s.students.length} ${s.students.length===1?'student':'students'} · ${s.moments.length} ${s.moments.length===1?'moment':'moments'} · ${s.photos.length} ${s.photos.length===1?'photo':'photos'}`;if(pill)pill.textContent=formatBytes(s.total);if(details)details.innerHTML=`<div><span>Moment photos</span><strong>${formatBytes(s.photoBytes)}</strong></div><div><span>Profile photos</span><strong>${formatBytes(s.profileBytes)}</strong></div><div><span>App records</span><strong>${formatBytes(s.recordBytes)}</strong></div><div class="storage-total"><span>Approximate total</span><strong>${formatBytes(s.total)}</strong></div><small>Stored locally on this device ♡</small>`}

function openSettings(autoRestore=false,options={}){
  if(!options.fromHistory)settingsReturn=detectReturnRoute();
  const p=prefs();
  app.innerHTML=`<section class="screen settings-screen"><header class="header"><button class="icon-btn" id="settings-back">←</button><div class="header-title"><small>Little Moments</small><h2>Settings &amp;<br>Data Safety</h2></div><span style="width:44px" aria-hidden="true"></span></header><div class="settings-intro">make Little Moments fit your classroom, then keep every memory safe ♡</div><div class="settings-list"><section class="settings-card class-settings-card"><div class="settings-card-head"><div class="settings-card-icon">👥</div><div><h3>Class &amp; Students</h3><p>Add students, update profile photos, and manage your current class.</p></div></div><button class="secondary compact class-settings-button" id="open-class-setup">Manage Class &amp; Students</button><div class="settings-status"><span>This is the permanent place to manage your roster.</span><span class="settings-pill">Class</span></div></section><section class="settings-card preferences-card" id="preferences-card"><div class="settings-card-head"><div class="settings-card-icon">✦</div><div><h3>Preferences</h3><p>Small choices that make capturing and revisiting your Little Moments easier.</p></div></div><div class="preference-list"><label><span><strong>Keep-friends prompt</strong><small>Ask whether to keep the same children after Capture Another.</small></span><input type="checkbox" data-pref="keepFriendsPrompt" ${p.keepFriendsPrompt?'checked':''}><i></i></label><label><span><strong>Recent Moments preview</strong><small>Show your latest saved moments on the home page.</small></span><input type="checkbox" data-pref="showRecent" ${p.showRecent?'checked':''}><i></i></label><label><span><strong>Confirm before deleting</strong><small>Ask before permanently removing a Little Moment.</small></span><input type="checkbox" data-pref="confirmDelete" ${p.confirmDelete?'checked':''}><i></i></label></div><div class="settings-status"><span id="preference-status">Your choices save automatically.</span><span class="settings-pill">Saved</span></div></section><section class="settings-card"><div class="settings-card-head"><div class="settings-card-icon">↥</div><div><h3>Backup &amp; Restore</h3><p>Create a safe copy of your class, moments, photos, and portfolios for another device or school year.</p></div></div><div class="backup-actions"><button class="primary compact" id="create-backup">Create Backup</button><button class="secondary compact" id="restore-backup">Restore Backup</button><input id="restore-file" class="sr-only" type="file" accept="application/json,.json"></div><div class="settings-status"><span id="backup-status">Your backup includes photos and student profiles.</span><span class="settings-pill">Ready</span></div></section><section class="settings-card storage-card" id="storage-card" role="button" tabindex="0" aria-expanded="false"><div class="settings-card-head"><div class="settings-card-icon">▣</div><div><h3>Storage</h3><p>See how much space your saved photos and Little Moments are using.</p></div></div><div class="settings-status"><span id="storage-summary">Tap to calculate storage details.</span><span class="settings-pill" id="storage-pill">Details</span></div><div class="storage-details hidden" id="storage-details"></div><div class="storage-tap-hint">Tap for details⌄</div></section><section class="settings-card privacy-card"><div class="settings-card-head"><div class="settings-card-icon">♡</div><div><h3>Privacy</h3><p>Little Moments keeps classroom information inside this app on your device.</p></div></div><div class="settings-status"><span>Your classroom memories stay private.</span><span class="settings-pill">Local</span></div></section></div><div class="settings-note">Your students, school years, and saved Little Moments stay connected unless you deliberately change or remove them. ♡</div></section>`;
  if(!options.fromHistory){history.pushState({lmScreen:'settings'},'');settingsHistoryActive=true}
  app.querySelector('#settings-back').addEventListener('click',()=>{if(settingsHistoryActive)history.back();else returnFromSettings()});
  const status=app.querySelector('#backup-status'),fileInput=app.querySelector('#restore-file'),storageCard=app.querySelector('#storage-card'),storageDetails=app.querySelector('#storage-details'),hint=storageCard.querySelector('.storage-tap-hint');
  app.querySelector('#open-class-setup').addEventListener('click',()=>window.__lmOpenClassSetup?.());
  app.querySelector('#create-backup').addEventListener('click',()=>downloadBackup(status));
  app.querySelector('#restore-backup').addEventListener('click',()=>fileInput.click());
  fileInput.addEventListener('change',()=>{const file=fileInput.files?.[0];if(file)restoreBackup(file,status)});
  let storageLoaded=false;
  const toggleStorage=async()=>{const open=storageCard.getAttribute('aria-expanded')==='true';storageCard.setAttribute('aria-expanded',String(!open));storageDetails.classList.toggle('hidden',open);hint.textContent=open?'Tap for details⌄':'Tap to close⌃';if(!open&&!storageLoaded){storageLoaded=true;app.querySelector('#storage-summary').textContent='Calculating…';await loadStorage().catch(err=>{console.error(err);const s=app.querySelector('#storage-summary');if(s)s.textContent='Storage details could not be loaded.'})}};
  storageCard.addEventListener('click',toggleStorage);
  storageCard.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleStorage()}});
  app.querySelectorAll('[data-pref]').forEach(input=>input.addEventListener('change',()=>{const next=prefs();next[input.dataset.pref]=input.checked;savePrefs(next);const s=app.querySelector('#preference-status');s.textContent='Saved ♡';setTimeout(()=>{if(s)s.textContent='Your choices save automatically.'},900)}));
  window.scrollTo({top:0,behavior:'instant'});
  if(autoRestore)setTimeout(()=>fileInput.click(),120);
}

document.addEventListener('click',e=>{const btn=e.target.closest('#settings,#teacher-tools');if(!btn)return;e.preventDefault();e.stopImmediatePropagation();openSettings()},true);
window.addEventListener('lm:open-settings-for-restore',()=>openSettings(true));
window.addEventListener('lm:open-settings',()=>openSettings(false));
window.addEventListener('popstate',()=>{if(app.querySelector('.settings-screen'))returnFromSettings()});
window.__lmOpenSettings=openSettings;
