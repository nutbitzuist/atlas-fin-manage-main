import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from '@/locales/en/common.json';
import enLanding from '@/locales/en/landing.json';
import enDashboard from '@/locales/en/dashboard.json';
import enFinances from '@/locales/en/finances.json';
import thCommon from '@/locales/th/common.json';
import thLanding from '@/locales/th/landing.json';
import thDashboard from '@/locales/th/dashboard.json';
import thFinances from '@/locales/th/finances.json';

const resources = {
  en: {
    common: enCommon,
    landing: enLanding,
    dashboard: enDashboard,
    finances: enFinances,
  },
  th: {
    common: thCommon,
    landing: thLanding,
    dashboard: thDashboard,
    finances: thFinances,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    lng: undefined, // Let the detector determine the language
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
    react: {
      useSuspense: false, // Disable suspense for better compatibility
    },
  });

export default i18n;
