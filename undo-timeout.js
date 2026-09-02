(()=>{
const KEY='smartMoneyDeletedExpensesV1';
const TTL=10000;
let timer=null;
const getItems=()=>{try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x:[]}catch{return[]}};
const setItems=items=>{if(items.length)localStorage.setItem(KEY,JSON.stringify(items));else localStorage.removeItem(KEY)};
function purgeExpired(){const now=Date.now();const fresh=getItems().filter(x=>Number(x.deletedAt)&&now-Number(x.deletedAt)<TTL);setItems(fresh);return fresh}
function removeBar(){const bar=document.getElementById('deleteUndoBar');if(bar)bar.remove();if(timer){clearTimeout(timer);timer=null}}
function scheduleExpiry(item){if(timer)clearTimeout(timer);const left=Math.max(0,TTL-(Date.now()-Number(item.deletedAt||0)));timer=setTimeout(()=>{const items=purgeExpired();removeBar();if(items.length)showUndoBar()},left+25)}
showUndoBar=function(){const items=purgeExpired();let bar=document.getElementById('deleteUndoBar');if(!items.length){removeBar();return}const latest=items[0];if(!bar){bar=document.createElement('div');bar.id='deleteUndoBar';bar.style.cssText='position:fixed;left:12px;right:12px;bottom:18px;z-index:9999;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 14px;border-radius:14px;background:#111827;color:white;box-shadow:0 8px 28px rgba(0,0,0,.28);font:inherit';document.body.appendChild(bar)}bar.innerHTML=`<span>נמחק: <strong>${escapeHtml(latest.name||'הוצאה')}</strong> · ניתן לשחזר ל-10 שניות</span><button type="button" id="restoreDeletedBtn" style="border:0;border-radius:10px;padding:8px 12px;font:inherit;font-weight:700;cursor:pointer">שחזר</button>`;document.getElementById('restoreDeletedBtn').addEventListener('click',()=>{const current=purgeExpired();const item=current.shift();if(!item){removeBar();return}const restored={...item};delete restored.deletedAt;if(!state.expenses.some(e=>String(e.id)===String(restored.id)))state.expenses.push(restored);setItems(current);save();render();showUndoBar()});scheduleExpiry(latest)};
const oldRemember=rememberDeleted;
rememberDeleted=function(expense){purgeExpired();oldRemember(expense);const items=getItems();if(items[0])items[0].deletedAt=Date.now();setItems(items.slice(0,1))};
window.addEventListener('load',showUndoBar);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')showUndoBar()});
})();