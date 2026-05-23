import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import * as Localization from 'expo-localization';
import en from '@/i18n/locales/en.json';
import trTR from '@/i18n/locales/tr-TR.json';

const deviceLanguage = Localization.getLocales()[0]?.languageCode?.toLowerCase();
const supportedLanguage = deviceLanguage === 'tr' ? 'tr-TR' : 'en';

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  lng: supportedLanguage,
  fallbackLng: 'en',
  resources: {
    en: {
      translation: en
    },
    tr: {
      translation: trTR
    },
    'tr-TR': {
      translation: trTR
    }
  },
  interpolation: {
    escapeValue: false
  }
});

export default i18n;
