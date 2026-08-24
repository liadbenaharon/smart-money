const STORAGE_KEY='smartMoneyAppV1';
const defaultState={version:1,accounts:{debit:{name:'Debit',balance:1500},credit:{name:'אשראי',balance:800,expectedCharge:1200,chargeDate:'2026-09-10'},monthlySavings:{name:'חיסכון חודשי',balance:3500,target:5000},annualSavings:{name:'חיסכון שנתי',balance:10000,unlockDate:'2027-08-01'}},allocation:{mode:'smart',percentages:{debit:40,credit:25,monthlySavings:20,annualSavings:15},rules:{creditFirst:true,minimumDebit:1000,monthlySavingsTarget:5000}},transactions:[],settings:{currency:'ILS',locale:'he-IL'}};

function clone(obj){return JSON.parse(JSON.stringify(obj));}
function loadState(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||clone(defaultState);}catch{return clone(defaultState)}}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
let state=loadState();
let pendingAllocation=null;
let pendingIncome=0;

const $=id=>document.getElementById(id);
const money=v=>new Intl.NumberFormat('he-IL',{style:'currency',currency:'ILS',maximumFractionDigits:2}).format(Number(v)||0);
const round=v=>Math.round((Number(v)||0)*100)/100;

function smartAllocate(amount){
  let remaining=round(amount);
  const result={debit:0,credit:0,monthlySavings:0,annualSavings:0};
  const credit=state.accounts.credit;
  if(state.allocation.rules.creditFirst){
    const creditMissing=Math.max(0,round(credit.expectedCharge-credit.balance));
    const toCredit=Math.min(remaining,creditMissing);
    result.credit=round(toCredit); remaining=round(remaining-toCredit);
  }
  const debitMissing=Math.max(0,round((state.allocation.rules.minimumDebit||0)-state.accounts.debit.balance));
  const toDebit=Math.min(remaining,debitMissing);
  result.debit=round(result.debit+toDebit); remaining=round(remaining-toDebit);
  if(remaining<=0) return result;

  const monthlyReached=state.accounts.monthlySavings.balance>=state.accounts.monthlySavings.target;
  const p=state.allocation.percentages;
  const weights={debit:p.debit,credit:state.allocation.rules.creditFirst?0:p.credit,monthlySavings:monthlyReached?0:p.monthlySavings,annualSavings:p.annualSavings};
  let weightTotal=Object.values(weights).reduce((a,b)=>a+b,0);
  if(weightTotal<=0){result.debit=round(result.debit+remaining);return result;}
  const keys=Object.keys(weights);
  let distributed=0;
  keys.forEach((key,index)=>{
    if(index===keys.length-1){result[key]=round(result[key]+remaining-distributed);return;}
    const part=round(remaining*(weights[key]/weightTotal));
    result[key]=round(result[key]+part);distributed=round(distributed+part);
  });
  const total=Object.values(result).reduce((a,b)=>round(a+b),0);
  result.debit=round(result.debit+(amount-total));
  return result;
}

function daysUntil(dateStr){if(!dateStr)return null;const today=new Date();today.setHours(0,0,0,0);const target=new Date(dateStr+'T00:00:00');return Math.max(0,Math.ceil((target-today)/86400000));}

function render(){
  $('debitBalance').textContent=money(state.accounts.debit.balance);
  $('creditBalance').textContent=money(state.accounts.credit.balance);
  $('monthlyBalance').textContent=money(state.accounts.monthlySavings.balance);
  $('annualBalance').textContent=money(state.accounts.annualSavings.balance);
  $('creditChargeText').textContent=`חיוב צפוי: ${money(state.accounts.credit.expectedCharge)}`;
  $('monthlyTargetText').textContent=`יעד: ${money(state.accounts.monthlySavings.target)}`;
  const d=daysUntil(state.accounts.annualSavings.unlockDate);
  $('annualDaysText').textContent=d===0?'החיסכון נזיל 🎉':d===null?'לא הוגדר תאריך':`עוד ${d} ימים`;

  const missing=Math.max(0,round(state.accounts.credit.expectedCharge-state.accounts.credit.balance));
  const debitGap=Math.max(0,round(state.accounts.credit.expectedCharge-state.accounts.debit.balance));
  $('creditStatus').innerHTML=missing<=0
    ? `<div class="status good">✓ החיוב הקרוב מכוסה במלואו.</div>`
    : `<div class="status warn">⚠ חסרים <strong>${money(missing)}</strong> בכסף ששמור לאשראי.${debitGap>0?` בנוסף, יתרת ה-Debit נמוכה מהחיוב הצפוי ב-${money(debitGap)}.`:''}</div>`;

  $('setDebit').value=state.accounts.debit.balance;
  $('setCredit').value=state.accounts.credit.balance;
  $('setExpectedCredit').value=state.accounts.credit.expectedCharge;
  $('setMonthly').value=state.accounts.monthlySavings.balance;
  $('setMonthlyTarget').value=state.accounts.monthlySavings.target;
  $('setAnnual').value=state.accounts.annualSavings.balance;
  $('setAnnualDate').value=state.accounts.annualSavings.unlockDate||'';
  $('setMinimumDebit').value=state.allocation.rules.minimumDebit;
  $('pctDebit').value=state.allocation.percentages.debit;
  $('pctCredit').value=state.allocation.percentages.credit;
  $('pctMonthly').value=state.allocation.percentages.monthlySavings;
  $('pctAnnual').value=state.allocation.percentages.annualSavings;
  renderHistory();
}

