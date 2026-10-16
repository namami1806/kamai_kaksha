import React from 'react';
import BentoTile from './BentoTile';
import { useTranslation } from '../lib/i18n';

/**
 * StatTile: Giant bold numbers (48-64px) with stable single-source value and sample labeling.
 * Always renders the exact target number with no animation jitter or restart on language toggle.
 */
export default function StatTile({
  variant = 'lavender',
  title,
  targetValue = 48000,
  prefix = '₹',
  suffix = '',
  subtitle,
  chartData = [15, 30, 48, 75, 100],
  className = ''
}) {
  const { t } = useTranslation();

  return (
    <BentoTile
      variant={variant}
      title={title}
      isSample={true}
      sampleLabel={t('sample_estimate')}
      className={className}
    >
      <div className="flex flex-col justify-end mt-2">
        {/* Giant Bold Number - Guaranteed exact targetValue */}
        <div className="flex items-baseline gap-1 font-display tracking-tight text-ink">
          <span className="text-3xl sm:text-4xl font-black text-ink">{prefix}</span>
          <span className="text-4xl sm:text-5xl lg:text-6xl font-black leading-none text-ink">
            {targetValue.toLocaleString('en-IN')}
          </span>
          {suffix && <span className="text-xl sm:text-2xl font-black text-ink">{suffix}</span>}
        </div>

        {/* Inline Sparkline Chart */}
        {chartData && (
          <div className="mt-4 pt-3 border-t border-ink/20 flex items-end justify-between gap-2 h-14">
            <div className="flex-1 h-full flex items-end gap-1.5">
              {chartData.map((val, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-ink/25 hover:bg-ink/40 rounded-t-sm transition-all duration-300"
                  style={{ height: `${targetValue === 0 ? 8 : val}%` }}
                  title={`Period ${idx + 1}: ${val}%`}
                />
              ))}
            </div>
            <span className="text-[11px] font-black text-ink shrink-0">
              {targetValue === 0 ? '+0%' : '+140%'}
            </span>
          </div>
        )}

        {/* Explanatory Subtitle with High-Contrast Ink */}
        {subtitle && (
          <p className="text-xs sm:text-sm font-semibold text-ink mt-2.5">
            {subtitle}
          </p>
        )}
      </div>
    </BentoTile>
  );
}
