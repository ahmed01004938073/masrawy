// Security middleware for production

import { sanitizeInput, rateLimiter, generateCSRFToken } from '@/utils/validation';
import { config, isProduction, isDevelopment } from '@/config/environment';

// Content Security Policy
export const setCSPHeaders = () => {
  if (typeof document !== 'undefined') {
    // تحقق من وجود CSP مسبقاً
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCSP) {
      return; // CSP موجود مسبقاً
    }

    const meta = document.createElement('meta');
    meta.httpEquiv = 'Content-Security-Policy';

    // CSP مختلف للـ development والـ production
    if (isDevelopment()) {
      // CSP أكثر مرونة للتطوير (بدون frame-ancestors لأنه مش بيشتغل في meta)
      meta.content = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:* https://www.google-analytics.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src 'self' https://fonts.gstatic.com;
        img-src 'self' data: https: http:;
        connect-src 'self' http://localhost:* ws://localhost:* https://www.google-analytics.com;
      `.replace(/\s+/g, ' ').trim();
    } else {
      // CSP صارم للإنتاج (بدون frame-ancestors لأنه مش بيشتغل في meta)
      meta.content = `
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google-analytics.com https://www.googletagmanager.com;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src 'self' https://fonts.gstatic.com;
        img-src 'self' data: https:;
        connect-src 'self' https://www.google-analytics.com;
      `.replace(/\s+/g, ' ').trim();
    }

    document.head.appendChild(meta);
    console.log('✅ تم تطبيق Content Security Policy');
  }
};

// XSS Protection
export const enableXSSProtection = () => {
  if (typeof document !== 'undefined') {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'X-XSS-Protection';
    meta.content = '1; mode=block';
    document.head.appendChild(meta);
  }
};

// Prevent clickjacking (Note: X-Frame-Options لا يعمل في meta tags، يحتاج HTTP header)
export const preventClickjacking = () => {
  if (typeof document !== 'undefined') {
    // في بيئة التطوير، نضع تحذير بدلاً من meta tag غير فعال
    if (isDevelopment()) {
      console.log('⚠️ X-Frame-Options يحتاج HTTP header في الإنتاج، ليس meta tag');
    }

    // يمكن إضافة حماية JavaScript بديلة
    if (isProduction() && window.top !== window.self) {
      // إذا كان الموقع في iframe، أعد توجيهه
      window.top.location = window.self.location;
    }
  }
};

// MIME type sniffing protection
export const preventMimeSniffing = () => {
  if (typeof document !== 'undefined') {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'X-Content-Type-Options';
    meta.content = 'nosniff';
    document.head.appendChild(meta);
  }
};

// Secure form submissions
export const secureFormSubmission = (formData: FormData): FormData => {
  const securedData = new FormData();

  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') {
      securedData.append(key, sanitizeInput(value));
    } else {
      securedData.append(key, value);
    }
  }

  // Add CSRF token
  securedData.append(config.security.csrfTokenName, generateCSRFToken());

  return securedData;
};

// API request security
export const secureApiRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  // Rate limiting check
  const clientId = 'api-requests';
  if (!rateLimiter.isAllowed(clientId, config.rateLimit.requests, config.rateLimit.window)) {
    throw new Error('Rate limit exceeded. Please try again later.');
  }

  // Add security headers
  const secureHeaders = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'X-CSRF-Token': generateCSRFToken(),
    ...options.headers,
  };

  // Sanitize request body if it's JSON
  let secureBody = options.body;
  if (options.body && typeof options.body === 'string') {
    try {
      const parsed = JSON.parse(options.body);
      const sanitized = sanitizeObject(parsed);
      secureBody = JSON.stringify(sanitized);
    } catch (e) {
      // If not JSON, sanitize as string
      secureBody = sanitizeInput(options.body);
    }
  }

  const secureOptions: RequestInit = {
    ...options,
    headers: secureHeaders,
    body: secureBody,
    credentials: 'same-origin', // Prevent CSRF
  };

  return fetch(url, secureOptions);
};

// Sanitize object recursively
const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return sanitizeInput(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (obj && typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[sanitizeInput(key)] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
};

// Local storage security
export const secureLocalStorage = {
  setItem: (key: string, value: any) => {
    try {
      const sanitizedKey = sanitizeInput(key);
      const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
      const encrypted = btoa(JSON.stringify(sanitizedValue)); // Simple encoding
      localStorage.setItem(sanitizedKey, encrypted);
    } catch (error) {
      console.error('Secure localStorage setItem failed:', error);
    }
  },

  getItem: (key: string) => {
    try {
      const sanitizedKey = sanitizeInput(key);
      const encrypted = localStorage.getItem(sanitizedKey);
      if (!encrypted) return null;

      const decrypted = atob(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Secure localStorage getItem failed:', error);
      return null;
    }
  },

  removeItem: (key: string) => {
    try {
      const sanitizedKey = sanitizeInput(key);
      localStorage.removeItem(sanitizedKey);
    } catch (error) {
      console.error('Secure localStorage removeItem failed:', error);
    }
  }
};

// Session timeout management
class SessionManager {
  private timeoutId: NodeJS.Timeout | null = null;
  private readonly TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes

  startSession() {
    this.resetTimeout();
    this.addActivityListeners();
  }

  resetTimeout() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.handleSessionTimeout();
    }, this.TIMEOUT_DURATION);
  }

  private addActivityListeners() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

    events.forEach(event => {
      document.addEventListener(event, () => {
        this.resetTimeout();
      }, { passive: true });
    });
  }

  private handleSessionTimeout() {
    // Clear sensitive data
    localStorage.clear();
    sessionStorage.clear();

    // Redirect to login based on current path
    if (window.location.pathname.startsWith('/admin')) {
      window.location.href = '/admin/login?reason=timeout';
    } else {
      window.location.href = '/login?reason=timeout';
    }
  }

  endSession() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}

export const sessionManager = new SessionManager();

// Initialize security measures
export const initializeSecurity = () => {
  // تطبيق الحماية الأساسية في كل الأوضاع
  setCSPHeaders();
  enableXSSProtection();
  preventClickjacking();
  preventMimeSniffing();

  // Enable session timeout in ALL environments as requested
  sessionManager.startSession();
  console.log('🔒 Security: Session timeout protection enabled (30m)');

  if (isProduction()) {
    // إضافات خاصة بالإنتاج
    // Disable right-click in production (optional)
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Disable F12, Ctrl+Shift+I, Ctrl+U
    document.addEventListener('keydown', (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && e.key === 'I') ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
      }
    });
  } else {
    // في وضع التطوير
    console.log('🔧 وضع التطوير: تم تطبيق الحماية الأساسية فقط');
  }
};

// Security audit function
export const performSecurityAudit = () => {
  const issues: string[] = [];

  // Check for HTTPS
  if (location.protocol !== 'https:' && isProduction()) {
    issues.push('Site is not using HTTPS');
  }

  // Check for security headers
  const hasCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!hasCSP) {
    issues.push('Content Security Policy not set');
  }

  const hasXSSProtection = document.querySelector('meta[http-equiv="X-XSS-Protection"]');
  if (!hasXSSProtection) {
    issues.push('X-XSS-Protection not set');
  }

  // X-Frame-Options لا يعمل في meta tags، لذلك لا نفحصه هنا
  // في الإنتاج، يجب إعداده كـ HTTP header في الخادم

  // Check for mixed content
  const scripts = document.querySelectorAll('script[src]');
  scripts.forEach(script => {
    const src = script.getAttribute('src');
    if (src && src.startsWith('http:') && location.protocol === 'https:') {
      issues.push(`Mixed content detected: ${src}`);
    }
  });

  if (issues.length > 0) {
    console.warn('Security issues detected:', issues);
  } else {
    console.log('Security audit passed ✅');
  }

  return issues;
};
