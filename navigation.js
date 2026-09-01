// Little Moments navigation coordinator — v2.35
const app=document.querySelector('#app');
let rendering=false;
function detectView(){
  if(app.querySelector('.settings-screen')) return 'settings';
  if(app.querySelector('.detail-screen')) return 'moment-detail';
  if(app.querySelector('.moments-screen')) return 'moments';
  return 'home';
}
function ensureState(view=detectView()){
  if(!history.state?.lmView) history.replaceState({lmView:view},'');
}
function push(view,extra={}){
  if(rendering) return;
  const current=detectView();
  if(history.state?.lmView!==current) history.replaceState({...(history.state||{}),lmView:current},'');
  if(history.state?.lmView===view) return;
  history.pushState({lmView:view,...extra},'');
}
async function render(state){
  const target=state?.lmView||'home';
  rendering=true;
  try{
    if(target==='settings') window.dispatchEvent(new Event('lm:open-settings'));
    else if(target==='moments') await window.__lmOpenMoments?.();
    else if(target==='moment-detail'&&state?.momentId){
      const {get,STORES}=await import('./db.js?v=235');
      const {showDetail}=await import('./moments-view.js?v=235');
      const moment=await get(STORES.moments,state.momentId);
      if(moment) await showDetail(moment,false,0,window.__lmOpenMoments);
      else await window.__lmOpenMoments?.();
    }else await window.__lmHome?.();
  }finally{rendering=false;}
}
function goBack(){
  ensureState();
  if(history.state?.lmView!=='home'&&history.length>1) history.back();
  else render({lmView:'home'});
}
ensureState('home');
window.__lmNavPush=push;
window.__lmNavBack=goBack;
window.__lmNavIsRendering=()=>rendering;

document.addEventListener('click',e=>{
  const settingsTrigger=e.target.closest('#settings,#teacher-tools,[data-open-settings]');
  if(settingsTrigger){
    const from=detectView();
    if(from!=='settings') push('settings',{lmFrom:from});
    return;
  }
  const momentsTrigger=e.target.closest('#moments,#see-all');
  if(momentsTrigger){
    if(detectView()!=='moments') push('moments');
    return;
  }
  const detailTrigger=e.target.closest('[data-open-moment],.mini-polaroid[data-moment]');
  if(detailTrigger){
    const momentId=detailTrigger.dataset.openMoment||detailTrigger.dataset.moment;
    if(momentId) push('moment-detail',{momentId});
    return;
  }
  const back=e.target.closest('#settings-back,#moments-back,#detail-back');
  if(back){
    e.preventDefault();
    e.stopImmediatePropagation();
    goBack();
  }
},true);
window.addEventListener('popstate',e=>render(e.state));