function renderHistory(){
  if(!state.transactions.length){$('historyList').innerHTML='<small>עדיין אין פעולות.</small>';return;}
  $('historyList').innerHTML=state.transactions.slice(0,8).map(t=>`<div class="history-item"><div><strong>הכנסה ${money(t.amount)}</strong><small>${new Date(t.date).toLocaleString('he-IL')}</small></div><small>Debit ${money(t.allocation.debit)} · אשראי ${money(t.allocation.credit)}<br>חודשי ${money(t.allocation.monthlySavings)} · שנתי ${money(t.allocation.annualSavings)}</small></div>`).join('');
}

$('calculateBtn').addEventListener('click',()=>{
  const amount=Number($('incomeInput').value);
  if(!Number.isFinite(amount)||amount<=0){alert('יש להזין סכום גדול מ-0');return;}
  pendingIncome=round(amount); pendingAllocation=smartAllocate(pendingIncome);
  $('allocationResult').innerHTML=[['debit','Debit'],['credit','אשראי'],['monthlySavings','חיסכון חודשי'],['annualSavings','חיסכון שנתי']].map(([k,n])=>`<div class="allocation-item"><span>${n}</span><strong>${money(pendingAllocation[k])}</strong></div>`).join('');
  $('allocationResult').classList.remove('hidden');$('applyBtn').classList.remove('hidden');
});

$('applyBtn').addEventListener('click',()=>{
  if(!pendingAllocation)return;
  state.accounts.debit.balance=round(state.accounts.debit.balance+pendingAllocation.debit);
  state.accounts.credit.balance=round(state.accounts.credit.balance+pendingAllocation.credit);
  state.accounts.monthlySavings.balance=round(state.accounts.monthlySavings.balance+pendingAllocation.monthlySavings);
  state.accounts.annualSavings.balance=round(state.accounts.annualSavings.balance+pendingAllocation.annualSavings);
  state.transactions.unshift({id:'txn_'+Date.now(),type:'income',amount:pendingIncome,date:new Date().toISOString(),allocation:clone(pendingAllocation)});
  saveState();pendingAllocation=null;$('incomeInput').value='';$('allocationResult').classList.add('hidden');$('applyBtn').classList.add('hidden');render();
});

$('settingsForm').addEventListener('submit',e=>{
  e.preventDefault();
  const percentages={debit:Number($('pctDebit').value)||0,credit:Number($('pctCredit').value)||0,monthlySavings:Number($('pctMonthly').value)||0,annualSavings:Number($('pctAnnual').value)||0};
  const total=Object.values(percentages).reduce((a,b)=>a+b,0);
  if(total!==100){alert('האחוזים חייבים להסתכם ל-100%');return;}
  state.accounts.debit.balance=round($('setDebit').value);
  state.accounts.credit.balance=round($('setCredit').value);
  state.accounts.credit.expectedCharge=round($('setExpectedCredit').value);
  state.accounts.monthlySavings.balance=round($('setMonthly').value);
  state.accounts.monthlySavings.target=round($('setMonthlyTarget').value);
  state.accounts.annualSavings.balance=round($('setAnnual').value);
  state.accounts.annualSavings.unlockDate=$('setAnnualDate').value;
  state.allocation.rules.minimumDebit=round($('setMinimumDebit').value);
  state.allocation.percentages=percentages;
  saveState();render();alert('ההגדרות נשמרו');
});

$('resetBtn').addEventListener('click',()=>{if(confirm('לאפס את כל הנתונים המקומיים?')){state=clone(defaultState);saveState();render();}});

if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));}
render();