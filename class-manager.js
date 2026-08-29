const app=document.querySelector('#app');
function decorateClassManager(){
  const title=[...app.querySelectorAll('.header-title h2')].find(h=>h.textContent.trim()==='Class & Students');
  if(!title)return;
  const screen=title.closest('.screen');
  if(screen&&!screen.classList.contains('class-manager-screen'))screen.classList.add('class-manager-screen');
}
new MutationObserver(decorateClassManager).observe(app,{childList:true,subtree:true});decorateClassManager();