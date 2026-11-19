import { useState } from 'react';
import { FilePlus2, Menu, X } from 'lucide-react';

interface HeaderProps {
  lang: 'en' | 'hi';
  onOpenApply: (serviceId?: number | string) => void;
  onOpenCitizen: () => void;
  onOpenStaff: () => void;
}

export function Header({ lang, onOpenApply, onOpenCitizen, onOpenStaff }: HeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: '#services', label: lang === 'hi' ? 'सेवाएं' : 'Services' },
    { href: '#track-status', label: lang === 'hi' ? 'स्थिति जांच' : 'Track Status' },
    { href: '#tools', label: lang === 'hi' ? 'कैलकुलेटर व टूल्स' : 'Tools' },
    { href: '#location', label: lang === 'hi' ? 'कार्यालय व FAQ' : 'Location' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Clean Single-Line Wordmark */}
        <a
          href="#top"
          className="font-display text-lg font-extrabold tracking-tight text-slate-950 dark:text-white whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500 rounded"
        >
          {lang === 'hi' ? 'प्रज्ञा केंद्र रांची' : 'Pragya Kendra Ranchi'}
        </a>

        {/* Zone 2: 4 Concise Single-Line Links */}
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="hover:text-slate-950 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-500 rounded"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Zone 3: Primary CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onOpenApply(1)}
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
          >
            <FilePlus2 className="w-3.5 h-3.5" />
            <span>{lang === 'hi' ? 'अभी आवेदन करें' : 'Apply Now'}</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className="block py-2.5 px-3 text-sm font-medium text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
            >
              {item.label}
            </a>
          ))}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenApply(1);
              }}
              className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-slate-900 dark:bg-amber-500 dark:text-slate-950 rounded-lg cursor-pointer"
            >
              {lang === 'hi' ? 'अभी आवेदन करें (PDF)' : 'Apply Now (PDFs)'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenCitizen();
              }}
              className="py-2.5 px-3.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              {lang === 'hi' ? 'नागरिक लॉगिन' : 'Citizen'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                onOpenStaff();
              }}
              className="py-2.5 px-3.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-amber-300 cursor-pointer"
            >
              {lang === 'hi' ? 'स्टाफ डेस्क' : 'Staff'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
