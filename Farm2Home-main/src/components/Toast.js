import React, { useState, useEffect } from 'react';

const ICONS = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚠',
};

const COLORS = {
  success: { border: '#16a34a', bg: '#f0fdf4', icon: '#16a34a', text: '#14532d' },
  error:   { border: '#dc2626', bg: '#fef2f2', icon: '#dc2626', text: '#7f1d1d' },
  info:    { border: '#2563eb', bg: '#eff6ff', icon: '#2563eb', text: '#1e3a8a' },
  warning: { border: '#d97706', bg: '#fffbeb', icon: '#d97706', text: '#78350f' },
};

const Toast = ({ message, type = 'info', duration = 3500, onClose }) => {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => dismiss(), duration);
    return () => clearTimeout(hide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => onClose && onClose(), 320);
  };

  const c = COLORS[type] || COLORS.info;

  return (
    <div
      onClick={dismiss}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        background: c.bg,
        border: `1px solid ${c.border}40`,
        borderLeft: `4px solid ${c.border}`,
        borderRadius: 10,
        padding: '12px 14px',
        boxShadow: '0 4px 18px rgba(0,0,0,0.13)',
        cursor: 'pointer',
        minWidth: 260,
        maxWidth: 360,
        transform: visible && !leaving ? 'translateX(0)' : 'translateX(110%)',
        opacity: visible && !leaving ? 1 : 0,
        transition: leaving
          ? 'transform 0.3s ease-in, opacity 0.3s ease-in'
          : 'transform 0.32s cubic-bezier(0.22,1,0.36,1), opacity 0.32s ease',
      }}
    >
      {/* Icon circle */}
      <div style={{
        flexShrink: 0,
        width: 28, height: 28,
        borderRadius: '50%',
        background: `${c.border}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: c.icon,
        fontWeight: 700, fontSize: 14,
      }}>
        {ICONS[type]}
      </div>

      {/* Message */}
      <div style={{ flex: 1, fontSize: 13.5, color: c.text, lineHeight: 1.45, fontWeight: 500, paddingTop: 3 }}>
        {message}
      </div>

      {/* Close */}
      <button
        onClick={e => { e.stopPropagation(); dismiss(); }}
        style={{
          flexShrink: 0,
          background: 'none', border: 'none',
          color: c.icon, cursor: 'pointer',
          fontSize: 16, lineHeight: 1, padding: 0, opacity: 0.7,
        }}
        aria-label="Close"
      >×</button>
    </div>
  );
};

export default Toast;