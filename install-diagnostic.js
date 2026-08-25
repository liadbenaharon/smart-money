(()=>{
let deferredPrompt=null;
let fired=false;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;fired=true;update('✅ Chrome מאפשר התקנה','אפשר להתקין את ה-PWA. לחץ על הכפתור למטה כדי לפתוח את חלון ההתקנה.','install');});
window.addEventListener('appinstalled',()=>update('✅ האפליקציה הותקנה','Chrome דיווח שההתקנה הושלמה.','installed'));
function isStandalone(){return window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true}
async function swStatus(){if(!('serviceWorker' in navigator))return 'Service Worker לא נתמך';try{const r=await navigator.serviceWorker.getRegistration('/smart-money/');return r?'Service Worker רשום':'Service Worker לא רשום'}catch{return 'לא ניתן לבדוק Service Worker'}}
async function update(title,text,state='waiting'){
 const box=document.getElementById('installDiagnostic');if(!box)return;
 const sw=await swStatus();
 const standalone=isStandalone();
 box.innerHTML=`<div><strong>${title}</strong><span>${text}</span><small>${sw} · מצב standalone: ${standalone?'כן':'לא'} · beforeinstallprompt: ${fired?'התקבל':'לא התקבל'}</small></div><button id="diagInstallBtn" class="small-btn" type="button">${state==='install'?'התקן עכשיו':'בדוק שוב'}</button>`;
 const b=document.getElementById('diagInstallBtn');
 b.onclick=async()=>{if(deferredPrompt){deferredPrompt.prompt();const choice=await deferredPrompt.userChoice;deferredPrompt=null;update(choice.outcome==='accepted'?'✅ ההתקנה אושרה':'ההתקנה בוטלה',`Chrome החזיר: ${choice.outcome}`);}else runCheck()};
}
async function runCheck(){
 if(isStandalone()){update('📱 פתוח כאפליקציה מותקנת','הדף הנוכחי רץ במצב standalone.');return}
 const sw=await swStatus();
 if(sw.includes('לא רשום')){update('❌ Service Worker לא רשום','זו סיבה ישירה לכך ש-Chrome לא יציע התקנת PWA.');return}
 update('⏳ ממתין לאישור Chrome','אם beforeinstallprompt לא מתקבל אחרי כמה שניות, Chrome לא מחשיב כרגע את האתר כניתן להתקנה.');
 setTimeout(()=>{if(!fired&&!isStandalone())update('❌ Chrome לא שלח אירוע התקנה','ה-manifest/Service Worker קיימים, אבל Chrome לא מחזיר beforeinstallprompt כרגע.');},3500);
}
document.addEventListener('DOMContentLoaded',()=>setTimeout(runCheck,250));
})();