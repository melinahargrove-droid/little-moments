const DB_NAME = 'little-moments';
const DB_VERSION = 1;
const AUDIT_KEY='lm-db-destructive-audit-v1';
const DB_OPEN_TIMEOUT=8000;
let cachedDB=null;
let openingPromise=null;

export const STORES = {
  students: 'students',
  schoolYears: 'schoolYears',
  enrollments: 'enrollments',
  moments: 'moments',
  photos: 'photos',
  books: 'books',
  settings: 'settings'
};

function bb(type,detail={}){try{window.__lmBlackBoxLog?.(type,detail)}catch{}}
function audit(entry){try{const old=JSON.parse(localStorage.getItem(AUDIT_KEY)||'[]');old.unshift({...entry,at:new Date().toISOString(),stack:(new Error()).stack||''});localStorage.setItem(AUDIT_KEY,JSON.stringify(old.slice(0,20)))}catch{}}
function emitChange(detail={}){try{window.dispatchEvent(new CustomEvent('lm:data-changed',{detail:{...detail,at:new Date().toISOString()}}))}catch{}}
function classroomCount(c={}){return Number(c.students||0)+Number(c.moments||0)+Number(c.photos||0)+Number(c.enrollments||0)}
function rowsCounts(rows={}){return{students:Array.isArray(rows.students)?rows.students.length:0,moments:Array.isArray(rows.moments)?rows.moments.length:0,photos:Array.isArray(rows.photos)?rows.photos.length:0,enrollments:Array.isArray(rows.enrollments)?rows.enrollments.length:0,years:Array.isArray(rows.schoolYears)?rows.schoolYears.length:0}}
async function liveCounts(){const [students,moments,photos,enrollments,years]=await Promise.all([getAll(STORES.students),getAll(STORES.moments),getAll(STORES.photos),getAll(STORES.enrollments),getAll(STORES.schoolYears)]);return{students:students.length,moments:moments.length,photos:photos.length,enrollments:enrollments.length,years:years.length}}
function dropCachedDB(reason='unknown'){const db=cachedDB;cachedDB=null;openingPromise=null;try{db?.close()}catch{}bb('DB_CONNECTION_RESET',{reason})}
function txError(tx,fallback='Database transaction failed.'){return tx?.error||new Error(fallback)}

export function openDB(){
  if(cachedDB)return Promise.resolve(cachedDB);
  if(openingPromise)return openingPromise;
  openingPromise=new Promise((resolve,reject)=>{
    let settled=false;
    const request=indexedDB.open(DB_NAME,DB_VERSION);
    const timer=setTimeout(()=>{
      if(settled)return;settled=true;openingPromise=null;
      try{request.result?.close?.()}catch{}
      bb('DB_OPEN_TIMEOUT',{version:DB_VERSION,timeoutMs:DB_OPEN_TIMEOUT});
      reject(new Error('Little Moments storage is taking too long to open. Please close and reopen the app.'));
    },DB_OPEN_TIMEOUT);
    const fail=(err)=>{if(settled)return;settled=true;clearTimeout(timer);openingPromise=null;reject(err)};
    request.onupgradeneeded=e=>{
      const db=request.result;
      bb('DB_UPGRADE_NEEDED',{oldVersion:e.oldVersion,newVersion:e.newVersion,storesBefore:[...db.objectStoreNames]});
      if(!db.objectStoreNames.contains(STORES.students)){const s=db.createObjectStore(STORES.students,{keyPath:'id'});s.createIndex('name','name',{unique:false})}
      if(!db.objectStoreNames.contains(STORES.schoolYears)){const y=db.createObjectStore(STORES.schoolYears,{keyPath:'id'});y.createIndex('isCurrent','isCurrent',{unique:false})}
      if(!db.objectStoreNames.contains(STORES.enrollments)){const eStore=db.createObjectStore(STORES.enrollments,{keyPath:'id'});eStore.createIndex('studentId','studentId',{unique:false});eStore.createIndex('schoolYearId','schoolYearId',{unique:false})}
      if(!db.objectStoreNames.contains(STORES.photos))db.createObjectStore(STORES.photos,{keyPath:'id'});
      if(!db.objectStoreNames.contains(STORES.moments)){const m=db.createObjectStore(STORES.moments,{keyPath:'id'});m.createIndex('schoolYearId','schoolYearId',{unique:false});m.createIndex('date','date',{unique:false});m.createIndex('favorite','favorite',{unique:false})}
      if(!db.objectStoreNames.contains(STORES.books))db.createObjectStore(STORES.books,{keyPath:'id'});
      if(!db.objectStoreNames.contains(STORES.settings))db.createObjectStore(STORES.settings,{keyPath:'key'});
      bb('DB_SCHEMA_CREATED',{storesAfter:[...db.objectStoreNames]});
    };
    request.onblocked=()=>bb('DB_OPEN_BLOCKED',{version:DB_VERSION});
    request.onsuccess=()=>{
      if(settled){try{request.result.close()}catch{};return}
      settled=true;clearTimeout(timer);
      const db=request.result;cachedDB=db;openingPromise=null;
      db.onversionchange=e=>{bb('DB_VERSION_CHANGE',{oldVersion:e.oldVersion,newVersion:e.newVersion});dropCachedDB('versionchange')};
      db.onclose=()=>{bb('DB_CLOSED',{});if(cachedDB===db){cachedDB=null;openingPromise=null}};
      resolve(db);
    };
    request.onerror=()=>{bb('DB_OPEN_ERROR',{name:request.error?.name,message:request.error?.message});fail(request.error||new Error('Little Moments storage could not open.'))};
  });
  return openingPromise;
}

