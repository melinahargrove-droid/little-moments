const MOMENTS_ART_KEY='lmMomentsArtAdjust';
const defaults={scale:1,x:0,y:0};

function readState(){
  try{return {...defaults,...JSON.parse(localStorage.getItem(MOMENTS_ART_KEY)||'{}')}}catch{return {...defaults}}
}
function saveState(state){localStorage.setItem(MOMENTS_ART_KEY,JSON.stringify(state));}
function clamp(n,min,max){return Math.min(max,Math.max(min,n));}

function ensureMomentsControls(){
  const icon=document.querySelector('.tile-icon.stack');
  const grid=document.querySelector('.screen:has(.capture-card) .grid2');
  const old=document.querySelector('.moments-art-controls');
  if(!icon||!grid){old?.remove();return;}

  let state=readState();
  const apply=()=>{
    icon.style.setProperty('--moments-scale',String(state.scale));
    icon.style.setProperty('--moments-x',`${state.x}px`);
    icon.style.setProperty('--moments-y',`${state.y}px`);
    const readout=document.querySelector('.moments-art-readout');
    if(readout) readout.textContent=`${Math.round(state.scale*100)}% · X ${state.x} · Y ${state.y}`;
  };

  let panel=old;
  if(!panel){
    panel=document.createElement('section');
    panel.className='moments-art-controls';
    panel.innerHTML=`
      <div class="moments-art-control-head"><strong>Our Moments clipart</strong><span class="moments-art-readout"></span></div>
      <div class="moments-art-control-grid">
        <button type="button" data-art="smaller">− Size</button>
        <button type="button" data-art="larger">＋ Size</button>
        <button type="button" data-art="left">←</button>
        <button type="button" data-art="up">↑</button>
        <button type="button" data-art="down">↓</button>
        <button type="button" data-art="right">→</button>
        <button type="button" data-art="reset" class="reset">Reset</button>
      </div>`;
    grid.insertAdjacentElement('afterend',panel);
    panel.querySelectorAll('[data-art]').forEach(btn=>btn.addEventListener('click',()=>{
      const action=btn.dataset.art;
      if(action==='smaller') state.scale=Number(clamp(state.scale-.05,.5,1.8).toFixed(2));
      if(action==='larger') state.scale=Number(clamp(state.scale+.05,.5,1.8).toFixed(2));
      if(action==='left') state.x-=4;
      if(action==='right') state.x+=4;
      if(action==='up') state.y-=4;
      if(action==='down') state.y+=4;
      if(action==='reset') state={...defaults};
      saveState(state);apply();
    }));
  }
  apply();
}

new MutationObserver(ensureMomentsControls).observe(document.getElementById('app'),{childList:true,subtree:true});
ensureMomentsControls();
