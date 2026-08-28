import {ensureInitialSchoolYear, getAll, put, STORES} from './db.js';

const app=document.querySelector('#app');
let currentYear=null;
const uid=(prefix='id')=>`${prefix}-${globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(16).slice(2)}`;

function esc(value=''){
  return String(value).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}

function samplePhoto(kind=1){
  const palettes=[['#e4ded2','#b17e66','#abb7a7'],['#dfe6dd','#9c725d','#b4aaa0'],['#e7e0d5','#b9856b','#aab6a7']];
  const [bg,skin,shirt]=palettes[(kind-1)%palettes.length];
  return `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"><rect width="100" height="100" fill="${bg}"/><rect y="72" width="100" height="28" fill="#c9bca7"/><circle cx="45" cy="34" r="13" fill="${skin}"/><path d="M29 52q16-17 32 0v34H29z" fill="${shirt}"/><rect x="62" y="58" width="24" height="7" fill="#8e806b"/><rect x="67" y="49" width="14" height="9" fill="#9b8c74"/></svg>`;
}

function initialAvatar(name='?'){
  const letter=esc(name.trim().charAt(0).toUpperCase()||'?');
  return `<div class="initial-avatar" aria-hidden="true">${letter}</div>`;
}

function cover(){
  app.innerHTML=`<section class="cover">
    <div><h1>Little<br>Moments</h1><div class="tagline">Our year, one moment at a time.</div></div>
    <div class="cover-stack" aria-label="Sample classroom memories">
      <div class="polaroid p1"><div class="photo">${samplePhoto(1)}</div><div class="caption">building big ideas ♡</div></div>
      <div class="polaroid p2"><div class="photo">${samplePhoto(2)}</div><div class="caption">exploring the world</div></div>
      <div class="polaroid p3"><div class="tape"></div><div class="photo">${samplePhoto(3)}</div><div class="caption">creating together ✦</div></div>
    </div>
    <button class="primary" id="open-journal">Open Our Journal</button>
    <div class="footline"><span>Capture every moment</span><span class="dot">•</span><span>Collect their memories</span><span class="dot">•</span><span>Create their story</span></div>
  </section>`;
  app.querySelector('#open-journal').addEventListener('click',home);
}

async function getCurrentRoster(){
  const [students,enrollments]=await Promise.all([getAll(STORES.students),getAll(STORES.enrollments)]);
  const currentIds=new Set(enrollments.filter(e=>e.schoolYearId===currentYear.id).map(e=>e.studentId));
  return students.filter(s=>currentIds.has(s.id));
}

async function home(){
  const [moments,roster]=await Promise.all([getAll(STORES.moments),getCurrentRoster()]);
  app.innerHTML=`<section class="screen">
    <header class="header"><span style="width:44px"></span><div class="header-title"><small>Welcome back to</small><h2>Little Moments</h2></div><button class="icon-btn" id="teacher-tools" aria-label="Teacher tools">♡</button></header>
    <section class="card capture-card">
      <div class="camera-polaroid"><div class="tape"></div><div class="camera-slot"><div class="camera-glyph"></div></div><div class="cap">capture what's happening ♡</div></div>
      <h3 class="serif" style="font-size:22px;margin:0">Capture a Moment</h3><p style="font-size:13px;color:#756e64;margin:5px 0 14px">Take a quick photo and save the story behind it.</p>
      <button class="primary" id="capture">＋ Take a Photo</button>
    </section>
    <div class="grid2">
      <button class="home-tile" id="moments"><div class="tile-icon stack"><span></span><span></span><span></span></div><h3>Our Moments</h3><p>Flip through the memories you've saved.</p><span class="tile-link">Open journal →</span></button>
      <button class="home-tile" id="portfolios"><div class="tile-icon book"></div><h3>Portfolios</h3><p>See each child's story growing over time.</p><span class="tile-link">View friends →</span></button>
    </div>
    <section class="recent-strip"><div class="recent-head"><div><h3>Recent Moments</h3><small>A peek at the latest pages</small></div><button class="icon-btn" id="see-all" aria-label="See all moments">›</button></div>
      ${moments.length?`<div class="mini-row">${moments.slice(-3).reverse().map((m,i)=>`<div class="mini-polaroid"><div class="mini-photo">${samplePhoto(i+1)}</div></div>`).join('')}</div>`:`<div class="empty-copy">Your first Little Moment will appear here ♡</div>`}
    </section>
    <div class="notice">${esc(currentYear.label)} · ${roster.length} ${roster.length===1?'child':'children'} in Current Class${currentYear.archived?' · archived':''}</div>
  </section>`;
  app.querySelector('#capture').addEventListener('click',()=>placeholder('Capture a Moment','The real photo/caption/student-tagging workflow is the next build section.'));
  app.querySelector('#moments').addEventListener('click',()=>placeholder('Our Moments','Your Polaroid journal gallery will live here.'));
  app.querySelector('#portfolios').addEventListener('click',()=>placeholder('Portfolios','Student portfolios and multi-year history will live here.'));
  app.querySelector('#teacher-tools').addEventListener('click',teacherTools);
  app.querySelector('#see-all').addEventListener('click',()=>placeholder('Our Moments','Your Polaroid journal gallery will live here.'));
}

