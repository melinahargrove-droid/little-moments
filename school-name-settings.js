const app=document.querySelector('#app');
const PREF_KEY='lm-preferences-v1';
function readPrefs(){try{return JSON.parse(localStorage.getItem(PREF_KEY)||'{}')}catch{return {}}}
function saveSchoolName(value){const p=readPrefs();p.schoolName=String(value||'').trim();localStorage.setItem(PREF_KEY,JSON.stringify(p))}
function installSchoolNameSetting(){
  const screen=app.querySelector('.settings-screen');
  if(!screen||screen.dataset.schoolNameReady==='1')return;
  const list=screen.querySelector('.settings-list');if(!list)return;
  screen.dataset.schoolNameReady='1';
  const p=readPrefs(),card=document.createElement('section');
  card.className='settings-card school-name-settings-card';
  card.innerHTML=`<div class="settings-card-head"><div class="settings-card-icon">⌂</div><div><h3>School &amp; Classroom</h3><p>Add the school name used on your printable portfolio covers.</p></div></div><label class="school-name-field"><span>School name</span><input id="school-name-input" type="text" maxlength="80" autocomplete="organization" placeholder="Type your school name" value="${String(p.schoolName||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}"></label><div class="settings-status"><span id="school-name-status">Leave blank to hide it on portfolio covers.</span><span class="settings-pill">Saved</span></div>`;
  list.insertAdjacentElement('afterbegin',card);
  const input=card.querySelector('#school-name-input'),status=card.querySelector('#school-name-status');let timer;
  const commit=()=>{saveSchoolName(input.value);status.textContent=input.value.trim()?'School name saved ♡':'School name cleared ♡';clearTimeout(timer);timer=setTimeout(()=>{if(status)status.textContent='Leave blank to hide it on portfolio covers.'},1000)};
  input.addEventListener('change',commit);input.addEventListener('blur',commit);
}
new MutationObserver(installSchoolNameSetting).observe(app,{childList:true,subtree:true});installSchoolNameSetting();