export async function put(store,value){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    let tx,settled=false;
    try{tx=db.transaction(store,'readwrite');const req=tx.objectStore(store).put(value);req.onerror=()=>bb('DB_WRITE_REQUEST_ERROR',{operation:'put',store,error:String(req.error||'')})}catch(e){dropCachedDB('put-transaction-failed');reject(e);return}
    tx.oncomplete=()=>{if(settled)return;settled=true;bb('DB_WRITE',{operation:'put',store,key:value?.id??value?.key??null});emitChange({operation:'put',store,key:value?.id??value?.key??null});resolve(value)};
    tx.onabort=()=>{if(settled)return;settled=true;const err=txError(tx,'Database write was aborted.');bb('DB_WRITE_ABORT',{operation:'put',store,error:String(err)});dropCachedDB('put-aborted');reject(err)};
    tx.onerror=()=>bb('DB_WRITE_ERROR',{operation:'put',store,error:String(tx.error||'')});
  })
}

export async function remove(store,key){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    let tx,settled=false;
    try{tx=db.transaction(store,'readwrite');const req=tx.objectStore(store).delete(key);req.onerror=()=>bb('DB_WRITE_REQUEST_ERROR',{operation:'remove',store,error:String(req.error||'')})}catch(e){dropCachedDB('remove-transaction-failed');reject(e);return}
    tx.oncomplete=()=>{if(settled)return;settled=true;bb('DB_WRITE',{operation:'remove',store,key});emitChange({operation:'remove',store,key});resolve(key)};
    tx.onabort=()=>{if(settled)return;settled=true;const err=txError(tx,'Database delete was aborted.');bb('DB_WRITE_ABORT',{operation:'remove',store,key,error:String(err)});dropCachedDB('remove-aborted');reject(err)};
    tx.onerror=()=>bb('DB_WRITE_ERROR',{operation:'remove',store,key,error:String(tx.error||'')});
  })
}

export async function clearStore(store){
  const before=await liveCounts().catch(()=>null);audit({operation:'clearStore',store,before});bb('DB_DESTRUCTIVE_ATTEMPT',{operation:'clearStore',store,before});const db=await openDB();
  return new Promise((resolve,reject)=>{let tx,settled=false;try{tx=db.transaction(store,'readwrite');tx.objectStore(store).clear()}catch(e){dropCachedDB('clear-transaction-failed');reject(e);return}tx.oncomplete=()=>{if(settled)return;settled=true;bb('DB_DESTRUCTIVE_COMPLETE',{operation:'clearStore',store});emitChange({operation:'clearStore',store});resolve()};tx.onabort=()=>{if(settled)return;settled=true;const err=txError(tx,'Database clear was aborted.');bb('DB_DESTRUCTIVE_ABORT',{operation:'clearStore',store,error:String(err)});dropCachedDB('clear-aborted');reject(err)};tx.onerror=()=>bb('DB_DESTRUCTIVE_ERROR',{operation:'clearStore',store,error:String(tx.error||'')})})
}

