import React, { useState } from 'react';
import { FaHeart, FaStar, FaShoppingCart, FaLeaf, FaTruck, FaShieldAlt, FaMapMarkerAlt, FaRupeeSign, FaCalendarAlt } from 'react-icons/fa';
import './ProductCard.css';

const ProductCard = ({
  product, 
  onAddToCart, 
  onToggleFavorite, 
  isFavorite,
  onViewDetails,
  onRequestNow,
  isAlreadyRequested = false,
}) => {
  const [imageError, setImageError] = useState(false);
  const defaultImage = '/images/default_crop.jpg';
  
  const handleAddToCart = (e) => {
    e.stopPropagation();
    onAddToCart(product);
  };

  const handleRequestNow = (e) => {
    e.stopPropagation();
    if (!isAlreadyRequested) {
      onRequestNow && onRequestNow(product);
    }
  };

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    onToggleFavorite(product.id);
  };
  
  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div 
      className="product-card"
      onClick={() => onViewDetails && onViewDetails(product)}
    >
      {/* Product Image */}
      <div className="product-image-container">
        <img 
          src={imageError ? defaultImage : product.image} 
          alt={product.name}
          className="product-image"
          loading="lazy"
          onError={handleImageError}
        />
        
        {/* Badges */}
        <div className="product-badges">
          {product.organic && (
            <span className="badge badge-organic">
              Organic
            </span>
          )}
          {product.featured && (
            <span className="badge badge-featured">Featured</span>
          )}
          {product.trending && (
            <span className="badge badge-trending">Trending</span>
          )}
        </div>

        {/* Favorite Button */}
        <button 
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={handleToggleFavorite}
          aria-label="Add to favorites"
        >
          <FaHeart />
        </button>

        {/* Discount Badge */}
        {product.discount > 0 && (
          <div className="discount-badge">
            {product.discount}% OFF
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        
        {/* Rating */}
        <div className="product-rating">
          <FaStar className="star-icon" />
          <span>{product.rating}</span>
          <span className="sales-count">({product.totalSales} sales)</span>
        </div>

        {/* Location */}
        <div className="product-location">
          <FaMapMarkerAlt />
          <span>{product.village}, {product.district}</span>
        </div>

        {/* Availability end date */}
        {product.availableUntil && (() => {
          const today = new Date().toISOString().split('T')[0];
          const isExpired = product.availableUntil < today;
          return (
            <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:11, fontWeight:600, color: isExpired ? '#dc2626' : '#059669', marginTop:4 }}>
              <FaCalendarAlt style={{ fontSize:10 }} />
              {isExpired ? 'Expired' : 'Available till'}: {new Date(product.availableUntil + 'T00:00:00').toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
            </div>
          );
        })()}

        {/* Price */}
        <div className="product-pricing">
          <div className="current-price">
            <FaRupeeSign />
            <span className="price">{product.pricePerKg}</span>
            <span className="unit">/{product.unit}</span>
          </div>
          {product.originalPrice > product.pricePerKg && (
            <div className="original-price">
              <FaRupeeSign />
              <span>{product.originalPrice}</span>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="product-features">
          {product.fastDelivery && (
            <span className="feature">
              <FaTruck /> Fast Delivery
            </span>
          )}
          {product.certifications && product.certifications.length > 0 && (
            <span className="feature">
              <FaShieldAlt /> Certified
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="product-action-btns">
          <button
            className="add-to-cart-btn"
            onClick={handleAddToCart}
          >
            <FaShoppingCart />
            Add to Cart
          </button>
          <button
            className="request-now-btn"
            onClick={handleRequestNow}
            disabled={isAlreadyRequested}
            title={isAlreadyRequested ? 'You already requested this crop' : 'Request this crop'}
          >
            {isAlreadyRequested ? 'Already Requested' : 'Request Now'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
