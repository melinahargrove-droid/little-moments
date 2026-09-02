const CLOUD_STATE_KEY='lm-one-little-teacher-cloud-v1';
function cloudState(){try{return JSON.parse(localStorage.getItem(CLOUD_STATE_KEY)||'{}')}catch{return{}}}
function patch(){
  const warning=document.querySelector('.lm-data-warning');if(!warning)return;
  const button=warning.querySelector('#lm-data-restore');if(!button||button.dataset.oltCloudPatched==='1')return;
  const s=cloudState();if(!s.signedIn)return;
  button.dataset.oltCloudPatched='1';button.textContent='Restore from One Little Teacher Cloud';
  button.onclick=async()=>{
    const msg=warning.querySelector('#lm-warning-status');button.disabled=true;button.textContent='Opening One Little Teacher Cloud…';if(msg)msg.textContent='Checking your private online recovery copy.';
    try{
      if(typeof window.__lmRestoreLatestCloudBackup!=='function')throw new Error('Cloud recovery is still loading. Try again in a moment.');
      const data=await window.__lmRestoreLatestCloudBackup();
      if(msg)msg.innerHTML=`<strong>Restored safely ♡</strong> ${data?.counts?.moments||0} Moments recovered. Reloading…`;
      setTimeout(()=>location.href=`${location.origin}${location.pathname}?recovered=${Date.now()}`,600);
    }catch(e){console.error(e);button.disabled=false;button.textContent='Restore from One Little Teacher Cloud';if(msg)msg.innerHTML=`<strong>Online recovery did not finish.</strong> ${String(e.message||e)}`}
  };
}
new MutationObserver(patch).observe(document.body,{childList:true,subtree:true});window.addEventListener('lm:cloud-backup-complete',patch);patch();
