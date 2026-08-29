import {getAll,get,STORES} from './db.js';
const app=document.querySelector('#app');
let urls=[];
const esc=(v='')=>String(v).replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const obj=blob=>{const u=URL.createObjectURL(blob);urls.push(u);return u};
const clear=()=>{urls.forEach(URL.revokeObjectURL);urls=[]};
function currentYearFrom(years){return years.find(y=>!y.archived)||years.sort((a,b)=>String(b.id).localeCompare(String(a.id)))[0]}
async function openMoments(){
  clear();
  const [moments,years]=await Promise.all([getAll(STORES.moments),getAll(STORES.schoolYears)]);
  const year=currentYearFrom(years);const list=moments.filter(m=>!year||m.schoolYearId===year.id).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));
  const cards=[];
  for(const m of list){const p=m.photoId?await get(STORES.photos,m.photoId):null;const media=p?.blob?`<img src="${obj(p.blob)}" alt="">`:`<div style="height:100%;display:grid;place-items:center;font-size:34px;color:#c9877b">♡</div>`;const d=m.createdAt?new Date(m.createdAt).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'';cards.push(`<button class="journal-polaroid" data-open-moment="${esc(m.id)}"><div class="journal-photo">${media}</div><div class="journal-date">${esc(d)}</div><div class="journal-caption">${esc(m.caption||'a little moment ♡')}</div></button>`)}
  app.innerHTML=`<section class="screen moments-screen"><header class="header"><button class="icon-btn" id="moments-back" aria-label="Back">←</button><div class="header-title"><small>our little scrapbook</small><h2>Our Moments</h2></div><button class="icon-btn" id="moments-heart" aria-label="Favorite moments">♡</button></header><div class="moments-intro"><p>the stories, discoveries &amp; everyday magic we've saved ♡</p></div><div class="moments-filters"><button class="moment-filter active">All Moments</button><button class="moment-filter">${esc(year?.label||'This Year')}</button><button class="moment-filter">Favorites ♡</button></div><div class="moments-count">${list.length?`${list.length} ${list.length===1?'moment':'moments'} tucked inside`:'ready for your first memory'}</div>${list.length?`<div class="moments-journal">${cards.join('')}</div>`:`<div class="moments-empty"><div class="empty-stack"><div class="empty-sheet"></div><div class="empty-sheet"></div><div class="empty-sheet"></div></div><h3>Your journal is waiting</h3><p>Your first Little Moment will become the first page in this scrapbook.</p><button class="primary" id="empty-home">Back to Capture a Moment</button></div>`}</section>`;
  app.querySelector('#moments-back').addEventListener('click',()=>location.reload());
  app.querySelector('#empty-home')?.addEventListener('click',()=>location.reload());
  app.querySelectorAll('.moment-filter').forEach((b,i)=>b.addEventListener('click',()=>{app.querySelectorAll('.moment-filter').forEach(x=>x.classList.remove('active'));b.classList.add('active');if(i>0)app.querySelector('.moments-count').textContent=i===1?'Showing this school year':'Favorites filter will fill as moments are hearted ♡'}));
}
document.addEventListener('click',e=>{const trigger=e.target.closest('#moments,#see-all');if(!trigger)return;e.preventDefault();e.stopImmediatePropagation();openMoments()},true);
