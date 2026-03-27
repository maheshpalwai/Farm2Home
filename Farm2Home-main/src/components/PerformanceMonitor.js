import React, { useState, useEffect, useMemo } from 'react';

const PerformanceMonitor = ({ isVisible = false }) => {
  const [metrics, setMetrics] = useState({
    fps: 0,
    memory: 0,
    loadTime: 0,
    renderTime: 0
  });

  const [isMonitoring, setIsMonitoring] = useState(false);

  // Performance monitoring
  useEffect(() => {
    if (!isMonitoring) return;

    let frameCount = 0;
    let lastTime = performance.now();
    let animationId;

    const measurePerformance = () => {
      const currentTime = performance.now();
      frameCount++;

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        
        setMetrics(prev => ({
          ...prev,
          fps,
          memory: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) : 0,
          renderTime: performance.now() - lastTime
        }));

        frameCount = 0;
        lastTime = currentTime;
      }

      animationId = requestAnimationFrame(measurePerformance);
    };

    animationId = requestAnimationFrame(measurePerformance);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isMonitoring]);

  // Measure page load time
  useEffect(() => {
    if (performance.timing) {
      const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
      setMetrics(prev => ({ ...prev, loadTime }));
    }
  }, []);

  const performanceStatus = useMemo(() => {
    if (metrics.fps >= 55) return { color: '#28a745', status: 'Excellent' };
    if (metrics.fps >= 45) return { color: '#ffc107', status: 'Good' };
    if (metrics.fps >= 30) return { color: '#fd7e14', status: 'Fair' };
    return { color: '#dc3545', status: 'Poor' };
  }, [metrics.fps]);

  if (!isVisible) return null;

  return (
    <div style={monitorContainer}>
      <div style={monitorHeader}>
        <h4>Performance Monitor</h4>
        <button 
          onClick={() => setIsMonitoring(!isMonitoring)}
          style={{
            ...monitorButton,
            backgroundColor: isMonitoring ? '#dc3545' : '#28a745'
          }}
        >
          {isMonitoring ? 'Stop' : 'Start'} Monitoring
        </button>
      </div>
      
      <div style={metricsGrid}>
        <div style={metricCard}>
          <h5>FPS</h5>
          <span style={{ ...metricValue, color: performanceStatus.color }}>
            {metrics.fps}
          </span>
          <small style={{ color: performanceStatus.color }}>
            {performanceStatus.status}
          </small>
        </div>
        
        <div style={metricCard}>
          <h5>Memory (MB)</h5>
          <span style={metricValue}>{metrics.memory}</span>
        </div>
        
        <div style={metricCard}>
          <h5>Load Time (ms)</h5>
          <span style={metricValue}>{metrics.loadTime}</span>
        </div>
        
        <div style={metricCard}>
          <h5>Render Time (ms)</h5>
          <span style={metricValue}>{Math.round(metrics.renderTime)}</span>
        </div>
      </div>
    </div>
  );
};

const monitorContainer = {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  backgroundColor: 'rgba(0, 0, 0, 0.9)',
  color: 'white',
  padding: '15px',
  borderRadius: '8px',
  fontSize: '12px',
  zIndex: 1000,
  minWidth: '200px'
};

const monitorHeader = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '10px'
};

const monitorButton = {
  padding: '4px 8px',
  border: 'none',
  borderRadius: '4px',
  color: 'white',
  fontSize: '10px',
  cursor: 'pointer'
};

const metricsGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '8px'
};

const metricCard = {
  textAlign: 'center',
  padding: '8px',
  backgroundColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '4px'
};

const metricValue = {
  fontSize: '16px',
  fontWeight: 'bold',
  display: 'block'
};

export default React.memo(PerformanceMonitor); 