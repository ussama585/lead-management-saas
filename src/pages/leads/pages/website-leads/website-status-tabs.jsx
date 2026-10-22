import React from 'react';
import { Button } from '../../../../components/ui/button.jsx';
import statusColors from '../../../shared/utils/statusColors.js';

export default function WebsiteStatusTabs({ statusFilter, setStatusFilter, statusChoices, getTotalCount, getStatusCount }) {
  return <div className='flex flex-wrap gap-2 py-2' role='group' aria-label='Filter by status'>
    {statusChoices.map(({ label, value, apiKey }) => {
      const selected = value ? statusFilter === value : !statusFilter || statusFilter === 'All';
      return <Button key={value} type='button' size='sm' variant={selected ? 'default' : 'outline'} aria-pressed={selected}
        className='h-auto min-h-8 max-w-full whitespace-normal text-left'
        onClick={() => setStatusFilter(selected ? '' : value)}>
        {value && <span className='size-2 shrink-0 rounded-full' style={{ backgroundColor: statusColors[value] || '#64748b' }} />}
        {label} ({value ? getStatusCount(apiKey) : getTotalCount()})
      </Button>;
    })}
  </div>;
}