export async function replaceAllStoresAtomic(rowsByStore,meta={}){
  const before=await liveCounts().catch(()=>({}));
  const incoming=rowsCounts(rowsByStore);
  const reason=String(meta?.reason||'unspecified');
  audit({operation:'replaceAllStoresAtomic-attempt',reason,before,incoming});
  bb('DB_DESTRUCTIVE_ATTEMPT',{operation:'replaceAllStoresAtomic',reason,before,incoming});
  if(classroomCount(before)>0&&classroomCount(incoming)===0){audit({operation:'replaceAllStoresAtomic-BLOCKED',reason,before,incoming});bb('DB_DESTRUCTIVE_BLOCKED',{operation:'replaceAllStoresAtomic',reason,before,incoming});throw new Error('Little Moments blocked an empty database replacement to protect your classroom data.')}
  const db=await openDB(),storeNames=Object.values(STORES);
  return new Promise((resolve,reject)=>{let settled=false,tx;try{tx=db.transaction(storeNames,'readwrite');for(const name of storeNames){const store=tx.objectStore(name);store.clear();const rows=Array.isArray(rowsByStore?.[name])?rowsByStore[name]:[];for(const row of rows)store.put(row)}}catch(err){try{tx?.abort()}catch{}dropCachedDB('atomic-restore-transaction-failed');bb('DB_DESTRUCTIVE_ERROR',{operation:'replaceAllStoresAtomic',reason,error:String(err)});reject(err);return}tx.oncomplete=()=>{if(settled)return;settled=true;audit({operation:'replaceAllStoresAtomic-complete',reason,before,incoming});bb('DB_DESTRUCTIVE_COMPLETE',{operation:'replaceAllStoresAtomic',reason,before,incoming});emitChange({operation:'atomic-restore',reason,counts:incoming});resolve()};tx.onabort=()=>{if(settled)return;settled=true;const err=txError(tx,'Restore transaction was aborted.');audit({operation:'replaceAllStoresAtomic-abort',reason,before,incoming});bb('DB_DESTRUCTIVE_ABORT',{operation:'replaceAllStoresAtomic',reason,before,incoming,error:String(err)});dropCachedDB('atomic-restore-aborted');reject(err)};tx.onerror=()=>bb('DB_DESTRUCTIVE_ERROR',{operation:'replaceAllStoresAtomic',reason,error:String(tx.error||'')})})
}

export async function getAll(store){const db=await openDB();return new Promise((resolve,reject)=>{let tx,settled=false;try{tx=db.transaction(store,'readonly')}catch(e){dropCachedDB('read-transaction-failed');reject(e);return}const req=tx.objectStore(store).getAll();req.onsuccess=()=>{if(settled)return;settled=true;resolve(req.result)};req.onerror=()=>{if(settled)return;settled=true;bb('DB_READ_ERROR',{store,error:String(req.error||'')});reject(req.error)};tx.onabort=()=>{if(settled)return;settled=true;const err=txError(tx,'Database read was aborted.');bb('DB_READ_ABORT',{store,error:String(err)});dropCachedDB('read-aborted');reject(err)}})}
export async function get(store,key){const db=await openDB();return new Promise((resolve,reject)=>{let tx,settled=false;try{tx=db.transaction(store,'readonly')}catch(e){dropCachedDB('get-transaction-failed');reject(e);return}const req=tx.objectStore(store).get(key);req.onsuccess=()=>{if(settled)return;settled=true;resolve(req.result)};req.onerror=()=>{if(settled)return;settled=true;bb('DB_READ_ERROR',{store,key,error:String(req.error||'')});reject(req.error)};tx.onabort=()=>{if(settled)return;settled=true;const err=txError(tx,'Database read was aborted.');bb('DB_READ_ABORT',{store,key,error:String(err)});dropCachedDB('get-aborted');reject(err)}})}

export async function ensureInitialSchoolYear(){const years=await getAll(STORES.schoolYears);if(years.some(y=>y.isCurrent))return years.find(y=>y.isCurrent);const now=new Date(),startMonth=7,startYear=now.getMonth()>=startMonth?now.getFullYear():now.getFullYear()-1;const year={id:`${startYear}-${startYear+1}`,label:`${startYear}–${startYear+1}`,isCurrent:true,archived:false,createdAt:new Date().toISOString()};bb('INITIAL_YEAR_CREATE',{existingYears:years.length,id:year.id});await put(STORES.schoolYears,year);return year}

window.__lmReadDbAudit=()=>{try{return JSON.parse(localStorage.getItem(AUDIT_KEY)||'[]')}catch{return[]}};
window.__lmResetDbConnection=()=>dropCachedDB('manual-reset');