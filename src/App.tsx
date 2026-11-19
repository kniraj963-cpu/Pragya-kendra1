import { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/Header.tsx';
import { HeroSection } from './components/HeroSection.tsx';
import { LocationAndFaqSection } from './components/LocationAndFaqSection.tsx';
import {
  ApplyNowModal,
  CitizenPortalModal,
  PortalStaffModal,
  TokenReceiptModal,
} from './components/PortalModals.tsx';
import { OfflineIndicator } from './components/PWAComponents.tsx';
import { ServicesCatalog } from './components/ServicesCatalog.tsx';
import { SmartToolsSection } from './components/SmartToolsSection.tsx';
import { StatusTrackerSection } from './components/StatusTrackerSection.tsx';
import { WhatsAppWidget } from './components/WhatsAppWidget.tsx';
import { SERVICES_CATALOG, type AttachedDocMeta } from './data/catalog.ts';
import { apiUrl } from './utils/fileReader.ts';
import {
  getCitizenSession,
  getPortalApplications,
  savePortalApplications,
  syncApplicationsToD1,
  type CitizenSession,
  type PortalApplication,
} from './utils/portalStore.ts';

interface ToastItem {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  const [lang, setLang] = useState<'en' | 'hi'>(() => {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem('pkr_2026_lang_v2') === 'hi' ? 'hi' : 'en';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const manualThemeOverride = useRef(false);

  const [applications, setApplications] = useState<PortalApplication[]>(() =>
    getPortalApplications()
  );
  const [citizenSession, setCitizenSession] = useState<CitizenSession | null>(() =>
    getCitizenSession()
  );
  const [d1StatusText, setD1StatusText] = useState('Local + D1 Ready');

  // Modals & Interactive States
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyTargetService, setApplyTargetService] = useState<number | string>(1);
  const [receiptRecord, setReceiptRecord] = useState<PortalApplication | null>(null);
  const [citizenModalOpen, setCitizenModalOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);

  // Smart Tools shared checklist state
  const [selectedChecklistSlug, setSelectedChecklistSlug] = useState('land-mutation');
  const [stagedDocs, setStagedDocs] = useState<AttachedDocMeta[]>([]);

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const notify = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  // Respect system dark mode initially unless manually toggled
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const applySystemTheme = (matches: boolean) => {
      if (manualThemeOverride.current) return;
      const next = matches ? 'dark' : 'light';
      setTheme(next);
      document.documentElement.classList.toggle('dark', next === 'dark');
    };
    applySystemTheme(mq.matches);
    const onChange = (e: MediaQueryListEvent) => applySystemTheme(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const syncWithD1 = useCallback(async (apps: PortalApplication[], customUrl?: string) => {
    const result = await syncApplicationsToD1(apps, customUrl);
    if (result === 'synced') setD1StatusText('Synced · Cloudflare D1');
    else if (result === 'error') setD1StatusText('D1 Retry · Local Saved');
    else setD1StatusText('Local + D1 Ready');
  }, []);

  useEffect(() => {
    syncWithD1(applications);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTheme = () => {
    manualThemeOverride.current = true;
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  };

  const toggleLang = () => {
    setLang((prev) => {
      const next = prev === 'en' ? 'hi' : 'en';
      document.documentElement.lang = next;
      localStorage.setItem('pkr_2026_lang_v2', next);
      notify(next === 'hi' ? 'भाषा हिंदी में बदली गई' : 'Switched to English', 'info');
      return next;
    });
  };

  const handleOpenApply = (serviceIdOrSlug: number | string = 1) => {
    setApplyTargetService(serviceIdOrSlug);
    setApplyModalOpen(true);
  };

  const updateAndPersistApplications = useCallback(
    (next: PortalApplication[]) => {
      setApplications(next);
      savePortalApplications(next);
      void syncWithD1(next);
    },
    [syncWithD1]
  );

  const handleApplicationSubmitted = async (record: PortalApplication) => {
    const next = [record, ...applications];
    updateAndPersistApplications(next);
    setApplyModalOpen(false);
    setReceiptRecord(record);
    notify(`Application submitted! Token: ${record.token}`, 'success');

    // Also mirror metadata to local Express API if running
    try {
      await fetch(apiUrl('/api/inquiries'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: record.applicantName,
          phone: record.phone,
          serviceSlug: record.serviceSlug,
          serviceName: record.serviceTitle,
          locationDetails: record.anchal,
          message: `Best Service: ${record.bestService} | UTR: ${record.utr} | Token: ${record.token}`,
          attachedDocs: [],
        }),
      });
    } catch {
      // Offline / static standby
    }
  };

  const handleReuploadFlaggedPdf = async (token: string, slotIndex: number, file: File) => {
    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });

    const next = applications.map((app) => {
      if (app.token !== token) return app;
      return {
        ...app,
        pdfs: app.pdfs.map((p) =>
          p.slotIndex === slotIndex
            ? {
                ...p,
                fileName: file.name,
                sizeKB: Math.max(1, Math.round(file.size / 1024)),
                dataUrl,
                flagged: false,
                flagNote: '',
              }
            : p
        ),
      };
    });
    updateAndPersistApplications(next);
    notify(`Re-uploaded ${file.name} for ${token}`, 'success');
  };

  const handleSelectServiceForChecklist = (slug: string) => {
    setSelectedChecklistSlug(slug);
    const el = document.getElementById('tools');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Toast Notifications */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0 no-print">
        {toasts.map((t) => {
          const style =
            t.type === 'success'
              ? 'bg-emerald-800 text-white border-emerald-600'
              : t.type === 'error'
                ? 'bg-rose-800 text-white border-rose-600'
                : 'bg-slate-900 text-amber-300 border-slate-700';
          return (
            <div
              key={t.id}
              className={`${style} border px-4 py-3 rounded-xl shadow-lg text-xs sm:text-sm font-medium pointer-events-auto flex items-center justify-between gap-2`}
            >
              <span>{t.message}</span>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="text-white/70 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <Header
        lang={lang}
        onOpenApply={handleOpenApply}
        onOpenCitizen={() => setCitizenModalOpen(true)}
        onOpenStaff={() => setStaffModalOpen(true)}
      />

      <main>
        <HeroSection
          lang={lang}
          onToggleLang={toggleLang}
          theme={theme}
          onToggleTheme={toggleTheme}
          totalCatalogServices={SERVICES_CATALOG.length}
          citizenSession={citizenSession}
          d1StatusText={d1StatusText}
          onOpenApply={handleOpenApply}
          onOpenCitizen={() => setCitizenModalOpen(true)}
          onOpenStaff={() => setStaffModalOpen(true)}
        />

        <ServicesCatalog
          lang={lang}
          onOpenApply={handleOpenApply}
          onSelectServiceForChecklist={handleSelectServiceForChecklist}
          onNotify={notify}
        />

        <StatusTrackerSection
          lang={lang}
          applications={applications}
          onReuploadFlaggedPdf={handleReuploadFlaggedPdf}
          onNotify={notify}
        />

        <SmartToolsSection
          lang={lang}
          selectedChecklistSlug={selectedChecklistSlug}
          onChangeChecklistSlug={setSelectedChecklistSlug}
          stagedDocs={stagedDocs}
          onAddStagedDocs={(docs) => setStagedDocs((prev) => [...prev, ...docs])}
          onRemoveStagedDoc={(index) =>
            setStagedDocs((prev) => prev.filter((_, i) => i !== index))
          }
          onJumpToInquiryWithService={(slug) => handleOpenApply(slug)}
          onNotify={notify}
        />

        <div id="location" className="no-print">
          <LocationAndFaqSection lang={lang} />
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="bg-slate-950 text-slate-400 py-10 text-xs no-print border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="font-display text-sm font-bold text-white">Pragya Kendra — Ranchi</p>
              <p className="mt-1">
                Beside Kolkatta Pharma, Radium Road, Kutchery Chowk, Ranchi - 834001 · +91 90652 33139 · +91 86038 58578 · kniraj963@gmail.com
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <a href="#services" className="hover:text-white">
                Services
              </a>
              <a href="#track-status" className="hover:text-white">
                Track Status
              </a>
              <a href="#tools" className="hover:text-white">
                Tools
              </a>
              <button
                type="button"
                onClick={() => handleOpenApply(1)}
                className="hover:text-white cursor-pointer"
              >
                Apply Now
              </button>
              <button
                type="button"
                onClick={() => setStaffModalOpen(true)}
                className="hover:text-white cursor-pointer"
              >
                Staff Console
              </button>
            </div>
          </div>
          <p className="text-slate-500">
            Independent digital service, land documentation, and legal drafting assistance centre. Not an official government portal. Aadhaar enrollment excluded.
          </p>
        </div>
      </footer>

      {/* Modals */}
      <ApplyNowModal
        open={applyModalOpen}
        lang={lang}
        initialService={applyTargetService}
        citizenSession={citizenSession}
        onClose={() => setApplyModalOpen(false)}
        onSubmitted={handleApplicationSubmitted}
        onNotify={notify}
      />

      <TokenReceiptModal
        record={receiptRecord}
        onClose={() => setReceiptRecord(null)}
        onNotify={notify}
      />

      <CitizenPortalModal
        open={citizenModalOpen}
        lang={lang}
        session={citizenSession}
        applications={applications}
        onClose={() => setCitizenModalOpen(false)}
        onSessionChange={setCitizenSession}
        onOpenNewApply={() => handleOpenApply(1)}
        onNotify={notify}
      />

      <PortalStaffModal
        open={staffModalOpen}
        lang={lang}
        applications={applications}
        onClose={() => setStaffModalOpen(false)}
        onUpdateApplications={updateAndPersistApplications}
        onSyncD1={syncWithD1}
        onNotify={notify}
      />

      <OfflineIndicator />
      <WhatsAppWidget lang={lang} />
    </div>
  );
}
