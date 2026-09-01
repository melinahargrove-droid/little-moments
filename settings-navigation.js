const app=document.querySelector('#app');
let settingsSource='home';

function detectSource(){
  if(app.querySelector('.moments-screen'))return 'moments';
  return 'home';
}

function go(route){
  const u=new URL(location.href);
  u.search='';
  u.hash='';
  u.searchParams.set('v','243');
  if(route==='moments')u.searchParams.set('nav','moments');
  location.replace(u.toString());
}

document.addEventListener('click',e=>{
  const opener=e.target.closest?.('#settings,#teacher-tools');
  if(opener){
    settingsSource=detectSource();
    sessionStorage.setItem('lm-settings-source',settingsSource);
    return;
  }
  const back=e.target.closest?.('#settings-back');
  if(!back)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  const route=sessionStorage.getItem('lm-settings-source')||settingsSource||'home';
  sessionStorage.removeItem('lm-settings-source');
  go(route);
},true);

const requested=new URLSearchParams(location.search).get('nav');
if(requested==='moments'){
  let tries=0;
  const restore=()=>{
    tries++;
    if(typeof window.__lmOpenMoments==='function'&&document.querySelector('#app .screen')){
      window.__lmOpenMoments();
      const clean=new URL(location.href);
      clean.searchParams.delete('nav');
      history.replaceState({},'',clean.pathname+(clean.search||''));
      return;
    }
    if(tries<40)setTimeout(restore,50);
  };
  setTimeout(restore,50);
}
