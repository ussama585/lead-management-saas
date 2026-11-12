import React from 'react';
import { ArrowLeft } from 'lucide-react';
import '../assets/styles/back-button.css';

export default function BackButton({ onClick }) {
  return <button type="button" className="app-back-button" aria-label="Go back" title="Go back" onClick={onClick}>
    <span className="app-back-button__track" aria-hidden="true">
      <span className="app-back-button__arrow"><ArrowLeft size={30} /></span>
      <span className="app-back-button__arrow"><ArrowLeft size={30} /></span>
    </span>
  </button>;
}
