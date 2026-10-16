import React from 'react';
import { useTranslation } from '../lib/i18n';

/**
 * BentoTile: Rounded 28px card with flat pastel fills and AA contrast
 * Variant colors: 'butter' | 'lavender' | 'leaf' | 'rose' | 'sky' | 'white' | 'dark'
 */
export default function BentoTile({
  variant = 'butter',
  title,
  subtitle,
  isSample = false,
  sampleLabel,
  className = '',
  children,
  onClick
}) {
  const { t } = useTranslation();

  // Explicit pastel themes with tested AA contrast for #1F2540 (ink) or white
  const variantStyles = {
    butter: 'bg-butter text-ink border-butter/40',
    lavender: 'bg-lavender text-ink border-lavender/40',
    leaf: 'bg-leaf text-ink border-leaf/40',
    rose: 'bg-rose text-ink border-rose/40',
    sky: 'bg-sky text-ink border-sky/40',
    white: 'bg-white text-ink border-black/5 shadow-bento',
    dark: 'bg-ink text-white border-white/10 shadow-bento',
    gold: 'bg-coin-gold text-ink border-coin-gold/40'
  };

  const style = variantStyles[variant] || variantStyles.white;

  return (
    <div
      onClick={onClick}
      className={`bento-card ${style} border p-5 sm:p-6 flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:shadow-bento-hover active:scale-[0.99]' : ''
      } ${className}`}
    >
      {/* Header Row: Title & Optional Sample Badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          {title && (
            <h3 className="text-base sm:text-lg font-bold leading-tight font-display">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs sm:text-sm opacity-80 mt-0.5 leading-snug">
              {subtitle}
            </p>
          )}
        </div>

        {/* Explicit Sample Data Indicator */}
        {isSample && (
          <span className="shrink-0 text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full bg-ink/10 text-ink/80 backdrop-blur-xs">
            {sampleLabel || t('sample_data_badge')}
          </span>
        )}
      </div>

      {/* Main Content Body */}
      <div className="relative z-10 flex-1 flex flex-col justify-center">
        {children}
      </div>
    </div>
  );
}
