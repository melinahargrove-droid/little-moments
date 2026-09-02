const DRIVE_STATE_KEY='lm-google-drive-backup-v1';
const TOKEN_KEY='lm-google-drive-session-token-v1';
const LEDGER_KEY='lm-drive-protection-ledger-v1';
const app=document.querySelector('#app');
let startupTimer=null;

function readJSON(key){try{return JSON.parse(localStorage.getItem(key)||'{}')}catch{return {}}}
function writeJSON(key,value){try{localStorage.setItem(key,JSON.stringify(value))}catch{}}
function driveState(){return readJSON(DRIVE_STATE_KEY)}
function ledger(){return readJSON(LEDGER_KEY)}
function hasActiveToken(){try{const s=JSON.parse(sessionStorage.getItem(TOKEN_KEY)||'{}');return !!(s.token&&Number(s.expiresAt)>Date.now()+30000)}catch{return false}}
function when(v){if(!v)return'never';try{return new Date(v).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}catch{return String(v)}}
function setDirty(detail={}){
  if(detail?.operation==='atomic-restore')return;
  const now=new Date().toISOString(),old=ledger();
  writeJSON(LEDGER_KEY,{...old,dirty:true,dirtyAt:now,lastChangeOperation:detail?.operation||'change',lastChangeStore:detail?.store||null});
  render();
}
function confirmProtected(detail={}){
  const old=ledger(),backupAt=detail?.createdAt||new Date().toISOString();
  if(old.dirtyAt&&new Date(backupAt).getTime()<new Date(old.dirtyAt).getTime()){render();return}
  writeJSON(LEDGER_KEY,{...old,dirty:false,lastProtectedAt:backupAt,lastProtectedCounts:detail?.counts||old.lastProtectedCounts||null});
  render();
}
function protectionStatus(){
  const d=driveState(),l=ledger(),token=hasActiveToken();
  if(!d.connected)return{kind:'off',title:'Drive protection is not connected',detail:'Your classroom changes are only on this device.',button:'Connect Drive'};
  if(l.dirty&&!token)return{kind:'danger',title:'Changes are NOT backed up yet',detail:'Reconnect School Google Drive now so these changes are protected.',button:'Reconnect & Protect'};
  if(l.dirty&&token)return{kind:'working',title:'Protecting your latest changes…',detail:'Little Moments is sending the newest classroom copy to Drive.',button:null};
  if(d.needsSessionReconnect&&!token)return{kind:'warn',title:'Drive protection needs reconnecting',detail:`Last confirmed Drive backup: ${when(d.lastBackupAt||l.lastProtectedAt)}`,button:'Reconnect Drive'};
  return{kind:'ok',title:'Classroom protected ✓',detail:`Last Drive backup: ${when(d.lastBackupAt||l.lastProtectedAt)}`,button:null};
}
async function reconnectAndProtect(btn){
  if(typeof window.__lmDriveBackupNow!=='function'){alert('Drive protection is still loading. Try again in a moment.');return}
  btn.disabled=true;btn.textContent='Connecting…';
  try{await window.__lmDriveBackupNow('reliability-protect',true);render()}catch(e){console.error(e);btn.disabled=false;btn.textContent='Try Reconnect Again';alert(`Google Drive protection did not finish: ${e?.message||e}`)}
}
function openSettings(){window.dispatchEvent(new Event('lm:open-settings'))}
function render(){
  let bar=document.querySelector('#lm-drive-protection-bar');
  const warning=document.querySelector('.lm-data-warning');
  const screen=app?.querySelector('.screen');
  if(!screen||warning){bar?.remove();return}
  const s=protectionStatus();
  if(!bar){bar=document.createElement('aside');bar.id='lm-drive-protection-bar';document.body.appendChild(bar)}
  const palette=s.kind==='danger'?['#fff1ed','#a94f42','#d98a79']:s.kind==='warn'?['#fff8e7','#7d6732','#dfc878']:s.kind==='working'?['#f4f1e9','#665d51','#c9bba7']:s.kind==='off'?['#fff3ed','#8b564e','#d9b2aa']:['#f3f7ef','#50664e','#b8c9ae'];
  Object.assign(bar.style,{position:'fixed',left:'12px',right:'12px',bottom:'calc(10px + env(safe-area-inset-bottom))',zIndex:'9998',display:'grid',gridTemplateColumns:s.button?'1fr auto':'1fr',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'16px',background:palette[0],border:`1px solid ${palette[2]}`,boxShadow:'0 7px 22px rgba(45,38,31,.16)',font:'12px/1.25 system-ui,sans-serif',color:palette[1]});
  bar.innerHTML=`<div><strong style="display:block;font-size:13px">${s.title}</strong><span style="display:block;margin-top:2px">${s.detail}</span></div>${s.button?`<button type="button" id="lm-drive-protect-action" style="border:1px solid ${palette[2]};background:#fffaf4;border-radius:12px;padding:9px 11px;font-weight:800;color:${palette[1]}">${s.button}</button>`:''}`;
  const btn=bar.querySelector('#lm-drive-protect-action');
  if(btn)btn.onclick=()=>s.kind==='off'?openSettings():reconnectAndProtect(btn);
}
function tryStartupProtection(){
  clearTimeout(startupTimer);
  startupTimer=setTimeout(async()=>{
    const l=ledger();if(!l.dirty||!hasActiveToken()||typeof window.__lmDriveBackupNow!=='function'){render();return}
    try{await window.__lmDriveBackupNow('startup-pending')}catch{}finally{render()}
  },1800)
}
window.addEventListener('lm:data-changed',e=>{setDirty(e.detail||{});tryStartupProtection()});
window.addEventListener('lm:drive-backup-complete',e=>confirmProtected(e.detail||{}));
window.addEventListener('focus',()=>{render();tryStartupProtection()});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){render();tryStartupProtection()}});
new MutationObserver(render).observe(app,{childList:true,subtree:true});
setTimeout(()=>{render();tryStartupProtection()},1200);
window.__lmDriveProtectionStatus=protectionStatus;