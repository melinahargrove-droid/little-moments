(()=>{
  const STORAGE_KEY='lmTileArtAdjustV1';
  const defaults={moments:{scale:1,x:0,y:0},portfolio:{scale:1,x:0,y:0},active:'moments'};
  let state=load();
  let panel=null;

  function load(){
    try{
      const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
      return {
        moments:{...defaults.moments,...(saved.moments||{})},
        portfolio:{...defaults.portfolio,...(saved.portfolio||{})},
        active:saved.active==='portfolio'?'portfolio':'moments'
      };
    }catch{return JSON.parse(JSON.stringify(defaults));}
  }

  function save(){
    try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{}
  }

  function clamp(n,min,max){return Math.max(min,Math.min(max,n));}

  function makePanel(){
    if(panel) return panel;
    panel=document.createElement('div');
    panel.id='lm-tile-art-controls';
    Object.assign(panel.style,{
      position:'fixed',left:'10px',right:'10px',bottom:'10px',zIndex:'10050',display:'none',
      background:'rgba(255,250,243,.97)',border:'1px solid #d8c9ba',borderRadius:'16px',
      boxShadow:'0 8px 24px rgba(70,50,35,.18)',padding:'9px',font:'600 12px system-ui,sans-serif',
      color:'#5f554e',touchAction:'manipulation'
    });
    panel.innerHTML=`
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:7px">
        <button type="button" data-target="moments">Our Moments</button>
        <button type="button" data-target="portfolio">Portfolio</button>
        <span data-readout style="margin-left:auto;font-size:11px;color:#8d756b;white-space:nowrap"></span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:5px">
        <button type="button" data-action="smaller">− Size</button>
        <button type="button" data-action="larger">+ Size</button>
        <button type="button" data-action="left">←</button>
        <button type="button" data-action="up">↑</button>
        <button type="button" data-action="down">↓</button>
        <button type="button" data-action="right">→</button>
        <button type="button" data-action="reset">Reset</button>
      </div>`;

    panel.querySelectorAll('button').forEach(btn=>{
      Object.assign(btn.style,{
        minHeight:'38px',border:'1px solid #ddcec0',borderRadius:'10px',background:'#fffaf4',
        color:'#6e5d54',font:'700 11px system-ui,sans-serif',padding:'5px 4px'
      });
      btn.addEventListener('click',event=>{
        event.preventDefault();
        event.stopPropagation();
        if(btn.dataset.target){state.active=btn.dataset.target;save();apply();return;}
        const target=state[state.active];
        switch(btn.dataset.action){
          case 'smaller': target.scale=Number(clamp(target.scale-.05,.45,1.8).toFixed(2)); break;
          case 'larger': target.scale=Number(clamp(target.scale+.05,.45,1.8).toFixed(2)); break;
          case 'left': target.x-=4; break;
          case 'right': target.x+=4; break;
          case 'up': target.y-=4; break;
          case 'down': target.y+=4; break;
          case 'reset': state[state.active]={scale:1,x:0,y:0}; break;
        }
        save();
        apply();
      });
    });
    document.body.appendChild(panel);
    return panel;
  }

  function apply(){
    const moments=document.querySelector('.tile-icon.stack');
    const portfolio=document.querySelector('.tile-icon.book');
    const p=makePanel();
    const onHome=!!(moments&&portfolio);
    p.style.display=onHome?'block':'none';
    if(!onHome) return;

    moments.style.setProperty('--moments-scale',state.moments.scale);
    moments.style.setProperty('--moments-x',`${state.moments.x}px`);
    moments.style.setProperty('--moments-y',`${state.moments.y}px`);
    portfolio.style.setProperty('--portfolio-scale',state.portfolio.scale);
    portfolio.style.setProperty('--portfolio-x',`${state.portfolio.x}px`);
    portfolio.style.setProperty('--portfolio-y',`${state.portfolio.y}px`);

    p.querySelectorAll('[data-target]').forEach(btn=>{
      const active=btn.dataset.target===state.active;
      btn.style.background=active?'#ead9cf':'#fffaf4';
      btn.style.borderColor=active?'#c99688':'#ddcec0';
    });
    const active=state[state.active];
    p.querySelector('[data-readout]').textContent=`${Math.round(active.scale*100)}% · X ${active.x} · Y ${active.y}`;
  }

  makePanel();
  apply();
  setInterval(apply,300);
  window.addEventListener('pageshow',apply);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) apply();});
})();
