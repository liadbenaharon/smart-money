(() => {
  const recurringBtn = document.getElementById('addRecurringBtn');
  const regularBtn = document.getElementById('addExpenseBtn');
  const recurringCheckbox = document.getElementById('expenseRecurring');
  const nameInput = document.getElementById('expenseName');
  const hint = document.getElementById('expenseModeHint');
  const saveBtn = document.getElementById('saveExpenseBtn');
  const versionBtn = document.getElementById('versionBtn');

  function updateModeHint() {
    if (!recurringCheckbox || !hint) return;
    if (recurringCheckbox.checked) {
      hint.textContent = 'חיוב קבוע — יישאר אוטומטית גם כשתפתח חודש חדש.';
      hint.classList.add('recurring-note');
    } else {
      hint.textContent = 'הוצאה חד־פעמית לחודש המתוכנן.';
      hint.classList.remove('recurring-note');
    }
  }

  if (recurringBtn) {
    recurringBtn.addEventListener('click', () => {
      if (recurringCheckbox) recurringCheckbox.checked = true;
      updateModeHint();
      if (saveBtn && saveBtn.textContent.includes('הוסף')) saveBtn.textContent = 'הוסף חיוב קבוע';
      nameInput?.focus();
      nameInput?.scrollIntoView({behavior:'smooth', block:'center'});
    });
  }

  if (regularBtn) {
    regularBtn.addEventListener('click', () => {
      if (recurringCheckbox) recurringCheckbox.checked = false;
      updateModeHint();
      if (saveBtn && saveBtn.textContent.includes('הוסף')) saveBtn.textContent = 'הוסף הוצאה';
    });
  }

  recurringCheckbox?.addEventListener('change', () => {
    updateModeHint();
    if (saveBtn && saveBtn.textContent.includes('הוסף')) {
      saveBtn.textContent = recurringCheckbox.checked ? 'הוסף חיוב קבוע' : 'הוסף הוצאה';
    }
  });

  if (versionBtn) versionBtn.textContent = 'v0.2.1';
  updateModeHint();
})();