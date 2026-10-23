(async () => {
  const pause = () => new Promise(resolve => setTimeout(resolve, 250));
  const checked = [];
  for (const [id, value] of Object.entries({ min_experience: 3, max_experience: 6,
    'skills.0.experience': 5, 'skills.0.last_used': 0, 'skills.1.experience': 4, 'skills.1.last_used': 0,
    'skills.2.experience': 3, 'skills.2.last_used': 1 })) {
    const input = document.getElementById(id);
    input.closest('.ant-select').querySelector('.ant-select-selector').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
    await pause();
    const popup = document.getElementById(input.getAttribute('aria-controls')).closest('.ant-select-dropdown');
    const option = [...popup.querySelectorAll('.ant-select-item-option')].find(el => el.getAttribute('title') === String(value));
    if (!option) throw Error('Missing option '+id+' '+value);
    option.click(); await pause();
    checked.push({ id, value: input.closest('.ant-select').querySelector('.ant-select-selection-item')?.getAttribute('title') });
  }
  return checked;
})()
