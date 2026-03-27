import React from 'react';
import { FaSort } from 'react-icons/fa';
import './FilterSection.css';

const FilterSection = ({
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  organicOnly,
  onOrganicToggle,
  onResetFilters,
  categories = [
    { id: 'all', label: 'All Products' },
    { id: 'Fruits', label: 'Fruits' },
    { id: 'Vegetables', label: 'Vegetables' },
    { id: 'Dry Fruits', label: 'Dry Fruits' },
  ]
}) => {
  return (
    <div className="filter-section">
      {/* Organic Toggle + Reset — above categories */}
      <div className="filter-group" style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-start', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          className={`organic-toggle-btn ${organicOnly ? 'organic-toggle-btn--on' : ''}`}
          onClick={() => onOrganicToggle(!organicOnly)}
        >
          Organic Only
        </button>
        <button
          type="button"
          onClick={onResetFilters}
          style={{ background: '#ef4444', border: '2px solid #ef4444', color: 'white', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer', letterSpacing: '0.2px', boxShadow: '0 3px 10px rgba(239,68,68,0.35)', transition: 'all 0.25s ease' }}
        >
          Reset
        </button>
      </div>

      {/* Category Filter */}
      <div className="filter-group">
        <label className="filter-label">Category</label>
        <div className="category-buttons">
          {categories.map((cat) => (
            <button
              type="button"
              key={cat.id}
              className={`category-btn ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => onCategoryChange(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort */}
      <div className="filter-controls">
        <div className="filter-control">
          <label className="filter-label">
            <FaSort /> Sort By
          </label>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
