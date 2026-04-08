import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';

const LOCALE_STORAGE_KEY = 'codeforge-locale';
const cachedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
const initialLocale = cachedLocale === 'en-US' || cachedLocale === 'zh-CN' ? cachedLocale : 'zh-CN';

i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    'en-US': { translation: enUS },
  },
  lng: initialLocale,
  fallbackLng: 'zh-CN',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
