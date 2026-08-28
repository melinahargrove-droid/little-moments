import {ensureInitialSchoolYear, getAll, get, put, STORES} from './db.js';

const app=document.querySelector('#app');
let currentYear=null;
let activeObjectUrls=[];
const uid=(prefix='id')=>`${prefix}-${globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(16).slice(2)}`;
const LEARNING_TAGS=['Blocks','Art','Writing','Literacy','Math','Science','Friends','Pretend Play'];

function esc(value=''){
  return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function clearObjectUrls(){activeObjectUrls.forEach(url=>URL.revokeObjectURL(url));activeObjectUrls=[];}
function objectUrl(blob){const url=URL.createObjectURL(blob);activeObjectUrls.push(url);return url;}
function samplePhoto(kind=1){
  const palettes=[['#e4ded2','#b17e66','#abb7a7'],['#dfe6dd','#9c725d','#b4aaa0'],['#e7e0d5','#b9856b','#aab6a7']];
  const [bg,skin,shirt]=palettes[(kind-1)%palettes.length];
  return `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"><rect width="100" height="100" fill="${bg}"/><rect y="72" width="100" height="28" fill="#c9bca7"/><circle cx="45" cy="34" r="13" fill="${skin}"/><path d="M29 52q16-17 32 0v34H29z" fill="${shirt}"/><rect x="62" y="58" width="24" height="7" fill="#8e806b"/><rect x="67" y="49" width="14" height="9" fill="#9b8c74"/></svg>`;
}
function initialAvatar(name='?'){
  const letter=esc(name.trim().charAt(0).toUpperCase()||'?');
  return `<div class="initial-avatar" aria-hidden="true">${letter}</div>`;
}
function setView(html){clearObjectUrls();app.innerHTML=html;window.scrollTo({top:0,behavior:'instant'});}

function cover(){
  setView(`<section class="cover">
    <div><h1>Little<br>Moments</h1><div class="tagline">Our year, one moment at a time.</div></div>
    <div class="cover-stack" aria-label="Sample classroom memories">
      <div class="polaroid p1"><div class="photo">${samplePhoto(1)}</div><div class="caption">building big ideas ♡</div></div>
      <div class="polaroid p2"><div class="photo">${samplePhoto(2)}</div><div class="caption">exploring the world</div></div>
      <div class="polaroid p3"><div class="tape"></div><div class="photo">${samplePhoto(3)}</div><div class="caption">creating together ✦</div></div>
    </div>
    <button class="primary" id="open-journal">Open Our Journal</button>
    <div class="footline"><span>Capture every moment</span><span class="dot">•</span><span>Collect their memories</span><span class="dot">•</span><span>Create their story</span></div>
  </section>`);
  app.querySelector('#open-journal').addEventListener('click',home);
}

async function getCurrentRoster(){
  const [students,enrollments]=await Promise.all([getAll(STORES.students),getAll(STORES.enrollments)]);
  const currentIds=new Set(enrollments.filter(e=>e.schoolYearId===currentYear.id).map(e=>e.studentId));
  return students.filter(s=>currentIds.has(s.id)).sort((a,b)=>a.name.localeCompare(b.name));
}

async function recentMomentCards(moments){
  const recent=moments.filter(m=>m.schoolYearId===currentYear.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)).slice(0,3);
  if(!recent.length) return '<div class="empty-copy">Your first Little Moment will appear here ♡</div>';
  const cards=[];
  for(const moment of recent){
    const photo=moment.photoId?await get(STORES.photos,moment.photoId):null;
    const media=photo?.blob?`<img src="${objectUrl(photo.blob)}" alt="">`:samplePhoto(cards.length+1);
    cards.push(`<button class="mini-polaroid" data-moment="${moment.id}" aria-label="Open ${esc(moment.caption)}"><div class="mini-photo">${media}</div><span>${esc(moment.caption)}</span></button>`);
  }
  return `<div class="mini-row">${cards.join('')}</div>`;
}

