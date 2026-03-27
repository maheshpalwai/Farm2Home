import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import './i18n';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SpeedInsights } from '@vercel/speed-insights/react';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
        <SpeedInsights />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);

// Preload critical resources
const preloadCriticalResources = () => {
  const criticalImages = [
    '/images/fruits.jpg',
    '/images/vegetables.jpg',
    '/images/dry fruits.jpg',
    '/images/apple.jpg',
    '/images/banana.jpg'
  ];

  criticalImages.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
};

// Execute preloading after initial render
setTimeout(preloadCriticalResources, 100);
