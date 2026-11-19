import { useState } from 'react';
import { FileUp, Mic, Search } from 'lucide-react';
import { CORE_BEST_SERVICES } from '../data/bestPackages.ts';
import { CATEGORIES, DOC_DICT, SERVICES_CATALOG } from '../data/catalog.ts';

interface ServicesCatalogProps {
  lang: 'en' | 'hi';
  onOpenApply: (serviceIdOrSlug: number | string) => void;
  onSelectServiceForChecklist: (slug: string) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const PACKAGE_CATEGORIES = [
  'All',
  'Land & Mutation',
  'Registry & Legal',
  'JharSewa Certificates',
  'Citizen & Business',
] as const;

export function ServicesCatalog({
  lang,
  onOpenApply,
  onSelectServiceForChecklist,
  onNotify,
}: ServicesCatalogProps) {
  const [viewMode, setViewMode] = useState<'packages' | 'directory'>('packages');
  const [selectedPkgCat, setSelectedPkgCat] = useState<string>('All');

  // 115+ directory state
  const [activeCat, setActiveCat] = useState('all');
  const [query, setQuery] = useState('');
  const [listening, setListening] = useState(false);

  const idx = lang === 'hi' ? 1 : 0;
  const q = query.toLowerCase().trim();

  const visiblePackages =
    selectedPkgCat === 'All'
      ? CORE_BEST_SERVICES
      : CORE_BEST_SERVICES.filter((s) => s.category === selectedPkgCat);

  const filteredDirectory = SERVICES_CATALOG.filter((s) => {
    const matchCat = activeCat === 'all' || s[1] === activeCat;
    const matchQ =
      !q || s[2].toLowerCase().includes(q) || s[3].includes(q) || s[0].includes(q);
    return matchCat && matchQ;
  });

  const handleVoiceSearch = () => {
    const win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        onresult: (ev: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRec) {
      onNotify('Voice search is not supported in this browser; please type above.', 'info');
      return;
    }
    try {
      const rec = new SpeechRec();
      rec.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      setListening(true);
      onNotify('Listening... Speak a service name (e.g., Land Mutation or Caste Certificate)', 'info');
      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        onNotify(`Searched: "${transcript}"`, 'success');
      };
      rec.onerror = () => onNotify('Could not capture voice clearly; please type instead.', 'error');
      rec.onend = () => setListening(false);
      rec.start();
    } catch {
      setListening(false);
    }
  };

