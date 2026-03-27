import { useEffect } from 'react';
import { logger } from '../utils/logger';

export const usePerformanceMonitor = (componentName) => {
  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Log slow renders in development
      if (renderTime > 16.67) { // 60fps threshold
        logger.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
      }
    };
  }, [componentName]);
};

export const measurePerformance = (fn, label) => {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  
  logger.log(`${label} took ${(end - start).toFixed(2)}ms`);
  return result;
};