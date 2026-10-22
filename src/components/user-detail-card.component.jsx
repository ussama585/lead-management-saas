import React from 'react';
import { MapPin as EnvironmentFilled } from 'lucide-react';
import PropTypes from 'prop-types';
import CallIcon from '../assets/images/user-card-icons/call.svg';
import MailIcon from '../assets/images/user-card-icons/mail.svg';
import PencilIcon from '../assets/images/user-card-icons/pencil.svg';
import Avatar from 'react-avatar';
import '../assets/styles/legacy/create-user.css';

export default function UserDetailCard({ type, name, phoneNumber, email, onEditPicture, isCreate = false, showPencil = true, isClient = false, status = "-", location }) {
  return (
    <div className="card">
      <div className="heading-section">
        {!isCreate && !isClient && (
          <>
            {showPencil &&
              <h2>Personal Information</h2>
            }


            {showPencil && <img
              src={PencilIcon}
              alt="Edit Icon"
              className="pencil-icon"
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              onClick={onEditPicture} // Add click handler if needed
            />}

          </>
        )}
      </div>

      <div className="avatar-section">
        <div className="avatar-outer-container">
          <div className="avatar-container">
            <Avatar name={name} round={true} />
          </div>
          {(
            <h3 className="general-name" style={{ color: '#3E6A9F', textAlign: 'center' }}>
              {name}
            </h3>
          )}
        </div>
      </div>

      {!isCreate && (
        <div className="info-section">
          {type === 'user' && (
            <>
              {/* Phone and Email Info */}
              <div className="phone-container">
                <img src={CallIcon} alt="Phone Icon" className="phone-icon" />
                <span className="phone-number">{phoneNumber || 'Not Provided'}</span>
              </div>

              <div className="phone-container">
                <img src={MailIcon} alt="Mail Icon" className="phone-icon" />
                <span className="phone-number">{email || 'Not Provided'}</span>
              </div>

              {/* Show Location and Active Status if isClient is true */}
              {isClient && (
                <>
                  <div className="phone-container">
                    <EnvironmentFilled size="1em" className={["app-icon", "phone-icon"].filter(Boolean).join(' ')} style={{ fontSize: '22px', color: '#3E6A9F' }} />
                    <span className="phone-number">
                      {location?.city && location?.country
                        ? `${location.city}, ${location.country}`
                        : location?.city || location?.country || "-"}
                    </span>

                  </div>

                  <div className="status-container">
                    {status && (
                      <span
                        className="status"
                        style={{
                          backgroundColor: {
                            Potential: "#2DB1F8", // Blue
                            Unassigned: "#F4D03F", // Yellow
                            Active: "#008000", // Green
                            Dormant: "#AAB7B8", // Gray
                            Lost: "#E74C3C", // Red
                            Converted: "#AF7AC5", // Purple
                          }[status],
                        }}
                      >
                        {status}
                      </span>
                    )}
                  </div>


                </>
              )}


            </>
          )}

          {type === 'general' && (
            <div className="general-info">
              <div className="phone-container">
                <img src={CallIcon} alt="Phone Icon" className="phone-icon" />
                <span className="phone-number">{phoneNumber || "Not Provided"}</span>
              </div>

              <div className="phone-container">
                <img src={MailIcon} alt="Mail Icon" className="phone-icon" />
                <span className="phone-number">{email || "Not Provided"}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

UserDetailCard.propTypes = {
  type: PropTypes.oneOf(['user', 'general']).isRequired, // Must be either 'user' or 'general'
  name: PropTypes.string.isRequired, // Name of the user or general entity
  phoneNumber: PropTypes.string, // Only for user
  email: PropTypes.string, // Only for user
  onEditPicture: PropTypes.func, // Function to handle 'Edit Picture' or 'Add Picture' click
  isCreate: PropTypes.bool, // Flag to indicate if it's in create mode
  isClient: PropTypes.bool, // Flag to indicate if it's a client
  location: PropTypes.string,
};

// Default props
UserDetailCard.defaultProps = {
  phoneNumber: '', // Empty by default
  email: '', // Empty by default
  onEditPicture: () => { }, // Default to no action
  isCreate: false, // Default to false
  isClient: false, // Default to false
  location: 'City, Country', // Default location
};
