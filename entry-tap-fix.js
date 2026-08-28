let entryTapLock=false;
function triggerEntryFromPoint(x,y,event){
  const button=document.getElementById('open-journal');
  if(!button||entryTapLock) return;
  const r=button.getBoundingClientRect();
  if(x<r.left||x>r.right||y<r.top||y>r.bottom) return;
  entryTapLock=true;
  event?.preventDefault?.();
  button.click();
  setTimeout(()=>{entryTapLock=false;},500);
}
document.addEventListener('pointerup',event=>{
  triggerEntryFromPoint(event.clientX,event.clientY,event);
},{capture:true});
document.addEventListener('touchend',event=>{
  const touch=event.changedTouches?.[0];
  if(touch) triggerEntryFromPoint(touch.clientX,touch.clientY,event);
},{capture:true,passive:false});
