// مكون صورة آمن يصلح blob URLs تلقائياً
import React, { useState, useEffect } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackSeed?: string;
  onError?: () => void;
  [key: string]: any;
}

// دالة إصلاح الصورة
const fixImageUrl = (url: string, fallbackSeed: string = 'default'): string => {
  if (!url || url.startsWith('blob:')) {
    return `https://api.dicebear.com/7.x/shapes/svg?seed=${fallbackSeed}`;
  }
  return url;
};

const SafeImage: React.FC<SafeImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  fallbackSeed = 'default',
  onError,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    // إصلاح الصورة فور<|im_start|>
    const fixedSrc = fixImageUrl(src, fallbackSeed);
    setImageSrc(fixedSrc);
    setHasError(false);
    
    // طباعة إصلاح إذا تم
    if (src !== fixedSrc) {
      console.log(`🔧 تم إصلاح صورة: ${src} → ${fixedSrc}`);
    }
  }, [src, fallbackSeed]);

  const handleError = () => {
    if (!hasError) {
      console.warn(`⚠️ فشل في تحميل الصورة: ${imageSrc}`);
      
      // محاولة إصلاح مرة أخرى
      const newSrc = `https://api.dicebear.com/7.x/shapes/svg?seed=${fallbackSeed}-${Date.now()}`;
      setImageSrc(newSrc);
      setHasError(true);
      
      if (onError) {
        onError();
      }
    }
  };

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
};

export default SafeImage;
