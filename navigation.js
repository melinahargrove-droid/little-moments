// Little Moments unified navigation for app buttons + Android system Back.
const app=document.querySelector('#app');
let restoring=false;
let lastDetected='home';
const view=()=>history.state?.lmView||'home';

function push(next,data={}){
  if(restoring)return;
  const state={lmView:next,...data};
  if(view()===next) history.replaceState(state,'');
  else history.pushState(state,'');
}
function replace(next,data={}){history.replaceState({lmView:next,...data},'')}
function detectView(){
  if(app.querySelector('.settings-screen'))return {lmView:'settings'};
  if(app.querySelector('.detail-screen'))return {lmView:'moment-detail',momentId:window.__lmDisplayMoment?.id||null};
  if(app.querySelector('.moments-screen:not(.detail-screen):not(.edit-moment-screen)'))return {lmView:'moments'};
  if(app.querySelector('#capture')&&app.querySelector('#moments'))return {lmView:'home'};
  return null;
}
async function render(state){
  const target=state?.lmView||'home';
  restoring=true;
  try{
    if(target==='settings') window.dispatchEvent(new Event('lm:open-settings'));
    else if(target==='moments'&&typeof window.__lmOpenMoments==='function') await window.__lmOpenMoments();
    else if(target==='moment-detail'&&window.__lmDisplayMoment?.id===state.momentId){
      // A detail screen can be restored from the in-memory moment when available.
      const mod=await import('./moments-view.js?v=234');
      await mod.showDetail(window.__lmDisplayMoment,false,0,window.__lmOpenMoments);
    }else if(typeof window.__lmHome==='function') await window.__lmHome();
  }finally{
    requestAnimationFrame(()=>{lastDetected=detectView()?.lmView||target;restoring=false});
  }
}
function back(){
  if(view()!=='home'&&history.length>1)history.back();
  else render({lmView:'home'});
}

if(!history.state?.lmView)replace('home');
lastDetected=view();
window.__lmNavPush=push;
window.__lmNavReplace=replace;
window.__lmNavBack=back;
window.__lmNavIsRestoring=()=>restoring;

// Record screen changes no matter which module opened them.
new MutationObserver(()=>{
  if(restoring)return;
  const detected=detectView();
  if(!detected)return;
  const key=detected.lmView;
  if(key===lastDetected&&view()===key)return;
  lastDetected=key;
  push(key,detected.momentId?{momentId:detected.momentId}:{});
}).observe(app,{childList:true,subtree:true});

// Make visible Back buttons use the same history as Android's system Back.
document.addEventListener('click',e=>{
  const btn=e.target.closest('#settings-back,#moments-back,#detail-back');
  if(!btn)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  back();
},true);

window.addEventListener('popstate',e=>render(e.state));
