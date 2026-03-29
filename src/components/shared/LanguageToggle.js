import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';
import { languageNames, languageFlags } from '../../translations';

const LanguageToggle = ({ className = '' }) => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-sm font-medium ${className}`}
      title={`Switch to ${language === 'en' ? 'Luganda' : 'English'}`}
    >
      <span className="text-lg">{languageFlags[language]}</span>
      <span>{languageNames[language]}</span>
    </button>
  );
};

export default LanguageToggle;
