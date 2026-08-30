const app=document.querySelector('#app');
function driveState(){try{return JSON.parse(localStorage.getItem('lm-google-drive-backup-v1')||'{}')}catch{return {}}}
function when(v){try{return new Date(v).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'})}catch{return v||''}}
async function install(){
 const card=document.querySelector('.lm-data-warning-card');if(!card||card.dataset.driveRecoveryReady==='1')return;
 const s=driveState();if(!s.connected&&!s.lastBackupAt)return;
 card.dataset.driveRecoveryReady='1';const actions=card.querySelector('.lm-warning-actions');if(!actions)return;
 const box=document.createElement('div');box.className='lm-drive-recovery-box';box.style.cssText='margin:14px 0 4px;padding:14px;border:1px solid #d9cabb;border-radius:16px;background:#fffaf2;text-align:left';
 box.innerHTML=`<strong style="display:block;margin-bottom:6px">School Google Drive backup available ♡</strong><span style="display:block;margin-bottom:10px">${s.lastCounts?.students||0} students · ${s.lastCounts?.moments||0} moments · ${s.lastCounts?.photos||0} photos<br><small>Last backed up ${when(s.lastBackupAt)}</small></span><button type="button" class="primary" id="lm-drive-recover" style="width:100%">Restore from School Google Drive</button>`;
 actions.insertAdjacentElement('beforebegin',box);
 box.querySelector('#lm-drive-recover').onclick=async()=>{const btn=box.querySelector('#lm-drive-recover');btn.disabled=true;btn.textContent='Opening school Google…';try{if(typeof window.__lmRestoreLatestDriveBackup!=='function')throw new Error('Drive recovery is still loading.');const data=await window.__lmRestoreLatestDriveBackup();btn.textContent='Restored safely ♡';setTimeout(()=>location.href=`${location.origin}${location.pathname}?v=165&recovered=${Date.now()}`,500)}catch(e){console.error(e);btn.disabled=false;btn.textContent='Restore from School Google Drive';alert(`Google Drive recovery could not finish: ${e.message||e}`)}};
}
new MutationObserver(()=>install().catch(console.error)).observe(app,{childList:true,subtree:true});install().catch(console.error);