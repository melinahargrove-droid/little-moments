// Targeted Settings return fix: preserve the screen Settings was opened from without changing app startup/navigation.
let settingsSource='home';

document.addEventListener('click',e=>{
  const open=e.target.closest('#settings,#teacher-tools');
  if(open){
    settingsSource=document.querySelector('.moments-screen:not(.detail-screen):not(.edit-moment-screen)')?'moments':'home';
    return;
  }
  const back=e.target.closest('#settings-back');
  if(!back)return;
  if(settingsSource!=='moments')return;
  e.preventDefault();
  e.stopImmediatePropagation();
  settingsSource='home';
  if(typeof window.__lmOpenMoments==='function')window.__lmOpenMoments();
  else if(typeof window.__lmHome==='function')window.__lmHome();
},true);
