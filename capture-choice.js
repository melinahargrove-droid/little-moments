const app=document.querySelector('#app');

function localDateString(d){
  if(!(d instanceof Date)||Number.isNaN(d.getTime()))return null;
  const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}
function parseExifTextDate(text){
  const m=String(text||'').match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if(!m)return null;
  const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]),Number(m[4]),Number(m[5]),Number(m[6]));
  return localDateString(d);
}
async function jpegExifDate(file){
  if(!file||!/^image\/jpe?g$/i.test(file.type||''))return null;
  const buffer=await file.slice(0,512*1024).arrayBuffer(),view=new DataView(buffer),bytes=new Uint8Array(buffer);
  if(view.byteLength<4||view.getUint16(0,false)!==0xffd8)return null;
  let p=2;
  while(p+4<=view.byteLength){
    if(bytes[p]!==0xff){p++;continue}
    const marker=bytes[p+1];
    if(marker===0xda||marker===0xd9)break;
    const len=view.getUint16(p+2,false);if(len<2||p+2+len>view.byteLength)break;
    if(marker===0xe1&&len>=8){
      const data=p+4;
      if(bytes[data]===0x45&&bytes[data+1]===0x78&&bytes[data+2]===0x69&&bytes[data+3]===0x66&&bytes[data+4]===0&&bytes[data+5]===0){
        const t=data+6;if(t+8>view.byteLength)return null;
        const little=view.getUint16(t,false)===0x4949;
        const u16=o=>view.getUint16(o,little),u32=o=>view.getUint32(o,little);
        const readAscii=(entry,count)=>{
          const valuePos=entry+8;let start;
          if(count<=4)start=valuePos;else start=t+u32(valuePos);
          if(start<0||start+count>view.byteLength)return '';
          let s='';for(let i=0;i<count&&bytes[start+i];i++)s+=String.fromCharCode(bytes[start+i]);return s;
        };
        const ifd0=t+u32(t+4);if(ifd0+2>view.byteLength)return null;
        let exifOffset=null,modified=null,n=u16(ifd0);
        for(let i=0;i<n;i++){
          const e=ifd0+2+i*12;if(e+12>view.byteLength)break;
          const tag=u16(e),type=u16(e+2),count=u32(e+4);
          if(tag===0x8769)exifOffset=u32(e+8);
          if(tag===0x0132&&type===2)modified=parseExifTextDate(readAscii(e,count))||modified;
        }
        if(exifOffset!=null){
          const exif=t+exifOffset;if(exif+2<=view.byteLength){
            n=u16(exif);
            for(let i=0;i<n;i++){
              const e=exif+2+i*12;if(e+12>view.byteLength)break;
              const tag=u16(e),type=u16(e+2),count=u32(e+4);
              if((tag===0x9003||tag===0x9004)&&type===2){
                const found=parseExifTextDate(readAscii(e,count));if(found)return found;
              }
            }
          }
        }
        if(modified)return modified;
      }
    }
    p+=2+len;
  }
  return null;
}
async function photoDate(file){
  const exif=await jpegExifDate(file).catch(()=>null);
  if(exif)return exif;
  if(file?.lastModified){const fallback=localDateString(new Date(file.lastModified));if(fallback)return fallback}
  return null;
}
function applyDate(date){const input=app.querySelector('#moment-date');if(input&&date)input.value=date}

function decorateCaptureChoices(){
  const homeCapture=app.querySelector('#capture');
  if(homeCapture&&homeCapture.textContent.includes('Take a Photo'))homeCapture.textContent='＋ Capture a Moment';

  const screen=app.querySelector('.capture-screen');
  if(!screen||screen.dataset.photoChoicesReady==='1')return;

  const batchNotice=screen.querySelector('.notice');
  if(batchNotice&&/Photo\s+\d+\s+of\s+\d+/i.test(batchNotice.textContent||'')){
    screen.dataset.photoChoicesReady='1';
    return;
  }

  const oldInput=screen.querySelector('#capture-photo-input'),oldButton=screen.querySelector('#capture-photo-button'),area=screen.querySelector('#capture-photo-area');
  if(!oldInput||!oldButton||!area)return;
  screen.dataset.photoChoicesReady='1';
  oldButton.style.display='none';
  area.innerHTML=`<div class="capture-choice-intro"><strong>Add your photo</strong><small>How would you like to capture this Little Moment?</small></div><div class="capture-source-grid"><button type="button" class="capture-source-card camera-source" id="take-photo-choice"><span class="capture-source-art">📷</span><strong>Take a Photo</strong><small>capture it now</small></button><button type="button" class="capture-source-card gallery-source" id="choose-photo-choice"><span class="capture-source-art">▧</span><strong>Choose Existing Photo</strong><small>Gallery or Files · one or several</small></button></div>`;

  const galleryInput=document.createElement('input');
  galleryInput.type='file';galleryInput.accept='image/*';galleryInput.multiple=true;galleryInput.className='sr-only';galleryInput.id='capture-gallery-input';
  oldInput.insertAdjacentElement('afterend',galleryInput);

  screen.querySelector('#take-photo-choice').addEventListener('click',()=>oldInput.click());
  screen.querySelector('#choose-photo-choice').addEventListener('click',()=>galleryInput.click());
  galleryInput.addEventListener('change',async()=>{
    const files=Array.from(galleryInput.files||[]);if(!files.length)return;
    const dates=await Promise.all(files.map(photoDate));
    if(files.length>1&&typeof window.__littleMomentsStartBatch==='function'){
      window.__littleMomentsStartBatch(files,dates);
      return;
    }
    const file=files[0];
    try{
      const dt=new DataTransfer();dt.items.add(file);oldInput.files=dt.files;oldInput.dispatchEvent(new Event('change',{bubbles:true}));applyDate(dates[0]);
    }catch{
      oldInput.removeAttribute('capture');oldInput.click();
    }
  });
}
new MutationObserver(decorateCaptureChoices).observe(app,{childList:true,subtree:true});decorateCaptureChoices();