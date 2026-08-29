const app=document.querySelector('#app');
function decorateClassManager(){
  const title=[...app.querySelectorAll('.header-title h2')].find(h=>h.textContent.trim()==='Class & Students');
  if(!title)return;
  const screen=title.closest('.screen');
  if(screen&&!screen.classList.contains('class-manager-screen'))screen.classList.add('class-manager-screen');

  const count=screen?.querySelector('#class-count');
  if(count){
    const match=count.textContent.trim().match(/^(\d+)\s+children\s*♡?$/i);
    if(match&&Number(match[1])===1)count.textContent='1 child ♡';
  }

  const yearBtn=screen?.querySelector('#school-year');
  if(yearBtn){
    const expanded=yearBtn.getAttribute('aria-expanded')==='true';
    yearBtn.textContent=`School Year ${expanded?'⌃':'⌄'}`;
  }
}
new MutationObserver(decorateClassManager).observe(app,{childList:true,subtree:true,characterData:true});decorateClassManager();