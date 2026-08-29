const app=document.querySelector('#app');
function decorateTeacherTools(){
  const title=[...app.querySelectorAll('.header-title h2')].find(h=>h.textContent.trim()==='Teacher Tools');
  if(!title)return;
  const screen=title.closest('.screen');if(!screen||screen.classList.contains('teacher-tools-screen'))return;
  screen.classList.add('teacher-tools-screen');
  const list=screen.querySelector('.tool-list');
  if(list&&!screen.querySelector('.teacher-tools-intro')){
    const intro=document.createElement('div');intro.className='teacher-tools-intro';intro.textContent='the little things that keep our year organized';list.before(intro);
    const note=document.createElement('div');note.className='teacher-tools-note';note.textContent='Every child’s story stays connected, year after year.';list.after(note);
  }
}
new MutationObserver(decorateTeacherTools).observe(app,{childList:true,subtree:true});decorateTeacherTools();