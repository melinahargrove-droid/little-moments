const load=()=>Promise.all([
  import('./portfolio-view.js?v=233'),
  import('./portfolio-print.js?v=233'),
  import('./portfolio-preview-performance.js?v=233'),
  import('./make-it-yours-modular.js?v=233'),
  import('./make-it-yours-page-a.js?v=233'),
  import('./make-it-yours-page-b.js?v=233'),
  import('./make-it-yours-page-c.js?v=233'),
  import('./make-it-yours-page-d.js?v=233')
]).catch(e=>console.error('Portfolio modules could not finish loading',e));
if('requestIdleCallback' in window)requestIdleCallback(load,{timeout:700});else setTimeout(load,250);