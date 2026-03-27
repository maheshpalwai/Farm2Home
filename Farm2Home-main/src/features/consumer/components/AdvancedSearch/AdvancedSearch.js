import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaSearch, FaMapMarkerAlt, FaFilter, FaTimes } from 'react-icons/fa';
import './AdvancedSearch.css';

const AdvancedSearch = ({ onSearch, onFilter }) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({
    category: 'all',
    minPrice: '',
    maxPrice: '',
    distance: 'any',
    rating: 0,
    organic: false,
    inStock: true
  });

  useEffect(() => {
    // Get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          // Location access denied — silently ignore
        }
      );
    }
  }, []);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (onFilter) {
      onFilter(newFilters, userLocation);
    }
  };

  const clearFilters = () => {
    const defaultFilters = {
      category: 'all',
      minPrice: '',
      maxPrice: '',
      distance: 'any',
      rating: 0,
      organic: false,
      inStock: true
    };
    setFilters(defaultFilters);
    if (onFilter) {
      onFilter(defaultFilters, userLocation);
    }
  };

  const applyFilters = () => {
    if (onFilter) {
      onFilter(filters, userLocation);
    }
    setShowFilters(false);
  };

  return (
    <div className="advanced-search-container">
      {/* Search Bar */}
      <div className="search-bar-wrapper">
        <div className="search-input-group">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder={t('search_products')}
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <FaTimes 
              className="clear-search-icon" 
              onClick={() => {
                setSearchTerm('');
                if (onSearch) onSearch('');
              }}
            />
          )}
        </div>
        <button 
          className="filter-toggle-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> {t('filter')}
        </button>
      </div>

      {/* Location Display */}
      {userLocation && (
        <div className="location-display">
          <FaMapMarkerAlt className="location-icon" />
          <span>{t('location')}: {t('detected')}</span>
        </div>
      )}

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="filters-panel">
          <div className="filters-header">
            <h3>{t('advanced_search')}</h3>
            <button onClick={() => setShowFilters(false)} className="close-filters-btn">
              <FaTimes />
            </button>
          </div>

          <div className="filters-content">
            {/* Category Filter */}
            <div className="filter-group">
              <label>{t('filter_by_category')}</label>
              <select 
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="filter-select"
              >
                <option value="all">{t('all')}</option>
                <option value="vegetables">{t('vegetables')}</option>
                <option value="fruits">{t('fruits')}</option>
                <option value="grains">{t('grains')}</option>
                <option value="pulses">{t('pulses')}</option>
                <option value="dairy">{t('dairy')}</option>
                <option value="dry_fruits">{t('dry_fruits')}</option>
              </select>
            </div>

            {/* Price Range Filter */}
            <div className="filter-group">
              <label>{t('filter_by_price')}</label>
              <div className="price-range-inputs">
                <input
                  type="number"
                  placeholder={t('min_price')}
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="filter-input"
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder={t('max_price')}
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="filter-input"
                />
              </div>
            </div>

            {/* Distance Filter */}
            {userLocation && (
              <div className="filter-group">
                <label>{t('filter_by_distance')}</label>
                <select 
                  value={filters.distance}
                  onChange={(e) => handleFilterChange('distance', e.target.value)}
                  className="filter-select"
                >
                  <option value="any">{t('any_distance')}</option>
                  <option value="5">{t('within_5km')}</option>
                  <option value="10">{t('within_10km')}</option>
                  <option value="25">{t('within_25km')}</option>
                  <option value="50">{t('within_50km')}</option>
                </select>
              </div>
            )}

            {/* Rating Filter */}
            <div className="filter-group">
              <label>{t('filter_by_rating')}</label>
              <div className="rating-filter">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className={`star-btn ${filters.rating >= star ? 'active' : ''}`}
                    onClick={() => handleFilterChange('rating', star)}
                  >
                    ★
                  </button>
                ))}
                <span className="rating-text">{filters.rating > 0 && `${filters.rating}+ Stars`}</span>
              </div>
            </div>

            {/* Checkbox Filters */}
            <div className="filter-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.organic}
                  onChange={(e) => handleFilterChange('organic', e.target.checked)}
                />
                <span>{t('organic')}</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.inStock}
                  onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                />
                <span>{t('in_stock')}</span>
              </label>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="filters-actions">
            <button onClick={clearFilters} className="clear-filters-btn">
              {t('clear_filters')}
            </button>
            <button onClick={applyFilters} className="apply-filters-btn">
              {t('apply_filters')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
