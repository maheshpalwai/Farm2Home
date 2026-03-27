import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en.json';
import teTranslations from './locales/te.json';
import hiTranslations from './locales/hi.json';
import taTranslations from './locales/ta.json';

const resources = {
  en: enTranslations,
  te: teTranslations,
  hi: hiTranslations,
  ta: taTranslations
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('selectedLanguage') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    },
    parseMissingKeyHandler: (key) =>
      key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    react: {
      useSuspense: false
    }
  });

export default i18n;
