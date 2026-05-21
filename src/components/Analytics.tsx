import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Analytics configuration
const GA_TRACKING_ID = import.meta.env.VITE_GA_TRACKING_ID || '';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// Google Analytics page view tracking
const pageview = (url: string) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', GA_TRACKING_ID, {
      page_path: url,
    });
  }
};

// Google Analytics event tracking
const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
};

// Analytics component to track page views
export const Analytics = () => {
  const location = useLocation();

  useEffect(() => {
    if (GA_TRACKING_ID) {
      pageview(location.pathname + location.search);
    }
  }, [location]);

  return null;
};

export default Analytics;
