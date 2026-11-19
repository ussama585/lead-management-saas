import React from 'react';
import { ArrowLeft } from 'lucide-react';
import '../assets/styles/back-button.css';

export default function BackButton({ onClick }) {
  return <button type="button" className="app-back-button" aria-label="Go back" title="Go back" onClick={onClick}>
    <ArrowLeft size={24} aria-hidden="true" />
  </button>;
}
