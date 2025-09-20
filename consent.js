(function(){
  const KEY = 'consent.choice.v1';
  if (localStorage.getItem(KEY)) return;

  const bar = document.createElement('div');
  bar.id = 'cookie-consent-bar';
  bar.style.cssText = 'position:fixed;z-index:9999;left:0;right:0;bottom:0;background:#0f172a;color:#fff;padding:12px 16px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center;';
  bar.innerHTML = `
    <span style="opacity:.9">We use cookies to improve your experience and serve ads. See our <a href="privacy.html" style="color:#93c5fd">Privacy Policy</a>.</span>
    <div style="display:flex;gap:8px;">
      <button id="consent-accept" style="background:#22c55e;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;">Accept</button>
      <button id="consent-decline" style="background:#64748b;color:#fff;border:none;padding:8px 12px;border-radius:6px;cursor:pointer;">Decline</button>
    </div>`;

  document.body.appendChild(bar);

  const save = (v)=>{ localStorage.setItem(KEY, v); bar.remove(); };
  document.getElementById('consent-accept').onclick = ()=> save('accepted');
  document.getElementById('consent-decline').onclick = ()=> save('declined');
})();
