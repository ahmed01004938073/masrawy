// Performance and error monitoring utilities

import { config } from '@/config/environment';

// Performance metrics interface
interface PerformanceMetrics {
  pageLoadTime: number;
  domContentLoaded: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

// Error tracking interface
interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  lineNumber?: number;
  columnNumber?: number;
  timestamp: number;
  userAgent: string;
  userId?: string;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private errors: ErrorReport[] = [];

  constructor() {
    this.initializeMonitoring();
  }

  private initializeMonitoring() {
    // Monitor page load performance
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        this.collectPerformanceMetrics();
      });

      // Monitor errors
      window.addEventListener('error', (event) => {
        this.trackError({
          message: event.message,
          stack: event.error?.stack,
          url: event.filename || window.location.href,
          lineNumber: event.lineno,
          columnNumber: event.colno,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
        });
      });

      // Monitor unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.trackError({
          message: `Unhandled Promise Rejection: ${event.reason}`,
          stack: event.reason?.stack,
          url: window.location.href,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
        });
      });

      // Monitor Web Vitals
      this.observeWebVitals();
    }
  }

  private collectPerformanceMetrics() {
    if (!performance || !performance.timing) return;

    const timing = performance.timing;
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    this.metrics = {
      pageLoadTime: timing.loadEventEnd - timing.navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      firstContentfulPaint: this.getFirstContentfulPaint(),
      largestContentfulPaint: this.getLargestContentfulPaint(),
    };

    if (config.development.showPerformanceMetrics) {
      console.log('Performance Metrics:', this.metrics);
    }

    // Send metrics to analytics service
    this.sendMetrics();
  }

  private getFirstContentfulPaint(): number {
    const fcpEntry = performance.getEntriesByName('first-contentful-paint')[0];
    return fcpEntry ? fcpEntry.startTime : 0;
  }

  private getLargestContentfulPaint(): number {
    return new Promise((resolve) => {
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        resolve(lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });
    }) as any;
  }

  private observeWebVitals() {
    // Cumulative Layout Shift
    new PerformanceObserver((entryList) => {
      let clsValue = 0;
      for (const entry of entryList.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.metrics.cumulativeLayoutShift = clsValue;
    }).observe({ entryTypes: ['layout-shift'] });

    // First Input Delay
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        this.metrics.firstInputDelay = (entry as any).processingStart - entry.startTime;
      }
    }).observe({ entryTypes: ['first-input'] });
  }

  public trackError(error: ErrorReport) {
    this.errors.push(error);

    if (config.development.debugMode) {
      console.error('Error tracked:', error);
    }

    // Send error to monitoring service
    this.sendError(error);
  }

  public trackUserAction(action: string, details?: any) {
    const event = {
      action,
      details,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    if (config.development.debugMode) {
      console.log('User action tracked:', event);
    }

    // Send to analytics
    this.sendUserAction(event);
  }

  private sendMetrics() {
    if (!config.features.analytics) return;

    // In production, send to your analytics service
    if (config.analytics.googleAnalyticsId) {
      // Google Analytics implementation
      this.sendToGoogleAnalytics();
    }

    // Custom analytics endpoint
    this.sendToCustomAnalytics('metrics', this.metrics);
  }

  private sendError(error: ErrorReport) {
    // In production, send to error tracking service (e.g., Sentry)
    this.sendToCustomAnalytics('errors', error);
  }

  private sendUserAction(event: any) {
    if (!config.features.analytics) return;
    this.sendToCustomAnalytics('events', event);
  }

  private sendToGoogleAnalytics() {
    if (typeof gtag !== 'undefined') {
      gtag('event', 'page_load_time', {
        value: this.metrics.pageLoadTime,
      });

      gtag('event', 'first_contentful_paint', {
        value: this.metrics.firstContentfulPaint,
      });
    }
  }

  private sendToCustomAnalytics(type: string, data: any) {
    if (config.api.url) {
      fetch(`${config.api.url}/analytics/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }).catch((error) => {
        console.error('Failed to send analytics:', error);
      });
    }
  }

  public getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  public getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  public clearErrors() {
    this.errors = [];
  }
}

// Resource monitoring
export const monitorResourceLoading = () => {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 1000) { // Resources taking more than 1 second
        console.warn(`Slow resource: ${entry.name} took ${entry.duration}ms`);
      }
    }
  });

  observer.observe({ entryTypes: ['resource'] });
};

// Memory monitoring
export const monitorMemoryUsage = () => {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    
    if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.9) {
      console.warn('High memory usage detected');
    }

    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    };
  }

  return null;
};

// Network monitoring
export const monitorNetworkStatus = () => {
  const connection = (navigator as any).connection;
  
  if (connection) {
    const networkInfo = {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt,
      saveData: connection.saveData,
    };

    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      console.warn('Slow network detected');
    }

    return networkInfo;
  }

  return null;
};

// Create global monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Initialize monitoring
if (typeof window !== 'undefined') {
  monitorResourceLoading();
  
  // Monitor memory every 30 seconds
  setInterval(() => {
    const memoryInfo = monitorMemoryUsage();
    if (memoryInfo && config.development.showPerformanceMetrics) {
      console.log('Memory usage:', memoryInfo);
    }
  }, 30000);

  // Monitor network status
  const networkInfo = monitorNetworkStatus();
  if (networkInfo && config.development.showPerformanceMetrics) {
    console.log('Network info:', networkInfo);
  }
}
