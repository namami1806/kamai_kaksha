import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { speakText } from '../lib/speech';
import { useTranslation } from '../lib/i18n';

/**
 * SpeechBubble: Crisp, consumer-wellness speech bubble with audio playback
 */
export default function SpeechBubble({ text, className = '' }) {
  const { lang, t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = (e) => {
    e.stopPropagation();
    setIsPlaying(true);
    speakText(text, lang);
    setTimeout(() => setIsPlaying(false), 3000);
  };

  return (
    <div className={`relative inline-flex items-center gap-2 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-bento border border-white/60 text-ink max-w-[280px] sm:max-w-md ${className}`}>
      {/* Short punchy line */}
      <p className="text-sm sm:text-base font-semibold leading-snug">
        {text}
      </p>

      {/* Speaker Replay Button - min 44px touch target */}
      <button
        onClick={handleSpeak}
        title={t('mascot.speak_tooltip')}
        className={`shrink-0 min-h-[44px] min-w-[44px] p-2.5 rounded-full flex items-center justify-center transition-all ${
          isPlaying ? 'bg-primary text-white scale-105 shadow-xs' : 'bg-[#F2F4FC] text-ink hover:bg-butter hover:text-ink'
        }`}
        aria-label="Replay voice guidance"
      >
        <Volume2 className="w-4 h-4" />
      </button>

      {/* Speech bubble pointer notch pointing left/down */}
      <div 
        className="absolute -bottom-2 left-6 w-3 h-3 bg-white/95 border-b border-r border-white/60 rotate-45 transform"
      />
    </div>
  );
}
