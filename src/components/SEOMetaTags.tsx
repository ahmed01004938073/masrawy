import { useEffect } from 'react';
import { getSiteSettings } from '@/services/siteSettingsService';

const SEOMetaTags = () => {
    useEffect(() => {
        const updateMetaTags = async () => {
            const settings = await getSiteSettings();

            // Update page title
            if (settings.seoTitle) {
                document.title = settings.seoTitle;
            } else if (settings.siteName) {
                document.title = settings.siteName;
            }

            // Update or create meta description
            let metaDescription = document.querySelector('meta[name="description"]');
            if (!metaDescription) {
                metaDescription = document.createElement('meta');
                metaDescription.setAttribute('name', 'description');
                document.head.appendChild(metaDescription);
            }
            metaDescription.setAttribute('content', settings.seoDescription || settings.siteDescription || '');

            // Update or create meta keywords
            let metaKeywords = document.querySelector('meta[name="keywords"]');
            if (settings.seoKeywords) {
                if (!metaKeywords) {
                    metaKeywords = document.createElement('meta');
                    metaKeywords.setAttribute('name', 'keywords');
                    document.head.appendChild(metaKeywords);
                }
                metaKeywords.setAttribute('content', settings.seoKeywords);
            }

            // Update Open Graph tags
            const updateOGTag = (property: string, content: string) => {
                let tag = document.querySelector(`meta[property="${property}"]`);
                if (!tag) {
                    tag = document.createElement('meta');
                    tag.setAttribute('property', property);
                    document.head.appendChild(tag);
                }
                tag.setAttribute('content', content);
            };

            updateOGTag('og:title', settings.seoTitle || settings.siteName || '');
            updateOGTag('og:description', settings.seoDescription || settings.siteDescription || '');
            updateOGTag('og:type', 'website');
            if (settings.logo) {
                updateOGTag('og:image', settings.logo);
            }

            // Update Twitter Card tags
            const updateTwitterTag = (name: string, content: string) => {
                let tag = document.querySelector(`meta[name="${name}"]`);
                if (!tag) {
                    tag = document.createElement('meta');
                    tag.setAttribute('name', name);
                    document.head.appendChild(tag);
                }
                tag.setAttribute('content', content);
            };

            updateTwitterTag('twitter:card', 'summary_large_image');
            updateTwitterTag('twitter:title', settings.seoTitle || settings.siteName || '');
            updateTwitterTag('twitter:description', settings.seoDescription || settings.siteDescription || '');
            if (settings.logo) {
                updateTwitterTag('twitter:image', settings.logo);
            }
        };

        updateMetaTags();
        window.addEventListener('storage', updateMetaTags);
        return () => window.removeEventListener('storage', updateMetaTags);
    }, []);

    return null; // This component doesn't render anything
};

export default SEOMetaTags;
