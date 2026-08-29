import {get,STORES} from './db.js';
import {showDetail} from './moments-view.js?v=095';
const app=document.querySelector('#app');
function cleanLegacyUI(){const archive=app.querySelector('#archive-year');if(archive)archive.remove();const menu=app.querySelector('#school-year-menu');if(menu&&!menu.querySelector('.year-safety-note')){const note=document.createElement('small');note.className='year-safety-note';note.textContent='Use Start New School Year to safely archive this chapter ♡';menu.appendChild(note)}}
new MutationObserver(cleanLegacyUI).observe(app,{childList:true,subtree:true});cleanLegacyUI();
document.addEventListener('click',async e=>{const card=e.target.closest('.mini-polaroid[data-moment]');if(!card)return;e.preventDefault();e.stopImmediatePropagation();const moment=await get(STORES.moments,card.dataset.moment);if(moment)showDetail(moment,false,0,()=>location.reload())},true);
