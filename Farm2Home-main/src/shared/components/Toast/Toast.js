import React, { useState, useEffect } from 'react';

const Toast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose && onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const toastStyles = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '12px 20px',
    backgroundColor: type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3',
    color: 'white',
    borderRadius: '4px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 1000,
    maxWidth: '300px',
    fontSize: '14px',
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.3s ease'
  };

  return (
    <div style={toastStyles}>
      {message}
      <button
        onClick={() => {
          setIsVisible(false);
          onClose && onClose();
        }}
        style={{
          background: 'none',
          border: 'none',
          color: 'white',
          float: 'right',
          marginLeft: '10px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        ×
      </button>
    </div>
  );
};

export default Toast;