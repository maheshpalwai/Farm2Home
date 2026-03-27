import React, { useState, useEffect, useRef } from 'react';

const LazyImage = ({ src, alt, placeholder = null, className, style, ...props }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef();

  // Create a simple placeholder SVG if no placeholder is provided
  const createPlaceholderSVG = () => {
    return `data:image/svg+xml;base64,${btoa(`
      <svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f8f9fa"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" 
              fill="#6c757d" text-anchor="middle" dy=".3em">Loading...</text>
      </svg>
    `)}`;
  };

  // Default placeholder
  const defaultPlaceholder = placeholder || createPlaceholderSVG();

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.onload = () => {
              setImageSrc(src);
              setImageLoaded(true);
              setHasError(false);
            };
            img.onerror = () => {
              setImageSrc(defaultPlaceholder);
              setImageLoaded(true);
              setHasError(true);
            };
            img.src = src;
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );

    const currentRef = imgRef.current; // Capture ref value
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) { // Use captured value
        observer.unobserve(currentRef);
      }
    };
  }, [src, defaultPlaceholder]);

  // Show placeholder initially
  if (!imageSrc) {
    return (
      <div
        ref={imgRef}
        className={className}
        style={{
          ...style,
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6c757d',
          fontSize: '14px',
          border: '1px solid #e9ecef',
          borderRadius: '4px',
          minHeight: '150px'
        }}
        {...props}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🖼️</div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={className}
      style={{
        ...style,
        opacity: imageLoaded ? 1 : 0.7,
        transition: 'opacity 0.3s ease-in-out',
        backgroundColor: hasError ? '#f8f9fa' : 'transparent',
        border: hasError ? '1px solid #e9ecef' : 'none',
        borderRadius: hasError ? '4px' : '0'
      }}
      onError={() => {
        setImageSrc(defaultPlaceholder);
        setHasError(true);
      }}
      {...props}
    />
  );
};

export default React.memo(LazyImage); 