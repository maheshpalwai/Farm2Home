import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Shown while Firebase resolves the session — prevents incorrect redirects on refresh
const RouteLoader = () => (
  <div style={{
    position: 'fixed', inset: 0, display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#f0fdf4', zIndex: 9999,
  }}>
    <div style={{
      width: 36, height: 36, border: '4px solid #d1fae5',
      borderTop: '4px solid #16a34a', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

/**
 * ProtectedRoute — guards routes that require authentication + specific role.
 *
 * Loading   → show spinner (Firebase hasn't resolved session yet)
 * No user   → redirect to "/" with openModal state so the login card pops open
 * Wrong role→ redirect to the user's own dashboard (prevents URL-bar hacking)
 * Correct   → render children
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, userData, loading } = useAuth();

  // ① Wait for Firebase onAuthStateChanged to fire before making any decision.
  //    Without this, a page refresh always sees currentUser=null for ~200ms and
  //    incorrectly redirects every authenticated user back to the landing page.
  if (loading) return <RouteLoader />;

  // ② Not authenticated at all — send to home and open the login modal
  if (!currentUser) {
    const role = allowedRoles?.[0] || 'consumer';
    return <Navigate to="/" state={{ openModal: true, role }} replace />;
  }

  // ③ Authenticated but wrong role (e.g. consumer typing /farmer-dashboard in URL bar)
  if (allowedRoles && !allowedRoles.includes(userData?.role)) {
    const role = userData?.role
    const dest = role === 'farmer' ? '/farmer-dashboard'
               : role === 'admin'  ? '/admin'
               : '/consumer'
    return <Navigate to={dest} replace />;
  }

  // ④ All checks passed — render the protected page
  return children;
};

export default ProtectedRoute;
