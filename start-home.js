const app=document.querySelector('#app');
function skipCover(){
  const btn=document.querySelector('#open-journal');
  if(!btn||typeof btn.onclick!=='function')return false;
  const handler=btn.onclick;
  window.__lmGoHome=()=>handler();
  btn.click();
  return true;
}
if(!skipCover()){
  const obs=new MutationObserver(()=>{if(skipCover())obs.disconnect()});
  obs.observe(app,{childList:true,subtree:true});
  setTimeout(()=>obs.disconnect(),10000);
}
