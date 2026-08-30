const app=document.querySelector('#app');
const style=document.createElement('style');
style.id='lm-skip-cover-style';
style.textContent='.cover{display:none!important}';
document.head.appendChild(style);
function skipCover(){
  const btn=document.querySelector('#open-journal');
  if(!btn)return false;
  btn.click();
  style.remove();
  return true;
}
if(!skipCover()){
  const obs=new MutationObserver(()=>{if(skipCover())obs.disconnect()});
  obs.observe(app,{childList:true,subtree:true});
}
