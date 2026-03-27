import React, { useState, useEffect } from 'react';
import './ShowCrops.css';
import { FaSearch, FaMapMarkerAlt, FaSort, FaLeaf, FaRupeeSign, FaCalendarAlt } from 'react-icons/fa';

const ShowCrops = ({ showAdminInfo = false }) => {
  const [crops, setCrops] = useState([]);
  const [filteredCrops, setFilteredCrops] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [sortBy, setSortBy] = useState('default');
  const [loading, setLoading] = useState(true);

  // Districts list (South Indian districts)
  const districts = [
    'All Districts',
    'Warangal',
    'Guntur',
    'Karimnagar',
    'Nizamabad',
    'Hyderabad',
    'Visakhapatnam',
    'Vijayawada',
    'Nalgonda',
    'Khammam',
    'Medak',
    'Rangareddy',
    'Adilabad',
    'Mahbubnagar',
    'Nellore',
    'Kurnool',
    'Anantapur',
    'Chittoor'
  ];

  // Fetch crops from localStorage
  useEffect(() => {
    const fetchCrops = async () => {
      try {
        setLoading(true);
        const cropsData = JSON.parse(localStorage.getItem('crops') || '[]');
        setCrops(cropsData);
        setFilteredCrops(cropsData);
      } catch (error) {
        console.error('Error fetching crops:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCrops();
  }, []);

  // Filter and sort crops whenever filters change
  useEffect(() => {
    let filtered = [...crops];

    // Search filter (case-insensitive)
    if (searchTerm) {
      filtered = filtered.filter(crop =>
        crop.cropName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // District filter
    if (selectedDistrict !== 'all') {
      filtered = filtered.filter(crop =>
        crop.district?.toLowerCase() === selectedDistrict.toLowerCase()
      );
    }

    // Sort
    if (sortBy === 'price_low') {
      filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price_high') {
      filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'newest') {
      filtered.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB - dateA;
      });
    }

    setFilteredCrops(filtered);
  }, [searchTerm, selectedDistrict, sortBy, crops]);

  return (
    <div className="show-crops-container">
      {/* Sticky Header with Search and Filters */}
      <div className="crops-header-sticky">
        <div className="crops-header-content">
          <h2 className="crops-title">
            <FaLeaf className="title-icon" />
            Available Crops
          </h2>

          <div className="filters-bar">
            {/* Search Input */}
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search for crops like Rice, Tomato..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* District Filter */}
            <div className="filter-group">
              <FaMapMarkerAlt className="filter-icon" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Districts</option>
                {districts.slice(1).map((district) => (
                  <option key={district} value={district.toLowerCase()}>
                    {district}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="filter-group">
              <FaSort className="filter-icon" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="default">Sort By</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="newest">Newest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Crops Grid */}
      <div className="crops-content">
        {loading ? (
          <div className="loading-container">
            <div className="loader"></div>
            <p>Loading crops...</p>
          </div>
        ) : filteredCrops.length === 0 ? (
          <div className="no-crops-message">
            <FaLeaf className="no-crops-icon" />
            <h3>No crops found in this area</h3>
            <p>Try adjusting your filters or search for different crops</p>
          </div>
        ) : (
          <div className="crops-grid">
            {filteredCrops.map((crop) => (
              <div key={crop.id} className="crop-card">
                <div className="crop-image-container">
                  <img 
                    src={crop.imageURL || 'https://cdn-icons-png.flaticon.com/512/6008/6008522.png'} 
                    alt={crop.cropName}
                    className="crop-image"
                  />
                  {crop.status === 'available' && (
                    <span className="badge-available">Available</span>
                  )}
                </div>

                <div className="crop-details">
                  <h3 className="crop-name">{crop.cropName}</h3>
                  
                  <div className="crop-location">
                    <FaMapMarkerAlt className="location-icon" />
                    <span>{crop.district || 'Unknown'}</span>
                  </div>

                  <div className="crop-price">
                    <FaRupeeSign className="rupee-icon" />
                    <span className="price-value">{crop.price || 'N/A'}</span>
                    <span className="price-unit">per kg</span>
                  </div>

                  <div className="crop-quantity">
                    <strong>Quantity:</strong> {crop.quantity || 'N/A'}
                  </div>

                  {/* Admin-only: Show creation date */}
                  {showAdminInfo && crop.createdAt && (
                    <div className="crop-date" style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                      <FaCalendarAlt style={{ marginRight: '4px' }} />
                      <strong>Added:</strong> {crop.createdAt?.toDate ? crop.createdAt.toDate().toLocaleDateString() : new Date(crop.createdAt).toLocaleDateString()}
                    </div>
                  )}

                  {crop.farmerId && (
                    <div className="farmer-info">
                      <small>Farmer ID: {crop.farmerId}</small>
                    </div>
                  )}

                  <button className="buy-button">
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowCrops;
