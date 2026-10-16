/**
 * Pluggable Speech Engine for Kamai Kaksha
 * Supports online Web Speech API, typed-text fallback, and pluggable on-device WASM STT.
 */

// TODO: Pluggable on-device STT interface (Vosk WASM / Whisper-tiny WASM).
// To integrate offline local speech recognition:
// 1. Load Vosk WebAssembly engine (vosk-browser) or Transformers.js whisper-tiny
// 2. Stream AudioContext mic buffer directly into the WASM worker
// 3. Emit partial and final transcript tokens locally without any internet roundtrip
export class VoskWaspSTTPlugin {
  constructor() {
    this.name = 'Vosk-WASM-Offline-Engine';
    this.isReady = false;
  }
  async initialize() {
    // Placeholder for WASM model loading:
    // await createVoskModel('/models/vosk-model-small-hi.tar.gz');
    console.info('[STT Plugin] Vosk WASM architecture hook ready for on-device Hindi/Magahi weights.');
    this.isReady = true;
  }
  async transcribeBuffer(audioBuffer) {
    throw new Error('Vosk WASM model weights pending build step. Falling back to browser speech engine.');
  }
}

/**
 * Speech Recognition Wrapper with Web Speech API + typed fallback
 */
export class SpeechService {
  constructor() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.hasBrowserSupport = !!SpeechRecognition;
    this.recognition = this.hasBrowserSupport ? new SpeechRecognition() : null;
    this.isListening = false;
    this.onDevicePlugin = new VoskWaspSTTPlugin();

    if (this.recognition) {
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'hi-IN'; // Default Hindi
    }
  }

  setLanguage(langCode) {
    if (!this.recognition) return;
    switch (langCode) {
      case 'hi':
      case 'magahi':
      case 'bhojpuri':
        this.recognition.lang = 'hi-IN';
        break;
      case 'en':
      default:
        this.recognition.lang = 'en-IN';
        break;
    }
  }

  startListening({ onResult, onInterim, onError, onEnd }) {
    if (!this.hasBrowserSupport) {
      if (onError) onError(new Error('Browser speech recognition not supported. Typed fallback available.'));
      return;
    }

    try {
      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event) => {
        let interim = '';
        let final = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (interim && onInterim) onInterim(interim);
        if (final && onResult) onResult(final);
      };

      this.recognition.onerror = (err) => {
        this.isListening = false;
        if (onError) onError(err);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (onEnd) onEnd();
      };

      this.recognition.start();
    } catch (err) {
      this.isListening = false;
      if (onError) onError(err);
    }
  }

  stopListening() {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }
}

/**
 * Text-to-Speech (TTS) for Mascot Kamu's voice readouts
 * Uses Web Speech API when a hi-IN voice is installed in Chrome.
 * Falls back to high-fidelity pre-recorded audio clips if no native Hindi voice is present.
 */
const AUDIO_FALLBACK_MAP = {
  welcome: '/audio/kamu_welcome.wav',
  greeting: '/audio/kamu_greeting.wav',
  lifemap: '/audio/kamu_lifemap.wav',
  consent: '/audio/kamu_consent.wav',
  module_complete: '/audio/kamu_module_complete.wav'
};

export function hasHindiVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return false;
  const voices = window.speechSynthesis.getVoices();
  return voices.some(v => v.lang.toLowerCase().startsWith('hi'));
}

export function playAudioFallback(clipKey) {
  const src = AUDIO_FALLBACK_MAP[clipKey];
  if (!src) return;
  const audio = new Audio(src);
  audio.play().catch(e => console.warn('Audio clip autoplay prevented:', e));
}

export function speakText(text, lang = 'hi', clipKey = null) {
  if (typeof window === 'undefined') return;

  // If a known clip exists and no Hindi voice is registered in Chrome, play the pre-recorded clip
  if (lang === 'hi' && clipKey && AUDIO_FALLBACK_MAP[clipKey] && !hasHindiVoice()) {
    playAudioFallback(clipKey);
    return;
  }

  if (!('speechSynthesis' in window)) {
    if (clipKey) playAudioFallback(clipKey);
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95; // Gentle, clear speed for rural students
  utterance.pitch = 1.05; // Warm, friendly pitch

  const voices = window.speechSynthesis.getVoices();
  const targetPrefix = lang === 'hi' ? 'hi' : 'en';
  const matchedVoice = voices.find(v => v.lang.toLowerCase().startsWith(targetPrefix));

  if (matchedVoice) {
    utterance.voice = matchedVoice;
    window.speechSynthesis.speak(utterance);
  } else if (lang === 'hi') {
    // If no Hindi voice in Chrome, use the pre-recorded clip fallback
    if (clipKey && AUDIO_FALLBACK_MAP[clipKey]) {
      playAudioFallback(clipKey);
    } else {
      // Best-effort speech or default clip
      if (text.includes('सोलर') || text.includes('लाइफ मैप')) {
        playAudioFallback('lifemap');
      } else if (text.includes('सहमति') || text.includes('गोपनीयता')) {
        playAudioFallback('consent');
      } else {
        playAudioFallback('greeting');
      }
    }
  } else {
    window.speechSynthesis.speak(utterance);
  }
}

export const speechService = new SpeechService();