async function home(){
  const [moments,roster]=await Promise.all([getAll(STORES.moments),getCurrentRoster()]);
  const recent=await recentMomentCards(moments);
  setView(`<section class="screen">
    <header class="header"><span style="width:44px"></span><div class="header-title"><small>Welcome back to</small><h2>Little Moments</h2></div><button class="icon-btn" id="teacher-tools" aria-label="Teacher tools">♡</button></header>
    <section class="card capture-card">
      <div class="camera-polaroid"><div class="tape"></div><div class="camera-slot"><div class="camera-glyph"></div></div><div class="cap">capture what's happening ♡</div></div>
      <h3 class="serif home-capture-title">Capture a Moment</h3><p class="home-copy">Take a quick photo and save the story behind it.</p>
      <button class="primary" id="capture">＋ Take a Photo</button>
    </section>
    <div class="grid2">
      <button class="home-tile" id="moments"><div class="tile-icon stack"><span></span><span></span><span></span></div><h3>Our Moments</h3><p>Flip through the memories you've saved.</p><span class="tile-link">Open journal →</span></button>
      <button class="home-tile" id="portfolios"><div class="tile-icon book"></div><h3>Portfolios</h3><p>See each child's story growing over time.</p><span class="tile-link">View friends →</span></button>
    </div>
    <section class="recent-strip"><div class="recent-head"><div><h3>Recent Moments</h3><small>A peek at the latest pages</small></div><button class="icon-btn" id="see-all" aria-label="See all moments">›</button></div>${recent}</section>
    <div class="notice">${esc(currentYear.label)} · ${roster.length} ${roster.length===1?'child':'children'} in Current Class${currentYear.archived?' · archived':''}</div>
  </section>`);
  app.querySelector('#capture').addEventListener('click',()=>captureMoment());
  app.querySelector('#moments').addEventListener('click',()=>placeholder('Our Moments','Your full Polaroid journal gallery is the next build section.'));
  app.querySelector('#portfolios').addEventListener('click',()=>placeholder('Portfolios','Student portfolios and multi-year history will live here.'));
  app.querySelector('#teacher-tools').addEventListener('click',teacherTools);
  app.querySelector('#see-all').addEventListener('click',()=>placeholder('Our Moments','Your full Polaroid journal gallery is the next build section.'));
  app.querySelectorAll('[data-moment]').forEach(btn=>btn.addEventListener('click',()=>placeholder('This Little Moment','Moment Detail is coming with the Our Moments build.')));
}

function teacherTools(){
  setView(`<section class="screen"><header class="header"><button class="icon-btn" id="tools-back">←</button><div class="header-title"><small>Little Moments</small><h2>Teacher Tools</h2></div><span style="width:44px"></span></header>
    <div class="tool-list">
      <button class="tool-row" id="manage-class"><span class="tool-art">♡</span><span><strong>Class &amp; Students</strong><small>Current class, past students &amp; school years</small></span><b>›</b></button>
      <button class="tool-row" id="settings"><span class="tool-art">⚙</span><span><strong>Settings &amp; Data Safety</strong><small>Privacy, backups, storage &amp; preferences</small></span><b>›</b></button>
    </div>
  </section>`);
  app.querySelector('#tools-back').addEventListener('click',home);
  app.querySelector('#manage-class').addEventListener('click',()=>classManager('current'));
  app.querySelector('#settings').addEventListener('click',()=>placeholder('Settings & Data Safety','Privacy, backups, storage, and school years will live here.',teacherTools));
}

