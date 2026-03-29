import { useState, useEffect } from 'react';
import { translations } from '../translations';

// Custom hook for multi-language support
export const useLanguage = () => {
  // Get saved language from localStorage or default to English
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('queueflow_language');
    return saved || 'en';
  });

  // Save language preference to localStorage
  useEffect(() => {
    localStorage.setItem('queueflow_language', language);
  }, [language]);

  // Translation function
  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  // Set language with validation
  const setLanguage = (lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
    }
  };

  // Toggle between English and Luganda
  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'lg' : 'en');
  };

  return { 
    t, 
    language, 
    setLanguage,
    toggleLanguage,
    availableLanguages: Object.keys(translations)
  };
};
