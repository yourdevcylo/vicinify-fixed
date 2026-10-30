/* Capstone business-hours editor helpers. Existing Firestore keys and formats stay unchanged. */
(function () {
  const ids = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  function editor() { return document.getElementById('page-biz-edit'); }
  function input(day) { return document.getElementById('bizHours' + day); }
  function note(message) {
    const feedback = document.getElementById('bizHoursFeedback');
    if (feedback) feedback.textContent = message;
  }
  document.addEventListener('click', function (event) {
    const button = event.target.closest?.('button[data-copy-hours], button[data-close-hours]');
    const page = editor();
    if (!button || !page || !page.contains(button)) return;
    if (button.hasAttribute('data-close-hours')) {
      const day = button.getAttribute('data-close-hours');
      if (!ids.includes(day)) return;
      const target = input(day);
      if (!target) return;
      target.value = 'Closed';
      target.dispatchEvent(new Event('input', { bubbles: true }));
      note(button.getAttribute('aria-label').replace(/^Mark /, '').replace(/ closed$/, '') + ' marked Closed. Save changes to update your profile.');
      return;
    }
    const monday = input('Mon')?.value.trim();
    if (!monday) { note('Enter Monday hours first, or type Closed.'); input('Mon')?.focus(); return; }
    const range = button.getAttribute('data-copy-hours');
    if (range !== 'all' && range !== 'weekdays') return;
    const targets = range === 'all' ? ids.slice(1) : ids.slice(1, 5);
    targets.forEach(day => {
      const target = input(day);
      if (!target) return;
      target.value = monday;
      target.dispatchEvent(new Event('input', { bubbles: true }));
    });
    note(range === 'all'
      ? 'Copied Monday hours to Tuesday–Sunday. Save changes when ready.'
      : 'Copied Monday hours to Tuesday–Friday. Save changes when ready.');
  });
  document.addEventListener('input', function (event) {
    if (event.target?.id?.startsWith('bizHours')) note('');
  });
})();
