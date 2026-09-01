// Little Moments unified navigation for app buttons + Android system Back.
let restoring=false;
const view=()=>history.state?.lmView||'home';

function push(next,data={}){
  if(restoring)return;
  const state={lmView:next,...data};
  if(view()===next) history.replaceState(state,'');
  else history.pushState(state,'');
}
function replace(next,data={}){history.replaceState({lmView:next,...data},'')}
function back(fallback='home'){
  if(view()!=='home'&&history.length>1) history.back();
  else render({lmView:fallback});
}
async function render(state){
  const target=state?.lmView||'home';
  restoring=true;
  try{
    if(target==='settings'&&typeof window.__lmOpenSettings==='function') await window.__lmOpenSettings(false,true);
    else if(target==='moment-detail'&&typeof window.__lmOpenMomentById==='function') await window.__lmOpenMomentById(state.momentId,true);
    else if(target==='moments'&&typeof window.__lmOpenMoments==='function') await window.__lmOpenMoments(true);
    else if(typeof window.__lmHome==='function') await window.__lmHome();
  }finally{
    restoring=false;
  }
}
if(!history.state?.lmView)replace('home');
window.__lmNavPush=push;
window.__lmNavReplace=replace;
window.__lmNavBack=back;
window.__lmNavIsRestoring=()=>restoring;
window.addEventListener('popstate',e=>render(e.state));
