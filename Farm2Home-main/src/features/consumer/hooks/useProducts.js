import { useState, useEffect } from 'react';
import { getAllProducts, subscribeToProducts, getProductsByCategory, getProductsByState } from '../../../services/productsService';
import { getSmartCropImage } from '../../../utils/smartImageMapper';
import { getCropCategory } from '../../../data/cropData';

/**
 * Custom hook for managing products from Firestore
 * Provides real-time product data and filtering capabilities
 * Now with smart image mapping for multi-language support
 */
export const useProducts = (options = {}) => {
  const { realtime = false, category = null, state = null } = options;
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Process products with smart image mapping and field normalization
   * Handles translation and fuzzy matching for crop names
   * Maps crop fields to product fields for consistency
   */
  const processProductsWithSmartImages = (productsData) => {
    return productsData.map(product => {
      // Normalize cropName to name field
      const productName = product.name || product.cropName || 'Unknown Product';
      const productPrice = product.pricePerKg || product.price || 0;
      
      return {
        ...product,
        // Normalize field names
        name: productName,
        pricePerKg: productPrice,
        price: productPrice,
        image: product.image || product.imageURL || getSmartCropImage(productName, product.category),
        originalName: productName,
        // Set defaults for missing fields
        category: product.category || getCropCategory(productName) || 'vegetables',
        state: product.state || 'Unknown',
        district: product.district || 'Unknown',
        village: product.village || product.district || 'Unknown',
        seller: product.seller || product.farmerEmail || 'Farmer',
        phone: product.phone || '',
        description: product.description || `Fresh ${productName} from local farms`,
        availability: product.availability || (product.quantity > 0 ? 'In Stock' : 'Out of Stock'),
        rating: product.rating || 4.5,
        totalSales: product.totalSales || 0,
        organic: product.organic !== undefined ? product.organic : true,
        unit: product.unit || 'kg',
        minOrder: product.minOrder || 1,
        maxOrder: product.maxOrder || product.quantity || 100,
        featured: product.featured || false,
        trending: product.trending || false,
        discount: product.discount || 0,
        originalPrice: product.originalPrice || productPrice,
        quantity: product.quantity || 0
      };
    });
  };

  useEffect(() => {
    let unsubscribe;

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        let result;
        
        // Fetch based on filters
        if (category) {
          result = await getProductsByCategory(category);
        } else if (state) {
          result = await getProductsByState(state);
        } else {
          result = await getAllProducts();
        }

        if (result.success) {
          // Process products with smart image mapping
          const processedProducts = processProductsWithSmartImages(result.products);
          setProducts(processedProducts);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Real-time updates if enabled
    if (realtime && !category && !state) {
      unsubscribe = subscribeToProducts((productsData) => {
        // Process products with smart image mapping
        const processedProducts = processProductsWithSmartImages(productsData);
        setProducts(processedProducts);
        setLoading(false);
      });
    } else {
      fetchProducts();
    }

    // Cleanup subscription
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [realtime, category, state]);

  return { products, loading, error };
};
