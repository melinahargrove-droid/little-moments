const LM_VERSION='0.19';
function ensureVersionBadge(){
  const home=document.querySelector('.screen .capture-card');
  let badge=document.querySelector('.lm-version-badge');
  if(!home){badge?.remove();return;}
  if(!badge){badge=document.createElement('div');badge.className='lm-version-badge';document.body.appendChild(badge);}
  badge.textContent=`LM v${LM_VERSION}`;
}
new MutationObserver(ensureVersionBadge).observe(document.getElementById('app'),{childList:true,subtree:true});
ensureVersionBadge();
