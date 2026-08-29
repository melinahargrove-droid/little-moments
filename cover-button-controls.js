const KEY='lm-cover-button-adjust-v049';
const defaults={scale:100,x:0,y:0};
let state={...defaults};
try{state={...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{}
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function apply(){
  const btn=document.querySelector('.cover #open-journal');
  if(!btn)return false;
  btn.style.setProperty('--btn-scale',state.scale/100);
  btn.style.setProperty('--btn-x',`${state.x}px`);
  btn.style.setProperty('--btn-y',`${state.y}px`);
  const read=document.querySelector('#lm-cover-readout');
  if(read)read.textContent=`${state.scale}% · X ${state.x} · Y ${state.y}`;
  try{localStorage.setItem(KEY,JSON.stringify(state))}catch{}
  return true;
}
function removePanel(){document.querySelector('#lm-cover-controls')?.remove()}
function showPanel(){
  if(document.querySelector('#lm-cover-controls')){apply();return}
  if(!document.querySelector('.cover #open-journal'))return;
  const panel=document.createElement('div');
  panel.id='lm-cover-controls';
  panel.innerHTML=`<div class="lm-ctl-head"><b>Journal Button</b><span id="lm-cover-readout"></span></div><div class="lm-ctl-row"><button data-a="smaller">− Size</button><button data-a="larger">+ Size</button><button data-a="left">←</button><button data-a="up">↑</button><button data-a="down">↓</button><button data-a="right">→</button><button data-a="reset">Reset</button></div>`;
  document.body.appendChild(panel);
  panel.addEventListener('click',e=>{
    const a=e.target.closest('button')?.dataset.a;if(!a)return;
    if(a==='smaller')state.scale=clamp(state.scale-5,50,180);
    if(a==='larger')state.scale=clamp(state.scale+5,50,180);
    if(a==='left')state.x=clamp(state.x-4,-100,100);
    if(a==='right')state.x=clamp(state.x+4,-100,100);
    if(a==='up')state.y=clamp(state.y-4,-100,100);
    if(a==='down')state.y=clamp(state.y+4,-100,100);
    if(a==='reset')state={...defaults};
    apply();
  });
  apply();
}
function sync(){
  if(document.querySelector('.cover #open-journal'))showPanel();else removePanel();
}
window.addEventListener('load',()=>{sync();setInterval(sync,500)});
