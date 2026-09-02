import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import {getAll,replaceAllStoresAtomic,STORES} from './db.js';

const STORE_NAMES=Object.values(STORES);
const STATE_KEY='lm-one-little-teacher-cloud-v1';
const CHANGE_DELAY=1800;
let client=null,timer=null,busy=false,pending=false;

function cfg(){return window.ONE_LITTLE_TEACHER_CLOUD||{}}
function configured(){const c=cfg();return !!(c.supabaseUrl&&c.supabasePublishableKey&&c.storageBucket&&c.appNamespace)}
function state(){try{return JSON.parse(localStorage.getItem(STATE_KEY)||'{}')}catch{return{}}}
function saveState(v){localStorage.setItem(STATE_KEY,JSON.stringify(v));refreshUI()}
function when(v){if(!v)return'Never';try{return new Date(v).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}catch{return v}}
function blobData(blob){return new Promise((res,rej)=>{const f=new FileReader();f.onerror=()=>rej(f.error);f.onload=()=>res(f.result);f.readAsDataURL(blob)})}
async function serializeRecord(record){const out={...record};for(const[k,v]of Object.entries(out))if(v instanceof Blob)out[k]={__lmBlob:true,data:await blobData(v)};return out}
function reviveRecord(record){const out={...record};for(const[k,v]of Object.entries(out))if(v&&typeof v==='object'&&v.__lmBlob&&v.data){const[head,body]=String(v.data).split(','),mime=(head.match(/data:([^;]+)/)||[])[1]||'application/octet-stream',bin=atob(body||''),bytes=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);out[k]=new Blob([bytes],{type:mime})}return out}
function recordSig(name,r){if(name==='photos')return `${r.id}:${r.size||r.blob?.size||0}:${r.name||''}`;if(name==='moments')return `${r.id}:${r.updatedAt||r.createdAt||''}:${r.caption||''}:${r.date||''}:${(r.studentIds||[]).join(',')}:${(r.tags||[]).join(',')}:${!!r.favorite}`;if(name==='students')return `${r.id}:${r.name||''}:${typeof r.profilePhoto==='string'?r.profilePhoto.length:0}`;return `${r.id||r.key||''}:${r.updatedAt||r.createdAt||''}:${JSON.stringify(r).length}`}
function meaningful(b){const c=b?.counts||{};return c.students||c.moments||c.photos||c.enrollments}
function richness(c={}){return(Number(c.moments)||0)*1000000+(Number(c.photos)||0)*10000+(Number(c.students)||0)*100+(Number(c.enrollments)||0)}

