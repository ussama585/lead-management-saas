import React from 'react';
import '../assets/styles/legacy/required-skill-card-component.css';

const RequiredSkillCard = ({ skillTitle, experience, lastUsed }) => {
  return (
    <div className="skill-card">
      <div className="skill-header">
        <h3>{skillTitle}</h3>
      </div>
      <div className="skill-info">
        <p>Experience: {experience}</p>
        <p>Last Used: {lastUsed}</p>
      </div>
    </div>
  );
};

export default RequiredSkillCard;