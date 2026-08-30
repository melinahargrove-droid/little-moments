const app=document.querySelector('#app');
let observer=null;
function optimize(){
  const screen=app.querySelector('.print-preview-screen');
  if(!screen||screen.dataset.previewPerf==='1')return;
  screen.dataset.previewPerf='1';
  const pages=[...screen.querySelectorAll('.print-page')];
  pages.forEach((page,i)=>{
    page.style.contentVisibility='auto';
    page.style.containIntrinsicSize='8.5in 11in';
    page.querySelectorAll('img').forEach(img=>{
      img.decoding='async';
      if(i>1)img.loading='lazy';
    });
  });
  if('IntersectionObserver'in window){
    observer?.disconnect();
    observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        entry.target.querySelectorAll('img[loading="lazy"]').forEach(img=>img.loading='eager');
      });
    },{rootMargin:'900px 0px'});
    pages.forEach(p=>observer.observe(p));
  }
  const print=screen.querySelector('#print-now');
  if(print&&!print.dataset.perfPrint){
    print.dataset.perfPrint='1';
    print.addEventListener('click',()=>{
      pages.forEach(page=>{page.style.contentVisibility='visible';page.querySelectorAll('img').forEach(img=>img.loading='eager')});
    },true);
  }
}
new MutationObserver(optimize).observe(app,{childList:true,subtree:true});
optimize();