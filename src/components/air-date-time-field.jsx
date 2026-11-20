import React, { useEffect, useId, useRef, useState } from 'react';
import AirDatepicker from 'air-datepicker';
import localeEn from 'air-datepicker/locale/en';
import { CalendarDays, X } from 'lucide-react';
import { Input } from './ui/input.jsx';
import 'air-datepicker/air-datepicker.css';
import '../assets/styles/air-date-time-field.css';

// The locale package is CommonJS; normalize its default export for Vite too.
const englishLocale = localeEn.default ?? localeEn;

export default function AirDateTimeField({ label, name, value, onChange, onBlur, error, touched, disabled = false }) {
  const id = useId();
  const root = useRef(null);
  const calendar = useRef(null);
  const picker = useRef(null);
  const callbacks = useRef({ onChange, onBlur });
  callbacks.current = { onChange, onBlur };
  const [open, setOpen] = useState(false);
  const invalid = Boolean(touched && error);
  const timestamp = value ? new Date(value).getTime() : null;

  useEffect(() => {
    if (!open || disabled) return;
    const minDate = new Date();
    minDate.setHours(0, 0, 0, 0);
    const instance = new AirDatepicker(calendar.current, {
      inline: true,
      locale: englishLocale,
      timepicker: true,
      timeFormat: 'hh:mm AA',
      dateFormat: 'dd MMM yyyy',
      minutesStep: 5,
      minDate,
      toggleSelected: false,
      onSelect: ({ date }) => callbacks.current.onChange?.(date ? new Date(date) : null),
    });
    picker.current = instance;
    return () => { picker.current = null; instance.destroy(); };
  }, [open, disabled]);

  useEffect(() => {
    if (!picker.current) return;
    if (timestamp != null && Number.isFinite(timestamp)) {
      picker.current.selectDate(new Date(timestamp), { silent: true, updateTime: true });
    } else picker.current.clear({ silent: true });
  }, [timestamp, open, disabled]);

  useEffect(() => {
    if (!open) return;
    const close = event => {
      const outside = !calendar.current?.contains(event.target)
        && !root.current?.querySelector('.air-date-time-field__control')?.contains(event.target);
      if (event.type === 'keydown' ? event.key === 'Escape' : outside) {
        if (event.type === 'keydown') event.stopPropagation();
        setOpen(false);
        callbacks.current.onBlur?.();
      }
    };
    document.addEventListener('pointerdown', close, true);
    document.addEventListener('keydown', close, true);
    return () => {
      document.removeEventListener('pointerdown', close, true);
      document.removeEventListener('keydown', close, true);
    };
  }, [open]);

  const text = timestamp != null && Number.isFinite(timestamp)
    ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).format(new Date(timestamp)).replace(/am|pm/g, part => part.toUpperCase()) : '';

  return <div ref={root} className="air-date-time-field">
    <label htmlFor={id} className="form-label">{label}</label>
    <div className="air-date-time-field__control">
      <Input id={id} name={name} value={text} readOnly disabled={disabled}
        placeholder="Select next follow-up date and time" aria-invalid={invalid}
        aria-describedby={invalid ? `${id}-error` : undefined} aria-expanded={open && !disabled}
        onClick={() => setOpen(current => !current)} onKeyDown={event => {
          if (event.key === 'Enter' || event.key === 'ArrowDown' || event.key === ' ') { event.preventDefault(); setOpen(true); }
        }} onBlur={onBlur} />
      {value && !disabled && <button type="button" className="air-date-time-field__clear" aria-label="Clear next follow-up" title="Clear date and time"
        onClick={() => { onChange(null); onBlur?.(); }}><X size={12} /></button>}
      <CalendarDays size={16} className="air-date-time-field__icon" aria-hidden="true" />
    </div>
    {invalid && <div id={`${id}-error`} className="validation-message text-red">{error}</div>}
    {open && !disabled && <div className="air-date-time-field__panel">
      <div ref={calendar} />
    </div>}
  </div>;
}
