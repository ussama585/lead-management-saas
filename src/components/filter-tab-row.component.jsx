import React from 'react';
import ExecutiveTabButton from './executive-tab-button.component.jsx';

const FilterTabRow = ({ items, selectedId, onSelect, style, disabled = false }) => {
  if (!items || items.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', width: 'fit-content', ...style }}>
      <ExecutiveTabButton
        isSelected={selectedId === ''}
        onClick={() => onSelect('')}
        disabled={disabled}
      />
      {items.map((item) => (
        <ExecutiveTabButton
          key={item.id}
          executive={{ id: item.id, name: item.name }}
          count={item.project_count}
          isSelected={selectedId === String(item.id)}
          showRoleSuffix={false}
          showCount={true}
          onClick={() => onSelect(String(item.id))}
          disabled={disabled}
        />
      ))}
    </div>
  );
};

export default FilterTabRow;
