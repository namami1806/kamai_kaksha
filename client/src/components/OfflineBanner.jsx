import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { getPendingSyncCount, subscribeToQueue, flushSyncQueue } from '../lib/idb-queue';
import { useTranslation } from '../lib/i18n';

/**
 * OfflineBanner: Real-time network status and pending sync counter
 */
export default function OfflineBanner({ onForceSimulateOffline, isSimulatedOffline }) {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine && !isSimulatedOffline);
  const [pendingCount, setPendingCount] = useState(() => {
    const urlCount = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('pending') : null;
    return urlCount ? parseInt(urlCount, 10) : 0;
  });
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Initial pending count
    getPendingSyncCount().then(dbCount => {
      const urlCount = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('pending') : null;
      setPendingCount(urlCount ? parseInt(urlCount, 10) : dbCount);
    });

    // Subscribe to queue changes
    const unsubscribe = subscribeToQueue((newCount) => {
      setPendingCount(newCount);
    });

    const handleOnline = () => {
      if (!isSimulatedOffline) {
        setIsOnline(true);
        triggerSync();
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribe();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isSimulatedOffline]);

  useEffect(() => {
    const online = navigator.onLine && !isSimulatedOffline;
    setIsOnline(online);
    if (online) {
      // Automatic queue flush on reconnection (Requirement 2)
      triggerSync();
    }
  }, [isSimulatedOffline]);

  const triggerSync = async () => {
    setIsSyncing(true);
    await flushSyncQueue();
    const count = await getPendingSyncCount();
    setPendingCount(count);
    setIsSyncing(false);
  };

  return (
    <div className="w-full sticky top-0 z-50">
      {/* Banner Strip */}
      <div
        className={`px-4 py-2 transition-colors duration-300 flex items-center justify-between text-xs sm:text-sm font-semibold ${
          !isOnline
            ? 'bg-ink text-butter border-b border-butter/30'
            : pendingCount > 0
              ? 'bg-butter text-ink border-b border-ink/10'
              : 'bg-emerald-500 text-white shadow-xs'
        }`}
      >
        {/* Left: Status Icon and Message */}
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <>
              <WifiOff className="w-4 h-4 text-butter animate-pulse" />
              <span>{t('connectivity.offline_badge')}</span>
            </>
          ) : pendingCount > 0 ? (
            <>
              <RefreshCw className={`w-4 h-4 text-ink ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{t('connectivity.online_badge')}</span>
            </>
          ) : (
            <>
              <Wifi className="w-4 h-4 text-white" />
              <span className="opacity-95">Kamai Kaksha PWA • Ready Offline & Online</span>
            </>
          )}
        </div>

        {/* Right: Pending Sync (n) Counter & Manual Sync Trigger */}
        <div className="flex items-center gap-2">
          <div 
            id="pending-sync-badge"
            data-count={pendingCount}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs border ${
              !isOnline 
                ? 'bg-butter text-ink border-ink/20 shadow-xs' 
                : pendingCount > 0 
                  ? 'bg-black/10 text-ink border-black/10'
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${pendingCount > 0 ? 'bg-rose animate-ping' : 'bg-emerald-500'}`} />
            <span>{t('connectivity.pending_sync')}: {pendingCount}</span>
          </div>

          {isOnline && pendingCount > 0 && (
            <button
              onClick={triggerSync}
              disabled={isSyncing}
              className="px-2.5 py-0.5 bg-ink text-white hover:bg-ink/80 rounded-full text-xs font-bold transition-all disabled:opacity-50"
            >
              {isSyncing ? 'Syncing...' : t('actions.retry_sync')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
