import React, { createContext, useContext, useState, useEffect } from 'react';
import en from './en.json';
import hi from './hi.json';

const translations = { en, hi };

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const urlLang = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('lang') : null;
    if (urlLang === 'en' || urlLang === 'hi') return urlLang;
    return localStorage.getItem('kk_language') || 'hi';
  });

  useEffect(() => {
    localStorage.setItem('kk_language', lang);
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'en' ? 'hi' : 'en'));
  };

  const t = (path) => {
    const keys = path.split('.');
    let current = translations[lang] || translations.en;
    for (const key of keys) {
      if (current && current[key] !== undefined) {
        current = current[key];
      } else {
        // Fallback to English
        let fallback = translations.en;
        for (const fKey of keys) {
          if (fallback && fallback[fKey] !== undefined) {
            fallback = fallback[fKey];
          } else {
            return path;
          }
        }
        return fallback;
      }
    }
    return current;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
