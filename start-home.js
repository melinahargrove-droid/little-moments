const app=document.querySelector('#app');
const coverStyle=document.createElement('style');coverStyle.textContent='.cover{display:none!important}';document.head.appendChild(coverStyle);
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
