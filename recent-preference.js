const PREF_KEY='lm-preferences-v1';
function readPrefs(){try{return JSON.parse(localStorage.getItem(PREF_KEY)||'{}')}catch{return {}}}
function applyRecentPreference(){
  const recent=document.querySelector('#app .recent-strip');
  if(!recent)return;
  const show=readPrefs().showRecent!==false;
  recent.hidden=!show;
  recent.style.display=show?'':'none';
}
new MutationObserver(applyRecentPreference).observe(document.getElementById('app'),{childList:true,subtree:true});
window.addEventListener('storage',applyRecentPreference);
document.addEventListener('change',e=>{if(e.target?.matches?.('[data-pref="showRecent"]'))queueMicrotask(applyRecentPreference)});
applyRecentPreference();