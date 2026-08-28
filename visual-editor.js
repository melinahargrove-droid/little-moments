const KEY='littleMoments.cameraVisual.v1';
const defaults={zoom:100,x:0,y:0};
let state={...defaults};
try{state={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{}

function apply(){
  document.documentElement.style.setProperty('--lm-camera-zoom',`${state.zoom}%`);
  document.documentElement.style.setProperty('--lm-camera-x',`${state.x}px`);
  document.documentElement.style.setProperty('--lm-camera-y',`${state.y}px`);
  const read=document.querySelector('.lm-edit-readout');
  if(read) read.textContent=`Size ${state.zoom}% · X ${state.x}px · Y ${state.y}px`;
}

function ensureEditor(){
  const camera=document.querySelector('.camera-polaroid');
  let launch=document.querySelector('.lm-edit-launch');
  if(!camera){ if(launch) launch.remove(); document.querySelector('.lm-edit-panel')?.remove(); return; }
  if(launch) return;
  launch=document.createElement('button');
  launch.className='lm-edit-launch';
  launch.type='button';
  launch.textContent='✎ Edit Camera';
  launch.addEventListener('click',()=>document.querySelector('.lm-edit-panel').hidden=false);
  document.body.appendChild(launch);

  const panel=document.createElement('div');
  panel.className='lm-edit-panel';
  panel.hidden=true;
  panel.innerHTML=`
    <div class="lm-edit-head"><strong>Camera Visual</strong><button class="lm-edit-close" type="button">×</button></div>
    <div class="lm-edit-readout"></div>
    <div class="lm-edit-row"><button data-act="smaller" type="button">− Smaller</button><div class="label">SIZE</div><button data-act="larger" type="button">+ Larger</button></div>
    <div class="lm-edit-nudge">
      <button class="up" data-act="up" type="button">↑</button>
      <button class="left" data-act="left" type="button">←</button>
      <button class="down" data-act="down" type="button">↓</button>
      <button class="right" data-act="right" type="button">→</button>
    </div>
    <div class="lm-edit-actions"><button data-act="reset" type="button">Reset</button><button class="save" data-act="save" type="button">Save</button></div>`;
  document.body.appendChild(panel);
  panel.querySelector('.lm-edit-close').addEventListener('click',()=>panel.hidden=true);
  panel.addEventListener('click',e=>{
    const act=e.target.closest('[data-act]')?.dataset.act;if(!act)return;
    if(act==='larger') state.zoom=Math.min(300,state.zoom+10);
    if(act==='smaller') state.zoom=Math.max(50,state.zoom-10);
    if(act==='up') state.y-=5;
    if(act==='down') state.y+=5;
    if(act==='left') state.x-=5;
    if(act==='right') state.x+=5;
    if(act==='reset') state={...defaults};
    if(act==='save'){localStorage.setItem(KEY,JSON.stringify(state));panel.hidden=true;}
    apply();
  });
  apply();
}

apply();
new MutationObserver(ensureEditor).observe(document.getElementById('app'),{childList:true,subtree:true});
ensureEditor();
