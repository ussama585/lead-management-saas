import React from 'react';
import { ChevronDown } from 'lucide-react';
import '../assets/styles/settings-page.css';

export default function SettingsSection({ title, children }) {
  return <details className="settings-section" open>
    <summary className="settings-section__heading">
      <span>{title}</span><ChevronDown size={18} aria-hidden="true" />
    </summary>
    <div className="settings-section__body">{children}</div>
  </details>;
}