function supabase(){
  if(client)return client;
  if(!configured())return null;
  const c=cfg();
  client=createClient(c.supabaseUrl,c.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  client.auth.onAuthStateChange((_event,session)=>{saveState({...state(),signedIn:!!session?.user,email:session?.user?.email||null,userId:session?.user?.id||null})});
  return client;
}

async function session(){const sb=supabase();if(!sb)return null;const{data}=await sb.auth.getSession();return data?.session||null}

async function buildBackup(){
  const stores={},sigParts=[];
  for(const name of STORE_NAMES){const rows=await getAll(name);stores[name]=[];for(const row of rows){sigParts.push(`${name}|${recordSig(name,row)}`);stores[name].push(await serializeRecord(row))}}
  const counts={students:stores.students.length,moments:stores.moments.length,photos:stores.photos.length,enrollments:stores.enrollments.length};
  return{format:'little-moments-backup',version:4,createdAt:new Date().toISOString(),source:'one-little-teacher-cloud',appNamespace:cfg().appNamespace,counts,contentSignature:sigParts.sort().join('~'),stores};
}

function cloudPath(userId){return `${userId}/${cfg().appNamespace}/latest.json`}

async function uploadBackup(b){
  const sb=supabase(),s=await session();
  if(!sb||!s)throw new Error('Sign in to One Little Teacher Cloud first.');
  const body=new Blob([JSON.stringify(b)],{type:'application/json'});
  const{error}=await sb.storage.from(cfg().storageBucket).upload(cloudPath(s.user.id),body,{contentType:'application/json',upsert:true,cacheControl:'0'});
  if(error)throw error;
}

export async function backupNow(reason='automatic',interactive=false){
  if(busy){pending=true;return null}busy=true;
  try{
    if(!configured()){saveState({...state(),status:'not-configured'});return null}
    const s=await session();if(!s){saveState({...state(),status:'sign-in-required'});if(interactive)throw new Error('Sign in to One Little Teacher Cloud first.');return null}
    const b=await buildBackup();if(!meaningful(b))return null;
    const old=state();if(!interactive&&old.lastContentSignature===b.contentSignature)return null;
    await uploadBackup(b);
    saveState({...old,status:'backed-up',signedIn:true,email:s.user.email||null,userId:s.user.id,lastBackupAt:b.createdAt,lastCounts:b.counts,lastContentSignature:b.contentSignature,lastError:null,lastReason:reason});
    window.dispatchEvent(new CustomEvent('lm:cloud-backup-complete',{detail:{createdAt:b.createdAt,counts:b.counts}}));
    return b;
  }catch(e){saveState({...state(),status:'error',lastError:String(e.message||e),lastErrorAt:new Date().toISOString()});if(interactive)throw e;return null}
  finally{busy=false;if(pending){pending=false;setTimeout(()=>backupNow('queued'),300)}}
}

export async function signIn(email){
  const sb=supabase();if(!sb)throw new Error('One Little Teacher Cloud is not configured yet.');
  const{error}=await sb.auth.signInWithOtp({email,options:{emailRedirectTo:location.href.split('#')[0]}});if(error)throw error;
  saveState({...state(),status:'magic-link-sent',email});
}

export async function signOut(){const sb=supabase();if(sb)await sb.auth.signOut();saveState({status:configured()?'signed-out':'not-configured'});refreshUI()}

export async function latestCloudBackup(){
  const sb=supabase(),s=await session();if(!sb||!s)throw new Error('Sign in to One Little Teacher Cloud first.');
  const{data,error}=await sb.storage.from(cfg().storageBucket).download(cloudPath(s.user.id));if(error)throw error;
  const backup=JSON.parse(await data.text());if(backup?.format!=='little-moments-backup'||!backup?.stores)throw new Error('The online backup is not a valid Little Moments recovery file.');return backup;
}

export async function restoreLatestCloudBackup(){
  const data=await latestCloudBackup(),rows={};for(const name of STORE_NAMES)rows[name]=(Array.isArray(data.stores[name])?data.stores[name]:[]).map(reviveRecord);
  await replaceAllStoresAtomic(rows,{reason:'one-little-teacher-cloud-restore'});
  saveState({...state(),status:'backed-up',lastBackupAt:data.createdAt,lastCounts:data.counts||{},lastContentSignature:data.contentSignature||null,lastRestoreAt:new Date().toISOString(),lastError:null});
  return data;
}

function schedule(e){if(e?.detail?.operation==='atomic-restore')return;clearTimeout(timer);timer=setTimeout(()=>backupNow('change'),CHANGE_DELAY)}

function refreshUI(){
  const card=document.querySelector('.olt-cloud-card');if(!card)return;const s=state(),status=card.querySelector('#olt-cloud-status'),pill=card.querySelector('.settings-pill'),email=card.querySelector('#olt-cloud-email'),send=card.querySelector('#olt-cloud-send'),backup=card.querySelector('#olt-cloud-now'),signout=card.querySelector('#olt-cloud-signout');
  const signed=!!s.signedIn;
  if(email)email.style.display=signed?'none':'block';if(send)send.style.display=signed?'none':'block';if(backup)backup.style.display=signed?'block':'none';if(signout)signout.style.display=signed?'block':'none';
  if(pill)pill.textContent=!configured()?'Setup':signed?(s.status==='backed-up'?'Protected':'Connected'):'Sign in';
  if(status)status.textContent=!configured()?'Cloud setup has not been connected to this app yet.':signed&&s.lastBackupAt?`${s.email||'One Little Teacher account'} · Last backup ${when(s.lastBackupAt)} · ${s.lastCounts?.moments||0} Moments protected`:signed?`${s.email||'One Little Teacher account'} · Connected. Your next change will back up automatically.`:'Sign in once with your One Little Teacher email. No Google Drive connection is required.';
}

function install(){
  const screen=document.querySelector('.settings-screen');if(!screen||screen.dataset.oltCloudReady==='1')return;const list=screen.querySelector('.settings-list');if(!list)return;screen.dataset.oltCloudReady='1';
  const card=document.createElement('section');card.className='settings-card olt-cloud-card';card.innerHTML=`<div class="settings-card-head"><div class="settings-card-icon">☁</div><div><h3>One Little Teacher Cloud</h3><p>Private automatic online protection for your Little Moments classroom memories.</p></div></div><label id="olt-cloud-email" style="display:block;margin:12px 0 8px"><span style="display:block;font-weight:700;margin-bottom:6px">Email</span><input id="olt-cloud-email-input" type="email" autocomplete="email" placeholder="you@example.com" style="box-sizing:border-box;width:100%;padding:11px;border:1px solid #d8cec1;border-radius:12px;background:#fff"></label><button type="button" class="primary compact" id="olt-cloud-send">Send Sign-In Link</button><button type="button" class="primary compact" id="olt-cloud-now" style="display:none">Back Up Now</button><button type="button" class="secondary compact" id="olt-cloud-signout" style="display:none;margin-top:8px">Sign Out</button><div class="settings-status" style="margin-top:10px"><span id="olt-cloud-status">Checking cloud protection…</span><span class="settings-pill">Cloud</span></div><small style="display:block;margin-top:8px;line-height:1.4">Little Moments stays fully usable offline. Cloud protection is an additional private recovery copy tied to your One Little Teacher account.</small>`;
  const dataCard=list.querySelector('.data-safety-card');if(dataCard)dataCard.insertAdjacentElement('afterend',card);else list.appendChild(card);
  card.querySelector('#olt-cloud-send').onclick=async()=>{const input=card.querySelector('#olt-cloud-email-input'),btn=card.querySelector('#olt-cloud-send');const email=input.value.trim();if(!email)return;btn.disabled=true;try{await signIn(email);card.querySelector('#olt-cloud-status').textContent='Check your email and tap the One Little Teacher sign-in link.'}catch(e){card.querySelector('#olt-cloud-status').textContent=`Sign-in could not start: ${e.message||e}`}finally{btn.disabled=false;refreshUI()}};
  card.querySelector('#olt-cloud-now').onclick=async()=>{const btn=card.querySelector('#olt-cloud-now');btn.disabled=true;try{await backupNow('manual',true)}catch(e){card.querySelector('#olt-cloud-status').textContent=`Backup did not finish: ${e.message||e}`}finally{btn.disabled=false;refreshUI()}};
  card.querySelector('#olt-cloud-signout').onclick=()=>signOut().catch(console.error);
  refreshUI();
}

async function boot(){
  if(configured()){const s=await session();saveState({...state(),signedIn:!!s?.user,email:s?.user?.email||state().email||null,userId:s?.user?.id||null,status:s?.user?(state().status==='backed-up'?'backed-up':'connected'):'sign-in-required'});if(s?.user)backupNow('startup').catch(()=>{})}
  install();
}

new MutationObserver(()=>install()).observe(document.querySelector('#app'),{childList:true,subtree:true});
window.addEventListener('lm:data-changed',schedule);window.addEventListener('lm:recovery-snapshot-created',schedule);window.addEventListener('online',()=>backupNow('online').catch(()=>{}));document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')backupNow('foreground').catch(()=>{})});
window.__lmCloudBackupNow=backupNow;window.__lmLatestCloudBackup=latestCloudBackup;window.__lmRestoreLatestCloudBackup=restoreLatestCloudBackup;window.__lmBuildCloudBackup=buildBackup;
boot().catch(console.error);
