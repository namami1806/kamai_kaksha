import React, { useState, useEffect } from 'react';
import { LanguageProvider, useTranslation } from './lib/i18n';
import OfflineBanner from './components/OfflineBanner';
import StudentHome from './pages/StudentHome';
import DesignTokensPanel from './components/DesignTokensPanel';
import DemoModeDock from './components/DemoModeDock';
import ConsentModal from './features/consent/ConsentModal';
import VoiceLifeMap from './features/lifemap/VoiceLifeMap';
import FacilitatorDashboard from './pages/FacilitatorDashboard';
import MicroTaskModal from './features/tasks/MicroTaskModal';
import WalletView from './features/wallet/WalletView';
import VerifiableCredentialCard from './features/credentials/VerifiableCredentialCard';
import GaonGuruRadar from './features/radar/GaonGuruRadar';
import AboutPage from './pages/AboutPage';
import ShowcasePage from './pages/ShowcasePage';
import DemoFramePage from './pages/DemoFramePage';
import { queueSyncEvent } from './lib/idb-queue';
import { ArrowLeft } from 'lucide-react';

function AppContent() {
  const { t } = useTranslation();
  const params = new URLSearchParams(window.location.search);
  const path = window.location.pathname;
  
  // Navigation & View state
  const initialView = params.get('view');
  const [activeTab, setActiveTab] = useState(() => {
    if (path === '/about' || initialView === 'about') return 'about';
    if (path === '/showcase' || initialView === 'showcase') return 'showcase';
    if (path === '/demo-frame' || initialView === 'demo-frame') return 'demo-frame';
    if (initialView === 'facilitator') return 'facilitator';
    if (initialView === 'lifemap' || initialView === 'learning_path' || initialView === 'voice_queued') return 'lifemap';
    if (initialView === 'wallet') return 'wallet';
    if (initialView === 'credentials' || initialView === 'credential') return 'credentials';
    if (initialView === 'radar' || initialView === 'jobs') return 'radar';
    if (params.get('tab') === 'tokens') return 'tokens';
    return 'home';
  });

  const [personaMode, setPersonaMode] = useState(() => params.get('persona') || 'fresh'); // Default to Fresh Priya for evaluation
  const [hasConsent, setHasConsent] = useState(() => params.get('consent') === 'true');
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(() => params.get('view') === 'tasks');
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(() => params.get('offline') === 'true');

  // Open Life Map handler (checks consent gate first)
  const handleOpenLifeMap = () => {
    if (!hasConsent) {
      setShowConsentModal(true);
    } else {
      setActiveTab('lifemap');
    }
  };

  const handleConsentGranted = () => {
    setHasConsent(true);
    setShowConsentModal(false);
    setActiveTab('lifemap');
  };

  const handleSimulateOfflineQueue = async () => {
    await queueSyncEvent({
      studentId: 'priya_17',
      eventType: 'COURSE_MODULE_COMPLETED',
      itemId: 'SAMPLE-CRS-SOLAR-101',
      payload: {
        module: 'M1_DC_INVERTER_WIRING',
        score: 95,
        timestamp: new Date().toISOString()
      }
    });
  };

  const handleSimulateVoice = () => {
    setActiveTab('lifemap');
  };

  useEffect(() => {
    if (params.get('queue') === 'true') {
      handleSimulateOfflineQueue();
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F8FD] text-ink pb-20 sm:pb-8">
      {/* 1. Offline / Online Connectivity Banner & Pending Sync (n) counter */}
      <OfflineBanner isSimulatedOffline={isSimulatedOffline} />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'home' && (
          <StudentHome 
            onNavigate={handleOpenLifeMap} 
            onNavigateFacilitator={() => setActiveTab('facilitator')}
            onSimulateOfflineQueue={handleSimulateOfflineQueue} 
            personaMode={personaMode}
          />
        )}

        {activeTab === 'lifemap' && (
          <VoiceLifeMap
            onBack={() => setActiveTab('home')}
            onCompleteModule={handleSimulateOfflineQueue}
            onUnlockTask={() => setShowTaskModal(true)}
            isSimulatedOffline={isSimulatedOffline}
          />
        )}

        {activeTab === 'wallet' && (
          <WalletView 
            onOpenCredentials={() => setActiveTab('credentials')}
            onBack={() => setActiveTab('lifemap')}
          />
        )}

        {activeTab === 'credentials' && (
          <VerifiableCredentialCard 
            onOpenRadar={() => setActiveTab('radar')}
            onBack={() => setActiveTab('wallet')}
          />
        )}

        {activeTab === 'radar' && (
          <GaonGuruRadar 
            onBack={() => setActiveTab('credentials')}
          />
        )}

        {activeTab === 'facilitator' && (
          <FacilitatorDashboard onBack={() => setActiveTab('home')} />
        )}

        {activeTab === 'tokens' && (
          <div className="py-6 px-4 max-w-5xl mx-auto space-y-4">
            <button
              onClick={() => setActiveTab('home')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-ink border border-ink/15 text-xs font-bold shadow-xs hover:bg-[#F2F4FC] transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Home</span>
            </button>
            <DesignTokensPanel />
          </div>
        )}

        {activeTab === 'about' && (
          <AboutPage 
            onBack={() => setActiveTab('home')} 
            onNavigate={(tab) => setActiveTab(tab)} 
          />
        )}

        {activeTab === 'showcase' && (
          <ShowcasePage 
            onBack={() => setActiveTab('home')} 
            onNavigate={(tab) => setActiveTab(tab)} 
            personaMode={personaMode} 
            setPersonaMode={setPersonaMode} 
          />
        )}

        {activeTab === 'demo-frame' && (
          <DemoFramePage onBack={() => setActiveTab('home')} />
        )}
      </main>

      {/* Micro-task Modal with Rate Limiting, Minor Check, and 3-Peer Validation */}
      <MicroTaskModal 
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onTaskVerified={() => {
          setShowTaskModal(false);
          setActiveTab('wallet');
        }}
      />

      {/* DPDP Plain-Language Consent Modal with Guardian Step for Under-18 */}
      {showConsentModal && (
        <ConsentModal
          studentAge={17} // Priya is 17 (Minor)
          onConsentGranted={handleConsentGranted}
          onCancel={() => setShowConsentModal(false)}
        />
      )}

      {/* 2. Discrete Demo Mode Dock (floating discreet trigger at bottom right) */}
      <DemoModeDock
        personaMode={personaMode}
        setPersonaMode={setPersonaMode}
        isSimulatedOffline={isSimulatedOffline}
        setIsSimulatedOffline={setIsSimulatedOffline}
        onOpenTokens={() => setActiveTab('tokens')}
        onOpenFacilitator={() => setActiveTab('facilitator')}
        onSimulateVoice={handleSimulateVoice}
        onOpenTask={() => setShowTaskModal(true)}
        onOpenWallet={() => setActiveTab('wallet')}
        onOpenCredentials={() => setActiveTab('credentials')}
        onOpenRadar={() => setActiveTab('radar')}
        onOpenAbout={() => setActiveTab('about')}
        onOpenShowcase={() => setActiveTab('showcase')}
        onOpenDemoFrame={() => setActiveTab('demo-frame')}
      />

      {/* Footer Notice */}
      <footer className="max-w-5xl mx-auto px-4 py-4 text-center text-xs text-ink/60 border-t border-black/5 space-y-1.5">
        <div className="flex items-center justify-center gap-4 text-xs font-bold text-primary flex-wrap">
          <button onClick={() => setActiveTab('about')} className="min-h-[44px] py-2 px-1 inline-flex items-center hover:underline">About & Architecture</button>
          <span>•</span>
          <button onClick={() => setActiveTab('showcase')} className="min-h-[44px] py-2 px-1 inline-flex items-center hover:underline">Showcase Gallery</button>
          <span>•</span>
          <button onClick={() => setActiveTab('demo-frame')} className="min-h-[44px] py-2 px-1 inline-flex items-center hover:underline">360px Simulator Frame</button>
        </div>
        <p>Kamai Kaksha (The Earning Classroom) • Citi Hackathon Prototype • Sample data modelled on DIKSHA/SWAYAM/NSDC</p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
