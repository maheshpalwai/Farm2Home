import { useEffect, useState, useCallback } from 'react'
import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next';
import './Navbar.css'
// Removed unused icons: FaUser, FaSignOutAlt, FaBars, FaTimes, FaCog, FaStore, FaHome, FaLeaf, FaSearch, FaArrowLeft, FaArrowRight
import { FaShoppingCart, FaBoxOpen, FaBell, FaChevronLeft, FaChevronRight, FaTools, FaLeaf, FaBars, FaTimes, FaHome, FaGift, FaHistory, FaUserCircle, FaSearch, FaGlobe, FaCog, FaSignOutAlt, FaMapPin } from 'react-icons/fa'

// Pass cartCount and notificationCount as props
const Navbar = React.memo(({ 
  showCart = false, 
  showOrders = false, 
  cartCount = 0, 
  notifications = [],
  isConsumerDashboard = false,
  activeTab = 'browse',
  onTabChange = () => {},
  onSearchClick = () => {}
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [hoveredItem, setHoveredItem] = useState(null)
  const [activeLanguage, setActiveLanguage] = useState('en')
  const [scrollY, setScrollY] = useState(0)
  const [userRole, setUserRole] = useState(null) // 'farmer' or 'consumer'
  const { t, i18n } = useTranslation();
  
  // Initialize active language
  useEffect(() => {
    setActiveLanguage(i18n.language)
  }, [i18n.language])

  // Detect user role based on current path
  useEffect(() => {
    const path = location.pathname
    if (path.startsWith('/farmer')) {
      setUserRole('farmer')
    } else if (path.startsWith('/consumer')) {
      setUserRole('consumer')
    } else {
      setUserRole(null)
    }
  }, [location.pathname])

  // Get breadcrumb data based on current location
  const getBreadcrumbs = () => {
    const path = location.pathname
    const breadcrumbs = [{label: 'Home', icon: '🏠', path: '/'}]
    
    if (path === '/consumer') {
      breadcrumbs.push({label: 'Dashboard', icon: '👥', path: '/consumer'})
      if (activeTab === 'cart') breadcrumbs.push({label: 'Cart', icon: '🛒', path: '#'})
      else if (activeTab === 'orders') breadcrumbs.push({label: 'Orders', icon: '📦', path: '#'})
      else if (activeTab === 'profile') breadcrumbs.push({label: 'Profile', icon: '👤', path: '#'})
    } else if (path === '/farmer') {
      breadcrumbs.push({label: 'Farmer Dashboard', icon: '👨‍🌾', path: '/farmer'})
    } else if (path === '/about') {
      breadcrumbs.push({label: 'About Us', icon: 'ℹ️', path: '/about'})
    }
    
    return breadcrumbs
  }

  // Check if we're on farmer dashboard
  const isFarmerDashboard = location.pathname === '/farmer'
  const isConsumerPage = location.pathname === '/consumer'

  // Optimized scroll handler with useCallback
  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 20)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Optimized navigation handlers
  const handleOrdersClick = useCallback(() => navigate('/orders'), [navigate])
  const handleCartClick = useCallback(() => navigate('/cart'), [navigate])
  const handleResourceShareClick = useCallback(() => navigate('/resource-share'), [navigate])
  // Removed ecommerce handler
  const handleAboutClick = useCallback(() => navigate('/about'), [navigate])
  const handleHomeClick = useCallback(() => navigate('/'), [navigate])
  const handleBackClick = useCallback((e) => {
    e.stopPropagation();
    navigate(-1);
  }, [navigate]);

  const handleForwardClick = useCallback((e) => {
    e.stopPropagation();
    navigate(1);
  }, [navigate]);

  const handleCropRecommendations = useCallback(() => {
    window.open('/crop-recommendations', '_blank');
  }, []);

  const changeLanguage = useCallback((lng) => {
    i18n.changeLanguage(lng);
  }, [i18n]);

  return (
    <div className={`navbar-container ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-content">
        {/* Left - Logo and Brand */}
        <div className="navbar-left" style={{ display: 'flex', flexDirection: 'column', gap: 4, cursor: 'pointer' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={handleHomeClick}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <button className="nav-button nav-backward" title="Go Back" onClick={handleBackClick}>
                <FaChevronLeft size={14} />
              </button>
              <button className="nav-button nav-forward" title="Go Forward" onClick={handleForwardClick}>
                <FaChevronRight size={14} />
              </button>
            </div>
            
            {/* Enhanced Logo Section with Glow */}
            <div className="logo-section">
              <div className="logo-container" style={{ transform: `scale(${Math.max(0.8, 1 - scrollY / 2000)})` }}>
                <div className="logo-glow"></div>
                <span className="navbar-project-name" data-no-auto-translate="true">
                  FARM
                  <img src={require('../logo/logo3.png')} alt="Farm 2 Home Logo" style={{ height: 52, verticalAlign: 'middle' }} />
                  HOME
                </span>
              </div>
              
              {/* Emoji Badge */}
              <div className="emoji-badge">🌱 Farm Fresh</div>
              
              {/* Role Badge */}
              {userRole && (
                <div className={`role-badge role-${userRole}`}>
                  {userRole === 'farmer' ? '👨‍🌾 Farmer' : '👥 Consumer'}
                </div>
              )}
            </div>

            {/* Location Badge */}
            <div className="navbar-location-badge">
              <FaMapPin style={{fontSize: '12px', marginRight: '4px'}} />
              <span>Telangana</span>
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          <div className="breadcrumb-nav">
            {getBreadcrumbs().map((breadcrumb, index) => (
              <div key={index} className="breadcrumb-item">
                <span className="breadcrumb-icon">{breadcrumb.icon}</span>
                <span className="breadcrumb-text">{breadcrumb.label}</span>
                {index < getBreadcrumbs().length - 1 && <span className="breadcrumb-separator">›</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Center - Navigation Links */}
        <div className="navbar-center">
          {/* Consumer Dashboard Navigation */}
          {isConsumerPage && (
            <>
              <button 
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => onTabChange('profile')}
                onMouseEnter={() => setHoveredItem('profile')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <FaUserCircle className="nav-icon" />
                <span className="nav-text">{t('profile', 'Profile')}</span>
              </button>
              <button 
                className={`nav-item ${activeTab === 'cart' ? 'active' : ''}`}
                onClick={() => onTabChange('cart')}
                onMouseEnter={() => setHoveredItem('cart')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <FaShoppingCart className="nav-icon" />
                <span className="nav-text">{t('cart', 'Cart')}</span>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </button>
              <button 
                className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => onTabChange('orders')}
                onMouseEnter={() => setHoveredItem('orders')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <FaHistory className="nav-icon" />
                <span className="nav-text">{t('orders', 'Orders')}</span>
              </button>
            </>
          )}

          {/* Farmer Dashboard Navigation */}
          {isFarmerDashboard && (
            <>
              <button 
                className="nav-item"
                onClick={handleCropRecommendations}
                onMouseEnter={() => setHoveredItem('crops')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <FaLeaf className="nav-icon" />
                <span className="nav-text">{t('crop_recommendations', 'Crop Recommendations')}</span>
              </button>
              <button 
                className="nav-item"
                onClick={handleResourceShareClick}
                onMouseEnter={() => setHoveredItem('resources')}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <FaTools className="nav-icon" />
                <span className="nav-text">{t('resource_share', 'Resource Share')}</span>
              </button>
            </>
          )}

          {/* Common Navigation Items (only show when not on consumer page) */}
          {!isConsumerPage && showOrders && (
            <button 
              className="nav-item"
              onClick={handleOrdersClick}
              onMouseEnter={() => setHoveredItem('orders')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              <FaBoxOpen className="nav-icon" />
              <span className="nav-text">{t('orders')}</span>
            </button>
          )}
        </div>

        {/* Right - Search, Notifications, Language, About */}
        <div className="navbar-right">
          {/* Notifications */}
          <div className="notification-container">
            <button 
              className={`nav-button notification-btn ${showNotifications ? 'active' : ''}`}
              onClick={() => setShowNotifications(!showNotifications)}
              title="Notifications"
            >
              <FaBell />
              {notifications.length > 0 && (
                <span className="notification-badge" style={{
                  animation: notifications.length > 2 ? 'pulse 1s infinite' : 'none'
                }}>
                  {notifications.length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="notification-dropdown">
                {notifications.length > 0 ? (
                  notifications.map((notif, index) => (
                    <div className="notification-item" key={index}>
                      {/* Assuming notif object has icon, text, and time */}
                      <span className="notification-icon">{notif.icon}</span>
                      <div className="notification-content">
                        <p>{notif.text}</p>
                        <span className="notification-time">{notif.time}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notification-item">
                    <p>No new notifications.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Language Selector Enhanced */}
          <div className="language-container">
            <div className="language-selector-wrapper">
              <FaGlobe className="language-icon" />
              <select
                onChange={(e) => {
                  changeLanguage(e.target.value)
                  setActiveLanguage(e.target.value)
                }}
                value={activeLanguage}
                className="language-select"
                title="Change Language"
              >
                <option value="en">EN</option>
                <option value="hi">हिंदी</option>
                <option value="te">తెలుగు</option>
                <option value="ta">தமிழ்</option>
                <option value="ml">മലയാളം</option>
                <option value="kn">ಕನ್ನಡ</option>
              </select>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className={`mobile-menu-toggle ${showMobileMenu ? 'active' : ''}`}
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            title="Menu"
          >
            {showMobileMenu ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="mobile-menu">
          <div className="mobile-menu-header">
            <h3 style={{margin: 0, color: '#333'}}>Menu</h3>
            <button 
              className="close-mobile-menu"
              onClick={() => setShowMobileMenu(false)}
            >
              <FaTimes />
            </button>
          </div>
          {isConsumerPage && (
            <>
              <button className="mobile-menu-item" onClick={() => { onTabChange('profile'); setShowMobileMenu(false); }}>
                <FaUserCircle className="nav-icon" />
                <span>{t('profile', 'Profile')}</span>
              </button>
              <button className="mobile-menu-item" onClick={() => { onTabChange('cart'); setShowMobileMenu(false); }}>
                <FaShoppingCart className="nav-icon" />
                <span>{t('cart', 'Cart')}</span>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </button>
              <button className="mobile-menu-item" onClick={() => { onTabChange('orders'); setShowMobileMenu(false); }}>
                <FaHistory className="nav-icon" />
                <span>{t('orders', 'Orders')}</span>
              </button>
            </>
          )}
          {isFarmerDashboard && (
            <>
              <button className="mobile-menu-item" onClick={() => { handleCropRecommendations(); setShowMobileMenu(false); }}>
                <FaLeaf className="nav-icon" />
                <span>{t('crop_recommendations', 'Crop Recommendations')}</span>
              </button>
              <button className="mobile-menu-item" onClick={() => { handleResourceShareClick(); setShowMobileMenu(false); }}>
                <FaTools className="nav-icon" />
                <span>{t('resource_share', 'Resource Share')}</span>
              </button>
            </>
          )}
          {!isConsumerPage && showOrders && (
            <button className="mobile-menu-item" onClick={() => { handleOrdersClick(); setShowMobileMenu(false); }}>
              <FaBoxOpen className="nav-icon" />
              <span>{t('orders')}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
})

export default Navbar
