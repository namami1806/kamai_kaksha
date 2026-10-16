import React from 'react';
import { useTranslation } from '../lib/i18n';
import { Languages } from 'lucide-react';

export default function LanguageToggle({ className = '' }) {
  const { lang, toggleLanguage } = useTranslation();

  return (
    <button
      onClick={toggleLanguage}
      className={`min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full bg-white/90 hover:bg-white text-ink border border-ink/10 shadow-xs text-xs font-bold transition-all ${className}`}
      title="Toggle English / हिन्दी"
      aria-label="Toggle language"
    >
      <Languages className="w-3.5 h-3.5 text-primary" />
      <span>{lang === 'hi' ? 'EN' : 'हिन्दी'}</span>
    </button>
  );
}
