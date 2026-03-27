// Performance utility functions

// Memoized product filtering
export const memoizedFilter = (() => {
  const cache = new Map();
  
  return (products, filters) => {
    const cacheKey = JSON.stringify({ products: products.length, filters });
    
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }
    
    const filtered = products.filter(product => {
      const matchesSearch = !filters.searchTerm || 
        product.crop.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        product.farmer.toLowerCase().includes(filters.searchTerm.toLowerCase());
      
      const matchesPrice = filters.priceRange === 'all' || 
        (filters.priceRange === 'low' && product.price <= 1000) ||
        (filters.priceRange === 'medium' && product.price > 1000 && product.price <= 3000) ||
        (filters.priceRange === 'high' && product.price > 3000);
      
      return matchesSearch && matchesPrice;
    });
    
    // Sort if needed
    if (filters.sortType !== 'none') {
      filtered.sort((a, b) => {
        if (filters.sortType === 'low') return a.price - b.price;
        if (filters.sortType === 'high') return b.price - a.price;
        if (filters.sortType === 'rating') return b.rating - a.rating;
        return 0;
      });
    }
    
    cache.set(cacheKey, filtered);
    
    // Limit cache size
    if (cache.size > 100) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    return filtered;
  };
})();

// Optimized cart calculations
export const calculateCartTotal = (cart) => {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};

// Image lazy loading utility - updated to not rely on placeholder file
export const lazyLoadImage = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => {
      // Create a simple placeholder SVG instead of relying on file
      const placeholderSVG = `data:image/svg+xml;base64,${btoa(`
        <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f8f9fa"/>
          <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" 
                fill="#6c757d" text-anchor="middle" dy=".3em">Image not available</text>
        </svg>
      `)}`;
      resolve(placeholderSVG);
    };
    img.src = src;
  });
};

// Throttle function for scroll events
export const throttle = (func, limit) => {
  let inThrottle;
  return function() {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Deep comparison for objects
export const deepEqual = (obj1, obj2) => {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== typeof obj2) return false;
  
  if (typeof obj1 !== 'object') return obj1 === obj2;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }
  
  return true;
}; 