async function classManager(initialView='current'){
  const [students,enrollments,years]=await Promise.all([getAll(STORES.students),getAll(STORES.enrollments),getAll(STORES.schoolYears)]);
  let view=initialView;
  const yearCountByStudent=new Map();
  for(const enrollment of enrollments) yearCountByStudent.set(enrollment.studentId,(yearCountByStudent.get(enrollment.studentId)||0)+1);
  const currentIds=new Set(enrollments.filter(e=>e.schoolYearId===currentYear.id).map(e=>e.studentId));
  const lastYearByStudent=new Map();
  for(const enrollment of enrollments){
    const yr=years.find(y=>y.id===enrollment.schoolYearId);if(!yr) continue;
    const old=lastYearByStudent.get(enrollment.studentId);if(!old||yr.id>old.id) lastYearByStudent.set(enrollment.studentId,yr);
  }
  setView(`<section class="screen class-screen">
    <header class="header"><button class="icon-btn" id="class-back">←</button><div class="header-title"><small>Little Moments</small><h2>Class &amp; Students</h2></div><button class="icon-btn" id="class-info" aria-label="Class information">♡</button></header>
    <div class="year-strip"><div><strong>${esc(currentYear.label)}</strong><small>${currentYear.archived?'Archived school year':'Current school year'}</small></div><span id="class-count">0 children ♡</span></div>
    <div class="class-tabs"><button class="class-tab ${view==='current'?'active':''}" data-view="current">Current Class</button><button class="class-tab ${view==='past'?'active':''}" data-view="past">Past Students</button></div>
    <label class="search-box"><span class="sr-only">Find a child</span><input id="student-search" type="search" placeholder="Find a child from any year…" autocomplete="off"><span>⌕</span></label>
    <div class="class-toolbar"><button class="primary compact" id="add-child">＋ Add Child</button><button class="secondary compact" id="school-year" aria-expanded="false">School Year⌄</button></div>
    <div id="school-year-menu" class="school-year-menu hidden"><button id="start-year">Start New School Year<small>Archive this year and create the next one.</small></button><button id="view-years">View Past School Years<small>See every saved school year.</small></button><button id="archive-year">Archive Current Year<small>Keeps everything saved and closes this year.</small></button></div>
    <div id="student-list" class="student-list"></div>
    <div id="add-child-panel" class="add-child-panel hidden"><h3>Add a Child</h3><p>We'll check past students first so their old portfolios stay connected.</p><label class="field-label" for="new-child-name">Child's name</label><input id="new-child-name" class="text-input" type="text" placeholder="First name" autocomplete="off"><div id="existing-match" class="existing-match hidden"></div><button class="secondary photo-placeholder" id="profile-photo">＋ Add profile photo <small>(optional)</small></button><button class="primary" id="create-child">Create New Child Profile</button></div>
    <p id="class-status" class="class-status" aria-live="polite">Past portfolios stay saved even when a child leaves your current class. ♡</p>
  </section>`);
  const list=app.querySelector('#student-list'),search=app.querySelector('#student-search'),status=app.querySelector('#class-status'),count=app.querySelector('#class-count'),panel=app.querySelector('#add-child-panel'),matchBox=app.querySelector('#existing-match'),nameInput=app.querySelector('#new-child-name');
  async function addEnrollmentIfNeeded(studentId,schoolYearId){const all=await getAll(STORES.enrollments);if(all.some(e=>e.studentId===studentId&&e.schoolYearId===schoolYearId)) return;await put(STORES.enrollments,{id:`${studentId}__${schoolYearId}`,studentId,schoolYearId,createdAt:new Date().toISOString()});}
  function renderList(){
    const q=search.value.trim().toLocaleLowerCase();
    const filtered=students.filter(s=>{const inCurrent=currentIds.has(s.id);return (view==='current'?inCurrent:!inCurrent)&&(!q||s.name.toLocaleLowerCase().startsWith(q));}).sort((a,b)=>a.name.localeCompare(b.name));
    count.textContent=view==='current'?`${students.filter(s=>currentIds.has(s.id)).length} children ♡`:`${filtered.length} found`;
    if(!filtered.length){list.innerHTML=`<div class="student-empty">${view==='current'&&!students.length?'Your class is ready for its first friend ♡':'No child matches this view.'}</div>`;return;}
    list.innerHTML=filtered.map(student=>{const yearsSaved=yearCountByStudent.get(student.id)||0,lastYear=lastYearByStudent.get(student.id),returning=view==='current'&&yearsSaved>1;return `<article class="student-row" data-id="${student.id}"><button class="student-main" data-open="${student.id}"><div class="student-polaroid">${student.profilePhoto?`<img src="${esc(student.profilePhoto)}" alt="">`:initialAvatar(student.name)}</div><div class="student-copy"><strong>${esc(student.name)}</strong><small>${view==='current'?(yearsSaved>1?yearsSaved+' school years saved':'first year'):`Last attended ${esc(lastYear?.label||'a past year')} · ${yearsSaved} ${yearsSaved===1?'year':'years'} saved`}</small>${returning?'<span class="returning-badge">Returning student ♡</span>':''}</div><span class="row-arrow">›</span></button>${view==='past'?`<button class="add-existing" data-return="${student.id}">Add to Current Class</button>`:''}</article>`;}).join('');
    list.querySelectorAll('[data-open]').forEach(btn=>btn.addEventListener('click',()=>{const child=students.find(s=>s.id===btn.dataset.open);status.textContent=`${child.name}'s student profile will open with Portfolios. ♡`;}));
    list.querySelectorAll('[data-return]').forEach(btn=>btn.addEventListener('click',async()=>{const child=students.find(s=>s.id===btn.dataset.return);await addEnrollmentIfNeeded(child.id,currentYear.id);await classManager('current');}));
  }
  function findExactMatch(){const q=nameInput.value.trim().toLocaleLowerCase();return q?students.find(s=>s.name.trim().toLocaleLowerCase()===q):null;}
  function renderMatch(){const match=findExactMatch();if(!match){matchBox.classList.add('hidden');matchBox.innerHTML='';return;}const alreadyCurrent=currentIds.has(match.id),yearsSaved=yearCountByStudent.get(match.id)||0;matchBox.classList.remove('hidden');matchBox.innerHTML=`<strong>${esc(match.name)} already has a Little Moments profile.</strong><small>${alreadyCurrent?'This child is already in your current class.':`${yearsSaved} previous ${yearsSaved===1?'school year':'school years'} saved.`}</small>${alreadyCurrent?'':`<button class="secondary compact" id="use-existing">Add Existing Profile</button>`}`;const use=matchBox.querySelector('#use-existing');if(use) use.addEventListener('click',async()=>{await addEnrollmentIfNeeded(match.id,currentYear.id);await classManager('current');});}
  app.querySelector('#class-back').addEventListener('click',teacherTools);app.querySelector('#class-info').addEventListener('click',()=>status.textContent='One permanent child profile can hold multiple school-year portfolios. ♡');
  app.querySelectorAll('.class-tab').forEach(btn=>btn.addEventListener('click',()=>{view=btn.dataset.view;app.querySelectorAll('.class-tab').forEach(b=>b.classList.toggle('active',b===btn));renderList();}));search.addEventListener('input',renderList);
  app.querySelector('#add-child').addEventListener('click',()=>{panel.classList.toggle('hidden');if(!panel.classList.contains('hidden')) nameInput.focus();});nameInput.addEventListener('input',renderMatch);
  app.querySelector('#profile-photo').addEventListener('click',()=>status.textContent='Profile photos are optional. We’ll wire this picker after the core capture flow.');
  app.querySelector('#create-child').addEventListener('click',async()=>{const name=nameInput.value.trim();if(!name){status.textContent='Enter the child’s name first ♡';return;}const match=findExactMatch();if(match){status.textContent='Use the existing profile so past years stay connected.';renderMatch();return;}const student={id:uid('student'),name,profilePhoto:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};await put(STORES.students,student);await addEnrollmentIfNeeded(student.id,currentYear.id);await classManager('current');});
  const yearBtn=app.querySelector('#school-year'),yearMenu=app.querySelector('#school-year-menu');yearBtn.addEventListener('click',()=>{const open=yearBtn.getAttribute('aria-expanded')==='true';yearBtn.setAttribute('aria-expanded',String(!open));yearMenu.classList.toggle('hidden',open);});
  app.querySelector('#archive-year').addEventListener('click',async()=>{if(currentYear.archived){status.textContent='This school year is already archived. ♡';return;}if(!confirm(`Archive ${currentYear.label}? Everything stays saved, but this year will close for normal editing.`)) return;currentYear={...currentYear,isCurrent:false,archived:true,archivedAt:new Date().toISOString()};await put(STORES.schoolYears,currentYear);status.textContent=`${currentYear.label} is safely archived. ♡`;});
  app.querySelector('#start-year').addEventListener('click',async()=>{if(!confirm(`Start a new school year after ${currentYear.label}? The current year will be preserved.`)) return;currentYear={...currentYear,isCurrent:false,archived:true,archivedAt:new Date().toISOString()};await put(STORES.schoolYears,currentYear);const start=Number(currentYear.id.slice(0,4))+1;currentYear={id:`${start}-${start+1}`,label:`${start}–${start+1}`,isCurrent:true,archived:false,createdAt:new Date().toISOString()};await put(STORES.schoolYears,currentYear);await classManager('current');});
  app.querySelector('#view-years').addEventListener('click',()=>{status.textContent=years.sort((a,b)=>b.id.localeCompare(a.id)).map(y=>`${y.label}${y.id===currentYear.id?' (current)':''}`).join(' · ')||'No past school years yet.';});
  renderList();
}

