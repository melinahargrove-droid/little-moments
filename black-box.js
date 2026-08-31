(()=>{
  const KEY='lm-black-box-v1';
  const SESSION_KEY='lm-black-box-session-v1';
  const MAX=180;
  const session=(sessionStorage.getItem(SESSION_KEY)||`${Date.now()}-${Math.random().toString(36).slice(2,8)}`);
  try{sessionStorage.setItem(SESSION_KEY,session)}catch{}
  function safe(v){
    if(v==null)return v;
    if(v instanceof Error)return{name:v.name,message:v.message,stack:String(v.stack||'').slice(0,1200)};
    try{return JSON.parse(JSON.stringify(v,(k,x)=>x instanceof Error?{name:x.name,message:x.message,stack:String(x.stack||'').slice(0,1200)}:x))}catch{return String(v)}
  }
  function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}}
  function log(type,detail={}){
    try{
      const rows=read();
      rows.push({at:new Date().toISOString(),session,type,detail:safe(detail)});
      localStorage.setItem(KEY,JSON.stringify(rows.slice(-MAX)));
    }catch{}
  }
  window.__lmBlackBoxLog=log;
  window.__lmReadBlackBox=()=>read();
  window.__lmClearBlackBox=()=>{try{localStorage.removeItem(KEY)}catch{}};

  const nav=performance.getEntriesByType?.('navigation')?.[0];
  log('APP_START',{href:location.href,visibility:document.visibilityState,navType:nav?.type||'unknown',referrer:document.referrer||'',userAgent:navigator.userAgent});
  addEventListener('error',e=>log('JS_ERROR',{message:e.message,filename:e.filename,line:e.lineno,col:e.colno,error:safe(e.error)}));
  addEventListener('unhandledrejection',e=>log('UNHANDLED_REJECTION',{reason:safe(e.reason)}));
  addEventListener('pagehide',e=>log('PAGE_HIDE',{persisted:!!e.persisted,visibility:document.visibilityState}));
  addEventListener('pageshow',e=>log('PAGE_SHOW',{persisted:!!e.persisted,visibility:document.visibilityState}));
  addEventListener('beforeunload',()=>log('BEFORE_UNLOAD',{visibility:document.visibilityState}));
  document.addEventListener('visibilitychange',()=>log('VISIBILITY',{state:document.visibilityState}));
  document.addEventListener('freeze',()=>log('FREEZE',{}));
  document.addEventListener('resume',()=>log('RESUME',{}));

  setTimeout(async()=>{
    const d={};
    try{if(indexedDB.databases)d.databases=(await indexedDB.databases()).map(x=>({name:x.name,version:x.version}))}catch(e){d.databasesError=String(e)}
    try{if(navigator.storage?.persisted)d.persisted=await navigator.storage.persisted()}catch{}
    try{if(navigator.storage?.estimate){const q=await navigator.storage.estimate();d.usage=q.usage||0;d.quota=q.quota||0}}catch{}
    log('STARTUP_STORAGE',d);
  },1200);
})();
