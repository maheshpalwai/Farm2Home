import React from 'react';
import LazyImage from './LazyImage';

const OptimizedImage = ({ 
  src, 
  alt, 
  width, 
  height, 
  className = '', 
  placeholder,
  quality = 80,
  ...props 
}) => {
  // Create optimized image URL (you can integrate with image CDN services like Cloudinary)
  const createOptimizedUrl = (originalSrc, width, height, quality) => {
    // For now, return original src. In production, you'd integrate with CDN:
    // return `https://res.cloudinary.com/your-cloud/image/fetch/w_${width},h_${height},q_${quality}/${originalSrc}`;
    return originalSrc;
  };

  // Create responsive image srcSet for different screen sizes
  const createSrcSet = (src) => {
    if (!width || !height) return undefined;
    
    const sizes = [
      { suffix: '@1x', multiplier: 1 },
      { suffix: '@2x', multiplier: 2 },
      { suffix: '@3x', multiplier: 3 }
    ];

    return sizes
      .map(size => `${createOptimizedUrl(src, width * size.multiplier, height * size.multiplier, quality)} ${size.multiplier}x`)
      .join(', ');
  };

  return (
    <LazyImage
      src={createOptimizedUrl(src, width, height, quality)}
      srcSet={createSrcSet(src)}
      alt={alt}
      width={width}
      height={height}
      className={`optimized-image ${className}`}
      placeholder={placeholder}
      loading="lazy"
      decoding="async"
      {...props}
    />
  );
};

export default OptimizedImage;