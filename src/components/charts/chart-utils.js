import dayjs from 'dayjs';

export const getDateBuckets = (from, to, groupBy) => {
  const start = dayjs(from);
  const end = dayjs(to);
  const buckets = [];
  if (groupBy === 'month') {
    let current = start.startOf('month');
    let count = 0;
    const maxMonths = 24;
    while ((current.isBefore(end) || current.isSame(end, 'month')) && count < maxMonths) {
      const monthEnd = current.endOf('month');
      const bucketEnd = monthEnd.isAfter(end) ? end : monthEnd;
      if (current.isSameOrBefore(bucketEnd)) {
        buckets.push({
          start: current.startOf('day').format('YYYY-MM-DDTHH:mm:ssZ'),
          end: bucketEnd.endOf('day').format('YYYY-MM-DDTHH:mm:ssZ'),
          label: current.format('MMM YYYY'),
        });
      }
      current = current.add(1, 'month').startOf('month');
      count += 1;
    }
  } else if (groupBy === 'week') {
    let current = start.startOf('week');
    let count = 0;
    const maxWeeks = 26;
    while ((current.isBefore(end) || current.isSame(end, 'week')) && count < maxWeeks) {
      const weekEnd = current.endOf('week');
      const bucketEnd = weekEnd.isAfter(end) ? end : weekEnd;
      buckets.push({
        start: current.startOf('day').format('YYYY-MM-DDTHH:mm:ssZ'),
        end: bucketEnd.endOf('day').format('YYYY-MM-DDTHH:mm:ssZ'),
        label: `${current.format('D MMM')} - ${bucketEnd.format('D MMM')}`,
      });
      current = current.add(1, 'week');
      count += 1;
    }
  } else {
    let current = start;
    while (current.isBefore(end) || current.isSame(end, 'day')) {
      const dayStart = current.startOf('day');
      const dayEnd = current.endOf('day');
      buckets.push({
        start: dayStart.format('YYYY-MM-DDTHH:mm:ssZ'),
        end: dayEnd.format('YYYY-MM-DDTHH:mm:ssZ'),
        label: current.format('D MMM YYYY'),
      });
      current = current.add(1, 'day');
    }
    if (buckets.length > 31) {
      const step = Math.ceil(buckets.length / 31);
      return buckets.filter((_, i) => i % step === 0).slice(0, 31);
    }
  }
  return buckets;
};