function teacherTools(){
  app.innerHTML=`<section class="screen"><header class="header"><button class="icon-btn" id="tools-back">←</button><div class="header-title"><small>Little Moments</small><h2>Teacher Tools</h2></div><span style="width:44px"></span></header>
    <div class="tool-list">
      <button class="tool-row" id="manage-class"><span class="tool-art">♡</span><span><strong>Class &amp; Students</strong><small>Current class, past students &amp; school years</small></span><b>›</b></button>
      <button class="tool-row" id="settings"><span class="tool-art">⚙</span><span><strong>Settings &amp; Data Safety</strong><small>Privacy, backups, storage &amp; preferences</small></span><b>›</b></button>
    </div>
  </section>`;
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
    const yr=years.find(y=>y.id===enrollment.schoolYearId);
    if(!yr) continue;
    const old=lastYearByStudent.get(enrollment.studentId);
    if(!old||yr.id>old.id) lastYearByStudent.set(enrollment.studentId,yr);
  }

  app.innerHTML=`<section class="screen class-screen">
    <header class="header"><button class="icon-btn" id="class-back">←</button><div class="header-title"><small>Little Moments</small><h2>Class &amp; Students</h2></div><button class="icon-btn" id="class-info" aria-label="Class information">♡</button></header>
    <div class="year-strip"><div><strong>${esc(currentYear.label)}</strong><small>${currentYear.archived?'Archived school year':'Current school year'}</small></div><span id="class-count">0 children ♡</span></div>
    <div class="class-tabs"><button class="class-tab ${view==='current'?'active':''}" data-view="current">Current Class</button><button class="class-tab ${view==='past'?'active':''}" data-view="past">Past Students</button></div>
    <label class="search-box"><span class="sr-only">Find a child</span><input id="student-search" type="search" placeholder="Find a child from any year…" autocomplete="off"><span>⌕</span></label>
    <div class="class-toolbar"><button class="primary compact" id="add-child">＋ Add Child</button><button class="secondary compact" id="school-year" aria-expanded="false">School Year⌄</button></div>
    <div id="school-year-menu" class="school-year-menu hidden">
      <button id="start-year">Start New School Year<small>Archive this year and create the next one.</small></button>
      <button id="view-years">View Past School Years<small>See every saved school year.</small></button>
      <button id="archive-year">Archive Current Year<small>Keeps everything saved and closes this year.</small></button>
    </div>
    <div id="student-list" class="student-list"></div>
    <div id="add-child-panel" class="add-child-panel hidden">
      <h3>Add a Child</h3><p>We'll check past students first so their old portfolios stay connected.</p>
      <label class="field-label" for="new-child-name">Child's name</label><input id="new-child-name" class="text-input" type="text" placeholder="First name" autocomplete="off">
      <div id="existing-match" class="existing-match hidden"></div>
      <button class="secondary photo-placeholder" id="profile-photo">＋ Add profile photo <small>(optional)</small></button>
      <button class="primary" id="create-child">Create New Child Profile</button>
    </div>
    <p id="class-status" class="class-status" aria-live="polite">Past portfolios stay saved even when a child leaves your current class. ♡</p>
  </section>`;

  const list=app.querySelector('#student-list');
  const search=app.querySelector('#student-search');
  const status=app.querySelector('#class-status');
  const count=app.querySelector('#class-count');
  const panel=app.querySelector('#add-child-panel');
  const matchBox=app.querySelector('#existing-match');
  const nameInput=app.querySelector('#new-child-name');

  function renderList(){
    const q=search.value.trim().toLocaleLowerCase();
    const filtered=students.filter(s=>{
      const inCurrent=currentIds.has(s.id);
      const modeOkay=view==='current'?inCurrent:!inCurrent;
      return modeOkay&&(!q||s.name.toLocaleLowerCase().startsWith(q));
    }).sort((a,b)=>a.name.localeCompare(b.name));
    count.textContent=view==='current'?`${students.filter(s=>currentIds.has(s.id)).length} children ♡`:`${filtered.length} found`;
    if(!filtered.length){
      list.innerHTML=`<div class="student-empty">${view==='current'&&!students.length?'Your class is ready for its first friend ♡':'No child matches this view.'}</div>`;
      return;
    }
    list.innerHTML=filtered.map((student,index)=>{
      const yearsSaved=yearCountByStudent.get(student.id)||0;
      const lastYear=lastYearByStudent.get(student.id);
      const returning=view==='current'&&yearsSaved>1;
      return `<article class="student-row" data-id="${student.id}">
        <button class="student-main" data-open="${student.id}">
          <div class="student-polaroid">${student.profilePhoto?`<img src="${student.profilePhoto}" alt="">`:initialAvatar(student.name)}</div>
          <div class="student-copy"><strong>${esc(student.name)}</strong><small>${view==='current'?`${yearsSaved>1?yearsSaved+' school years saved':'first year'}`:`Last attended ${esc(lastYear?.label||'a past year')} · ${yearsSaved} ${yearsSaved===1?'year':'years'} saved`}</small>${returning?'<span class="returning-badge">Returning student ♡</span>':''}</div><span class="row-arrow">›</span>
        </button>
        ${view==='past'?`<button class="add-existing" data-return="${student.id}">Add to Current Class</button>`:''}
      </article>`;
    }).join('');
    list.querySelectorAll('[data-open]').forEach(btn=>btn.addEventListener('click',()=>{
      const child=students.find(s=>s.id===btn.dataset.open);status.textContent=`${child.name}'s student profile will open here next. ♡`;
    }));
    list.querySelectorAll('[data-return]').forEach(btn=>btn.addEventListener('click',async()=>{
      const child=students.find(s=>s.id===btn.dataset.return);
      await addEnrollmentIfNeeded(child.id,currentYear.id);
      status.textContent=`${child.name} is back in ${currentYear.label} with every previous portfolio preserved. ♡`;
      await classManager('current');
    }));
  }

  async function addEnrollmentIfNeeded(studentId,schoolYearId){
    const all=await getAll(STORES.enrollments);
    if(all.some(e=>e.studentId===studentId&&e.schoolYearId===schoolYearId)) return;
    await put(STORES.enrollments,{id:`${studentId}__${schoolYearId}`,studentId,schoolYearId,createdAt:new Date().toISOString()});
  }

  function findExactMatch(){
    const q=nameInput.value.trim().toLocaleLowerCase();
    return q?students.find(s=>s.name.trim().toLocaleLowerCase()===q):null;
  }

  function renderMatch(){
    const match=findExactMatch();
    if(!match){matchBox.classList.add('hidden');matchBox.innerHTML='';return;}
    const alreadyCurrent=currentIds.has(match.id);
    const yearsSaved=yearCountByStudent.get(match.id)||0;
    matchBox.classList.remove('hidden');
    matchBox.innerHTML=`<strong>${esc(match.name)} already has a Little Moments profile.</strong><small>${alreadyCurrent?'This child is already in your current class.':`${yearsSaved} previous ${yearsSaved===1?'school year':'school years'} saved.`}</small>${alreadyCurrent?'':`<button class="secondary compact" id="use-existing">Add Existing Profile</button>`}`;
    const use=matchBox.querySelector('#use-existing');
    if(use) use.addEventListener('click',async()=>{await addEnrollmentIfNeeded(match.id,currentYear.id);await classManager('current');});
  }

  app.querySelector('#class-back').addEventListener('click',teacherTools);
  app.querySelector('#class-info').addEventListener('click',()=>status.textContent='One permanent child profile can hold multiple school-year portfolios. ♡');
  app.querySelectorAll('.class-tab').forEach(btn=>btn.addEventListener('click',()=>{view=btn.dataset.view;app.querySelectorAll('.class-tab').forEach(b=>b.classList.toggle('active',b===btn));renderList();}));
  search.addEventListener('input',renderList);
  app.querySelector('#add-child').addEventListener('click',()=>{panel.classList.toggle('hidden');if(!panel.classList.contains('hidden')) nameInput.focus();});
  nameInput.addEventListener('input',renderMatch);
  app.querySelector('#profile-photo').addEventListener('click',()=>status.textContent='Profile photo selection will be wired into the phone photo picker with Capture.');
  app.querySelector('#create-child').addEventListener('click',async()=>{
    const name=nameInput.value.trim();
    if(!name){status.textContent='Enter the child’s name first. ♡';nameInput.focus();return;}
    const match=findExactMatch();
    if(match){status.textContent=`${match.name} already has a profile. Use Add Existing Profile so the old years stay connected.`;return;}
    const student={id:uid('student'),name,profilePhoto:null,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
    await put(STORES.students,student);
    await put(STORES.enrollments,{id:`${student.id}__${currentYear.id}`,studentId:student.id,schoolYearId:currentYear.id,createdAt:new Date().toISOString()});
    await classManager('current');
  });

  const yearBtn=app.querySelector('#school-year');
  const yearMenu=app.querySelector('#school-year-menu');
  yearBtn.addEventListener('click',()=>{const open=yearBtn.getAttribute('aria-expanded')==='true';yearBtn.setAttribute('aria-expanded',String(!open));yearMenu.classList.toggle('hidden',open);});
  app.querySelector('#view-years').addEventListener('click',()=>showPastSchoolYears());
  app.querySelector('#archive-year').addEventListener('click',async()=>{
    if(currentYear.archived){status.textContent=`${currentYear.label} is already archived. ♡`;return;}
    if(!confirm(`Archive ${currentYear.label}? Everything stays saved, but this school year will be treated as closed.`)) return;
    currentYear={...currentYear,archived:true,archivedAt:new Date().toISOString()};
    await put(STORES.schoolYears,currentYear);
    await classManager(view);
  });
  app.querySelector('#start-year').addEventListener('click',async()=>{
    const [startText,endText]=currentYear.id.split('-');
    const nextStart=Number(endText||Number(startText)+1),nextId=`${nextStart}-${nextStart+1}`;
    if(!confirm(`Start ${nextStart}–${nextStart+1}? ${currentYear.label} will be preserved as an archived year.`)) return;
    await put(STORES.schoolYears,{...currentYear,isCurrent:false,archived:true,archivedAt:new Date().toISOString()});
    const allYears=await getAll(STORES.schoolYears);
    const existing=allYears.find(y=>y.id===nextId);
    currentYear=existing?{...existing,isCurrent:true,archived:false}:{id:nextId,label:`${nextStart}–${nextStart+1}`,isCurrent:true,archived:false,createdAt:new Date().toISOString()};
    await put(STORES.schoolYears,currentYear);
    await classManager('current');
  });
  renderList();
}