  return (
    <section
      id="services"
      className="py-14 sm:py-18 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 no-print"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              {lang === 'hi' ? 'नागरिक एवं कानूनी सेवा सूची' : 'Citizen & Legal Catalog'}
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {lang === 'hi'
                ? 'ऑटो-अप्लाइड बेस्ट पैकेज एवं 115+ सेवाएं'
                : 'Services with Auto-Applied Best Package'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              {lang === 'hi'
                ? 'प्रत्येक सेवा में अनुशंसित बेस्ट पैकेज और आवश्यक .PDF चेकलिस्ट शामिल है। PDF अपलोड व आवेदन के लिए Apply Now दबाएं।'
                : 'Every service includes its recommended Best Service package and strict .PDF checklist. Click Apply Now to upload PDFs and submit.'}
            </p>
          </div>

          {/* Segmented Mode Switcher */}
          <div className="inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 self-start">
            <button
              type="button"
              onClick={() => setViewMode('packages')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'packages'
                  ? 'bg-white dark:bg-slate-950 text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'hi' ? 'मुख्य बेस्ट पैकेज (6)' : 'Best Packages (6)'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('directory')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'directory'
                  ? 'bg-white dark:bg-slate-950 text-slate-950 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lang === 'hi'
                ? `संपूर्ण निर्देशिका (${SERVICES_CATALOG.length}+)`
                : `Full Directory (${SERVICES_CATALOG.length}+)`}
            </button>
          </div>
        </div>

        {viewMode === 'packages' ? (
          <>
            {/* Package Category Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {PACKAGE_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedPkgCat(cat)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    selectedPkgCat === cat
                      ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* 6 Best Service Package Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {visiblePackages.map((s) => {
                const title = lang === 'hi' ? s.titleHi : s.titleEn;
                const desc = lang === 'hi' ? s.descHi : s.descEn;
                const bestName = lang === 'hi' ? s.bestServiceHi : s.bestServiceEn;
                return (
                  <article
                    key={s.id}
                    className="bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-amber-700 dark:text-amber-400">
                          {s.category}
                        </span>
                        <span className="font-mono text-sm font-extrabold text-slate-950 dark:text-white tabular-nums">
                          ₹{s.fee}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-display font-bold text-slate-950 dark:text-white text-lg leading-snug">
                          {title}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                          {desc}
                        </p>
                      </div>

                      <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800 rounded-xl p-3">
                        <p className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                          {lang === 'hi' ? 'बेस्ट सर्विस शामिल' : 'Best Service Included'}
                        </p>
                        <p className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                          {bestName}
                        </p>
                      </div>

                      <div className="pt-1">
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                          Required PDFs ({s.checklist.length})
                        </p>
                        <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                          {s.checklist.map((item) => (
                            <li key={item} className="flex items-start gap-1.5">
                              <span className="text-amber-600 dark:text-amber-400 font-bold">·</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => onOpenApply(s.id)}
                        className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
                      >
                        <FileUp className="w-4 h-4" />
                        <span>{lang === 'hi' ? 'अभी आवेदन करें' : 'Apply Now'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectServiceForChecklist(s.slug)}
                        className="px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                      >
                        {lang === 'hi' ? 'चेकलिस्ट' : 'Checklist'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        ) : (
          <>
            {/* Search + Category Tabs for Full 115+ Directory */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 max-w-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5">
                <Search className="w-4 h-4 text-slate-400 ml-3 shrink-0" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    lang === 'hi'
                      ? 'सेवा खोजें (दाखिल-खारिज, सेल डीड, जाति, राशन, डीटीओ)...'
                      : 'Search 115+ services (Mutation, Sale Deed, Caste, Ration, DTO)...'
                  }
                  className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 py-2 px-1 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleVoiceSearch}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0 ${
                    listening
                      ? 'bg-rose-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 text-white'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>{listening ? 'Listening...' : lang === 'hi' ? 'बोलें' : 'Speak'}</span>
                </button>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                Showing {filteredDirectory.length} of {SERVICES_CATALOG.length} services
              </span>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setActiveCat('all')}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  activeCat === 'all'
                    ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                    : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}
              >
                {lang === 'hi' ? 'सभी सेवाएं' : 'All Services'}
              </button>
              {Object.entries(CATEGORIES).map(([key, names]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveCat(key)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    activeCat === key
                      ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {names[idx]}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDirectory.map((s) => {
                const serviceSlug = s[0];
                const catName = CATEGORIES[s[1]] ? CATEGORIES[s[1]][idx] : s[1];
                const docKeys = s[4].split(' ').filter(Boolean);
                return (
                  <article
                    key={serviceSlug}
                    className="bg-slate-50/70 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-amber-700 dark:text-amber-400">
                          {catName}
                        </span>
                        <span className="font-mono text-slate-500 dark:text-slate-400">
                          {docKeys.length} PDFs
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-sm text-slate-950 dark:text-white leading-snug">
                        {s[2 + idx]}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {docKeys.map((dk) => DOC_DICT[dk]?.[idx] || dk).join(' · ')}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => onSelectServiceForChecklist(serviceSlug)}
                        className="text-xs font-medium text-slate-600 dark:text-slate-400 hover:underline cursor-pointer"
                      >
                        {lang === 'hi' ? 'चेकलिस्ट' : 'Checklist'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenApply(serviceSlug)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 text-white cursor-pointer"
                      >
                        {lang === 'hi' ? 'आवेदन करें →' : 'Apply Now →'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
