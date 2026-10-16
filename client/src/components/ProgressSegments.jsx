import React from 'react';
import { useTranslation } from '../lib/i18n';

/**
 * ProgressSegments: Segmented progress bar at top of onboarding / quiz screens
 * Accessible with min 44px touch targets and full Hindi/English i18n
 */
export default function ProgressSegments({ total = 4, current = 1, onSkip, onBack, canGoBack = false }) {
  const { lang, t } = useTranslation();

  return (
    <div className="w-full flex items-center justify-between gap-3 py-2 px-1">
      {/* Back Button with 44px Touch Target */}
      {canGoBack ? (
        <button
          onClick={onBack}
          className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold text-ink/80 hover:text-ink hover:bg-black/5 active:scale-95 transition-all flex items-center gap-1"
          aria-label={lang === 'hi' ? 'पिछला पृष्ठ' : 'Previous step'}
        >
          <span>← {lang === 'hi' ? 'वापस' : 'Back'}</span>
        </button>
      ) : (
        <div className="w-12 h-11" />
      )}

      {/* Progress Bars */}
      <div className="flex-1 flex items-center gap-1.5 max-w-xs">
        {Array.from({ length: total }).map((_, idx) => (
          <div
            key={idx}
            className={`h-2 flex-1 rounded-full transition-all duration-300 ${
              idx < current
                ? 'bg-primary'
                : idx === current
                  ? 'bg-butter border border-ink/20 animate-pulse'
                  : 'bg-black/10'
            }`}
          />
        ))}
      </div>

      {/* Skip Button with 44px Touch Target */}
      {onSkip ? (
        <button
          onClick={onSkip}
          className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold text-ink/70 hover:text-ink hover:bg-black/5 active:scale-95 transition-all flex items-center gap-1"
        >
          <span>{lang === 'hi' ? 'छोड़ें' : 'Skip'}</span>
        </button>
      ) : (
        <div className="w-12 h-11" />
      )}
    </div>
  );
}
