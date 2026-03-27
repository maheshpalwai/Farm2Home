// App.js
import React, { Suspense, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Analytics } from "@vercel/analytics/react";
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalAutoTranslator from './components/GlobalAutoTranslator';
import { useAuth } from './context/AuthContext';
import { db } from './firebase';
import { collection, onSnapshot } from 'firebase/firestore';

// Import styles
import './App.css';
import './styles/responsive.css';

// Lazy load pages for better performance - Using feature-based structure
const HomePage = React.lazy(() => import('./features/home/pages/HomePage'));
const FarmerDashboard = React.lazy(() => import('./features/farmer/pages/FarmerDashboard'));
// Using new modular ConsumerDashboard
const ConsumerDashboard = React.lazy(() => import('./features/consumer/pages/ConsumerDashboard'));
const AboutPage = React.lazy(() => import('./pages/AboutPage'));
const CartPage = React.lazy(() => import('./pages/CartPage'));
const OrdersPage = React.lazy(() => import('./pages/OrdersPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const ResourceSharePage = React.lazy(() => import('./pages/ResourceSharePage'));
const CropRecommendationPage = React.lazy(() => import('./pages/CropRecommendationPage'));
const OrderCheckout = React.lazy(() => import('./pages/OrderCheckout'))
const AdminDashboard = React.lazy(() => import('./features/admin/pages/AdminDashboard'));

// Splash screen shown while Firebase resolves auth state
const AuthSplash = () => (
  <div style={{
    position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    zIndex: 9999,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 28 }}>
      <span style={{ fontSize: 26, fontWeight: 800, color: '#15803d', letterSpacing: 1 }}>FARM</span>
      <img src={require('./logo/logo3.png')} alt="Farm 2 Home" style={{ height: 52 }} />
      <span style={{ fontSize: 26, fontWeight: 800, color: '#15803d', letterSpacing: 1 }}>HOME</span>
    </div>
    <div style={{
      width: 40, height: 40, border: '4px solid #d1fae5',
      borderTop: '4px solid #16a34a', borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <p style={{ marginTop: 18, color: '#6b7280', fontSize: 14 }}>Checking session...</p>
  </div>
);

// Loading component
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
  </div>
);

/**
 * PublicOnlyRoute — the inverse of ProtectedRoute.
 * Wraps the landing page ("/") and any auth pages ("/login", etc.).
 *
 * Loading     → show splash (Firebase hasn't resolved yet)
 * Logged in   → redirect to their dashboard (prevents showing login to authed users)
 * Not logged in → render the public page normally
 */
const PublicOnlyRoute = ({ children }) => {
  const { currentUser, userData, loading } = useAuth();

  if (loading) return <AuthSplash />;

  if (currentUser) {
    const role = userData?.role
    const dest = role === 'farmer' ? '/farmer-dashboard'
               : role === 'admin'  ? '/admin'
               : '/consumer'
    return <Navigate to={dest} replace />;
  }

  return children;
};

// Navigation wrapper component to handle navbar interactions
const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');
  const [cartCount, setCartCount] = useState(0);
  const [resourceNotifCount, setResourceNotifCount] = useState(0);

  const isConsumerPage = location.pathname === '/consumer';
  const isFarmerPage = location.pathname === '/farmer' || location.pathname === '/farmer-dashboard';

  // Update cart count from localStorage
  useEffect(() => {
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
        setCartCount(totalItems);
      } catch {
        setCartCount(0);
      }
    };

    updateCartCount();

    // cross-tab sync, same-tab custom events, and tab focus refresh
    window.addEventListener('storage', updateCartCount);
    window.addEventListener('cartUpdated', updateCartCount);
    document.addEventListener('visibilitychange', updateCartCount);

    return () => {
      window.removeEventListener('storage', updateCartCount);
      window.removeEventListener('cartUpdated', updateCartCount);
      document.removeEventListener('visibilitychange', updateCartCount);
    };
  }, []);

  // Resource sharing counts
  useEffect(() => {
    if (!currentUser?.uid) {
      setResourceNotifCount(0);
      return;
    }
    const unsub = onSnapshot(collection(db, 'rental_requests'), (snap) => {
      const docs = snap.docs.map(d => d.data());
      const pending = docs.filter(r => {
        return (
          (r.toolOwnerId === currentUser.uid && r.status === 'Requested') ||
          (r.requesterId === currentUser.uid && r.status === 'Accepted')
        );
      }).length;
      setResourceNotifCount(pending);
    }, () => {});
    return () => unsub();
  }, [currentUser]);

  // Handle tab changes in consumer dashboard
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    switch(tab) {
      case 'browse':
        navigate('/consumer');
        break;
      case 'cart':
        navigate('/cart');
        break;
      case 'orders':
        navigate('/orders');
        break;
      case 'deals':
        // Handle deals - could scroll to deals section or navigate
        navigate('/consumer');
        break;
      case 'profile':
        navigate('/profile');
        break;
      default:
        break;
    }
  };

  const handleSearchClick = () => {
    // Scroll to products section or show search modal
    if (isConsumerPage) {
      const searchSection = document.querySelector('.products-area');
      if (searchSection) {
        searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <>
      <GlobalAutoTranslator />
      {loading && <AuthSplash />}
      {!isFarmerPage && (
        <Navbar 
          cartCount={cartCount}
          notifications={[]}
          isConsumerDashboard={isConsumerPage}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onSearchClick={handleSearchClick}
          showCart={true}
          showOrders={true}
          resourceNotifCount={resourceNotifCount}
        />
      )}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route
            path="/"
            element={
              <PublicOnlyRoute>
                <HomePage />
              </PublicOnlyRoute>
            }
          />
          <Route path="/about" element={<AboutPage />} />
          {/* /login, /signup, /auth redirect to "/" which PublicOnlyRoute guards */}
          <Route path="/auth" element={<Navigate to="/" replace />} />
          <Route path="/signup" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={['consumer']}>
                <OrderCheckout />
              </ProtectedRoute>
            }
          />
          <Route path="/profile" element={<ProfilePage />} />
          {/* Removed ecommerce route */}
          <Route path="/crop-recommendations" element={<CropRecommendationPage />} />
          
          {/* Resource Share - Protected route for farmers */}
          {/* Temporarily disabled authentication - will be added later */}
          <Route
            path="/resource-share"
            element={
              // <ProtectedRoute allowedRoles={['farmer']}>
                <ResourceSharePage />
              // </ProtectedRoute>
            }
          />

          <Route
            path="/farmer"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/farmer-dashboard"
            element={
              <ProtectedRoute allowedRoles={['farmer']}>
                <FarmerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/consumer"
            element={
              <ProtectedRoute allowedRoles={['consumer']}>
                <ConsumerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </>
  );
};

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <AppContent />
        </div>
        <Analytics />
      </Router>
    </ErrorBoundary>
  );
};

export default App;
