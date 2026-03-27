import { useEffect, useState, useCallback, useRef } from 'react'
import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next';
import './Navbar.css'
// Removed unused icons: FaUser, FaSignOutAlt, FaBars, FaTimes, FaCog, FaStore, FaHome, FaLeaf, FaSearch, FaArrowLeft, FaArrowRight, FaBoxOpen
import { FaShoppingCart, FaChevronLeft, FaChevronRight, FaTools, FaLeaf, FaBars, FaTimes, FaHome, FaGift, FaHistory, FaUserCircle, FaSearch, FaSignOutAlt, FaBell } from 'react-icons/fa'
import { useAuth } from '../context/AuthContext'

// Pass cartCount and notificationCount as props
const Navbar = React.memo(({ 
  showCart = false, 
  cartCount = 0, 
  notifications = [],
  isConsumerDashboard = false,
  isFarmerDashboard: isFarmerDashboardProp = false,
  activeTab = 'browse',
  onTabChange = () => {},
  onSearchClick = () => {},
  farmerNotifCount = 0,
  farmerNotifications = [],
  onFarmerNotifOpen = () => {},
  onFarmerNotifItemClick = () => {},
  resourceNotifCount = 0,
  onFarmerProfileClick = () => {},
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [isScrolled, setIsScrolled] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showNotifDropdown, setShowNotifDropdown] = useState(false)
  const notifRef = useRef(null)
  const { t, i18n } = useTranslation();
  const { signOut, currentUser } = useAuth();

  const handleLogout = useCallback(async () => {
    try { await signOut() } catch (e) {}
    localStorage.removeItem('currentUser')
    navigate('/')
  }, [signOut, navigate])

  // Check if we're on farmer dashboard
  const isFarmerDashboard = isFarmerDashboardProp || location.pathname === '/farmer' || location.pathname === '/farmer-dashboard'
  const isConsumerPage = location.pathname === '/consumer'
  const isResourceSharePage = location.pathname === '/resource-share'

  // Optimized scroll handler with useCallback
  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 20)
  }, [])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // Optimized navigation handlers
  const handleCartClick = useCallback(() => navigate('/cart'), [navigate])
  const handleResourceShareClick = useCallback(() => navigate('/resource-share'), [navigate])
  // Removed ecommerce handler
  const handleAboutClick = useCallback(() => navigate('/about'), [navigate])
  const handleHomeClick = useCallback(() => {
    if (isFarmerDashboard) {
      navigate('/farmer-dashboard');
    } else if (isConsumerPage) {
      navigate('/consumer');
    } else {
      navigate('/');
    }
  }, [navigate, isFarmerDashboard, isConsumerPage])
  const handleBackClick = useCallback((e) => {
    e.stopPropagation();
    navigate(-1);
  }, [navigate]);

  const handleForwardClick = useCallback((e) => {
    e.stopPropagation();
    navigate(1);
  }, [navigate]);

  const handleCropRecommendations = useCallback(() => {
    navigate('/crop-recommendations');
  }, [navigate]);

  const handleResourceShareNewTab = useCallback(() => {
    navigate('/resource-share');
  }, [navigate]);

  const changeLanguage = useCallback((lng) => {
    i18n.changeLanguage(lng);
  }, [i18n]);

  // Close notification dropdown on outside click
  useEffect(() => {
    if (!showNotifDropdown) return
    const handleOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showNotifDropdown])

  return (
    <div className={`navbar-container ${isScrolled ? 'scrolled' : ''}`}>
      <div className="navbar-content">
        {/* Left - Logo and Brand */}
        <div className="navbar-left" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={handleHomeClick}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button className="nav-button nav-backward" title="Go Back" onClick={handleBackClick}>
              <FaChevronLeft size={14} />
            </button>
            <button className="nav-button nav-forward" title="Go Forward" onClick={handleForwardClick}>
              <FaChevronRight size={14} />
            </button>
          </div>
          <span className="navbar-project-name navbar-brand-mark" data-no-auto-translate="true" style={{ display: 'flex', alignItems: 'center', gap: 0, whiteSpace: 'nowrap' }}>
            <span className="navbar-brand-text">FARM</span>
            <img src={require('../logo/logo3.png')} alt="Farm 2 Home Logo" className="navbar-brand-logo" />
            <span className="navbar-brand-text">HOME</span>
          </span>
        </div>

        {/* Center - Navigation Links */}
        <div className="navbar-center">
          {/* Consumer Dashboard Navigation */}
          {isConsumerPage && (
            <>
              <button 
                className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
                onClick={() => onTabChange('profile')}
              >
                <FaUserCircle className="nav-icon" />
                <span className="nav-text">Profile</span>
              </button>
              <button 
                className={`nav-item ${activeTab === 'cart' ? 'active' : ''}`}
                onClick={() => onTabChange('cart')}
              >
                <FaShoppingCart className="nav-icon" />
                <span className="nav-text">Cart</span>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </button>
              <button 
                className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
                onClick={() => onTabChange('orders')}
              >
                <FaHistory className="nav-icon" />
                <span className="nav-text">Orders</span>
              </button>
            </>
          )}

          {/* Farmer Dashboard Navigation */}
          {isFarmerDashboard && (
            <>
              <button className="nav-item" onClick={onFarmerProfileClick}>
                <FaUserCircle className="nav-icon" />
                <span className="nav-text">Profile</span>
              </button>
              <button className="nav-item" onClick={handleCropRecommendations}>
                <FaLeaf className="nav-icon" />
                <span className="nav-text">Crop Recommendations</span>
              </button>
              <button className="nav-item" onClick={handleResourceShareNewTab}>
                <FaTools className="nav-icon" />
                <span className="nav-text">Resource Sharing</span>
              </button>
            </>
          )}
        </div>

        {/* Right - Search, Notifications, Language, About */}
        <div className="navbar-right">
          {/* Search removed from homepage */}


          {/* Farmer Notification Bell */}
          {isFarmerDashboard && (
            <div className="farmer-notif-wrap" ref={notifRef}>
              <button
                className="farmer-notif-btn"
                title="Notifications"
                onClick={() => {
                  const opening = !showNotifDropdown
                  setShowNotifDropdown(opening)
                  if (opening) onFarmerNotifOpen()
                }}
              >
                <FaBell />
                {farmerNotifCount > 0 && (
                  <span className="farmer-notif-badge">
                    {farmerNotifCount > 99 ? '99+' : farmerNotifCount}
                  </span>
                )}
              </button>
              {showNotifDropdown && (
                <div className="farmer-notif-dropdown">
                  <div className="farmer-notif-header">
                    <span>Notifications</span>
                    {farmerNotifications.length > 0 && (
                      <span className="farmer-notif-header-count">{farmerNotifications.length}</span>
                    )}
                  </div>
                  {farmerNotifications.length === 0 ? (
                    <div className="farmer-notif-empty">🔔 All caught up! No pending requests.</div>
                  ) : (
                    <div className="farmer-notif-list">
                      {farmerNotifications.map(n => (
                        <button
                          key={n.id}
                          className="farmer-notif-item"
                          onClick={() => { setShowNotifDropdown(false); onFarmerNotifItemClick(n); }}
                        >
                          <span className="farmer-notif-item-icon">{n.icon}</span>
                          <div className="farmer-notif-item-body">
                            <div className="farmer-notif-item-title">{n.title}</div>
                            <div className="farmer-notif-item-sub">{n.subtitle}</div>
                          </div>
                          <span className="farmer-notif-item-time">{n.timeLabel}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          {/* Resource Notification Bell — hide on farmer dashboard to avoid duplicate bells */}
          {currentUser && !isFarmerDashboard && !isResourceSharePage && (
            <button
              className="rs-notif-bell-btn"
              title="Resource Sharing Notifications"
              onClick={() => navigate('/resource-share?tab=requests')}
            >
              <FaBell />
              {resourceNotifCount > 0 && (
                <span className="rs-notif-bell-badge">
                  {resourceNotifCount > 99 ? '99+' : resourceNotifCount}
                </span>
              )}
            </button>
          )}

          {/* Language Selector */}
          <div className="language-container">
            <select
              onChange={e => changeLanguage(e.target.value)}
              value={i18n.language}
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

          {/* Logout Button — shown on farmer AND consumer dashboards */}
          {(isFarmerDashboard || isConsumerPage) && (
            <button
              className="navbar-logout-btn"
              onClick={handleLogout}
              title="Logout"
            >
              <FaSignOutAlt />
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle" 
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
          {isConsumerPage && (
            <>
              <button className="mobile-menu-item" onClick={() => { onTabChange('profile'); setShowMobileMenu(false); }}>
                <FaUserCircle className="nav-icon" />
                <span>Profile</span>
              </button>
              <button className="mobile-menu-item" onClick={() => { onTabChange('cart'); setShowMobileMenu(false); }}>
                <FaShoppingCart className="nav-icon" />
                <span>Cart</span>
                {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
              </button>
              <button className="mobile-menu-item" onClick={() => { onTabChange('orders'); setShowMobileMenu(false); }}>
                <FaHistory className="nav-icon" />
                <span>Orders</span>
              </button>
              <button className="mobile-menu-item mobile-menu-item--logout" onClick={() => { handleLogout(); setShowMobileMenu(false); }}>
                <FaSignOutAlt className="nav-icon" />
                <span>Logout</span>
              </button>
            </>
          )}
          {isFarmerDashboard && (
            <>
              <button className="mobile-menu-item" onClick={() => { onFarmerProfileClick(); setShowMobileMenu(false); }}>
                <FaUserCircle className="nav-icon" />
                <span>Profile</span>
              </button>
              <button className="mobile-menu-item" onClick={() => { handleCropRecommendations(); setShowMobileMenu(false); }}>
                <FaLeaf className="nav-icon" />
                <span>Crop Recommendations</span>
              </button>
              <button className="mobile-menu-item" onClick={() => { handleResourceShareNewTab(); setShowMobileMenu(false); }}>
                <FaTools className="nav-icon" />
                <span>Resource Share</span>
              </button>
              <button className="mobile-menu-item mobile-menu-item--logout" onClick={() => { handleLogout(); setShowMobileMenu(false); }}>
                <FaSignOutAlt className="nav-icon" />
                <span>Logout</span>
              </button>
            </>
          )}

        </div>
      )}
    </div>
  )
})

export default Navbar
