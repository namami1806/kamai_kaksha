import React, { useState } from 'react';
import { ShieldCheck, Volume2, Users, Check, AlertCircle, ArrowRight } from 'lucide-react';
import { speakText } from '../../lib/speech';
import { useTranslation } from '../../lib/i18n';

/**
 * ConsentModal: DPDP plain-language consent screen with mandatory guardian gate for minors (<18).
 * Priya is 17, so the guardian consent gate is required before voice capture.
 */
export default function ConsentModal({ studentAge = 17, onConsentGranted, onCancel }) {
  const { t, lang } = useTranslation();
  const [dataConsent, setDataConsent] = useState(false);
  const [guardianName, setGuardianName] = useState('Ramesh Sharma');
  const [guardianRelation, setGuardianRelation] = useState('Father / पिता');
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [isReadingAloud, setIsReadingAloud] = useState(false);

  const isMinor = studentAge < 18;
  const canProceed = dataConsent && (!isMinor || guardianConsent);

  const consentAudioScript = lang === 'hi'
    ? "कमाई कक्षा में आपका स्वागत है। हम केवल आपके हुनर और बोले गए शब्दों का लिखित रूप उपयोग करते हैं। ऑडियो रिकॉर्डिंग को काम पूरा होते ही हमेशा के लिए हटा दिया जाता है। आप कभी भी अपना डेटा हटा सकते हैं। चूंकि आपकी उम्र 18 वर्ष से कम है, इसलिए अभिभावक की सहमति आवश्यक है।"
    : "Welcome to Kamai Kaksha. Under Indian DPDP principles, we only retain text transcripts to match you with village skills and micro-tasks. Raw voice audio is permanently deleted. Because you are under 18, guardian consent is required.";

  const handleReadAloud = () => {
    setIsReadingAloud(true);
    speakText(consentAudioScript, lang, 'consent');
    setTimeout(() => setIsReadingAloud(false), 5000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-32 border border-black/10 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-butter-light via-sky-light to-lavender-light p-5 border-b border-black/5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white shadow-xs text-primary border border-primary/20">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                DPDP Act 2023 • Plain Language Consent
              </span>
              <h2 className="text-lg sm:text-xl font-black font-display text-ink">
                {lang === 'hi' ? 'डेटा व गोपनीयता सहमति' : 'Data & Privacy Consent'}
              </h2>
            </div>
          </div>

          {/* Voice Readout Button */}
          <button
            onClick={handleReadAloud}
            className={`p-2 rounded-full border transition-all flex items-center gap-1.5 text-xs font-bold ${
              isReadingAloud 
                ? 'bg-primary text-white border-primary animate-pulse' 
                : 'bg-white text-ink border-ink/15 hover:bg-butter'
            }`}
            title="Listen to consent terms aloud"
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">{lang === 'hi' ? 'सुनें' : 'Listen'}</span>
          </button>
        </div>

        {/* Scrollable Consent Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-ink leading-relaxed">
          
          {/* Plain Language Summary Box */}
          <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-ink/10 space-y-2">
            <p className="font-extrabold text-ink flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {lang === 'hi' ? 'हम आपके डेटा की सुरक्षा कैसे करते हैं:' : 'How we safeguard your information:'}
            </p>
            <ul className="space-y-1.5 list-disc list-inside text-ink/90 font-medium text-xs sm:text-xs">
              <li>{lang === 'hi' ? 'केवल आपके हुनर और बोले गए शब्दों का टेक्स्ट सहेजा जाता है।' : 'Only written skill transcripts are saved; never raw identity profiles.'}</li>
              <li>
                <span className="font-bold">{lang === 'hi' ? 'ट्रांसक्रिप्शन के बाद ऑडियो हटाया जाता है:' : 'Audio deleted after transcription:'}</span>{' '}
                {lang === 'hi'
                  ? 'स्थानीय IndexedDB में बफ़र किया गया ऑडियो ट्रांसक्रिप्शन के तुरंत बाद हमेशा के लिए हटा दिया जाता है।'
                  : 'Raw audio buffered in IndexedDB is permanently purged immediately after transcription.'}
              </li>
              <li>
                <span className="font-bold">{lang === 'hi' ? 'ऑनलाइन फ़ास्ट पाथ सूचना:' : 'Online Fast Path Notice:'}</span>{' '}
                {lang === 'hi'
                  ? 'ऑनलाइन मोड (Web Speech API) भाषण पहचानने हेतु ऑडियो को ब्राउज़र वेंडर को भेजता है।'
                  : 'Online Fast Path (Web Speech API) sends audio to the browser vendor for speech recognition.'}
              </li>
              <li>{lang === 'hi' ? 'आप कभी भी "डेटा डिलीट करें" बटन से अपना डेटा मिटा सकते हैं।' : 'You can exercise your right to erasure at any time with one click.'}</li>
            </ul>
          </div>

          {/* Student Consent Checkbox */}
          <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-black/10 hover:border-primary/50 cursor-pointer bg-white transition-all">
            <input
              type="checkbox"
              checked={dataConsent}
              onChange={(e) => setDataConsent(e.target.checked)}
              className="mt-1 w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
            />
            <span className="text-xs sm:text-xs font-bold text-ink">
              {lang === 'hi'
                ? 'मैं करियर मार्गदर्शन और माइक्रो-टास्क आमदनी के लिए अपना हुनर डेटा साझा करने की अनुमति देता/देती हूँ।'
                : 'I consent to sharing my skill responses for personalized career roadmap generation and paid village micro-tasks.'}
            </span>
          </label>

          {/* Mandatory Guardian Gate for Minors (<18) - Explicitly Labeled as Simulated */}
          {isMinor && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-800" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-900">
                    {lang === 'hi' ? 'अभिभावक सहमति (18 वर्ष से कम)' : 'Guardian Consent (Under 18 Gate)'}
                  </h3>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200/90 text-amber-900 border border-amber-400/40">
                  {lang === 'hi' ? 'डेमो सिमुलेशन' : 'Simulated for Demo'}
                </span>
              </div>
              <p className="text-[11px] text-amber-900 font-medium">
                {lang === 'hi'
                  ? 'प्रिया की उम्र 17 वर्ष है। DPDP सिद्धांतों के अनुसार अभिभावक की अनुमति अनिवार्य है (हैकथॉन डेमो हेतु सिमुलेटेड)।'
                  : 'Priya is 17 years old. In accordance with DPDP and child safeguards, parental/guardian authorization is required (Simulated for hackathon demo).'}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold text-amber-900/80 uppercase">
                    {lang === 'hi' ? 'अभिभावक का नाम' : 'Guardian Name'}
                  </label>
                  <input
                    type="text"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl bg-white border border-amber-300 font-bold text-ink text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-amber-900/80 uppercase">
                    {lang === 'hi' ? 'संबंध' : 'Relationship'}
                  </label>
                  <input
                    type="text"
                    value={guardianRelation}
                    onChange={(e) => setGuardianRelation(e.target.value)}
                    className="w-full mt-1 p-2 rounded-xl bg-white border border-amber-300 font-bold text-ink text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={guardianConsent}
                  onChange={(e) => setGuardianConsent(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-amber-600 focus:ring-amber-500 accent-amber-600"
                />
                <span className="text-[11px] font-bold text-amber-950">
                  {lang === 'hi'
                    ? 'मैं (अभिभावक) पुष्टि करता हूँ कि प्रिया सुरक्षित व्यावसायिक कौशल प्रशिक्षण और स्वीकृत छात्रवृत्ति टास्क कर सकती हैं।'
                    : 'I (Guardian) authorize Priya to participate in safe vocational training and youth-approved scholarship tasks.'}
                </span>
              </label>
            </div>
          )}

        </div>

        {/* Action Footer */}
        <div className="p-4 bg-[#F8F9FD] border-t border-black/5 flex items-center justify-between gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2.5 rounded-full text-xs font-bold text-ink/70 hover:text-ink hover:bg-black/5 transition-all"
          >
            {t('actions.back')}
          </button>

          <button
            onClick={onConsentGranted}
            disabled={!canProceed}
            className={`px-6 py-3 rounded-full text-xs sm:text-sm font-black flex items-center gap-2 shadow-md transition-all ${
              canProceed
                ? 'bg-primary hover:bg-primary-hover text-white scale-100 active:scale-95'
                : 'bg-black/15 text-black/40 cursor-not-allowed'
            }`}
          >
            <span>{lang === 'hi' ? 'सहमति दें और शुरू करें' : 'Grant Consent & Proceed'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
