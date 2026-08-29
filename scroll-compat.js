(()=>{
  const nativeScrollTo=window.scrollTo.bind(window);
  window.scrollTo=function(arg1,arg2){
    if(arg1&&typeof arg1==='object'){
      const opts={...arg1};
      if(opts.behavior==='instant') opts.behavior='auto';
      try{return nativeScrollTo(opts);}catch{return nativeScrollTo(opts.left||0,opts.top||0);}
    }
    return nativeScrollTo(arg1,arg2);
  };
})();
