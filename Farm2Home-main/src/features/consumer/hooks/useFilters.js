import { useState, useMemo } from 'react';

/**
 * Custom hook to manage product filtering and sorting
 * Handles search, category, price filters, and sorting
 */
export const useFilters = (products) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [organicOnly, setOrganicOnly] = useState(false);
  const [selectedStates, setSelectedStates] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 1000]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        (product.name || '').toLowerCase().includes(term) ||
        (product.description || '').toLowerCase().includes(term) ||
        (product.tags || []).some(tag => (tag || '').toLowerCase().includes(term))
      );
    }

    // Category filter (case-insensitive)
    if (selectedCategory && selectedCategory !== 'all') {
      const catLower = selectedCategory.toLowerCase();
      filtered = filtered.filter(product =>
        (product.category || '').toLowerCase() === catLower
      );
    }

    // Organic filter
    if (organicOnly) {
      filtered = filtered.filter(product => product.organic === true);
    }

    // Sorting
    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) => (a.pricePerKg || 0) - (b.pricePerKg || 0));
        break;
      case 'price_high':
        filtered.sort((a, b) => (b.pricePerKg || 0) - (a.pricePerKg || 0));
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.harvestDate || 0) - new Date(a.harvestDate || 0));
        break;
      case 'popular':
        filtered.sort((a, b) => (b.totalSales || 0) - (a.totalSales || 0));
        break;
      case 'featured':
      default:
        filtered.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return 0;
        });
        break;
    }

    return filtered;
  }, [products, searchTerm, selectedCategory, sortBy, organicOnly]);

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSortBy('featured');
    setOrganicOnly(false);
    setSelectedStates([]);
    setPriceRange([0, 1000]);
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    sortBy,
    setSortBy,
    organicOnly,
    setOrganicOnly,
    selectedStates,
    setSelectedStates,
    priceRange,
    setPriceRange,
    filteredProducts,
    resetFilters
  };
};
