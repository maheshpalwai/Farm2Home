// Utility functions for location-based features

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Convert degrees to radians
 */
const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};

/**
 * Filter products by distance from user location
 * @param {Array} products - Array of products with location data
 * @param {Object} userLocation - User's current location {lat, lng}
 * @param {number} maxDistance - Maximum distance in km
 * @returns {Array} Filtered products within distance
 */
export const filterByDistance = (products, userLocation, maxDistance) => {
  if (!userLocation || maxDistance === 'any') return products;
  
  return products.filter(product => {
    if (!product.location || !product.location.lat || !product.location.lng) {
      return false;
    }
    
    const distance = calculateDistance(
      userLocation.lat,
      userLocation.lng,
      product.location.lat,
      product.location.lng
    );
    
    return distance <= parseFloat(maxDistance);
  }).map(product => ({
    ...product,
    distance: calculateDistance(
      userLocation.lat,
      userLocation.lng,
      product.location.lat,
      product.location.lng
    )
  }));
};

/**
 * Sort products by distance from user
 * @param {Array} products - Array of products with distance data
 * @returns {Array} Sorted products
 */
export const sortByDistance = (products) => {
  return [...products].sort((a, b) => {
    if (!a.distance && !b.distance) return 0;
    if (!a.distance) return 1;
    if (!b.distance) return -1;
    return a.distance - b.distance;
  });
};

/**
 * Get user's current location
 * @returns {Promise<Object>} Promise resolving to {lat, lng}
 */
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(error);
      }
    );
  });
};

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance string
 */
export const formatDistance = (distance) => {
  if (!distance) return '';
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};
