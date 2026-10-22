import React from 'react';
import '../assets/styles/legacy/notification-card-component.css'; // Adjust the path as necessary

const Notification = ({ notification, isRead }) => {
  const notificationText = notification.length > 50 ? notification.substring(0, 47) + '...' : notification;

  return (
    <div className={`notification-container ${isRead ? 'read' : 'unread'}`}>
      {/* Red dot for unread notifications */}
      {!isRead && <div className="notification-dot"></div>}

      {/* Notification text */}
      <div className="notification-text">
        {notificationText}
      </div>
    </div>
  );
};

export default Notification;
