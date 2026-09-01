(()=>{
const SHIFT_KEY='ilShiftTrackerData_v1';
const ACTUAL_KEY='smartMoneyActualSalaryReceivedV1';
const PAYDAY_KEY='smartMoneySalaryPayDayV1';
const SOURCE_MONTH_KEY='smartMoneySalarySourceMonthV1';
const EXPECTED_OVERRIDE_KEY='smartMoneyExpectedSalaryOverrideV1';
const NI_THRESHOLD=7703,NI_CEILING=51910,NI_RATE_LOW=0.0427,NI_RATE_HIGH=0.1217;
const round=v=>Math.round((Number(v)||0)*100)/100;
const money=v=>new Intl.NumberFormat('he-IL',{style:'currency',currency:'ILS',maximumFractionDigits:2}).format(Number(v)||0);
const monthLabel=key=>{if(!/^\d{4}-\d{2}$/.test(String(key||'')))return String(key||'');const [y,m]=key.split('-').map(Number);return new Intl.DateTimeFormat('he-IL',{month:'long',year:'numeric'}).format(new Date(y,m-1,1))};
function monthKey(ms=Date.now()){const d=new Date(ms);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function previousMonthKey(){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-1);return monthKey(d.getTime())}
function nextMonthKey(key){const [y,m]=String(key).split('-').map(Number);return monthKey(new Date(y,m,1).getTime())}
function deduction(grossWork){const low=Math.min(grossWork,NI_THRESHOLD),high=Math.max(0,Math.min(grossWork,NI_CEILING)-NI_THRESHOLD);return low*NI_RATE_LOW+high*NI_RATE_HIGH}
function getPayDay(){const n=Number(localStorage.getItem(PAYDAY_KEY));return Number.isInteger(n)&&n>=1&&n<=31?n:null}
function setPayDay(v){const n=Number(v);if(Number.isInteger(n)&&n>=1&&n<=31)localStorage.setItem(PAYDAY_KEY,String(n));else localStorage.removeItem(PAYDAY_KEY)}
function defaultWorkMonth(){const day=getPayDay(),today=new Date().getDate();return day&&today<day?previousMonthKey():monthKey()}
function validMonth(v){return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(v||''))}
function getSourceMonth(defaultMonth){const saved=localStorage.getItem(SOURCE_MONTH_KEY);return validMonth(saved)?saved:defaultMonth}
function setSourceMonth(v){if(validMonth(v))localStorage.setItem(SOURCE_MONTH_KEY,v);else localStorage.removeItem(SOURCE_MONTH_KEY)}
function getExpectedOverride(sourceMonth){try{const data=JSON.parse(localStorage.getItem(EXPECTED_OVERRIDE_KEY)||'null');if(!data||data.month!==sourceMonth)return null;const amount=Number(data.amount);return Number.isFinite(amount)&&amount>=0?round(amount):null}catch{return null}}
function setExpectedOverride(amount,sourceMonth){if(amount==null){localStorage.removeItem(EXPECTED_OVERRIDE_KEY);return}localStorage.setItem(EXPECTED_OVERRIDE_KEY,JSON.stringify({month:sourceMonth,amount:round(amount),savedAt:new Date().toISOString()}))}
function getShiftSalary(targetMonth){try{const raw=localStorage.getItem(SHIFT_KEY);if(!raw)return null;const s=JSON.parse(raw);const shifts=Array.isArray(s.shifts)?s.shifts:[];const month=shifts.filter(x=>monthKey(Number(x.start))===targetMonth);if(!month.length)return null;const totalWork=month.reduce((a,x)=>a+(Number(x.pay)||0),0);const travel=month.reduce((a,x)=>a+(Number(x.travel)||0),0);const expenses=month.reduce((a,x)=>a+(Number(x.expenses)||0),0);const net=round(totalWork-deduction(totalWork)+travel-expenses);return{net,count:month.length,month:targetMonth}}catch(e){console.warn('Shift Clock sync failed',e);return null}}
function getActual(sourceMonth){try{const raw=localStorage.getItem(ACTUAL_KEY);if(!raw)return null;const data=JSON.parse(raw);if(data.periodMonth!==sourceMonth)return null;const amount=Number(data.amount);return Number.isFinite(amount)&&amount>=0?round(amount):null}catch{return null}}
function setActual(amount,sourceMonth){if(amount==null){localStorage.removeItem(ACTUAL_KEY);return}localStorage.setItem(ACTUAL_KEY,JSON.stringify({periodMonth:sourceMonth,amount:round(amount),savedAt:new Date().toISOString()}))}
function applyEffective(value){const salary=document.getElementById('salary');if(!salary)return;const next=String(round(value||0));if(salary.value!==next){salary.value=next;salary.dispatchEvent(new Event('input',{bubbles:true}));salary.dispatchEvent(new Event('change',{bubbles:true}))}}
function isCurrentSalaryCycle(sourceMonth){const payMonth=nextMonthKey(sourceMonth),now=monthKey(),day=getPayDay(),today=new Date().getDate();return payMonth===now&&day&&today>=day}
function sync(){
const expectedInput=document.getElementById('expectedSalary'),sourceInput=document.getElementById('salarySourceMonth'),payMonthText=document.getElementById('salaryPayMonthText'),actualInput=document.getElementById('actualSalaryReceived'),payDayInput=document.getElementById('salaryPayDay'),syncStatus=document.getElementById('salarySyncStatus'),actualStatus=document.getElementById('actualSalaryStatus'),clearActual=document.getElementById('clearActualSalary'),clearExpected=document.getElementById('clearExpectedSalary');
const sourceMonth=getSourceMonth(defaultWorkMonth()),payMonth=nextMonthKey(sourceMonth),data=getShiftSalary(sourceMonth),override=getExpectedOverride(sourceMonth),expected=override==null?(data?data.net:null):override,actual=getActual(sourceMonth),payDay=getPayDay(),receivedWindow=isCurrentSalaryCycle(sourceMonth);
if(payDayInput&&document.activeElement!==payDayInput)payDayInput.value=payDay||'';
if(sourceInput&&document.activeElement!==sourceInput)sourceInput.value=sourceMonth;
if(payMonthText)payMonthText.textContent=`המשכורת של ${monthLabel(sourceMonth)} צפויה להיכנס ב${monthLabel(payMonth)}${payDay?` ב-${payDay} בחודש`:''}.`;
if(expectedInput){expectedInput.disabled=false;if(document.activeElement!==expectedInput)expectedInput.value=expected==null?'':String(expected)}
if(clearExpected)clearExpected.style.display=override==null?'none':'inline-flex';
if(syncStatus){if(override!=null)syncStatus.textContent=`סכום צפוי ידני עבור עבודת ${monthLabel(sourceMonth)}: ${money(override)} · תשלום ב${monthLabel(payMonth)}.`;else if(data)syncStatus.textContent=`לפי אפליקציית השעות: ${data.count} משמרות ב${monthLabel(sourceMonth)} · ${money(data.net)} · צפוי להיכנס ב${monthLabel(payMonth)}.`;else syncStatus.textContent=`לא נמצאו משמרות ב${monthLabel(sourceMonth)}. אפשר לבחור חודש אחר או להזין סכום ידנית.`}
if(actual!=null){applyEffective(actual);if(actualStatus)actualStatus.textContent=`משכורת בפועל עבור עבודת ${monthLabel(sourceMonth)}: ${money(actual)}.`}
else if(receivedWindow){applyEffective(0);if(actualStatus)actualStatus.textContent=`הגיע מועד התשלום של עבודת ${monthLabel(sourceMonth)}. הזן את המשכורת שקיבלת בפועל.`}
else if(expected!=null){applyEffective(expected);if(actualStatus)actualStatus.textContent=`החישובים משתמשים כרגע במשכורת הצפויה של עבודת ${monthLabel(sourceMonth)}.`}
else{applyEffective(0);if(actualStatus)actualStatus.textContent='אין כרגע משכורת צפויה לחישוב.'}
if(actualInput&&document.activeElement!==actualInput)actualInput.value=actual==null?'':String(actual);
if(clearActual)clearActual.style.display=actual==null?'none':'inline-flex';
}
function bind(){
const expectedInput=document.getElementById('expectedSalary'),sourceInput=document.getElementById('salarySourceMonth'),actualInput=document.getElementById('actualSalaryReceived'),payDayInput=document.getElementById('salaryPayDay'),clearActual=document.getElementById('clearActualSalary'),clearExpected=document.getElementById('clearExpectedSalary');
if(payDayInput&&!payDayInput.dataset.bound){payDayInput.dataset.bound='1';payDayInput.addEventListener('change',()=>{setPayDay(payDayInput.value);sync()})}
if(sourceInput&&!sourceInput.dataset.bound){sourceInput.dataset.bound='1';sourceInput.addEventListener('change',()=>{setSourceMonth(sourceInput.value);setExpectedOverride(null,sourceInput.value);sync()})}
if(expectedInput&&!expectedInput.dataset.bound){expectedInput.dataset.bound='1';expectedInput.addEventListener('change',()=>{const sourceMonth=getSourceMonth(defaultWorkMonth()),raw=expectedInput.value.trim();if(raw===''){setExpectedOverride(null,sourceMonth);sync();return}const amount=Number(raw);if(!Number.isFinite(amount)||amount<0)return;setExpectedOverride(amount,sourceMonth);sync()})}
if(clearExpected&&!clearExpected.dataset.bound){clearExpected.dataset.bound='1';clearExpected.addEventListener('click',()=>{setExpectedOverride(null,getSourceMonth(defaultWorkMonth()));sync()})}
if(actualInput&&!actualInput.dataset.bound){actualInput.dataset.bound='1';actualInput.addEventListener('change',()=>{const raw=actualInput.value.trim(),sourceMonth=getSourceMonth(defaultWorkMonth());if(raw===''){setActual(null,sourceMonth);sync();return}const amount=Number(raw);if(!Number.isFinite(amount)||amount<0)return;setActual(amount,sourceMonth);sync()})}
if(clearActual&&!clearActual.dataset.bound){clearActual.dataset.bound='1';clearActual.addEventListener('click',()=>{setActual(null,getSourceMonth(defaultWorkMonth()));if(actualInput)actualInput.value='';sync()})}
}
function run(){bind();sync()}
document.addEventListener('DOMContentLoaded',()=>setTimeout(run,180));window.addEventListener('load',()=>setTimeout(run,260));window.addEventListener('focus',sync);window.addEventListener('pageshow',sync);window.addEventListener('storage',e=>{if([SHIFT_KEY,ACTUAL_KEY,PAYDAY_KEY,SOURCE_MONTH_KEY,EXPECTED_OVERRIDE_KEY].includes(e.key))sync()});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync()});
})();