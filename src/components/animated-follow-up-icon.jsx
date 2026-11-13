import React, { forwardRef } from 'react';
import '../assets/styles/animated-follow-up-icon.css';

// Can be a standalone action or the decorative icon inside an existing button.
const AnimatedFollowUpIcon = forwardRef(function AnimatedFollowUpIcon({
  onClick, onKeyDown, title, 'aria-label': ariaLabel, className = '', style, variant = 'clock', icon: Icon, tone = 'primary',
  size: _size, role: _role, tabIndex: _tabIndex, ...props
}, ref) {
  const interactive = Boolean(onClick);
  const Element = interactive ? 'button' : 'span';
  return <Element {...props} ref={ref} className={`animated-follow-up-icon ${className}`}
    style={{ ...style, color: undefined, fontSize: undefined, '--table-icon-color': tone === 'danger' ? '#dc2626' : '#3e6a9f' }}
    {...(interactive ? { type: 'button', onClick, onKeyDown, 'aria-label': ariaLabel || title || 'Follow Ups' } : { 'aria-hidden': true })}
    title={title}>
    <svg viewBox="0 0 24 24" width="32" height="32" fill="none" aria-hidden="true">
      <rect className="animated-follow-up-icon__face" x="2" y="2" width="20" height="20" rx="4.5" strokeWidth="1.5" />
      {Icon ? <g className="animated-follow-up-icon__hands"><Icon x="5" y="5" width="14" height="14" /></g> : variant === 'fields' ? <g className="animated-follow-up-icon__hands" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 7.5h10M7 11.5h6M7 15.5h3M16 13v5m-2.5-2.5h5" />
      </g> : variant === 'history' ? <g className="animated-follow-up-icon__hands" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 10a5 5 0 1 1 0 4M7 6.5V10h3.5" />
      </g> : <path className="animated-follow-up-icon__hands" d="M12 6v6l4 2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />}
    </svg>
  </Element>;
});

export default AnimatedFollowUpIcon;
