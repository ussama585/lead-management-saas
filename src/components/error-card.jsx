import React from 'react';
import '../assets/styles/legacy/error-card.css';

const ErrorCard = ({ message, onRetry }) => {
  return (
    <div className="error-card-container">
      <div className="error-card-content">
        {/* Error Icon */}
        <div className="error-card-icon-wrapper">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#dc3545"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        {/* Error Message */}
        <h3 className="error-card-title">
          Oops! Something went wrong
        </h3>
        
        <p className="error-card-message">
          {message || 'Unable to load the requested data.'}
        </p>

        {/* Action Buttons */}
        <div className="error-card-actions">
          {onRetry && (
            <button
              onClick={onRetry}
              className="error-card-btn-retry"
            >
              Try Again
            </button>
          )}
          <button
            onClick={() => window.history.back()}
            className="error-card-btn-back"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default ErrorCard;
