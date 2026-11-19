import { useState } from 'react';
import {
  ArrowRight,
  Database,
  FileCheck2,
  Languages,
  MapPin,
  Moon,
  QrCode,
  Search,
  ShieldCheck,
  ShieldX,
  Sun,
  UserCheck,
  Wand2,
} from 'lucide-react';
import heroDeskImg from '../assets/images/hero_citizen_desk_1795082206192.jpg';
import { ALL_APPLY_OPTIONS, type BestServicePackage } from '../data/bestPackages.ts';
import type { CitizenSession } from '../utils/portalStore.ts';
import { PWAInstallButton } from './PWAComponents.tsx';

interface HeroSectionProps {
  lang: 'en' | 'hi';
  onToggleLang: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  totalCatalogServices: number;
  citizenSession: CitizenSession | null;
  d1StatusText: string;
  onOpenApply: (serviceId?: number | string) => void;
  onOpenCitizen: () => void;
  onOpenStaff: () => void;
}

export function HeroSection({
  lang,
  onToggleLang,
  theme,
  onToggleTheme,
  totalCatalogServices,
  citizenSession,
  d1StatusText,
  onOpenApply,
  onOpenCitizen,
  onOpenStaff,
}: HeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [imgFailed, setImgFailed] = useState(false);

  const q = searchQuery.trim().toLowerCase();
  const matches: BestServicePackage[] = q
    ? ALL_APPLY_OPTIONS.filter(
        (s) =>
          s.titleEn.toLowerCase().includes(q) ||
          s.titleHi.toLowerCase().includes(q) ||
          s.bestServiceEn.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)
      ).slice(0, 6)
    : [];

  const handleApplyBestFromSearch = () => {
    const pick = matches[0] || ALL_APPLY_OPTIONS[0];
    setSearchQuery('');
    onOpenApply(pick.id);
  };

  return (
    <section
      id="top"
      className="pt-5 pb-14 sm:pt-8 sm:pb-20 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 no-print"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Workspace Utility Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-900">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              {lang === 'hi'
                ? 'कोलकाता फार्मा के बगल में, रेडियम रोड, कचहरी चौक, रांची'
                : 'Beside Kolkatta Pharma, Radium Road, Kutchery Chowk, Ranchi'}
            </span>
            <span className="hidden xl:inline text-slate-400" aria-hidden="true">
              ·
            </span>
            <span className="hidden xl:inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{d1StatusText}</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PWAInstallButton />

            <button
              type="button"
              onClick={onOpenCitizen}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
              <span>
                {citizenSession ? citizenSession.name.split(' ')[0] : lang === 'hi' ? 'नागरिक लॉगिन' : 'Citizen Login'}
              </span>
            </button>

            <button
              type="button"
              onClick={onOpenStaff}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{lang === 'hi' ? 'स्टाफ लॉगिन' : 'Staff Console'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleLang}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>{lang === 'en' ? 'हिंदी में देखें' : 'English'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label="Toggle light or dark mode"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-slate-700" />
              )}
              <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>

        {/* 2-Column Balanced Split Hero */}
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Column: Proposition + Search Finder */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <p className="text-xs font-semibold tracking-wide text-amber-700 dark:text-amber-400">
                {lang === 'hi'
                  ? 'अधिकृत नागरिक सेवा केंद्र · कचहरी एवं रजिस्ट्री हब, रांची'
                  : 'Authorized Citizen Service Center · Kutchery & Registry Hub, Ranchi'}
              </p>

              <h1
                className="font-display font-extrabold tracking-tight text-slate-950 dark:text-white leading-[1.1] max-w-2xl"
                style={{ fontSize: 'clamp(2.15rem, 3.8vw, 3.35rem)', textWrap: 'balance' }}
              >
                {lang === 'hi'
                  ? 'रांची में तेज़, सत्यापित नागरिक एवं कानूनी सेवाएं'
                  : 'Fast, Verified Citizen & Legal Services in Ranchi'}
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                {lang === 'hi'
                  ? 'प्रत्येक दस्तावेज़ हेतु .PDF चेकलिस्ट, अनुशंसित बेस्ट सर्विस पैकेज, त्वरित UPI QR एवं UTR सत्यापन और लाइव स्टेटस ट्रैकिंग—रेडियम रोड, कचहरी चौक पर।'
                  : 'Apply online with strict per-document .PDF checklists, auto-applied Best Service packages, instant UPI QR payment with UTR verification, and live application tracking.'}
              </p>
            </div>

            {/* Quick Search / Best Service Finder */}
            <div className="relative bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      lang === 'hi'
                        ? 'दाखिल-खारिज, लगान, रजिस्ट्री, जाति/आय, पैन, पासपोर्ट खोजें...'
                        : 'Search mutation, lagaan, registry, caste/income, PAN, passport...'
                    }
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyBestFromSearch}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-semibold text-sm transition-colors shrink-0 whitespace-nowrap cursor-pointer"
                >
                  <Wand2 className="w-4 h-4" />
                  <span>{lang === 'hi' ? 'बेस्ट सर्विस चुनें' : 'Best Service & Apply'}</span>
                </button>
              </div>

              {q && (
                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
                  {matches.length === 0 ? (
                    <div className="p-3 text-xs text-slate-500">
                      {lang === 'hi' ? 'कोई मिलती-जुलती सेवा नहीं मिली।' : 'No matching service found.'}
                    </div>
                  ) : (
                    matches.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          onOpenApply(m.id);
                        }}
                        className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-900 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {lang === 'hi' ? m.titleHi : m.titleEn}
                          </p>
                          <p className="text-[11px] text-emerald-700 dark:text-emerald-400 truncate">
                            {lang === 'hi' ? m.bestServiceHi : m.bestServiceEn} · ₹{m.fee}
                          </p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 shrink-0">
                          {lang === 'hi' ? 'आवेदन' : 'Apply'}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Clean Unboxed Verification Notes & Links */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <FileCheck2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{lang === 'hi' ? 'प्रत्येक आइटम हेतु .PDF अनिवार्य' : 'Strict .PDF Per Checklist Item'}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{lang === 'hi' ? 'UPI QR व UTR सत्यापन' : 'UPI QR & UTR Verification'}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldX className="w-3.5 h-3.5 text-slate-500" />
                <span>{lang === 'hi' ? 'आधार नामांकन/अपडेट उपलब्ध नहीं' : 'No Aadhaar Enrollment / Update'}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <a
                href="#services"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-xl transition-colors"
              >
                <span>{lang === 'hi' ? 'सेवाएं व पैकेज देखें' : 'Explore Services & Apply'}</span>
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#track-status"
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 rounded-xl transition-colors"
              >
                <span>{lang === 'hi' ? 'आवेदन स्थिति जांचें' : 'Track Application Status'}</span>
              </a>
            </div>
          </div>

          {/* Right Column: Editorial Consultation Desk Visual */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="relative flex-1 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 min-h-[280px]">
              {!imgFailed ? (
                <img
                  src={heroDeskImg}
                  alt="Pragya Kendra Ranchi citizen consultation and documentation desk at Radium Road, Kutchery Chowk"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center text-slate-300 bg-slate-900">
                  <FileCheck2 className="w-10 h-10 text-amber-400 mb-3" />
                  <p className="font-display font-bold text-white">Pragya Kendra Ranchi</p>
                  <p className="text-xs text-slate-400 mt-1">Kutchery Chowk Documentation &amp; Legal Desk</p>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent flex flex-col justify-end p-5 text-white">
                <p className="text-xs font-semibold text-amber-300">
                  {lang === 'hi' ? 'रांची कचहरी रोड डेस्क' : 'Radium Road · Adjacent to Gayatri Medical Hall'}
                </p>
                <p className="font-display text-base sm:text-lg font-bold leading-snug mt-1">
                  {lang === 'hi'
                    ? 'दाखिल-खारिज, सेल डीड व झारसेवा दस्तावेज़ सत्यापन'
                    : 'Jharbhoomi Mutation, Registry Deeds & JharSewa Verification'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-Width 4-Column Metric Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
            <div className="font-mono text-2xl font-bold text-slate-950 dark:text-white tabular-nums">
              {totalCatalogServices}+
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {lang === 'hi' ? 'सक्रिय नागरिक एवं राजस्व सेवाएं' : 'Citizen, Legal & Revenue Services'}
            </div>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
            <div className="font-mono text-2xl font-bold text-slate-950 dark:text-white tabular-nums">
              6 Packs
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {lang === 'hi' ? 'ऑटो-अप्लाइड बेस्ट सर्विस पैकेज' : 'Auto-Applied Best Service Packages'}
            </div>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
            <div className="font-mono text-2xl font-bold text-slate-950 dark:text-white tabular-nums">
              4.2 ★
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              95 Google Reviews · Kutchery Chowk
            </div>
          </div>
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50">
            <div className="font-mono text-2xl font-bold text-slate-950 dark:text-white tabular-nums">
              09:30–19:30
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              Mon – Sat · Sun by Appointment
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
