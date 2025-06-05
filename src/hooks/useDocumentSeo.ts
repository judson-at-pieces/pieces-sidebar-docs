
import { useEffect } from 'react';

export interface SeoData {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogType: string;
  ogUrl: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  twitterSite: string;
  twitterCreator: string;
  robots: string;
  noindex: boolean;
  nofollow: boolean;
  customMeta: Array<{ name: string; content: string; property?: string }>;
}

export function useDocumentSeo(seoData: Partial<SeoData>) {
  useEffect(() => {
    // Update document title
    if (seoData.metaTitle || seoData.title) {
      document.title = seoData.metaTitle || seoData.title || '';
    }

    // Helper function to set or update meta tag
    const setMetaTag = (selector: string, content: string, attribute: 'name' | 'property' = 'name') => {
      if (!content) return;
      
      let element = document.querySelector(selector) as HTMLMetaElement;
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, selector.replace(`[${attribute}="`, '').replace('"]', ''));
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Helper function to set or update link tag
    const setLinkTag = (rel: string, href: string) => {
      if (!href) return;
      
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!element) {
        element = document.createElement('link');
        element.rel = rel;
        document.head.appendChild(element);
      }
      element.href = href;
    };

    // Basic meta tags
    setMetaTag('[name="description"]', seoData.metaDescription || seoData.description || '');
    setMetaTag('[name="keywords"]', seoData.keywords?.join(', ') || '');
    setMetaTag('[name="robots"]', seoData.robots || 'index,follow');

    // Open Graph tags
    setMetaTag('[property="og:title"]', seoData.ogTitle || seoData.metaTitle || seoData.title || '', 'property');
    setMetaTag('[property="og:description"]', seoData.ogDescription || seoData.metaDescription || seoData.description || '', 'property');
    setMetaTag('[property="og:image"]', seoData.ogImage || '', 'property');
    setMetaTag('[property="og:type"]', seoData.ogType || 'website', 'property');
    setMetaTag('[property="og:url"]', seoData.ogUrl || window.location.href, 'property');

    // Twitter Card tags
    setMetaTag('[name="twitter:card"]', seoData.twitterCard || 'summary_large_image');
    setMetaTag('[name="twitter:title"]', seoData.twitterTitle || seoData.metaTitle || seoData.title || '');
    setMetaTag('[name="twitter:description"]', seoData.twitterDescription || seoData.metaDescription || seoData.description || '');
    setMetaTag('[name="twitter:image"]', seoData.twitterImage || seoData.ogImage || '');
    setMetaTag('[name="twitter:site"]', seoData.twitterSite || '@pieces_app');
    setMetaTag('[name="twitter:creator"]', seoData.twitterCreator || '');

    // Canonical URL
    setLinkTag('canonical', seoData.canonicalUrl || '');

    // Custom meta tags
    seoData.customMeta?.forEach((meta) => {
      if (meta.property) {
        setMetaTag(`[property="${meta.property}"]`, meta.content, 'property');
      } else {
        setMetaTag(`[name="${meta.name}"]`, meta.content);
      }
    });

    // Handle noindex/nofollow
    if (seoData.noindex || seoData.nofollow) {
      const robotsContent = [
        seoData.noindex ? 'noindex' : 'index',
        seoData.nofollow ? 'nofollow' : 'follow'
      ].join(',');
      setMetaTag('[name="robots"]', robotsContent);
    }

  }, [seoData]);
}
