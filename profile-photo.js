import {getAll,put,STORES} from './db.js';

const app=document.querySelector('#app');
let pendingPhoto=null;
let pendingName='';

function resizeImage(file,max=420,quality=.86){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onerror=()=>reject(reader.error);
    reader.onload=()=>{
      const img=new Image();
      img.onerror=()=>reject(new Error('Could not read image'));
      img.onload=()=>{
        const scale=Math.min(1,max/Math.max(img.width,img.height));
        const w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
        const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
        const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,w,h);
        resolve(canvas.toDataURL('image/jpeg',quality));
      };
      img.src=reader.result;
    };
    reader.readAsDataURL(file);
  });
}

function ensurePicker(){
  const panel=app.querySelector('#add-child-panel');
  const button=panel?.querySelector('#profile-photo');
  if(!panel||!button||button.dataset.photoWired==='1')return;
  button.dataset.photoWired='1';
  const input=document.createElement('input');
  input.type='file';input.accept='image/*';input.className='sr-only';input.id='student-profile-photo-input';
  button.insertAdjacentElement('afterend',input);
  const preview=document.createElement('div');preview.className='profile-photo-preview hidden';preview.innerHTML='<div class="profile-photo-thumb"></div><div><strong>Profile photo ready ♡</strong><small>It will save with this child’s permanent profile.</small></div>';
  input.insertAdjacentElement('afterend',preview);
  button.addEventListener('click',()=>input.click());
  input.addEventListener('change',async()=>{
    const file=input.files?.[0];if(!file)return;
    const status=app.querySelector('#class-status');
    if(!file.type.startsWith('image/')){if(status)status.textContent='Choose a photo file ♡';return;}
    try{
      button.disabled=true;button.textContent='Preparing photo…';
      pendingPhoto=await resizeImage(file);pendingName=panel.querySelector('#new-child-name')?.value.trim()||'';
      preview.querySelector('.profile-photo-thumb').innerHTML=`<img src="${pendingPhoto}" alt="Profile photo preview">`;
      preview.classList.remove('hidden');
      button.textContent='Change profile photo';
      if(status)status.textContent='Profile photo ready ♡';
    }catch(err){console.error(err);if(status)status.textContent='That profile photo could not be prepared.';button.textContent='＋ Add profile photo (optional)';}
    finally{button.disabled=false;}
  });

  const create=panel.querySelector('#create-child');
  if(create&&!create.dataset.photoFollowup){
    create.dataset.photoFollowup='1';
    create.addEventListener('click',()=>{
      if(!pendingPhoto)return;
      const name=panel.querySelector('#new-child-name')?.value.trim();if(!name)return;
      const photo=pendingPhoto;pendingName=name;
      let tries=0;
      const finish=async()=>{
        tries++;
        try{
          const students=await getAll(STORES.students);
          const student=students.find(s=>s.name.trim().toLocaleLowerCase()===name.toLocaleLowerCase());
          if(student){
            await put(STORES.students,{...student,profilePhoto:photo,updatedAt:new Date().toISOString()});
            pendingPhoto=null;pendingName='';
            setTimeout(refreshVisibleAvatars,30);
            return;
          }
        }catch(e){console.error(e)}
        if(tries<12)setTimeout(finish,80);
      };
      setTimeout(finish,60);
    });
  }
}

async function refreshVisibleAvatars(){
  const rows=[...app.querySelectorAll('.student-row[data-id]')];if(!rows.length)return;
  const students=await getAll(STORES.students);
  for(const row of rows){
    const student=students.find(s=>s.id===row.dataset.id);if(!student?.profilePhoto)continue;
    const slot=row.querySelector('.student-polaroid');if(slot)slot.innerHTML=`<img src="${student.profilePhoto}" alt="">`;
  }
}

new MutationObserver(()=>{ensurePicker();refreshVisibleAvatars().catch(()=>{})}).observe(app,{childList:true,subtree:true});
ensurePicker();
