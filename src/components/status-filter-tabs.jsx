import React from 'react';
import { Button } from './ui/button.jsx';
import statusColors from '../pages/shared/utils/statusColors.js';
export default function StatusFilterTabs({ statusFilter, setStatusFilter, statusChoices, getTotalCount, getStatusCount, statusColors: customColors, showAllTab = true }) {
  const colors = customColors || statusColors;
  return <div className='flex flex-wrap gap-2 py-2' role='group' aria-label='Filter by status'>
    {showAllTab && <Button type='button' size='sm' variant={!statusFilter || statusFilter === 'All' ? 'default' : 'outline'} aria-pressed={!statusFilter || statusFilter === 'All'} onClick={() => setStatusFilter('')}>All ({getTotalCount()})</Button>}
    {statusChoices.filter(item => item.value !== '' && item.label !== 'All').map(({ label, value, apiKey }) => <Button type='button' size='sm' variant={statusFilter === value ? 'default' : 'outline'} aria-pressed={statusFilter === value} key={value} onClick={() => setStatusFilter(previous => previous === value && showAllTab ? '' : value)}><span className='size-2 rounded-full' style={{ backgroundColor: colors[value] || '#64748b' }} />{label} ({getStatusCount(apiKey)})</Button>)}
  </div>;
}
