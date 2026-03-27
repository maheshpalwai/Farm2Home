import React from 'react';
import { FaExclamationTriangle, FaTimes, FaCheck } from 'react-icons/fa';

/**
 * NotificationModal component
 * Shows alerts for crop removal and other notifications
 */
const NotificationModal = ({ notification, onClear, onMarkAsRead }) => {
  if (!notification) return null;

  const handleClear = () => {
    onClear(notification.id);
  };

  const handleMarkAsRead = () => {
    onMarkAsRead(notification.id);
  };

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999
  };

  const modalContentStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    maxWidth: '500px',
    width: '90%',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    position: 'relative',
    animation: 'slideIn 0.3s ease-out'
  };

  const headerStyle = {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '15px',
    borderBottom: '2px solid #f0f0f0'
  };

  const iconStyle = {
    fontSize: '32px',
    color: notification.type === 'warning' ? '#ff9800' : '#f44336',
    marginRight: '15px'
  };

  const titleStyle = {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0
  };

  const messageStyle = {
    fontSize: '16px',
    color: '#666',
    lineHeight: '1.6',
    marginBottom: '20px'
  };

  const detailsStyle = {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#555'
  };

  const buttonContainerStyle = {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end'
  };

  const buttonStyle = {
    padding: '10px 20px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease'
  };

  const clearButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f44336',
    color: 'white'
  };

  const markReadButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#4CAF50',
    color: 'white'
  };

  return (
    <div style={modalOverlayStyle} onClick={(e) => e.stopPropagation()}>
      <div style={modalContentStyle}>
        <div style={headerStyle}>
          <FaExclamationTriangle style={iconStyle} />
          <h2 style={titleStyle}>
            {notification.title || 'Admin Alert'}
          </h2>
        </div>

        <div style={messageStyle}>
          {notification.message || 'Your crop was removed by the Admin.'}
        </div>

        {notification.cropName && (
          <div style={detailsStyle}>
            <strong>Crop Details:</strong>
            <div style={{ marginTop: '8px' }}>
              <div><strong>Name:</strong> {notification.cropName}</div>
              {notification.quantity && (
                <div><strong>Quantity:</strong> {notification.quantity}</div>
              )}
              {notification.reason && (
                <div style={{ marginTop: '8px', color: '#f44336' }}>
                  <strong>Reason:</strong> {notification.reason}
                </div>
              )}
            </div>
          </div>
        )}

        <div style={buttonContainerStyle}>
          <button
            style={markReadButtonStyle}
            onClick={handleMarkAsRead}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#45a049'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#4CAF50'}
          >
            <FaCheck /> Mark as Read
          </button>
          <button
            style={clearButtonStyle}
            onClick={handleClear}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#da190b'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#f44336'}
          >
            <FaTimes /> Clear
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateY(-50px);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default NotificationModal;
