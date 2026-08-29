const app=document.querySelector('#app');

function decorateCaptureChoices(){
  // Home: describe the action, not the input source.
  const homeCapture=app.querySelector('#capture');
  if(homeCapture && homeCapture.textContent.includes('Take a Photo')) homeCapture.textContent='＋ Capture a Moment';

  const screen=app.querySelector('.capture-screen');
  if(!screen || screen.dataset.photoChoicesReady==='1') return;
  const oldInput=screen.querySelector('#capture-photo-input');
  const oldButton=screen.querySelector('#capture-photo-button');
  const area=screen.querySelector('#capture-photo-area');
  if(!oldInput || !oldButton || !area) return;
  screen.dataset.photoChoicesReady='1';

  // Keep the existing camera input and its existing change/save wiring intact.
  oldButton.style.display='none';
  area.innerHTML=`<div class="capture-choice-intro"><strong>Add your photo</strong><small>How would you like to capture this Little Moment?</small></div><div class="capture-source-grid"><button type="button" class="capture-source-card camera-source" id="take-photo-choice"><span class="capture-source-art">📷</span><strong>Take a Photo</strong><small>capture it now</small></button><button type="button" class="capture-source-card gallery-source" id="choose-photo-choice"><span class="capture-source-art">▧</span><strong>Choose from Phone</strong><small>add one you already took</small></button></div>`;

  const galleryInput=document.createElement('input');
  galleryInput.type='file';galleryInput.accept='image/*';galleryInput.className='sr-only';galleryInput.id='capture-gallery-input';
  oldInput.insertAdjacentElement('afterend',galleryInput);

  screen.querySelector('#take-photo-choice').addEventListener('click',()=>oldInput.click());
  screen.querySelector('#choose-photo-choice').addEventListener('click',()=>galleryInput.click());
  galleryInput.addEventListener('change',()=>{
    const file=galleryInput.files?.[0];if(!file)return;
    try{
      const dt=new DataTransfer();dt.items.add(file);oldInput.files=dt.files;oldInput.dispatchEvent(new Event('change',{bubbles:true}));
    }catch{
      // Fallback for browsers that do not allow assigning FileList: temporarily remove capture and reuse the original picker.
      oldInput.removeAttribute('capture');oldInput.click();
    }
  });
}
new MutationObserver(decorateCaptureChoices).observe(app,{childList:true,subtree:true});
decorateCaptureChoices();