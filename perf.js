// Consolidated lightweight performance helpers
// Defer non-critical JS work until idle or after first paint

(function(){
  // Utility: run a callback when browser is idle (fallback to timeout)
  window.runIdle = function(cb){
    if('requestIdleCallback' in window){
      requestIdleCallback(cb, {timeout:1500});
    } else {
      setTimeout(cb, 200);
    }
  };

  // Defer footer collapsible setup if present
  runIdle(function(){
    const footer = document.querySelector('.site-footer');
    if(!footer) return;
    const sections = footer.querySelectorAll('[data-footer-collapse]');
    const mq = window.matchMedia('(max-width:700px)');
    function apply(){
      sections.forEach(sec=>{
        const heading = sec.querySelector('h4');
        const list = sec.querySelector('ul,div');
        if(!heading || !list) return;
        if(mq.matches){
          heading.setAttribute('tabindex','0');
          heading.classList.add('collapsible');
          if(!heading.dataset.bound){
            heading.addEventListener('click', toggle);
            heading.addEventListener('keydown', e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggle.call(heading);}});
            heading.dataset.bound='1';
          }
          if(!heading.classList.contains('open')){
            list.style.maxHeight='0px';
            list.style.overflow='hidden';
            list.style.transition='max-height .35s ease';
          }
        } else {
          heading.removeAttribute('tabindex');
          heading.classList.remove('collapsible');
          list.style.maxHeight='';
          list.style.overflow='';
          list.style.transition='';
        }
      });
    }
    function toggle(){
      const list = this.nextElementSibling;
      const open = this.classList.toggle('open');
      if(open){
        list.style.maxHeight= list.scrollHeight + 'px';
      } else {
        list.style.maxHeight='0px';
      }
    }
    mq.addEventListener('change', apply);
    apply();
  });

  // Lazy add a class after first paint for transitions
  window.requestAnimationFrame(()=>document.documentElement.classList.add('post-paint'));
})();
