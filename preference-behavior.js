const PREF_KEY='lm-preferences-v1';
function prefs(){try{return JSON.parse(localStorage.getItem(PREF_KEY)||'{}')}catch{return {}}}

document.addEventListener('click',e=>{
  const captureAnother=e.target.closest('#capture-another');
  if(captureAnother&&prefs().keepFriendsPrompt===false){
    queueMicrotask(()=>document.querySelector('#new-friends')?.click());
    return;
  }
  const deleteBtn=e.target.closest('#detail-delete');
  if(deleteBtn&&prefs().confirmDelete===false){
    const original=window.confirm;
    window.confirm=()=>true;
    queueMicrotask(()=>{window.confirm=original});
  }
},true);
