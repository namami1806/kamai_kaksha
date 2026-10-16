import React, { useState, useEffect, useRef } from 'react';
import MascotKamu from '../../components/MascotKamu';
import SpeechBubble from '../../components/SpeechBubble';
import PillOption from '../../components/PillOption';
import ProgressSegments from '../../components/ProgressSegments';
import { useTranslation } from '../../lib/i18n';
import { 
  queueSyncEvent, 
  queueAudioBlob, 
  deleteAudioBlob, 
  getAllAudioBlobs, 
  getPendingSyncCount,
  flushSyncQueue
} from '../../lib/idb-queue';
import { extractGroundedLifeMap } from '../../lib/mock-engine';
import { speakText, speechService } from '../../lib/speech';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Sparkles, 
  Flame, 
  ArrowRight, 
  CheckCircle2, 
  Wrench, 
  Sun, 
  BookOpen, 
  Briefcase, 
  Coins, 
  AlertTriangle,
  RotateCcw,
  Check,
  RefreshCw,
  Trash2,
  Database
} from 'lucide-react';

export default function VoiceLifeMap({ onBack, onCompleteModule, onUnlockTask, isSimulatedOffline, personaMode = 'fresh' }) {
  const { t, lang } = useTranslation();

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isFresh = personaMode === 'fresh' || params?.get('persona') === 'fresh';
  const initialStreak = isFresh ? 0 : 14;
  const initialXp = isFresh ? 0 : 120;
  const [streakDays, setStreakDays] = useState(initialStreak);
  const [xp, setXp] = useState(initialXp);

  // Dialect state (Item 6): Hindi, Magahi/Bhojpuri, English
  const [dialect, setDialect] = useState(() => {
    const pDialect = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('dialect') : null;
    if (pDialect === 'en' || pDialect === 'hi' || pDialect === 'magahi') return pDialect;
    return lang === 'en' ? 'en' : 'hi';
  });

  // Dialect-specific phrases for Priya (17, Gaya)
  const DIALECT_PHRASES = {
    hi: "मैं गया में रेडियो और टेप रिकॉर्डर की मरम्मत करती हूँ, सोलर इन्वर्टर का काम सीखना चाहती हूँ।",
    magahi: "हम गया में रेडियो-टेप रिकॉर्डर बनावे ही, सोलर इन्वर्टर के काम सीखे के चाहव ही।",
    en: "I repair radios and tape recorders in Gaya, want to learn solar inverter work."
  };

  const currentPhrase = DIALECT_PHRASES[dialect] || DIALECT_PHRASES.hi;

  const initialStage = params?.get('stage') || (params?.get('view') === 'learning_path' ? 'learning_path' : 'input');
  const [stage, setStage] = useState(initialStage);
  const [transcript, setTranscript] = useState(() => (initialStage !== 'input' || params?.get('queued') === 'true' ? currentPhrase : ''));
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // IndexedDB queue tracking state
  const [audioQueueCount, setAudioQueueCount] = useState(0);
  const [syncQueueCount, setSyncQueueCount] = useState(0);
  const [lastAudioId, setLastAudioId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const [lifeMapData, setLifeMapData] = useState(() => extractGroundedLifeMap({
    transcript: currentPhrase,
    studentId: 'priya_17',
    language: lang
  }));
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);
  const [moduleCompleted, setModuleCompleted] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Refresh IndexedDB queue counts
  const refreshQueueStatus = async () => {
    try {
      const audioBlobs = await getAllAudioBlobs();
      setAudioQueueCount(audioBlobs.length);
      if (audioBlobs.length > 0) {
        setLastAudioId(audioBlobs[audioBlobs.length - 1].id);
      }
      const syncCount = await getPendingSyncCount();
      setSyncQueueCount(syncCount);
    } catch (e) {
      console.warn('Error reading idb queue counts:', e);
    }
  };

  useEffect(() => {
    refreshQueueStatus();
    const interval = setInterval(refreshQueueStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  // Update transcript when dialect is toggled if not dirty
  const handleSelectDialect = (d) => {
    setDialect(d);
    if (!transcript || Object.values(DIALECT_PHRASES).includes(transcript)) {
      setTranscript(DIALECT_PHRASES[d]);
    }
  };

  // Real voice capture using MediaRecorder
  const handleToggleRecord = async () => {
    if (isRecording) {
      // STOP recording
      setIsRecording(false);
      clearInterval(timerRef.current);
      setRecordingSeconds(0);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (e) {
          console.warn('Error stopping media recorder:', e);
        }
      } else {
        speechService.stopListening();
      }
      return;
    }

    // START recording
    setIsRecording(true);
    setRecordingSeconds(0);
    timerRef.current = setInterval(() => setRecordingSeconds(s => s + 1), 1000);

    const isOffline = !navigator.onLine || isSimulatedOffline;

    if (isOffline) {
      // Offline mode: Record audio blob with MediaRecorder and buffer into IndexedDB
      audioChunksRef.current = [];
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          mediaRecorderRef.current = recorder;

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) audioChunksRef.current.push(e.data);
          };

          recorder.onstop = async () => {
            stream.getTracks().forEach(t => t.stop());
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const record = await queueAudioBlob({
              studentId: 'priya_17',
              audioBlob: audioBlob.size > 0 ? audioBlob : new Blob(['sample-voice-data'], { type: 'audio/webm' }),
              durationMs: 3500
            });
            setLastAudioId(record.id);
            setTranscript(currentPhrase);
            await refreshQueueStatus();
          };

          recorder.start(250);
          // Auto-stop after 3 seconds for smooth demo
          setTimeout(() => {
            if (recorder.state === 'recording') recorder.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
          }, 3000);
        } else {
          // Synthetic audio blob fallback if mic is blocked/headless
          setTimeout(async () => {
            const fallbackBlob = new Blob(['synthetic-audio-buffer-priya-radio-repair'], { type: 'audio/webm' });
            const record = await queueAudioBlob({
              studentId: 'priya_17',
              audioBlob: fallbackBlob,
              durationMs: 3000
            });
            setLastAudioId(record.id);
            setTranscript(currentPhrase);
            setIsRecording(false);
            clearInterval(timerRef.current);
            await refreshQueueStatus();
          }, 2000);
        }
      } catch (err) {
        console.warn('Microphone permission or hardware error, falling back to queued synthetic audio:', err);
        setTimeout(async () => {
          const fallbackBlob = new Blob(['synthetic-audio-buffer-priya-radio-repair'], { type: 'audio/webm' });
          const record = await queueAudioBlob({
            studentId: 'priya_17',
            audioBlob: fallbackBlob,
            durationMs: 3000
          });
          setLastAudioId(record.id);
          setTranscript(currentPhrase);
          setIsRecording(false);
          clearInterval(timerRef.current);
          await refreshQueueStatus();
        }, 1500);
      }
      return;
    }

    // Online fast path: Web Speech API
    speechService.setLanguage(dialect === 'en' ? 'en' : 'hi');
    speechService.startListening({
      onResult: (text) => {
        setTranscript(text);
        setIsRecording(false);
        clearInterval(timerRef.current);
      },
      onError: () => {
        setIsRecording(false);
        clearInterval(timerRef.current);
        setTranscript(currentPhrase);
      },
      onEnd: () => {
        setIsRecording(false);
        clearInterval(timerRef.current);
      }
    });
  };

  // Simulate Priya's Voice Backup Button (Item 6)
  const handleSimulateVoiceInput = async () => {
    setTranscript(currentPhrase);
    const isOffline = !navigator.onLine || isSimulatedOffline;
    if (isOffline) {
      const dummyAudioBlob = new Blob(['simulated-voice-blob-priya-17-gaya'], { type: 'audio/webm' });
      const record = await queueAudioBlob({
        studentId: 'priya_17',
        audioBlob: dummyAudioBlob,
        durationMs: 2800
      });
      setLastAudioId(record.id);
      await refreshQueueStatus();
    }
  };

  // Upload, Transcribe & Purge Audio Blob (The Real Online Flow - Item 2)
  const handleUploadAndSync = async () => {
    setIsSyncing(true);
    try {
      // 1. Flush sync queue against Express backend
      await flushSyncQueue('/api/sync');

      // 2. Transcribe & ground through AI endpoint (FastAPI or mock)
      let aiResponse = null;
      try {
        const res = await fetch('/api/extract-lifemap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: 'priya_17',
            transcript: transcript || currentPhrase,
            language: dialect,
            district: 'Gaya'
          })
        });
        if (res.ok) {
          aiResponse = await res.json();
        }
      } catch (err) {
        console.warn('AI endpoint fetch failed, using grounded mock engine:', err);
      }

      if (!aiResponse) {
        aiResponse = extractGroundedLifeMap({
          transcript: transcript || currentPhrase,
          studentId: 'priya_17',
          language: lang
        });
      }

      // 3. DPDP COMPLIANCE: Delete raw audio blob from IndexedDB immediately after transcription!
      if (lastAudioId) {
        await deleteAudioBlob(lastAudioId);
      }
      // Also delete all remaining audio queue items to guarantee zero residual raw audio
      const remainingBlobs = await getAllAudioBlobs();
      for (const b of remainingBlobs) {
        await deleteAudioBlob(b.id);
      }

      setLifeMapData(aiResponse);
      await refreshQueueStatus();
      setStage('lifemap');

      // 4. Voice readout
      const guidance = lang === 'hi' ? aiResponse.voice_guidance_hi : aiResponse.voice_guidance_en;
      speakText(guidance, lang, 'lifemap');
    } catch (e) {
      console.error('Error during upload and sync flow:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Direct Generate Life Map
  const handleGenerateLifeMap = () => {
    if (!transcript.trim()) return;
    setStage('processing');

    setTimeout(() => {
      const result = extractGroundedLifeMap({
        transcript,
        studentId: 'priya_17',
        language: lang
      });
      setLifeMapData(result);
      setStage('lifemap');

      const guidance = lang === 'hi' ? result.voice_guidance_hi : result.voice_guidance_en;
      speakText(guidance, lang, 'lifemap');
    }, 700);
  };

  // Learning Path Modules for SAMPLE-CRS-SOLAR-101
  const modules = [
    {
      id: 'MOD-1',
      stepNumber: 1,
      title: lang === 'hi' ? 'मॉड्यूल 1: इन्वर्टर सोल्डरिंग व सुरक्षा' : 'Module 1: Inverter Soldering & Safety',
      desc: lang === 'hi' ? 'रेडियो सोल्डरिंग कौशल को डीसी इन्वर्टर पीसीबी पर लागू करना।' : 'Apply small electronics soldering to high-current DC inverter PCBs.',
      xp: 40,
      duration: '15 mins',
      status: 'active'
    },
    {
      id: 'MOD-2',
      stepNumber: 2,
      title: lang === 'hi' ? 'मॉड्यूल 2: मल्टीमीटर से बैटरी वोल्टेज टेस्टिंग' : 'Module 2: Multimeter & Battery Testing',
      desc: lang === 'hi' ? '12V लेड-एसिड व लिथियम बैटरी बैंक की जांच।' : 'Test battery banks and measure terminal resistance.',
      xp: 40,
      duration: '20 mins',
      status: 'locked'
    },
    {
      id: 'MOD-3',
      stepNumber: 3,
      title: lang === 'hi' ? 'मॉड्यूल 3: रूफटॉप सोलर ग्रिड सिंक्रनाइज़ेशन' : 'Module 3: Rooftop Grid Synchronization',
      desc: lang === 'hi' ? 'पीएम सूर्य घर योजना के तहत ग्रिड टाई-इन।' : 'Final sync with net metering and earthing check.',
      xp: 40,
      duration: '25 mins',
      status: 'locked'
    }
  ];

  // Complete Module 1 action
  const handleFinishModule = async () => {
    setModuleCompleted(true);
    setXp(prev => prev + 40);
    if (isFresh && streakDays === 0) {
      setStreakDays(1);
    }
    const cheer = lang === 'hi' 
      ? 'शाबाश प्रिया! मॉड्यूल एक पूरा हो गया। आपका पहला चालीस रुपये का विलेज टास्क अनलॉक हो गया है!'
      : 'Well done Priya! Module 1 complete. Your first ₹40 village micro-task is unlocked!';
    speakText(cheer, lang, 'module_complete');

    await queueSyncEvent({
      studentId: 'priya_17',
      eventType: 'COURSE_MODULE_COMPLETED',
      itemId: 'SAMPLE-CRS-SOLAR-101-MOD-1',
      payload: {
        score: 95,
        courseId: 'SAMPLE-CRS-SOLAR-101',
        completedAt: new Date().toISOString()
      }
    });
    if (navigator.onLine && !isSimulatedOffline) {
      await flushSyncQueue('/api/sync');
    }
    await refreshQueueStatus();
    if (onCompleteModule) onCompleteModule();
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 py-4 space-y-5">
      
      {/* Top Header with Progress Segments and Back Arrow */}
      <div className="flex items-center justify-between pb-1">
        <ProgressSegments
          total={3}
          current={stage === 'input' ? 1 : stage === 'lifemap' ? 2 : 3}
          canGoBack={true}
          onBack={onBack}
        />
      </div>

      {/* STAGE 1: VOICE INPUT & SKILL CAPTURE */}
      {stage === 'input' && (
        <div className="bg-white rounded-32 border border-black/10 shadow-bento p-5 sm:p-7 space-y-6">
          
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <MascotKamu state={isRecording ? 'listening' : 'idle'} size={110} />
            <div className="flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-primary">
                  Voice Life Map • {lang === 'hi' ? 'हुनर पहचान' : 'Skill Discovery'}
                </span>
                {/* Live IndexedDB Queue Counters Badge */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-butter border border-ink/20 text-[11px] font-bold text-ink">
                  <Database className="w-3 h-3 text-primary" />
                  <span>Audio: {audioQueueCount}</span>
                  <span className="text-ink/30">•</span>
                  <span>Sync: {syncQueueCount}</span>
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-black font-display text-ink mt-1">
                {lang === 'hi' ? 'अपनी बोली में अपना हुनर बताएं' : 'Speak Your Skills in Your Own Voice'}
              </h2>
              <p className="text-xs sm:text-sm text-ink font-medium mt-1">
                {lang === 'hi'
                  ? 'जैसे: "मैं रेडियो बनाती हूँ", "मुझे सिलाई पसंद है", "मैं खेती का काम करता हूँ"'
                  : 'Example: "I repair radios", "I know tailoring", "I help with electric pumps"'}
              </p>
            </div>
          </div>

          {/* Dialect Selector (Item 6) */}
          <div className="p-3 rounded-2xl bg-[#F8F9FD] border border-ink/10 space-y-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-ink block">
              {lang === 'hi' ? 'बोली / भाषा चुनें (Dialect Selector)' : 'Choose Dialect / Language'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'hi', label: 'हिंदी (Hindi)', sub: 'मानक हिंदी' },
                { id: 'magahi', label: 'मगही / भोजपुरी', sub: 'Magahi / Bhojpuri' },
                { id: 'en', label: 'English', sub: 'Indian English' }
              ].map(d => (
                <button
                  key={d.id}
                  onClick={() => handleSelectDialect(d.id)}
                  className={`min-h-[44px] py-2 px-3 rounded-xl border font-bold text-xs flex flex-col items-center justify-center transition-all ${
                    dialect === d.id
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-white text-ink border-ink/15 hover:bg-butter-light'
                  }`}
                >
                  <span>{d.label}</span>
                  <span className={`text-[10px] ${dialect === d.id ? 'text-white/80' : 'text-ink/60'}`}>{d.sub}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Voice Input Action Row */}
          <div className="space-y-3">
            <PillOption
              id="voice-pill"
              label={
                isRecording 
                  ? `${lang === 'hi' ? 'सुन रहे हैं... बोलिए...' : 'Listening... Speak now...'} (${recordingSeconds}s)`
                  : (lang === 'hi' ? `माइक दबाकर बोलें (${dialect === 'magahi' ? 'मगही / भोजपुरी' : dialect === 'en' ? 'English' : 'हिंदी'})` : 'Tap Mic to Speak')
              }
              icon={isRecording ? MicOff : Mic}
              isVoicePill={true}
              isListening={isRecording}
              onClick={handleToggleRecord}
            />

            {/* Simulated Voice Fallback Pill for Demo (Item 6) */}
            <div className="flex items-center justify-between px-1 flex-wrap gap-2">
              <button
                onClick={handleSimulateVoiceInput}
                className="min-h-[44px] text-xs font-bold text-primary hover:underline flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>{lang === 'hi' ? `डेमो: प्रिया की आवाज़ (${dialect === 'magahi' ? 'मगही' : 'हिंदी'})` : "Demo: Load Priya's Voice"}</span>
              </button>
              
              <span className="text-[11px] text-ink font-semibold">
                {isSimulatedOffline || !navigator.onLine 
                  ? '⚡ Offline Mode (MediaRecorder -> IndexedDB audio_queue)' 
                  : '🌐 Online Fast Path'}
              </span>
            </div>
          </div>

          {/* Transcript Box */}
          <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-ink/10 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase text-ink tracking-wider">
                  {lang === 'hi' ? 'आवाज़ का ट्रांसक्रिप्ट (Transcript)' : 'Captured Voice Transcript'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {lang === 'hi' ? 'डेमो ट्रांसक्रिप्ट (एसटीटी कनेक्ट नहीं है)' : 'demo transcript (STT not connected)'}
                </span>
              </div>
              {transcript && (
                <button
                  onClick={() => speakText(transcript, dialect === 'en' ? 'en' : 'hi', 'greeting')}
                  className="min-h-[44px] min-w-[44px] text-xs text-primary font-bold flex items-center gap-1 hover:underline"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'सुनें' : 'Readout'}</span>
                </button>
              )}
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={lang === 'hi' ? 'यहाँ आवाज़ का ट्रांसक्रिप्ट दिखेगा या सीधे टाइप करें...' : 'Voice transcript will appear here or type directly...'}
              rows={3}
              className="w-full bg-white p-3 rounded-xl border border-ink/15 text-xs sm:text-sm font-bold text-ink focus:ring-2 focus:ring-primary outline-hidden resize-none"
            />
            {/* DPDP Safeguard Explanation (Requirement 1) */}
            <p className="text-[11px] text-ink font-medium leading-relaxed bg-white/70 p-2.5 rounded-xl border border-black/5">
              <span className="font-bold text-primary">{lang === 'hi' ? 'DPDP सुरक्षा:' : 'DPDP Safeguard:'}</span>{' '}
              {lang === 'hi'
                ? 'ट्रांसक्रिप्शन के बाद ऑडियो हमेशा के लिए हटा दिया जाता है। ध्यान दें: ऑनलाइन फ़ास्ट पाथ (वेब स्पीच) आवाज़ पहचानने हेतु ऑडियो को ब्राउज़र वेंडर को भेजता है।'
                : 'Audio deleted after transcription. Note: The Online Fast Path sends audio to the browser vendor for speech recognition.'}
            </p>
          </div>

          {/* Offline Audio Queued Banner with Real IndexedDB State */}
          {audioQueueCount > 0 && (
            <div className="p-4 rounded-2xl bg-butter text-ink border border-ink/20 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose animate-ping" />
                  <span className="text-xs font-bold">
                    {lang === 'hi' 
                      ? 'ऑडियो IndexedDB (audio_queue) में सुरक्षित है।' 
                      : 'Audio Blob queued in IndexedDB audio_queue.'}
                  </span>
                </div>
                <span className="text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full bg-ink text-butter">
                  audio_queue: {audioQueueCount} | sync_queue: {syncQueueCount}
                </span>
              </div>

              <p className="text-[11px] font-medium text-ink/80">
                {lang === 'hi'
                  ? 'DPDP अनुपालन: ऑनलाइन होने पर ट्रांसक्राइब होगा और कच्चा ऑडियो तुरंत डिलीट कर दिया जाएगा।'
                  : 'DPDP Safeguard: On sync, transcript is extracted and raw audio blob is permanently purged.'}
              </p>

              {/* Upload, Transcribe & Purge Trigger Button (Item 2) */}
              <button
                onClick={handleUploadAndSync}
                disabled={isSyncing}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-ink text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs hover:bg-black active:scale-98 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncing 
                    ? (lang === 'hi' ? 'अपलोड व ट्रांसक्राइब हो रहा है...' : 'Syncing & Purging Audio...')
                    : (lang === 'hi' ? 'ऑनलाइन जाएं, ट्रांसक्राइब करें व ऑडियो हटाएं (Sync & Purge)' : 'Go Online: Sync, Transcribe & Purge Audio')}
                </span>
              </button>
            </div>
          )}

          {/* Next Button */}
          <button
            onClick={audioQueueCount > 0 ? handleUploadAndSync : handleGenerateLifeMap}
            disabled={!transcript.trim()}
            className={`w-full min-h-[48px] py-4 rounded-full font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all ${
              transcript.trim()
                ? 'bg-primary hover:bg-primary-hover text-white active:scale-98'
                : 'bg-black/10 text-black/40 cursor-not-allowed'
            }`}
          >
            <span>
              {audioQueueCount > 0
                ? (lang === 'hi' ? 'सहेजे गए ऑडियो से लाइफ मैप बनाएं' : 'Sync Queued Audio & Generate Life Map')
                : (lang === 'hi' ? 'लाइफ मैप तैयार करें' : 'Generate Voice Life Map')}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STAGE 2: PROCESSING TRANSCRIPT WITH GROUNDED AI */}
      {stage === 'processing' && (
        <div className="bg-white rounded-32 border border-black/10 shadow-bento p-12 text-center space-y-4">
          <MascotKamu state="thinking" size={130} />
          <h3 className="text-lg font-black font-display text-ink">
            {lang === 'hi' ? 'कामू आपके हुनर को सरकारी पाठ्यक्रमों से जोड़ रहा है...' : 'Kamu is grounding your skills against verified DIKSHA/SWAYAM tracks...'}
          </h3>
          <p className="text-xs text-ink font-semibold max-w-sm mx-auto">
            Strict ID validation active • Confidence threshold scoring
          </p>
        </div>
      )}

      {/* STAGE 3: VISUAL VOICE LIFE MAP NODE GRAPH */}
      {stage === 'lifemap' && lifeMapData && (
        <div className="bg-white rounded-32 border border-black/10 shadow-bento p-5 sm:p-7 space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-black/5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-primary">
                  AI Life Map
                </span>
                {/* Item 8: Label rule-based confidence */}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-butter border border-ink/20 text-ink">
                  {lang === 'hi' ? 'कॉन्फिडेंस: 88% (नियम-आधारित अनुमान)' : 'Confidence: 88% (Rule-Based Grounding)'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black font-display text-ink mt-0.5">
                {lang === 'hi' ? 'प्रिया का करियर लाइफ मैप' : "Priya's Career Life Map"}
              </h2>
            </div>
            <button
              onClick={() => speakText(lang === 'hi' ? lifeMapData.voice_guidance_hi : lifeMapData.voice_guidance_en, lang, 'lifemap')}
              className="min-h-[44px] px-4 py-2 rounded-full bg-butter text-ink border border-ink/20 text-xs font-bold flex items-center gap-1.5 shadow-xs hover:bg-butter-light active:scale-95 transition-all"
            >
              <Volume2 className="w-4 h-4" />
              <span>{lang === 'hi' ? 'लाइफ मैप सुनें' : 'Listen to Life Map'}</span>
            </button>
          </div>

          {/* Low Confidence Refer to Facilitator Safeguard */}
          {lifeMapData.refer_to_facilitator ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 space-y-2">
              <div className="flex items-center gap-2 font-black text-sm text-amber-900">
                <AlertTriangle className="w-5 h-5 text-amber-700" />
                <span>Referred to Village Facilitator</span>
              </div>
              <p className="text-xs font-medium">
                Confidence was below 0.60. To prevent inaccurate matching, your profile has been flagged for in-person mentor counseling.
              </p>
            </div>
          ) : (
            /* Visual Node Roadmap (Skill -> Career -> Course -> Apprenticeship -> Micro-Task) */
            <div className="space-y-3.5">
              
              {/* Node 1: Matched Skills */}
              <div className="p-4 rounded-2xl bg-butter-light border border-butter/60 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-butter text-ink border border-ink/15 shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-ink/70">
                    Step 1: {lang === 'hi' ? 'पहचाना गया हुनर' : 'Identified Skill'}
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-ink">
                    {lifeMapData.matched_skills.join(' • ')}
                  </h4>
                  <p className="text-xs text-ink font-medium mt-0.5">
                    {lang === 'hi' ? 'रेडियो, सोल्डरिंग व एनालॉग सर्किट रिपेयर का अनुभव' : 'Small audio & circuit repair aptitude'}
                  </p>
                </div>
              </div>

              {/* Node 2: Target Emerging Rural Career */}
              <div className="p-4 rounded-2xl bg-sky-light border border-sky/60 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-sky text-ink border border-ink/15 shrink-0">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                    Step 2: {lang === 'hi' ? 'संभावित ग्रामीण करियर' : 'Emerging Village Career'}
                  </span>
                  <h4 className="text-sm sm:text-base font-black text-ink">
                    {lifeMapData.suggested_career}
                  </h4>
                  <p className="text-xs text-ink font-medium mt-0.5">
                    {lang === 'hi' ? 'पीएम सूर्य घर व सोलर पंपिंग में बढ़ती स्थानीय मांग' : 'High demand under PM Surya Ghar 300 units rooftop project'}
                  </p>
                </div>
              </div>

              {/* Node 3: Grounded SWAYAM / DIKSHA Course */}
              <div className="p-4 rounded-2xl bg-lavender-light border border-lavender/60 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-lavender text-ink border border-ink/15 shrink-0">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-ink/70">
                      Step 3: {lang === 'hi' ? 'सरकारी कौशल पाठ्यक्रम' : 'Certified Course'}
                    </span>
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-white text-ink border border-black/10">
                      {lifeMapData.primary_course_id}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-ink">
                    {lifeMapData.primary_course_title}
                  </h4>
                  <p className="text-xs text-ink font-medium mt-0.5">
                    {lang === 'hi' ? 'SWAYAM / National Institute of Solar Energy' : '6 Weeks • Free Practical Modules'}
                  </p>
                </div>
              </div>

              {/* Node 4: District Apprenticeship */}
              <div className="p-4 rounded-2xl bg-[#F8F9FD] border border-ink/10 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-white text-ink border border-ink/15 shrink-0">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-ink/70">
                      Step 4: {lang === 'hi' ? 'अप्रेंटिसशिप (मॉडल)' : 'Local Apprenticeship'}
                    </span>
                    <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-white text-ink border border-black/10">
                      {lifeMapData.apprenticeship_id}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-ink">
                    PM-KUSUM Feeder Solar Trainee (Gaya, Bihar)
                  </h4>
                  <p className="text-xs text-ink font-medium mt-0.5">
                    {lang === 'hi' ? 'मासिक स्टाइपेंड: ₹8,500/माह' : 'Stipend: ₹8,500/mo • 24 District Openings'}
                  </p>
                </div>
              </div>

              {/* Node 5: Paid Village Micro-Task Reward */}
              <div className="p-4 rounded-2xl bg-rose-light border border-rose/60 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-rose text-ink border border-ink/15 shrink-0">
                  <Coins className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-ink/70">
                      Step 5: {lang === 'hi' ? 'कमाई का पहला अवसर' : 'Earn While You Learn Micro-Task'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-white text-ink border border-black/10">
                        {lifeMapData.micro_task_id || 'SAMPLE-TASK-SOLAR-SURVEY-01'}
                      </span>
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-coin-gold text-ink border border-ink/20">
                        +₹{lifeMapData.micro_task_payout}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-sm sm:text-base font-black text-ink mt-0.5">
                    {lang === 'hi' ? 'गांव में 5 सोलर इन्वर्टर का सर्वे पूरा करें' : 'Verify 5 Village Solar Inverter Checklists'}
                  </h4>
                  <p className="text-xs text-ink font-medium mt-0.5">
                    {lang === 'hi' ? 'मॉड्यूल 1 पूरा करते ही अनलॉक होगा' : 'Unlocks immediately upon completing Module 1'}
                  </p>
                </div>
              </div>

              {/* Explicit Curriculum Disclaimer (Requirement 7) */}
              <p className="text-[11px] text-center text-ink/60 font-semibold pt-1">
                Sample data modelled on DIKSHA/SWAYAM/NSDC
              </p>

            </div>
          )}

          {/* Action to proceed to Winding Learning Path */}
          <button
            onClick={() => setStage('learning_path')}
            className="w-full min-h-[48px] py-4 rounded-full bg-primary hover:bg-primary-hover text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg active:scale-98 transition-all"
          >
            <span>{lang === 'hi' ? 'लर्निंग पाथ देखें व शुरू करें' : 'Proceed to Winding Learning Path'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STAGE 4: WINDING LEARNING PATH & GAME LAYER (Item 4 Overhaul) */}
      {stage === 'learning_path' && (
        <div className="bg-white rounded-32 border border-black/10 shadow-bento p-5 sm:p-7 space-y-6">
          
          {/* Top Game Layer Stats: Streak Diya & XP Ring */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-butter-light via-sky-light to-rose-light border border-black/10 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-white shadow-xs border border-black/5">
                <Flame className="w-6 h-6 text-coin-gold fill-coin-gold animate-bounce" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase text-ink/70 block">
                  Streak Diya
                </span>
                <span className="text-base font-black text-ink font-display">
                  {streakDays} {lang === 'hi' ? 'दिन का दीया' : 'Days Glowing'}
                </span>
              </div>
            </div>

            {/* XP Ring Progress */}
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] font-black uppercase text-ink/70 block">
                  Skill Level XP
                </span>
                <span className="text-sm sm:text-base font-black text-ink">
                  {xp} / 200 XP
                </span>
              </div>
              <div className="w-11 h-11 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center font-black text-xs text-primary shadow-xs">
                {Math.round((xp / 200) * 100)}%
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-primary">
                  {lang === 'hi' ? 'कौशल यात्रा' : 'Learning Expedition'}
                </span>
                <h3 className="text-lg sm:text-xl font-black font-display text-ink">
                  {lang === 'hi' ? 'घुमावदार सीखने का मार्ग (Winding Path)' : 'Interactive Winding Learning Path'}
                </h3>
              </div>
              <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-[#F8F9FD] border border-ink/10 text-ink">
                SAMPLE-CRS-SOLAR-101
              </span>
            </div>
            <p className="text-xs text-ink font-semibold mt-1">
              {lang === 'hi' 
                ? 'मॉड्यूल 1 पूरा करने पर ₹40 का पहला विलेज टास्क अनलॉक होगा' 
                : 'Complete Module 1 to unlock your first ₹40 village micro-task'}
            </p>
          </div>

          {/* Organic Winding Learning Trail with S-Curve Visual Connectors */}
          <div className="relative py-4 px-2 sm:px-6">
            
            {/* SVG Winding Road Connector Line */}
            <div className="absolute left-6 sm:left-10 top-8 bottom-8 w-1 bg-gradient-to-b from-primary via-leaf to-sky/40 rounded-full hidden sm:block" />

            <div className="space-y-6 relative">
              {modules.map((mod, idx) => {
                const isActive = idx === 0 && !moduleCompleted;
                const isDone = idx === 0 && moduleCompleted;
                const isLocked = idx > 0;

                return (
                  <div
                    key={mod.id}
                    className={`relative flex items-start gap-4 p-4 sm:p-5 rounded-28 border transition-all ${
                      isDone
                        ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                        : isActive
                          ? 'bg-butter-light border-butter shadow-md ring-2 ring-primary/20 scale-[1.01]'
                          : 'bg-[#F8F9FD] border-black/10 opacity-70'
                    }`}
                  >
                    {/* Winding Milestone Token */}
                    <div className="shrink-0 relative">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-black text-sm border-2 shadow-sm ${
                        isDone
                          ? 'bg-emerald-600 text-white border-emerald-700'
                          : isActive
                            ? 'bg-primary text-white border-white animate-pulse'
                            : 'bg-white text-ink/40 border-black/10'
                      }`}>
                        {isDone ? <Check className="w-5 h-5" /> : mod.stepNumber}
                      </div>

                      {/* Kamu Coaching Avatar on Active Milestone */}
                      {isActive && (
                        <div className="absolute -top-3 -right-3">
                          <MascotKamu state="coach" size={32} />
                        </div>
                      )}
                    </div>

                    {/* Milestone Content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-wider text-ink/60">
                            Milestone {idx + 1} • {mod.duration}
                          </span>
                          <h4 className="text-sm sm:text-base font-black text-ink">
                            {mod.title}
                          </h4>
                        </div>
                        <span className="text-xs font-black px-2.5 py-1 rounded-full bg-white text-ink border border-black/10 shrink-0">
                          +{mod.xp} XP
                        </span>
                      </div>

                      <p className="text-xs text-ink font-medium leading-relaxed">
                        {mod.desc}
                      </p>

                      {/* Interactive Milestone Actions */}
                      {idx === 0 && (
                        <div className="pt-3 border-t border-black/10 flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs font-bold text-ink">
                            {isDone
                              ? (lang === 'hi' ? '✅ मॉड्यूल 1 संपन्न! ₹40 टास्क अनलॉक हुआ।' : '✅ Module 1 Done! ₹40 Micro-Task Unlocked.')
                              : (lang === 'hi' ? 'सोल्डरिंग सिमुलेटर तैयार है' : 'Interactive soldering module ready')}
                          </span>
                          
                          {!moduleCompleted ? (
                            <button
                              onClick={handleFinishModule}
                              className="min-h-[44px] px-5 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white font-black text-xs shadow-xs active:scale-95 transition-all"
                            >
                              {lang === 'hi' ? 'मॉड्यूल 1 पूरा करें (+40 XP)' : 'Complete Module 1 (+40 XP)'}
                            </button>
                          ) : (
                            <button
                              onClick={onUnlockTask}
                              className="min-h-[44px] px-5 py-2.5 rounded-full bg-coin-gold hover:brightness-105 text-ink font-black text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5"
                            >
                              <Coins className="w-4 h-4" />
                              <span>{lang === 'hi' ? '₹40 माइक्रो-टास्क खोलें' : 'Open ₹40 Micro-Task'}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
