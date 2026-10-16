import React from 'react';

/**
 * PillOption: Rounded translucent pill option row with radio circle, icon, and label
 * Supports pulsing mic state for voice-first answers.
 */
export default function PillOption({
  id,
  label,
  icon: Icon,
  selected = false,
  isVoicePill = false,
  isListening = false,
  onClick,
  className = ''
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`w-full text-left flex items-center justify-between p-4 sm:p-5 rounded-full transition-all duration-200 border ${
        isVoicePill
          ? isListening
            ? 'bg-primary text-white border-primary shadow-lg ring-4 ring-primary/20 animate-pulse'
            : 'bg-white/80 hover:bg-white text-ink border-primary/30 shadow-pill'
          : selected
            ? 'bg-primary text-white border-primary shadow-pill scale-[1.01]'
            : 'bg-white/70 hover:bg-white/95 text-ink border-white/80 shadow-pill hover:border-butter'
      } ${className}`}
    >
      {/* Left: Radio circle + Icon + Label */}
      <div className="flex items-center gap-3.5 sm:gap-4 overflow-hidden">
        {/* Radio Indicator */}
        <div
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
            selected || (isVoicePill && isListening)
              ? 'border-white bg-white text-primary'
              : 'border-ink/30 bg-transparent'
          }`}
        >
          {(selected || (isVoicePill && isListening)) && (
            <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          )}
        </div>

        {/* Optional Icon */}
        {Icon && (
          <div
            className={`p-2 rounded-full shrink-0 ${
              selected || (isVoicePill && isListening)
                ? 'bg-white/20 text-white'
                : 'bg-black/5 text-ink'
            }`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}

        {/* Label */}
        <span className="font-semibold text-sm sm:text-base truncate">
          {label}
        </span>
      </div>

      {/* Right Voice Indicator / Sparkle */}
      {isVoicePill && (
        <span className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${
          isListening ? 'bg-white text-primary' : 'bg-primary/10 text-primary'
        }`}>
          {isListening ? 'Listening...' : 'Voice Tap'}
        </span>
      )}
    </button>
  );
}
