import {get, STORES} from './db.js';

const app=document.querySelector('#app');
let recentUrls=[];
let refreshToken=0;

function clearRecentUrls(){
  recentUrls.forEach(url=>URL.revokeObjectURL(url));
  recentUrls=[];
}

async function repairRecentPhotos(){
  const cards=[...app.querySelectorAll('.mini-polaroid[data-moment]')];
  if(!cards.length){
    clearRecentUrls();
    return;
  }

  const token=++refreshToken;
  clearRecentUrls();

  for(const card of cards){
    if(token!==refreshToken) return;
    const momentId=card.dataset.moment;
    if(!momentId) continue;
    const moment=await get(STORES.moments,momentId);
    if(!moment?.photoId) continue;
    const photo=await get(STORES.photos,moment.photoId);
    if(!photo?.blob) continue;

    let img=card.querySelector('.mini-photo img');
    const photoBox=card.querySelector('.mini-photo');
    if(!photoBox) continue;
    if(!img){
      photoBox.innerHTML='<img alt="">';
      img=photoBox.querySelector('img');
    }
    const url=URL.createObjectURL(photo.blob);
    recentUrls.push(url);
    img.src=url;
  }
}

let scheduled=false;
function scheduleRepair(){
  if(scheduled) return;
  scheduled=true;
  requestAnimationFrame(()=>{
    scheduled=false;
    repairRecentPhotos();
  });
}

new MutationObserver(scheduleRepair).observe(app,{childList:true,subtree:true});
scheduleRepair();
