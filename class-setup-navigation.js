document.addEventListener('click',async e=>{
  const btn=e.target.closest?.('#open-class-setup');
  if(!btn)return;
  e.preventDefault();
  e.stopImmediatePropagation();
  btn.disabled=true;
  try{
    const mod=await import('./class-setup.js?v=245');
    await mod.openSetup();
  }catch(err){
    console.error('Could not open Class & Students',err);
    btn.disabled=false;
    alert('Class & Students could not be opened. Please reopen Little Moments and try again.');
  }
},true);
