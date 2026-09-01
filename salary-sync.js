(()=>{
const SHIFT_KEY='ilShiftTrackerData_v1';
const ACTUAL_KEY='smartMoneyActualSalaryReceivedV1';
const PAYDAY_KEY='smartMoneySalaryPayDayV1';
const SOURCE_MONTH_KEY='smartMoneySalarySourceMonthV1';
const EXPECTED_OVERRIDE_KEY='smartMoneyExpectedSalaryOverrideV1';
const NI_THRESHOLD=7703,NI_CEILING=51910,NI_RATE_LOW=0.0427,NI_RATE_HIGH=0.1217;
const round=v=>Math.round((Number(v)||0)*100)/100;
const money=v=>new Intl.NumberFormat('he-IL',{style:'currency',currency:'ILS',maximumFractionDigits:2}).format(Number(v)||0);
function monthKey(ms=Date.now()){const d=new Date(ms);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function previousMonthKey(){const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-1);return monthKey(d.getTime())}
function deduction(grossWork){const low=Math.min(grossWork,NI_THRESHOLD),high=Math.max(0,Math.min(grossWork,NI_CEILING)-NI_THRESHOLD);return low*NI_RATE_LOW+high*NI_RATE_HIGH}
function getPayDay(){const n=Number(localStorage.getItem(PAYDAY_KEY));return Number.isInteger(n)&&n>=1&&n<=31?n:null}
function setPayDay(v){const n=Number(v);if(Number.isInteger(n)&&n>=1&&n<=31)localStorage.setItem(PAYDAY_KEY,String(n));else localStorage.removeItem(PAYDAY_KEY)}
function salaryPeriod(){const day=getPayDay(),today=new Date().getDate();if(day)return{month:previousMonthKey(),waiting:today<day,day};return{month:monthKey(),waiting:true,day:null}}
function validMonth(v){return /^\d{4}-(0[1-9]|1[0-2])$/.test(String(v||''))}
function getSourceMonth(defaultMonth){try{const data=JSON.parse(localStorage.getItem(SOURCE_MONTH_KEY)||'null');return data&&data.cycle===monthKey()&&validMonth(data.month)?data.month:defaultMonth}catch{return defaultMonth}}
function setSourceMonth(v){if(validMonth(v))localStorage.setItem(SOURCE_MONTH_KEY,JSON.stringify({cycle:monthKey(),month:v}));else localStorage.removeItem(SOURCE_MONTH_KEY)}
function getExpectedOverride(sourceMonth){try{const data=JSON.parse(localStorage.getItem(EXPECTED_OVERRIDE_KEY)||'null');if(!data||data.cycle!==monthKey()||data.month!==sourceMonth)return null;const amount=Number(data.amount);return Number.isFinite(amount)&&amount>=0?round(amount):null}catch{return null}}
function setExpectedOverride(amount,sourceMonth){if(amount==null){localStorage.removeItem(EXPECTED_OVERRIDE_KEY);return}localStorage.setItem(EXPECTED_OVERRIDE_KEY,JSON.stringify({cycle:monthKey(),month:sourceMonth,amount:round(amount),savedAt:new Date().toISOString()}))}
function getShiftSalary(targetMonth){try{const raw=localStorage.getItem(SHIFT_KEY);if(!raw)return null;const s=JSON.parse(raw);const shifts=Array.isArray(s.shifts)?s.shifts:[];const month=shifts.filter(x=>monthKey(Number(x.start))===targetMonth);if(!month.length)return null;const totalWork=month.reduce((a,x)=>a+(Number(x.pay)||0),0);const travel=month.reduce((a,x)=>a+(Number(x.travel)||0),0);const expenses=month.reduce((a,x)=>a+(Number(x.expenses)||0),0);const net=round(totalWork-deduction(totalWork)+travel-expenses);return{net,count:month.length,month:targetMonth}}catch(e){console.warn('Shift Clock sync failed',e);return null}}
function getActual(sourceMonth){try{const raw=localStorage.getItem(ACTUAL_KEY);if(!raw)return null;const data=JSON.parse(raw);if(data.periodMonth!==sourceMonth)return null;const amount=Number(data.amount);return Number.isFinite(amount)&&amount>=0?round(amount):null}catch{return null}}
function setActual(amount,sourceMonth){if(amount==null){localStorage.removeItem(ACTUAL_KEY);return}localStorage.setItem(ACTUAL_KEY,JSON.stringify({periodMonth:sourceMonth,amount:round(amount),savedAt:new Date().toISOString()}))}
function applyEffective(value){const salary=document.getElementById('salary');if(!salary)return;const next=String(round(value||0));if(salary.value!==next){salary.value=next;salary.dispatchEvent(new Event('input',{bubbles:true}));salary.dispatchEvent(new Event('change',{bubbles:true}))}}
function sync(){
const expectedInput=document.getElementById('expectedSalary'),sourceInput=document.getElementById('salarySourceMonth'),actualInput=document.getElementById('actualSalaryReceived'),payDayInput=document.getElementById('salaryPayDay'),syncStatus=document.getElementById('salarySyncStatus'),actualStatus=document.getElementById('actualSalaryStatus'),clearActual=document.getElementById('clearActualSalary'),clearExpected=document.getElementById('clearExpectedSalary');
const period=salaryPeriod(),sourceMonth=getSourceMonth(period.month),data=getShiftSalary(sourceMonth),override=getExpectedOverride(sourceMonth),expected=override==null?(data?data.net:null):override,actual=getActual(sourceMonth);
if(payDayInput&&document.activeElement!==payDayInput)payDayInput.value=getPayDay()||'';
if(sourceInput&&document.activeElement!==sourceInput)sourceInput.value=sourceMonth;
if(expectedInput){expectedInput.disabled=!!(period.day&&!period.waiting);if(document.activeElement!==expectedInput)expectedInput.value=period.day&&!period.waiting?'':(expected==null?'':String(expected))}
if(clearExpected)clearExpected.style.display=override==null?'none':'inline-flex';
if(period.day&&period.waiting){
if(syncStatus){if(override!=null)syncStatus.textContent=`משכורת צפויה ידנית עבור ${sourceMonth}: ${money(override)} · תישאר עד ה-${period.day} בחודש`;else if(data)syncStatus.textContent=`לפי אפליקציית השעות עבור ${sourceMonth} · ${data.count} משמרות · ${money(data.net)} · תישאר עד ה-${period.day} בחודש`;else syncStatus.textContent=`לא נמצאו נתוני משמרות עבור ${sourceMonth}. אפשר לבחור חודש אחר או להזין סכום ידנית.`}
if(actual!=null){applyEffective(actual);if(actualStatus)actualStatus.textContent=`כבר הוזנה משכורת בפועל: ${money(actual)}.`}else if(expected!=null){applyEffective(expected);if(actualStatus)actualStatus.textContent=`עד ה-${period.day} החישובים משתמשים במשכורת הצפויה.`}else applyEffective(0);
}else if(period.day){
if(syncStatus)syncStatus.textContent=`הגיע יום המשכורת (${period.day} בחודש) — המשכורת הצפויה עבור ${sourceMonth} הוסרה. הזן את הסכום שקיבלת בפועל.`;
if(actual!=null){applyEffective(actual);if(actualStatus)actualStatus.textContent=`החישובים משתמשים במשכורת בפועל: ${money(actual)}.`}else{applyEffective(0);if(actualStatus)actualStatus.textContent='הזן את המשכורת שקיבלת בפועל.'}
}else{
if(syncStatus){if(override!=null)syncStatus.textContent=`משכורת צפויה ידנית עבור ${sourceMonth}: ${money(override)}.`;else if(data)syncStatus.textContent=`לפי אפליקציית השעות עבור ${sourceMonth} · ${data.count} משמרות · ${money(data.net)}.`;else syncStatus.textContent=`לא נמצאו נתוני משמרות עבור ${sourceMonth}. אפשר לבחור חודש אחר או להזין סכום ידנית.`}
if(actual!=null)applyEffective(actual);else if(expected!=null)applyEffective(expected);else applyEffective(0)
}
if(actualInput&&document.activeElement!==actualInput)actualInput.value=actual==null?'':String(actual);
if(clearActual)clearActual.style.display=actual==null?'none':'inline-flex';
}
function bind(){
const expectedInput=document.getElementById('expectedSalary'),sourceInput=document.getElementById('salarySourceMonth'),actualInput=document.getElementById('actualSalaryReceived'),payDayInput=document.getElementById('salaryPayDay'),clearActual=document.getElementById('clearActualSalary'),clearExpected=document.getElementById('clearExpectedSalary');
if(payDayInput&&!payDayInput.dataset.bound){payDayInput.dataset.bound='1';payDayInput.addEventListener('change',()=>{setPayDay(payDayInput.value);sync()})}
if(sourceInput&&!sourceInput.dataset.bound){sourceInput.dataset.bound='1';sourceInput.addEventListener('change',()=>{setSourceMonth(sourceInput.value);setExpectedOverride(null,sourceInput.value);sync()})}
if(expectedInput&&!expectedInput.dataset.bound){expectedInput.dataset.bound='1';expectedInput.addEventListener('change',()=>{if(expectedInput.disabled)return;const sourceMonth=getSourceMonth(salaryPeriod().month),raw=expectedInput.value.trim();if(raw===''){setExpectedOverride(null,sourceMonth);sync();return}const amount=Number(raw);if(!Number.isFinite(amount)||amount<0)return;setExpectedOverride(amount,sourceMonth);sync()})}
if(clearExpected&&!clearExpected.dataset.bound){clearExpected.dataset.bound='1';clearExpected.addEventListener('click',()=>{setExpectedOverride(null,getSourceMonth(salaryPeriod().month));sync()})}
if(actualInput&&!actualInput.dataset.bound){actualInput.dataset.bound='1';actualInput.addEventListener('change',()=>{const raw=actualInput.value.trim(),sourceMonth=getSourceMonth(salaryPeriod().month);if(raw===''){setActual(null,sourceMonth);sync();return}const amount=Number(raw);if(!Number.isFinite(amount)||amount<0)return;setActual(amount,sourceMonth);sync()})}
if(clearActual&&!clearActual.dataset.bound){clearActual.dataset.bound='1';clearActual.addEventListener('click',()=>{setActual(null,getSourceMonth(salaryPeriod().month));if(actualInput)actualInput.value='';sync()})}
}
function run(){bind();sync()}
document.addEventListener('DOMContentLoaded',()=>setTimeout(run,180));window.addEventListener('load',()=>setTimeout(run,260));window.addEventListener('focus',sync);window.addEventListener('pageshow',sync);window.addEventListener('storage',e=>{if([SHIFT_KEY,ACTUAL_KEY,PAYDAY_KEY,SOURCE_MONTH_KEY,EXPECTED_OVERRIDE_KEY].includes(e.key))sync()});document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')sync()});
})();