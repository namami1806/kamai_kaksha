import React, { useState } from 'react';
import MascotKamu from '../components/MascotKamu';
import SceneBackground from '../components/SceneBackground';
import SpeechBubble from '../components/SpeechBubble';
import BentoTile from '../components/BentoTile';
import StatTile from '../components/StatTile';
import LanguageToggle from '../components/LanguageToggle';
import { useTranslation } from '../lib/i18n';
import { 
  Flame, 
  ArrowRight, 
  Sunrise, 
  Sun, 
  Sunset, 
  CheckCircle2, 
  Sparkles,
  Award
} from 'lucide-react';

export default function StudentHome({ onNavigate, onNavigateFacilitator, onSimulateOfflineQueue, personaMode = 'returning' }) {
  const { t, lang } = useTranslation();
  const [timeOfDay, setTimeOfDay] = useState('dawn'); // 'dawn' | 'noon' | 'sunset'
  const [mascotState, setMascotState] = useState('idle');

  const isFresh = personaMode === 'fresh';
  const skillLevel = isFresh ? 0 : 1;
  const streakDays = isFresh ? 0 : 14;
  const walletBalance = isFresh ? 0 : 40;
  const autoSavedBalance = isFresh ? 0 : 4;
  const targetProjected = isFresh ? 0 : 48000;

  const skillSteps = [
    t('bento.levels.beginner'),
    t('bento.levels.growing'),
    t('bento.levels.skilled'),
    t('bento.levels.pro')
  ];

  const mascotLines = {
    dawn: t('mascot.intro_dawn'),
    noon: t('mascot.intro_noon'),
    sunset: t('mascot.intro_dusk')
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      
      {/* 1. Header Bar: Brand, Tagline, Time of Day cycles, Language Toggle */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-coin-gold shadow-xs animate-pulse" />
            <h1 className="font-display font-black text-xl sm:text-2xl text-ink tracking-tight">
              {t('app_name')}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-xs text-ink font-semibold">
              {t('app_tagline')} • <span className="text-primary font-bold">Priya ({isFresh ? 'Fresh Start' : 'Gaya, Bihar'})</span>
            </p>
            {onNavigateFacilitator && (
              <button
                onClick={onNavigateFacilitator}
                className="text-[11px] font-bold text-primary hover:underline bg-lavender/40 px-2 py-0.5 rounded-full"
                title="Open Gaya District Facilitator View"
              >
                📊 Facilitator
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Time of Day Cycle Previewer with Accessible min 44px Touch Targets */}
          <div className="flex items-center bg-white/90 p-0.5 rounded-full border border-ink/10 shadow-xs text-xs">
            <button
              onClick={() => { setTimeOfDay('dawn'); setMascotState('idle'); }}
              className={`min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-full font-bold flex items-center justify-center gap-1 transition-all ${
                timeOfDay === 'dawn' ? 'bg-butter text-ink shadow-xs' : 'text-ink/70 hover:text-ink'
              }`}
              title="Dawn"
              aria-label="Dawn theme"
            >
              <Sunrise className="w-4 h-4" />
              <span className="hidden sm:inline">{t('time_of_day.dawn')}</span>
            </button>
            <button
              onClick={() => { setTimeOfDay('noon'); setMascotState('coach'); }}
              className={`min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-full font-bold flex items-center justify-center gap-1 transition-all ${
                timeOfDay === 'noon' ? 'bg-sky text-ink shadow-xs' : 'text-ink/70 hover:text-ink'
              }`}
              title="Noon"
              aria-label="Noon theme"
            >
              <Sun className="w-4 h-4" />
              <span className="hidden sm:inline">{t('time_of_day.noon')}</span>
            </button>
            <button
              onClick={() => { setTimeOfDay('sunset'); setMascotState('celebrating'); }}
              className={`min-h-[44px] min-w-[44px] px-2.5 py-2 rounded-full font-bold flex items-center justify-center gap-1 transition-all ${
                timeOfDay === 'sunset' ? 'bg-rose text-ink shadow-xs' : 'text-ink/70 hover:text-ink'
              }`}
              title="Sunset"
              aria-label="Sunset theme"
            >
              <Sunset className="w-4 h-4" />
              <span className="hidden sm:inline">{t('time_of_day.sunset')}</span>
            </button>
          </div>

          <LanguageToggle />
        </div>
      </div>

      {/* 2. Hero Mascot Scene: Enlarged Kamu (2x), Compact SVG Sky, Unobstructed Cottages & Solar Array */}
      <div className="relative rounded-28 sm:rounded-32 overflow-hidden border border-white shadow-bento bg-white">
        <SceneBackground timeOfDay={timeOfDay} className="min-h-[290px] sm:min-h-[260px]">
          <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-3 pb-1">
            
            {/* Mascot Kamu (Enlarged 2x) + Short Speech Bubble */}
            <div className="flex items-end gap-2 sm:gap-3 w-full sm:w-auto justify-start">
              <div 
                className="cursor-pointer group transform hover:scale-105 active:scale-95 transition-transform shrink-0"
                onClick={() => {
                  const states = ['idle', 'listening', 'thinking', 'celebrating', 'coach'];
                  const nextState = states[(states.indexOf(mascotState) + 1) % states.length];
                  setMascotState(nextState);
                }}
                title="Tap to cycle Kamu mascot states"
              >
                <MascotKamu state={mascotState} size={145} className="sm:w-[170px] sm:h-[170px]" />
              </div>
              
              {/* Short, non-occluding punchy speech bubble */}
              <div className="mb-4 max-w-[190px] sm:max-w-xs">
                <SpeechBubble text={mascotLines[timeOfDay]} />
              </div>
            </div>

            {/* Anchored Primary CTA Button */}
            <div className="w-full sm:w-auto pb-1 sm:pb-2">
              <button
                onClick={() => onNavigate && onNavigate('lifemap')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-primary hover:bg-primary-hover text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <span>{t('actions.open_lifemap')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </SceneBackground>
      </div>

      {/* 3. Bento Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        
        {/* Yellow Tile: Skill Level with 4-step slider */}
        <BentoTile
          variant="butter"
          title={t('bento.skill_level_title')}
          subtitle={isFresh ? t('fresh_state.skill_path_fresh') : t('bento.skill_path_text')}
          className="col-span-1 md:col-span-1 lg:col-span-2"
        >
          <div className="space-y-4 my-auto">
            {/* 4-step pill slider */}
            <div className="relative flex items-center justify-between pt-2">
              <div className="absolute top-1/2 left-0 right-0 h-2 bg-ink/15 -translate-y-1/2 rounded-full" />
              <div 
                className="absolute top-1/2 left-0 h-2 bg-ink -translate-y-1/2 rounded-full transition-all duration-300"
                style={{ width: `${(skillLevel / (skillSteps.length - 1)) * 100}%` }}
              />

              {skillSteps.map((step, idx) => (
                <div
                  key={step}
                  className={`relative z-10 flex flex-col items-center transition-transform ${
                    idx <= skillLevel ? 'scale-105' : 'opacity-70'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs border-2 transition-all ${
                    idx <= skillLevel 
                      ? 'bg-ink text-butter border-ink' 
                      : 'bg-white text-ink border-ink/40'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="text-[11px] font-extrabold text-ink mt-1.5 whitespace-nowrap">
                    {step}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-white/80 rounded-2xl flex items-center justify-between text-xs font-bold text-ink border border-ink/10">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>{isFresh ? t('fresh_state.milestone_fresh') : t('bento.milestone_text')}</span>
              </div>
              <span className="text-primary font-black">{isFresh ? '0 XP' : t('bento.xp_chip')}</span>
            </div>
          </div>
        </BentoTile>

        {/* Lavender Tile: Projected Earnings (Consistent single source value) */}
        <StatTile
          variant="lavender"
          title={t('bento.projected_title')}
          targetValue={targetProjected}
          prefix="₹"
          subtitle={isFresh 
            ? (lang === 'hi' ? 'अनुमानित (Illustrative): मॉड्यूल पूरा करने पर अनलॉक होगा' : 'Illustrative: ₹0 at day 0 (Unlocks upon completing Module 1)')
            : t('bento.projected_sub')}
          chartData={isFresh ? [5, 5, 5, 5, 5] : [15, 30, 48, 75, 100]}
          className="col-span-1 md:col-span-1 lg:col-span-2"
        />

        {/* Sky-Blue Tile: Meet Kamu (Coach Mascot) */}
        <BentoTile
          variant="sky"
          title={t('bento.kamu_tile_title')}
          subtitle={t('bento.kamu_tile_desc')}
          className="col-span-1 md:col-span-1"
        >
          <div className="flex items-center justify-center py-1">
            <MascotKamu state="coach" size={110} />
          </div>
          <div className="mt-1 text-center">
            <span className="inline-block text-[11px] font-extrabold px-3 py-1 rounded-full bg-white/80 text-ink border border-ink/10">
              {t('bento.kamu_tile_chip')}
            </span>
          </div>
        </BentoTile>

        {/* Pink Tile: Streak / Sprout */}
        <BentoTile
          variant="rose"
          title={t('bento.streak_tile_title')}
          subtitle={isFresh ? t('fresh_state.streak_sub') : t('bento.streak_sub')}
          className="col-span-1 md:col-span-1"
        >
          <div className="flex items-center justify-between my-auto py-2">
            <div>
              <div className="flex items-center gap-2 text-ink">
                <Flame className={`w-7 h-7 text-coin-gold fill-coin-gold ${isFresh ? 'opacity-40' : 'animate-bounce'}`} />
                <span className="text-3xl sm:text-4xl font-black font-display text-ink">
                  {streakDays} {t('bento.streak_days')}
                </span>
              </div>
              <p className="text-xs font-bold text-ink mt-1">
                {isFresh ? t('fresh_state.title') : t('bento.streak_diya_lit')}
              </p>
            </div>
            <div className="animate-float">
              <MascotKamu state="idle" size={80} />
            </div>
          </div>
          <div className="w-full bg-white/60 rounded-full h-2.5 overflow-hidden mt-2">
            <div className="bg-ink h-full rounded-full" style={{ width: isFresh ? '10%' : '70%' }} />
          </div>
        </BentoTile>

        {/* Green Tile: Social Proof Cards (Sample Data) */}
        <BentoTile
          variant="leaf"
          title={t('bento.social_proof_title')}
          isSample={true}
          className="col-span-1 md:col-span-1 lg:col-span-2"
        >
          <div className="space-y-3 my-auto">
            <div className="p-3.5 bg-white/90 rounded-2xl border border-leaf/40 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-leaf text-ink font-black flex items-center justify-center text-sm border border-ink/15">
                    {lang === 'hi' ? 'रवि' : 'RK'}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-ink">Ravi Kumar</h4>
                    <p className="text-[11px] text-ink font-semibold">{t('bento.social_proof_role')}</p>
                  </div>
                </div>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-coin-gold text-ink border border-ink/20">
                  {t('bento.social_proof_first_earning')}
                </span>
              </div>
              <p className="text-xs text-ink font-medium italic mt-2 leading-relaxed">
                "{t('bento.social_proof_quote')}"
              </p>
            </div>
          </div>
        </BentoTile>

        {/* Dark Scenic Tile: Days Logged Counter */}
        <BentoTile
          variant="dark"
          isSample={true}
          className="col-span-1 md:col-span-1 lg:col-span-2 relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col justify-between h-full py-1">
            <span className="text-xs uppercase tracking-widest text-butter font-extrabold">
              Village Impact Metric
            </span>
            <div className="my-2.5">
              <h3 className="text-2xl sm:text-3xl font-black font-display text-white leading-tight">
                24,800+ {t('bento.streak_days')}
              </h3>
              <p className="text-xs text-white/90 font-medium mt-1 max-w-sm">
                {t('bento.days_logged_title')}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-butter font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{t('bento.days_logged_sub')}</span>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-15 pointer-events-none w-48 h-32">
            <svg viewBox="0 0 200 120" className="w-full h-full fill-white">
              <path d="M 0 100 Q 60 40 120 70 T 200 60 L 200 120 L 0 120 Z" />
            </svg>
          </div>
        </BentoTile>

        {/* Lock-Screen Widget Mock Tile */}
        <BentoTile
          variant="white"
          title={t('bento.widget_mock_title')}
          subtitle={t('bento.widget_mock_sub')}
          className="col-span-1 md:col-span-2 lg:col-span-4"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-butter-light via-sky-light to-lavender-light border border-black/10 mt-2">
            <div className="flex items-center gap-3">
              <MascotKamu state="celebrating" size={70} />
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-primary">
                  Kamai Kaksha Widget
                </p>
                <h4 className="text-base font-black text-ink">
                  {t('bento.widget_daily_progress')}
                </h4>
                <p className="text-xs text-ink font-semibold">
                  {isFresh ? t('fresh_state.streak_sub') : t('bento.widget_streak_xp')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white px-4 py-2 rounded-xl shadow-xs text-center border border-black/10">
                <span className="text-[10px] font-bold text-ink uppercase block">
                  {t('bento.wallet_balance_label')}
                </span>
                <span className="text-lg font-black text-ink font-display">
                  ₹{walletBalance}
                </span>
              </div>
              <div className="bg-emerald-50 px-4 py-2 rounded-xl shadow-xs text-center border border-emerald-300">
                <span className="text-[10px] font-bold text-emerald-900 uppercase block">
                  {t('bento.auto_save_label')}
                </span>
                <span className="text-lg font-black text-emerald-800 font-display">
                  ₹{autoSavedBalance}
                </span>
              </div>
            </div>
          </div>
        </BentoTile>

      </div>
    </div>
  );
}
