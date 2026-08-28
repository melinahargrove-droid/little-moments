const DB_NAME = 'little-moments';
const DB_VERSION = 1;

export const STORES = {
  students: 'students',
  schoolYears: 'schoolYears',
  enrollments: 'enrollments',
  moments: 'moments',
  photos: 'photos',
  books: 'books',
  settings: 'settings'
};

export function openDB(){
  return new Promise((resolve,reject)=>{
    const request=indexedDB.open(DB_NAME,DB_VERSION);
    request.onupgradeneeded=()=>{
      const db=request.result;
      if(!db.objectStoreNames.contains(STORES.students)){
        const s=db.createObjectStore(STORES.students,{keyPath:'id'});
        s.createIndex('name','name',{unique:false});
      }
      if(!db.objectStoreNames.contains(STORES.schoolYears)){
        const y=db.createObjectStore(STORES.schoolYears,{keyPath:'id'});
        y.createIndex('isCurrent','isCurrent',{unique:false});
      }
      if(!db.objectStoreNames.contains(STORES.enrollments)){
        const e=db.createObjectStore(STORES.enrollments,{keyPath:'id'});
        e.createIndex('studentId','studentId',{unique:false});
        e.createIndex('schoolYearId','schoolYearId',{unique:false});
      }
      if(!db.objectStoreNames.contains(STORES.photos)) db.createObjectStore(STORES.photos,{keyPath:'id'});
      if(!db.objectStoreNames.contains(STORES.moments)){
        const m=db.createObjectStore(STORES.moments,{keyPath:'id'});
        m.createIndex('schoolYearId','schoolYearId',{unique:false});
        m.createIndex('date','date',{unique:false});
        m.createIndex('favorite','favorite',{unique:false});
      }
      if(!db.objectStoreNames.contains(STORES.books)) db.createObjectStore(STORES.books,{keyPath:'id'});
      if(!db.objectStoreNames.contains(STORES.settings)) db.createObjectStore(STORES.settings,{keyPath:'key'});
    };
    request.onsuccess=()=>resolve(request.result);
    request.onerror=()=>reject(request.error);
  });
}

export async function put(store,value){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readwrite');
    tx.objectStore(store).put(value);
    tx.oncomplete=()=>resolve(value);
    tx.onerror=()=>reject(tx.error);
  });
}

export async function getAll(store){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readonly');
    const req=tx.objectStore(store).getAll();
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}

export async function get(store,key){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(store,'readonly');
    const req=tx.objectStore(store).get(key);
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error);
  });
}

export async function ensureInitialSchoolYear(){
  const years=await getAll(STORES.schoolYears);
  if(years.some(y=>y.isCurrent)) return years.find(y=>y.isCurrent);
  const now=new Date();
  const startMonth=7; // August = 7
  const startYear=now.getMonth()>=startMonth?now.getFullYear():now.getFullYear()-1;
  const year={id:`${startYear}-${startYear+1}`,label:`${startYear}–${startYear+1}`,isCurrent:true,archived:false,createdAt:new Date().toISOString()};
  await put(STORES.schoolYears,year);
  return year;
}
