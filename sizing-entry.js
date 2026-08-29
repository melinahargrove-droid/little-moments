(()=>{
  const params=new URLSearchParams(location.search);
  const sizingMode=params.get('sizing')==='1';

  function renderSizingHome(){
    const app=document.getElementById('app');
    if(!app) return;
    app.innerHTML=`<section class="screen">
      <header class="header"><span style="width:44px"></span><div class="header-title"><small>Welcome back to</small><h2>Little Moments</h2></div><button class="icon-btn" aria-label="Teacher tools">♡</button></header>
      <section class="card capture-card">
        <div class="camera-polaroid"><div class="tape"></div><div class="camera-slot"><div class="camera-glyph"></div></div><div class="cap">capture what's happening ♡</div></div>
        <h3 class="serif home-capture-title">Capture a Moment</h3><p class="home-copy">Take a quick photo and save the story behind it.</p>
        <button class="primary" type="button">＋ Take a Photo</button>
      </section>
      <div class="grid2">
        <button class="home-tile" type="button"><div class="tile-icon stack"><span></span><span></span><span></span></div><h3>Our Moments</h3><p>Flip through the memories you've saved.</p><span class="tile-link">Open journal →</span></button>
        <button class="home-tile" type="button"><div class="tile-icon book"></div><h3>Portfolios</h3><p>See each child's story growing over time.</p><span class="tile-link">View friends →</span></button>
      </div>
      <section class="recent-strip"><div class="recent-head"><div><h3>Recent Moments</h3><small>A peek at the latest pages</small></div><button class="icon-btn" type="button" aria-label="See all moments">›</button></div><div class="empty-copy">Your first Little Moment will appear here ♡</div></section>
    </section>`;
    try{window.scrollTo(0,0)}catch{}
  }

  function makeCoverLink(){
    const button=document.getElementById('open-journal');
    if(!button||button.tagName==='A') return;
    const link=document.createElement('a');
    link.id='open-journal';
    link.className=button.className;
    link.href='./?sizing=1&v=034';
    link.textContent='Open Our Journal';
    link.setAttribute('role','button');
    Object.assign(link.style,{display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none'});
    button.replaceWith(link);
  }

  function sync(){
    const app=document.getElementById('app');
    if(!app) return;
    if(sizingMode){
      if(!app.querySelector('.screen:has(.capture-card)')) renderSizingHome();
      return;
    }
    makeCoverLink();
  }

  const app=document.getElementById('app');
  if(app){
    if(sizingMode) renderSizingHome();
    new MutationObserver(sync).observe(app,{childList:true,subtree:true});
    sync();
  }
})();