async function captureMoment(options={}){
  const roster=await getCurrentRoster();
  if(!roster.length){
    setView(`<section class="screen"><header class="header"><button class="icon-btn" id="capture-back">←</button><div class="header-title"><small>Little Moments</small><h2>Capture a Moment</h2></div><span style="width:44px"></span></header><div class="card empty-capture"><div class="empty-camera">♡</div><h3>Add your class first</h3><p>You need at least one child in Current Class before saving a Little Moment.</p><button class="primary" id="go-class">Add Children</button></div></section>`);
    app.querySelector('#capture-back').addEventListener('click',home);app.querySelector('#go-class').addEventListener('click',()=>classManager('current'));return;
  }
  const recentSetting=await get(STORES.settings,'recentStudentIds');
  const recentIds=(recentSetting?.value||[]).filter(id=>roster.some(s=>s.id===id));
  const selectedStudents=new Set(options.keepStudentIds||[]);
  const selectedTags=new Set();
  let photoFile=null,previewUrl=null,favorite=false,tagsOpen=false,allFriendsOpen=false;
  setView(`<section class="screen capture-screen">
    <header class="header"><button class="icon-btn" id="capture-back">←</button><div class="header-title"><small>Little Moments</small><h2>Capture a Moment</h2></div><button class="icon-btn" id="capture-help" aria-label="Capture help">♡</button></header>
    <div class="capture-polaroid">
      <div class="tape"></div>
      <div id="capture-photo-area" class="capture-photo-area"><div class="camera-glyph"></div><strong>Take a Photo</strong><small>or choose one from your phone</small></div>
      <input id="capture-photo-input" class="sr-only" type="file" accept="image/*" capture="environment">
      <button id="capture-photo-button" class="photo-hit" aria-label="Take or choose a photo"></button>
      <label class="sr-only" for="capture-caption">Moment caption</label><textarea id="capture-caption" class="capture-caption" maxlength="180" placeholder="Write the little story here…"></textarea>
      <div class="caption-count"><span id="caption-count">0</span>/180</div>
    </div>
    <section class="capture-section"><div class="capture-section-head"><div><h3>Who’s in this moment?</h3><p>Search and tap a name to add.</p></div><span id="selected-count">0 selected</span></div>
      <label class="search-box capture-search"><span class="sr-only">Search for a friend</span><input id="friend-search" type="search" placeholder="Search for a friend…" autocomplete="off"><span>⌕</span></label>
      <div id="friend-results" class="friend-results hidden"></div><div id="selected-friends" class="selected-friends"></div>
      <div id="recent-friends" class="recent-friends"></div><button id="see-all-friends" class="text-link">See all friends</button><div id="all-friends" class="all-friends hidden"></div>
    </section>
    <button id="learning-toggle" class="optional-toggle" aria-expanded="false"><span><strong>Add learning tags</strong><small>optional</small></span><b>›</b></button>
    <section id="learning-panel" class="capture-section hidden"><div class="tag-grid">${LEARNING_TAGS.map(tag=>`<button class="tag-chip" data-tag="${esc(tag)}">${esc(tag)}</button>`).join('')}</div><button id="favorite-toggle" class="favorite-toggle" aria-pressed="false"><span class="favorite-star">☆</span><span><strong>Portfolio Favorite</strong><small>Mark this as one of the extra-special moments.</small></span></button></section>
    <button id="save-moment" class="primary save-moment">Save This Moment ♡</button><p id="capture-status" class="class-status" aria-live="polite">Photo → caption → friend → save ♡</p>
  </section>`);
  const status=app.querySelector('#capture-status'),input=app.querySelector('#capture-photo-input'),area=app.querySelector('#capture-photo-area'),caption=app.querySelector('#capture-caption'),friendSearch=app.querySelector('#friend-search'),results=app.querySelector('#friend-results'),selectedWrap=app.querySelector('#selected-friends'),recentWrap=app.querySelector('#recent-friends'),allWrap=app.querySelector('#all-friends'),selectedCount=app.querySelector('#selected-count');
  function renderSelected(){selectedWrap.innerHTML=[...selectedStudents].map(id=>{const s=roster.find(x=>x.id===id);return s?`<button class="selected-chip" data-remove-student="${id}">${esc(s.name)} <span>×</span></button>`:'';}).join('');selectedCount.textContent=`${selectedStudents.size} selected`;selectedWrap.querySelectorAll('[data-remove-student]').forEach(btn=>btn.addEventListener('click',()=>{selectedStudents.delete(btn.dataset.removeStudent);renderSelected();renderRecent();renderAll();}));}
  function addStudent(id){selectedStudents.add(id);friendSearch.value='';results.classList.add('hidden');results.innerHTML='';renderSelected();renderRecent();renderAll();friendSearch.focus();}
  function renderRecent(){const candidates=recentIds.map(id=>roster.find(s=>s.id===id)).filter(Boolean).filter(s=>!selectedStudents.has(s.id)).slice(0,4);recentWrap.innerHTML=candidates.length?`<div class="recent-label">Recently tagged</div><div class="chip-row">${candidates.map(s=>`<button class="quick-chip" data-recent="${s.id}">${esc(s.name)}</button>`).join('')}</div>`:'';recentWrap.querySelectorAll('[data-recent]').forEach(btn=>btn.addEventListener('click',()=>addStudent(btn.dataset.recent)));}
  function renderAll(){allWrap.innerHTML=roster.map(s=>`<button class="friend-row ${selectedStudents.has(s.id)?'selected':''}" data-all="${s.id}"><span>${esc(s.name)}</span><b>${selectedStudents.has(s.id)?'✓':'＋'}</b></button>`).join('');allWrap.querySelectorAll('[data-all]').forEach(btn=>btn.addEventListener('click',()=>{const id=btn.dataset.all;if(selectedStudents.has(id))selectedStudents.delete(id);else selectedStudents.add(id);renderSelected();renderRecent();renderAll();}));}
  friendSearch.addEventListener('input',()=>{const q=friendSearch.value.trim().toLocaleLowerCase();if(!q){results.classList.add('hidden');results.innerHTML='';return;}const matches=roster.filter(s=>s.name.toLocaleLowerCase().startsWith(q)&&!selectedStudents.has(s.id)).slice(0,7);results.classList.remove('hidden');results.innerHTML=matches.length?matches.map(s=>`<button data-result="${s.id}">${esc(s.name)}</button>`).join(''):'<div class="no-match">No matching friend</div>';results.querySelectorAll('[data-result]').forEach(btn=>btn.addEventListener('click',()=>addStudent(btn.dataset.result)));});
  app.querySelector('#capture-photo-button').addEventListener('click',()=>input.click());
  input.addEventListener('change',()=>{const file=input.files?.[0];if(!file)return;if(!file.type.startsWith('image/')){status.textContent='Choose a photo file ♡';return;}photoFile=file;if(previewUrl)URL.revokeObjectURL(previewUrl);previewUrl=URL.createObjectURL(file);area.innerHTML=`<img src="${previewUrl}" alt="Selected classroom moment"><button type="button" class="replace-photo" id="replace-photo">Change photo</button>`;area.classList.add('has-photo');app.querySelector('#replace-photo').addEventListener('click',e=>{e.stopPropagation();input.click();});status.textContent='Photo ready ♡ Now add the little story.';});
  caption.addEventListener('input',()=>app.querySelector('#caption-count').textContent=caption.value.length);
  app.querySelector('#see-all-friends').addEventListener('click',()=>{allFriendsOpen=!allFriendsOpen;allWrap.classList.toggle('hidden',!allFriendsOpen);app.querySelector('#see-all-friends').textContent=allFriendsOpen?'Hide all friends':'See all friends';});
  const learningToggle=app.querySelector('#learning-toggle'),learningPanel=app.querySelector('#learning-panel');learningToggle.addEventListener('click',()=>{tagsOpen=!tagsOpen;learningToggle.setAttribute('aria-expanded',String(tagsOpen));learningPanel.classList.toggle('hidden',!tagsOpen);learningToggle.querySelector('b').textContent=tagsOpen?'⌄':'›';});
  app.querySelectorAll('[data-tag]').forEach(btn=>btn.addEventListener('click',()=>{const tag=btn.dataset.tag;if(selectedTags.has(tag))selectedTags.delete(tag);else selectedTags.add(tag);btn.classList.toggle('selected',selectedTags.has(tag));}));
  const favBtn=app.querySelector('#favorite-toggle');favBtn.addEventListener('click',()=>{favorite=!favorite;favBtn.setAttribute('aria-pressed',String(favorite));favBtn.classList.toggle('selected',favorite);favBtn.querySelector('.favorite-star').textContent=favorite?'★':'☆';});
  app.querySelector('#capture-back').addEventListener('click',home);app.querySelector('#capture-help').addEventListener('click',()=>status.textContent='Take or choose a photo, write the story, choose at least one child, and save. Learning tags are optional. ♡');
  app.querySelector('#save-moment').addEventListener('click',async()=>{
    if(!photoFile){status.textContent='Add a photo before saving ♡';return;}const story=caption.value.trim();if(!story){status.textContent='Add a little caption before saving ♡';caption.focus();return;}if(!selectedStudents.size){status.textContent='Choose at least one friend in this moment ♡';friendSearch.focus();return;}
    const saveBtn=app.querySelector('#save-moment');saveBtn.disabled=true;saveBtn.textContent='Saving…';
    try{
      const photoId=uid('photo'),momentId=uid('moment'),now=new Date();
      await put(STORES.photos,{id:photoId,blob:photoFile,name:photoFile.name||'classroom-photo',type:photoFile.type,size:photoFile.size,createdAt:now.toISOString()});
      await put(STORES.moments,{id:momentId,photoId,caption:story,date:now.toISOString().slice(0,10),schoolYearId:currentYear.id,studentIds:[...selectedStudents],tags:[...selectedTags],favorite,createdAt:now.toISOString(),updatedAt:now.toISOString()});
      const ordered=[...selectedStudents,...recentIds.filter(id=>!selectedStudents.has(id))].slice(0,8);await put(STORES.settings,{key:'recentStudentIds',value:ordered,updatedAt:now.toISOString()});
      if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null;}
      savedMomentScreen({studentIds:[...selectedStudents],caption:story});
    }catch(error){console.error(error);saveBtn.disabled=false;saveBtn.textContent='Save This Moment ♡';status.textContent='That moment could not be saved. Please try again.';}
  });
  renderSelected();renderRecent();renderAll();
}

