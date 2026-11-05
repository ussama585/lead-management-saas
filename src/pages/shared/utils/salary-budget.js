export function formatSalaryBudget(value) {
  if (value == null || !String(value).trim()) return '-';
  return String(value).replace(/_/g, ' ').replace(/\bpkr\b/gi, 'PKR')
    .replace(/under\s*pkr\s*/gi, 'Under PKR ')
    .replace(/\s+/g, ' ').trim()
    .replace(/(\d[\d,]*(?:\.\d+)?[kKmM]?)\s+(?:to\s+)?(?=(?:PKR\s*)?\d)/gi, '$1 - ')
    .replace(/\s*[-–]\s*/g, ' - ');
}
