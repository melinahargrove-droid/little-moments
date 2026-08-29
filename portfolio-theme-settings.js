const app=document.querySelector('#app');
const PREF_KEY='lm-preferences-v1';
const THEMES=[
  {id:'early-eagle',name:'Early Eagle Classic',note:'navy · watercolor · scrapbook',icon:'★',ready:true},
  {id:'woodland-neutral',name:'Woodland Neutral',note:'sage · forest · nature journal',icon:'❧',ready:true},
  {id:'colorful-classroom',name:'Colorful Classroom',note:'bright · watercolor · classroom',icon:'✦',ready:true},
  {id:'soft-botanical',name:'Soft Botanical',note:'planned theme',icon:'♡',ready:false}
];
function readPrefs(){try{return JSON.parse(localStorage.getItem(PREF_KEY)||'{}')}catch{return {}}}
function writeTheme(id){const p=readPrefs();p.portfolioTheme=id;localStorage.setItem(PREF_KEY,JSON.stringify(p))}
function installPortfolioThemeSetting(){
  const screen=app.querySelector('.settings-screen');
  if(!screen||screen.dataset.portfolioThemeReady==='1')return;
  const list=screen.querySelector('.settings-list');
  if(!list)return;
  screen.dataset.portfolioThemeReady='1';
  const selected=readPrefs().portfolioTheme||'early-eagle';
  const card=document.createElement('section');
  card.className='settings-card portfolio-theme-settings-card';
  card.innerHTML=`<div class="settings-card-head"><div class="settings-card-icon" aria-label="Printer">🖨️</div><div><h3>Printable Portfolio Theme</h3><p>Choose the style used when you print or save every child's portfolio.</p></div></div><div class="settings-theme-options">${THEMES.map(t=>`<button type="button" class="settings-theme-option ${selected===t.id?'active':''} ${t.ready?'':'coming'}" data-portfolio-theme="${t.id}" ${t.ready?'':'disabled'}><span class="settings-theme-swatch ${t.id}">${t.icon}</span><span><strong>${t.name}</strong><small>${t.note}</small></span><b>${selected===t.id?'✓':t.ready?'':'soon'}</b></button>`).join('')}</div><div class="settings-status"><span id="portfolio-theme-status">Applies to all printable portfolios.</span><span class="settings-pill">Saved</span></div>`;
  const prefsCard=list.querySelector('.preferences-card');
  if(prefsCard)prefsCard.insertAdjacentElement('afterend',card);else list.appendChild(card);
  card.querySelectorAll('[data-portfolio-theme]:not([disabled])').forEach(btn=>btn.addEventListener('click',()=>{
    writeTheme(btn.dataset.portfolioTheme);
    card.querySelectorAll('[data-portfolio-theme]').forEach(x=>{x.classList.toggle('active',x===btn);const b=x.querySelector('b');if(b)b.textContent=x===btn?'✓':x.disabled?'soon':''});
    const status=card.querySelector('#portfolio-theme-status');status.textContent=`${btn.querySelector('strong').textContent} selected ♡`;
    setTimeout(()=>{if(status)status.textContent='Applies to all printable portfolios.'},1100);
  }));
}
new MutationObserver(installPortfolioThemeSetting).observe(app,{childList:true,subtree:true});
installPortfolioThemeSetting();