function savedMomentScreen(saved){
  setView(`<section class="screen saved-screen"><div class="saved-card"><div class="saved-heart">♡</div><h2>Moment Saved</h2><p>Your little story is safely in the journal.</p><div class="saved-caption">“${esc(saved.caption)}”</div><button class="primary" id="capture-another">Capture Another</button><button class="secondary" id="done-capturing">Done</button></div></section>`);
  app.querySelector('#done-capturing').addEventListener('click',home);
  app.querySelector('#capture-another').addEventListener('click',()=>{
    setView(`<section class="screen"><div class="saved-card keep-card"><h2>Keep these friends?</h2><p>Keep the same children selected for the next photo?</p><div class="keep-actions"><button class="primary" id="keep-friends">Yes, keep them ♡</button><button class="secondary" id="new-friends">Start fresh</button></div></div></section>`);
    app.querySelector('#keep-friends').addEventListener('click',()=>captureMoment({keepStudentIds:saved.studentIds}));app.querySelector('#new-friends').addEventListener('click',()=>captureMoment());
  });
}

function placeholder(title,copy,back=home){
  setView(`<section class="screen"><header class="header"><button class="icon-btn" id="back">←</button><div class="header-title"><small>Little Moments</small><h2>${esc(title)}</h2></div><span style="width:44px"></span></header><div class="card placeholder-card"><div class="tagline placeholder-copy">${esc(copy)}</div><button class="secondary" id="home">Back</button></div></section>`);
  app.querySelector('#back').addEventListener('click',back);app.querySelector('#home').addEventListener('click',back);
}

async function init(){
  if('serviceWorker' in navigator){try{await navigator.serviceWorker.register('./sw.js')}catch(e){console.warn('SW registration skipped',e)}}
  currentYear=await ensureInitialSchoolYear();cover();
}
init();