async function showPastSchoolYears(){
  const years=(await getAll(STORES.schoolYears)).sort((a,b)=>b.id.localeCompare(a.id));
  app.innerHTML=`<section class="screen"><header class="header"><button class="icon-btn" id="years-back">←</button><div class="header-title"><small>Little Moments</small><h2>School Years</h2></div><span style="width:44px"></span></header>
    <div class="school-year-list">${years.map(y=>`<div class="saved-year"><div><strong>${esc(y.label)}</strong><small>${y.id===currentYear.id?(y.archived?'Current selection · archived':'Current school year'):(y.archived?'Archived':'Saved')}</small></div><span>${y.archived?'♡':'✦'}</span></div>`).join('')}</div>
  </section>`;
  app.querySelector('#years-back').addEventListener('click',()=>classManager('current'));
}

function placeholder(title,copy,back=home){
  app.innerHTML=`<section class="screen"><header class="header"><button class="icon-btn" id="back">←</button><div class="header-title"><small>Little Moments</small><h2>${title}</h2></div><span style="width:44px"></span></header><div class="card" style="margin-top:28px;text-align:center"><div class="tagline" style="font-size:16px">${copy}</div><button class="secondary" id="home">Back</button></div></section>`;
  app.querySelector('#back').addEventListener('click',back);app.querySelector('#home').addEventListener('click',back);
}

async function init(){
  if('serviceWorker' in navigator){try{await navigator.serviceWorker.register('./sw.js')}catch(e){console.warn('SW registration skipped',e)}}
  currentYear=await ensureInitialSchoolYear();
  cover();
}
init();
