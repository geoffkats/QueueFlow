import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Get saved language from localStorage or default to English
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('queueflow_language');
    return saved || 'en';
  });

  // Save language preference to localStorage whenever it changes
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

  const value = {
    t,
    language,
    setLanguage,
    toggleLanguage,
    availableLanguages: Object.keys(translations)
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use the language context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
