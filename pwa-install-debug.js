(()=>{
let deferredPrompt=null;
let beforeInstallFired=false;
const $=id=>document.getElementById(id);
function setLine(id,ok,text){const el=$(id);if(!el)return;el.textContent=`${ok?'✅':'❌'} ${text}`;el.style.color=ok?'#22c55e':'#ef4444'}
function setInfo(id,text){const el=$(id);if(el)el.textContent=text}
async function check(){
 const box=$('pwaInstallDebug');if(!box)return;
 setInfo('pwaDiagStatus','בודק…');
 let manifestOk=false,iconsOk=false,swRegistered=false,swControlled=!!navigator.serviceWorker?.controller;
 try{
  const r=await fetch('./manifest.json?diag='+Date.now(),{cache:'no-store'});
  const m=await r.json();
  manifestOk=r.ok&&m.name&&m.start_url&&m.display&&Array.isArray(m.icons)&&m.icons.length>=2;
  setLine('pwaDiagManifest',manifestOk,manifestOk?`Manifest תקין · id: ${m.id||'ללא'}`:'Manifest לא תקין');
  const required=['192x192','512x512'];
  iconsOk=required.every(size=>m.icons.some(i=>String(i.sizes).split(/\s+/).includes(size)));
  if(iconsOk){
   const checks=await Promise.all(m.icons.filter(i=>required.some(s=>String(i.sizes).includes(s))).map(async i=>{try{const x=await fetch(new URL(i.src,location.href),{cache:'no-store'});return x.ok}catch{return false}}));
   iconsOk=checks.every(Boolean);
  }
  setLine('pwaDiagIcons',iconsOk,iconsOk?'אייקונים 192 ו־512 נטענים':'בעיה באחד האייקונים');
 }catch(e){setLine('pwaDiagManifest',false,'לא ניתן לקרוא manifest');setLine('pwaDiagIcons',false,'לא ניתן לבדוק אייקונים')}
 try{
  if('serviceWorker' in navigator){const regs=await navigator.serviceWorker.getRegistrations();swRegistered=regs.some(r=>r.scope.includes('/smart-money/'));}
  setLine('pwaDiagSW',swRegistered,swRegistered?`Service Worker רשום${swControlled?' ושולט בדף':' אבל עדיין לא שולט בדף'}`:'Service Worker לא רשום');
 }catch{setLine('pwaDiagSW',false,'שגיאה בבדיקת Service Worker')}
 setLine('pwaDiagPrompt',beforeInstallFired,beforeInstallFired?'Chrome שלח אירוע התקנה':'Chrome עדיין לא שלח beforeinstallprompt');
 const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
 setLine('pwaDiagStandalone',standalone,standalone?'האפליקציה כבר פתוחה כ־standalone':'הדף פתוח בתוך Chrome');
 const btn=$('pwaDiagInstallBtn');
 if(btn){btn.disabled=!deferredPrompt;btn.textContent=deferredPrompt?'התקן עכשיו':'אין עדיין אפשרות התקנה'}
 setInfo('pwaDiagStatus',manifestOk&&iconsOk&&swRegistered?'הבסיס של ה־PWA תקין. אם Chrome עדיין לא מציע התקנה, צילום המסך של הבדיקות האלו יראה בדיוק מה חסר.':'נמצאה בעיה באחד מתנאי ה־PWA.');
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;beforeInstallFired=true;check()});
window.addEventListener('appinstalled',()=>{deferredPrompt=null;check()});
document.addEventListener('click',async e=>{if(e.target?.id==='pwaDiagInstallBtn'&&deferredPrompt){await deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;check()}if(e.target?.id==='pwaDiagRefreshBtn')check()});
document.addEventListener('DOMContentLoaded',()=>setTimeout(check,500));
window.addEventListener('load',()=>setTimeout(check,1500));
})();