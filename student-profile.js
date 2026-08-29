import {getAll,get,put,STORES} from './db.js';

const app=document.querySelector('#app');
let pendingNewPhoto=null;
let pendingNewName='';

const esc=(v='')=>String(v).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

function initials(name='?'){return esc((name.trim()[0]||'?').toUpperCase())}
function uid(prefix='id'){return `${prefix}-${globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(16).slice(2)}`}

function chooseImage(){
  return new Promise(resolve=>{
    const input=document.createElement('input');
    input.type='file';
    input.accept='image/*';
    input.style.position='fixed';input.style.left='-9999px';
    document.body.appendChild(input);
    input.addEventListener('change',async()=>{
      const file=input.files?.[0];
      if(!file){input.remove();resolve(null);return}
      try{resolve(await resizeImage(file))}catch{resolve(null)}finally{input.remove()}
    },{once:true});
    input.click();
  });
}

function resizeImage(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(reader.error);
    reader.onload=()=>{
      const img=new Image();
      img.onerror=reject;
      img.onload=()=>{
        const side=Math.min(img.naturalWidth,img.naturalHeight);
        const sx=(img.naturalWidth-side)/2,sy=(img.naturalHeight-side)/2;
        const canvas=document.createElement('canvas');canvas.width=640;canvas.height=640;
        const ctx=canvas.getContext('2d');ctx.drawImage(img,sx,sy,side,side,0,0,640,640);
        resolve(canvas.toDataURL('image/jpeg',.86));
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function setAddPhotoPreview(dataUrl){
  const btn=app.querySelector('#profile-photo');if(!btn)return;
  btn.classList.add('has-profile-preview');
  btn.innerHTML=`<img src="${dataUrl}" alt="Selected profile photo"><span>Change profile photo</span>`;
}

async function applyPendingPhoto(){
  if(!pendingNewPhoto||!pendingNewName)return;
  for(let attempt=0;attempt<12;attempt++){
    await new Promise(r=>setTimeout(r,120));
    const students=await getAll(STORES.students);
    const matches=students.filter(s=>s.name?.trim().toLocaleLowerCase()===pendingNewName.toLocaleLowerCase()).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
    const student=matches[0];
    if(!student)continue;
    if(!student.profilePhoto){student.profilePhoto=pendingNewPhoto;student.updatedAt=new Date().toISOString();await put(STORES.students,student)}
    const row=document.querySelector(`.student-row[data-id="${CSS.escape(student.id)}"] .student-polaroid`);
    if(row)row.innerHTML=`<img src="${pendingNewPhoto}" alt="">`;
    pendingNewPhoto=null;pendingNewName='';return;
  }
}

function closeEditor(){document.querySelector('.student-profile-overlay')?.remove()}

async function openEditor(studentId){
  const student=await get(STORES.students,studentId);if(!student)return;
  let workingPhoto=student.profilePhoto||null;
  const overlay=document.createElement('div');overlay.className='student-profile-overlay';
  overlay.innerHTML=`<section class="student-profile-sheet" role="dialog" aria-modal="true" aria-label="Edit ${esc(student.name)}"><header><button class="profile-close" aria-label="Close">←</button><div><small>one friend · every year</small><h2>Edit Student</h2></div><span></span></header><div class="profile-editor-card"><button class="profile-photo-editor" id="edit-profile-photo" aria-label="Change profile photo">${workingPhoto?`<img src="${workingPhoto}" alt="">`:`<span>${initials(student.name)}</span>`}<b>✎</b></button><p class="profile-photo-help">Tap the photo to add or change it ♡</p><label for="edit-student-name">Child's name</label><input id="edit-student-name" value="${esc(student.name)}" autocomplete="off"><p class="profile-save-status" aria-live="polite"></p><button class="primary" id="save-student-profile">Save Student Profile ♡</button></div></section>`;
  document.body.appendChild(overlay);
  const name=overlay.querySelector('#edit-student-name'),photo=overlay.querySelector('#edit-profile-photo'),status=overlay.querySelector('.profile-save-status');
  overlay.querySelector('.profile-close').addEventListener('click',closeEditor);
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeEditor()});
  photo.addEventListener('click',async()=>{const data=await chooseImage();if(!data)return;workingPhoto=data;photo.innerHTML=`<img src="${data}" alt=""><b>✎</b>`});
  overlay.querySelector('#save-student-profile').addEventListener('click',async()=>{
    const next=name.value.trim();if(!next){status.textContent='Enter the child’s name first ♡';name.focus();return}
    const students=await getAll(STORES.students);const duplicate=students.find(s=>s.id!==student.id&&s.name?.trim().toLocaleLowerCase()===next.toLocaleLowerCase());
    if(duplicate){status.textContent='Another child already has that name. ♡';return}
    student.name=next;student.profilePhoto=workingPhoto;student.updatedAt=new Date().toISOString();await put(STORES.students,student);
    const row=document.querySelector(`.student-row[data-id="${CSS.escape(student.id)}"]`);
    if(row){const strong=row.querySelector('.student-copy strong');if(strong)strong.textContent=next;const polaroid=row.querySelector('.student-polaroid');if(polaroid)polaroid.innerHTML=workingPhoto?`<img src="${workingPhoto}" alt="">`:`<div class="initial-avatar" aria-hidden="true">${initials(next)}</div>`}
    status.textContent='Saved ♡';setTimeout(closeEditor,350);
  });
}

document.addEventListener('click',async e=>{
  const photoBtn=e.target.closest('#profile-photo');
  if(photoBtn){e.preventDefault();e.stopImmediatePropagation();const data=await chooseImage();if(data){pendingNewPhoto=data;setAddPhotoPreview(data)}return}

  const create=e.target.closest('#create-child');
  if(create){pendingNewName=app.querySelector('#new-child-name')?.value.trim()||'';if(pendingNewPhoto&&pendingNewName)setTimeout(applyPendingPhoto,0);return}

  const studentBtn=e.target.closest('.student-main[data-open]');
  if(studentBtn){e.preventDefault();e.stopImmediatePropagation();openEditor(studentBtn.dataset.open);return}
},true);
