import React from 'react';
import { Button } from './ui/button.jsx';
export default function ExecutiveTabButton({ executive, count, isSelected, onClick, label, showRoleSuffix = true, showCount = true, disabled = false }) {
  const isAll = !executive || executive.id === undefined;
  const roleMap = { sales_manager: 'Manager', sales_executive: 'Executive', recruitment_manager: 'Recruitment Manager', recruitment_executive: 'Recruitment Executive' };
  const suffix = !isAll && showRoleSuffix && executive.user_type ? ` - ${roleMap[executive.user_type] || 'Executive'}` : '';
  return <Button type='button' variant={isSelected ? 'default' : 'outline'} aria-pressed={Boolean(isSelected)} disabled={disabled} onClick={onClick}>
    {label || (isAll ? 'All' : executive.name)}{suffix}{!isAll && showCount && typeof count === 'number' ? ` (${count})` : ''}
  </Button>;
}
