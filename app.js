import {ensureInitialSchoolYear, getAll, STORES} from './db.js';

const app=document.querySelector('#app');
let currentYear=null;

function samplePhoto(kind=1){
  const palettes=[['#e4ded2','#b17e66','#abb7a7'],['#dfe6dd','#9c725d','#b4aaa0'],['#e7e0d5','#b9856b','#aab6a7']];
  const [bg,skin,shirt]=palettes[(kind-1)%palettes.length];
  return `<svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden="true"><rect width="100" height="100" fill="${bg}"/><rect y="72" width="100" height="28" fill="#c9bca7"/><circle cx="45" cy="34" r="13" fill="${skin}"/><path d="M29 52q16-17 32 0v34H29z" fill="${shirt}"/><rect x="62" y="58" width="24" height="7" fill="#8e806b"/><rect x="67" y="49" width="14" height="9" fill="#9b8c74"/></svg>`;
}

function cover(){
  app.innerHTML=`<section class="cover">
    <div><h1>Little<br>Moments</h1><div class="tagline">Our year, one moment at a time.</div></div>
    <div class="cover-stack" aria-label="Sample classroom memories">
      <div class="polaroid p1"><div class="photo">${samplePhoto(1)}</div><div class="caption">building big ideas ♡</div></div>
      <div class="polaroid p2"><div class="photo">${samplePhoto(2)}</div><div class="caption">exploring the world</div></div>
      <div class="polaroid p3"><div class="tape"></div><div class="photo">${samplePhoto(3)}</div><div class="caption">creating together ✦</div></div>
    </div>
    <button class="primary" id="open-journal">Open Our Journal</button>
    <div class="footline"><span>Capture every moment</span><span class="dot">•</span><span>Collect their memories</span><span class="dot">•</span><span>Create their story</span></div>
  </section>`;
  app.querySelector('#open-journal').addEventListener('click',home);
}

async function home(){
  const moments=await getAll(STORES.moments);
  app.innerHTML=`<section class="screen">
    <header class="header"><span style="width:44px"></span><div class="header-title"><small>Welcome back to</small><h2>Little Moments</h2></div><button class="icon-btn" id="settings" aria-label="Settings">♡</button></header>
    <section class="card capture-card">
      <div class="camera-polaroid"><div class="tape"></div><div class="camera-slot"><div class="camera-glyph"></div></div><div class="cap">capture what's happening ♡</div></div>
      <h3 class="serif" style="font-size:22px;margin:0">Capture a Moment</h3><p style="font-size:13px;color:#756e64;margin:5px 0 14px">Take a quick photo and save the story behind it.</p>
      <button class="primary" id="capture">＋ Take a Photo</button>
    </section>
    <div class="grid2">
      <button class="home-tile" id="moments"><div class="tile-icon stack"><span></span><span></span><span></span></div><h3>Our Moments</h3><p>Flip through the memories you've saved.</p><span class="tile-link">Open journal →</span></button>
      <button class="home-tile" id="portfolios"><div class="tile-icon book"></div><h3>Portfolios</h3><p>See each child's story growing over time.</p><span class="tile-link">View friends →</span></button>
    </div>
    <section class="recent-strip"><div class="recent-head"><div><h3>Recent Moments</h3><small>A peek at the latest pages</small></div><button class="icon-btn" id="see-all" aria-label="See all moments">›</button></div>
      ${moments.length?`<div class="mini-row">${moments.slice(-3).reverse().map((m,i)=>`<div class="mini-polaroid"><div class="mini-photo">${samplePhoto(i+1)}</div></div>`).join('')}</div>`:`<div class="empty-copy">Your first Little Moment will appear here ♡</div>`}
    </section>
    <div class="notice">Foundation build: ${currentYear.label} is active. Student, school-year, moment, photo, portfolio-book, and settings data stores are ready.</div>
  </section>`;
  app.querySelector('#capture').addEventListener('click',()=>placeholder('Capture a Moment','The real photo/caption/student-tagging workflow is the next build section.'));
  app.querySelector('#moments').addEventListener('click',()=>placeholder('Our Moments','Your Polaroid journal gallery will live here.'));
  app.querySelector('#portfolios').addEventListener('click',()=>placeholder('Portfolios','Student portfolios and multi-year history will live here.'));
  app.querySelector('#settings').addEventListener('click',()=>placeholder('Settings & Data Safety','Privacy, backups, storage, and school years will live here.'));
  app.querySelector('#see-all').addEventListener('click',()=>placeholder('Our Moments','Your Polaroid journal gallery will live here.'));
}

function placeholder(title,copy){
  app.innerHTML=`<section class="screen"><header class="header"><button class="icon-btn" id="back">←</button><div class="header-title"><small>Little Moments</small><h2>${title}</h2></div><span style="width:44px"></span></header><div class="card" style="margin-top:28px;text-align:center"><div class="tagline" style="font-size:16px">${copy}</div><button class="secondary" id="home">Back to Home</button></div></section>`;
  app.querySelector('#back').addEventListener('click',home);app.querySelector('#home').addEventListener('click',home);
}

async function init(){
  if('serviceWorker' in navigator){try{await navigator.serviceWorker.register('./sw.js')}catch(e){console.warn('SW registration skipped',e)}}
  currentYear=await ensureInitialSchoolYear();
  cover();
}
init();
