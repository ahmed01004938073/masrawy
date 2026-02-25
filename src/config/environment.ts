// Environment configuration interface
interface Config {
  app: {
    name: string;
    version: string;
    environment: string;
  };
  api: {
    url: string;
    timeout: number;
  };
  security: {
    jwtSecret: string;
    encryptionKey: string;
    csrfTokenName: string;
  };
  upload: {
    maxFileSize: number;
    allowedTypes: string[];
  };
  rateLimit: {
    requests: number;
    window: number;
  };
  analytics: {
    googleAnalyticsId?: string;
    facebookPixelId?: string;
  };
  cdn: {
    url: string;
    imagesBaseUrl: string;
  };
  social: {
    facebook: string;
    twitter: string;
    instagram: string;
  };
  support: {
    email: string;
    phone: string;
    whatsapp: string;
  };
  features: {
    notifications: boolean;
    analytics: boolean;
    chatSupport: boolean;
    pwa: boolean;
  };
  development: {
    debugMode: boolean;
    showPerformanceMetrics: boolean;
  };
  isDevelopment?: () => boolean;
  isProduction?: () => boolean;
  isFeatureEnabled?: (feature: string) => boolean;
}

// Environment configuration
export const config: Config = {
  // Application
  app: {
    name: import.meta.env.REACT_APP_NAME || 'Afleet Store',
    version: import.meta.env.REACT_APP_VERSION || '1.0.0',
    environment: import.meta.env.REACT_APP_ENVIRONMENT || 'development',
  },

  // API Configuration
  api: {
    url: import.meta.env.REACT_APP_API_URL || '/api',
    timeout: parseInt(import.meta.env.REACT_APP_API_TIMEOUT || '10000'),
  },

  // Security
  security: {
    jwtSecret: import.meta.env.REACT_APP_JWT_SECRET || 'default-secret-key',
    encryptionKey: import.meta.env.REACT_APP_ENCRYPTION_KEY || 'default-encryption-key',
    csrfTokenName: import.meta.env.REACT_APP_CSRF_TOKEN_NAME || '_token',
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(import.meta.env.REACT_APP_MAX_FILE_SIZE || '5242880'), // 5MB
    allowedTypes: (import.meta.env.REACT_APP_ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/webp').split(','),
  },

  // Rate Limiting
  rateLimit: {
    requests: parseInt(import.meta.env.REACT_APP_RATE_LIMIT_REQUESTS || '100'),
    window: parseInt(import.meta.env.REACT_APP_RATE_LIMIT_WINDOW || '900000'), // 15 minutes
  },

  // Analytics
  analytics: {
    googleAnalyticsId: import.meta.env.REACT_APP_GOOGLE_ANALYTICS_ID,
    facebookPixelId: import.meta.env.REACT_APP_FACEBOOK_PIXEL_ID,
  },

  // CDN
  cdn: {
    url: import.meta.env.REACT_APP_CDN_URL || '',
    imagesBaseUrl: import.meta.env.REACT_APP_IMAGES_BASE_URL || '',
  },

  // Social Media
  social: {
    facebook: import.meta.env.REACT_APP_FACEBOOK_URL || '',
    twitter: import.meta.env.REACT_APP_TWITTER_URL || '',
    instagram: import.meta.env.REACT_APP_INSTAGRAM_URL || '',
  },

  // Support
  support: {
    email: import.meta.env.REACT_APP_SUPPORT_EMAIL || 'support@afleetstore.com',
    phone: import.meta.env.REACT_APP_SUPPORT_PHONE || '+201234567890',
    whatsapp: import.meta.env.REACT_APP_SUPPORT_WHATSAPP || '+201234567890',
  },

  // Feature Flags
  features: {
    notifications: import.meta.env.REACT_APP_ENABLE_NOTIFICATIONS === 'true',
    analytics: import.meta.env.REACT_APP_ENABLE_ANALYTICS === 'true',
    chatSupport: import.meta.env.REACT_APP_ENABLE_CHAT_SUPPORT === 'true',
    pwa: import.meta.env.REACT_APP_ENABLE_PWA === 'true',
  },

  // Development
  development: {
    debugMode: import.meta.env.REACT_APP_DEBUG_MODE === 'true',
    showPerformanceMetrics: import.meta.env.REACT_APP_SHOW_PERFORMANCE_METRICS === 'true',
  },
};

// Helper functions
export const isDevelopment = () => config.app.environment === 'development';
export const isProduction = () => config.app.environment === 'production';
export const isFeatureEnabled = (feature: keyof typeof config.features) => config.features[feature];

// Add helper functions to config object
config.isDevelopment = isDevelopment;
config.isProduction = isProduction;
config.isFeatureEnabled = isFeatureEnabled;

// Validation
export const validateConfig = () => {
  const errors: string[] = [];

  if (!config.app.name) {
    errors.push('App name is required');
  }

  if (!config.api.url) {
    errors.push('API URL is required');
  }

  if (isProduction() && !config.security.jwtSecret) {
    errors.push('JWT secret is required in production');
  }

  if (errors.length > 0) {
    console.error('Configuration errors:', errors);
    throw new Error(`Configuration validation failed: ${errors.join(', ')}`);
  }
};

// Initialize configuration
validateConfig();
