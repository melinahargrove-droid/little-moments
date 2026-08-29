const app=document.querySelector('#app');
function decorateClassManager(){
  const title=[...app.querySelectorAll('.header-title h2')].find(h=>h.textContent.trim()==='Class & Students');
  if(!title)return;
  const screen=title.closest('.screen');
  if(!screen)return;
  if(!screen.classList.contains('class-manager-screen'))screen.classList.add('class-manager-screen');

  const count=screen.querySelector('#class-count');
  if(count){
    const txt=count.textContent.trim();
    const match=txt.match(/^(\d+)\s+children\s*♡?$/i);
    if(match&&Number(match[1])===1&&txt!=='1 child ♡')count.textContent='1 child ♡';
  }

  const yearBtn=screen.querySelector('#school-year');
  if(yearBtn&&yearBtn.textContent.trim()!=='School Year ▾')yearBtn.textContent='School Year ▾';
}
new MutationObserver(decorateClassManager).observe(app,{childList:true,subtree:true});
decorateClassManager();