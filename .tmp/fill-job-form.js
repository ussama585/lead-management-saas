(async () => {
  const pause = () => new Promise(resolve => setTimeout(resolve, 100));
  function fill(id, value) {
    const input = document.getElementById(id);
    if (!input) throw new Error('Missing field: ' + id);
    const prototype = input.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(input, String(value));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
  }
  async function select(id, value) {
    const input = document.getElementById(id);
    input.closest('.ant-select').querySelector('.ant-select-selector').dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
    await pause();
    const candidates = [...document.querySelectorAll('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option')];
    const option = candidates.find(option => option.getAttribute('title') === String(value) || option.innerText.trim() === String(value));
    if (!option) throw new Error('Missing option ' + value + ' for ' + id + ': ' + candidates.map(el => el.innerText).join(', '));
    option.click();
    await pause();
  }
  const button = label => [...document.querySelectorAll('button')].find(button => button.innerText.trim() === label);
  const fields = {
    job_title: 'UI TEST - Python Developer - 2026-10-22', number_of_vacancies: 3, department: 'Information Technology',
    location_country: 'Pakistan', location_city: 'Lahore', address: 'Gulberg, Lahore',
    job_description: 'Test record created to verify the Super Admin data lead job form.',
    job_requirements: 'Python, Django, REST APIs, PostgreSQL.', job_responsibilities: 'Develop APIs and collaborate with the team.',
    key_skills_required: 'Python, Django, PostgreSQL', educational_qualification: "Bachelor's degree in Computer Science",
    min_salary: 150000, max_salary: 250000, other_benefits: 'Medical insurance and paid leave', languages_required: 'English, Urdu',
    nationality_preference: 'Pakistani', notes: 'UI TEST record created during authorized form testing.',
    job_shift: 'day-shift', working_days: 'Monday-Friday', working_hours: '09:00-18:00', hours_per_week: 40,
    contract_length: '12', cv_submission_deadline: '2026-11-15T23:59', expected_joining_date: '2026-12-01T09:00',
  };
  for (const [id, value] of Object.entries(fields)) { fill(id, value); await pause(); }
  await select('job_type', 'Full-Time');
  await select('employment_type', 'Remote');
  await select('min_experience', 3);
  await select('max_experience', 6);
  await select('degree_level', "Bachelor's");
  await select('contract_period', 'Month(s)');
  button('Add degree').click(); await pause();
  button('Add degree').click(); await pause();
  fill('degrees.0.degree_name', 'Bachelor of Computer Science');
  fill('degrees.1.degree_name', 'Master of Computer Science');
  button('Add skill').click(); await pause();
  button('Add skill').click(); await pause();
  for (const [index, skill] of ['Python', 'Django', 'PostgreSQL'].entries()) {
    fill(`skills.${index}.skill_name`, skill); await pause();
    await select(`skills.${index}.experience`, 5 - index);
    await select(`skills.${index}.last_used`, index === 2 ? 1 : 0);
  }
  await pause();
  return { title: document.getElementById('job_title').value, skills: document.querySelectorAll('input[name$="skill_name"]').length,
    degrees: document.querySelectorAll('input[name$="degree_name"]').length, errors: [...document.querySelectorAll('[role=alert]')].map(el => el.innerText),
    overflow: { viewport: document.documentElement.clientWidth, documentWidth: document.documentElement.scrollWidth } };
})()
