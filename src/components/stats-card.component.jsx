import React from 'react';
import { ChartNoAxesCombined } from 'lucide-react';
import { Card, CardContent, CardTitle } from './ui/card.jsx';
import '../assets/styles/stats-card.css';
function display(value) {
  if (value == null) return '0';
  if (typeof value === 'object' && 'count' in value) return display(value.count);
  return typeof value === 'string' || typeof value === 'number' ? value : '0';
}
function trend(value) {
  if (value == null) return undefined;
  if (typeof value === 'object' && 'trend' in value) return trend(value.trend);
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
export default function StatsCard({ title, value, percentage, icon, isTarget = false, completion }) {
  const change = trend(percentage);
  return <Card className='dashboard-stat-card'>
    <span className='dashboard-stat-card__icon' aria-hidden='true'>{icon || <ChartNoAxesCombined />}</span>
    <CardContent className='dashboard-stat-card__content'>
      <CardTitle className='dashboard-stat-card__title'>{title}</CardTitle>
      <div className='dashboard-stat-card__value'>{display(value)}</div>
      {isTarget ? <p className='dashboard-stat-card__trend'><span className='dashboard-stat-card__badge dashboard-stat-card__badge--neutral'>{completion ?? 0}%</span> completed</p> : change !== undefined && <p className='dashboard-stat-card__trend'>
        <span className={`dashboard-stat-card__badge dashboard-stat-card__badge--${change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral'}`}>{change > 0 ? '+' : ''}{change}%</span>
        <span>{change > 0 ? 'Higher than last week' : change < 0 ? 'Lower than last week' : 'No change since last week'}</span>
      </p>}
    </CardContent>
  </Card>;
}
