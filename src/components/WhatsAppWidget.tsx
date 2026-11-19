import { useState } from 'react';
import { ExternalLink, MessageCircle, X } from 'lucide-react';

interface WhatsAppWidgetProps {
  lang: 'en' | 'hi';
}

const COUNTERS = [
  { value: '919065233139', label: 'Main Desk (Radium Road) — +91 90652 33139' },
  { value: '918603858578', label: 'Land Mutation & Registry — +91 86038 58578' },
  { value: '919835000002', label: 'JharSewa & Certificate Desk — +91 98350 00002' },
];

const TEMPLATES: Record<string, string> = {
  mutation:
    'Namaste Pragya Kendra Ranchi (Kutchery Chowk), I need help with Jharbhoomi Land Mutation (दाखिल-खारिज) & Lagaan PDF checklist.',
  registry:
    'Namaste Pragya Kendra Ranchi, please guide me on Kutchery Registry, deed drafting & stamp duty calculation.',
  jharsewa:
    'Namaste Pragya Kendra Ranchi, I want to apply for a JharSewa Certificate (Caste / Residential / Income) with PDF checklist.',
  status:
    'Namaste Pragya Kendra Ranchi, please share an update on my application status & UTR payment verification.',
};

export function WhatsAppWidget({ lang }: WhatsAppWidgetProps) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(COUNTERS[0].value);
  const [templateKey, setTemplateKey] = useState('mutation');
  const [message, setMessage] = useState(TEMPLATES.mutation);

  const handleTemplateChange = (key: string) => {
    setTemplateKey(key);
    setMessage(TEMPLATES[key] || TEMPLATES.mutation);
  };

  const launchHref = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

  return (
    <div className="fixed bottom-4 right-4 z-40 no-print flex flex-col items-end">
      {open && (
        <div className="mb-3 w-80 sm:w-96 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-emerald-700 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              <div>
                <p className="font-bold text-sm">
                  {lang === 'hi' ? 'व्हाट्सएप सहायता डेस्क' : 'WhatsApp Counter Desk'}
                </p>
                <p className="text-[11px] text-emerald-100">
                  Pragya Kendra · Kutchery Chowk, Ranchi
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close WhatsApp panel"
              className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'काउंटर नंबर चुनें' : 'Select Counter Number'}
              </label>
              <select
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-semibold"
              >
                {COUNTERS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'त्वरित संदेश टेम्पलेट' : 'Quick Custom Message'}
              </label>
              <select
                value={templateKey}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              >
                <option value="mutation">Land Mutation (दाखिल-खारिज) &amp; Lagaan Checklist</option>
                <option value="registry">Kutchery Registry &amp; Deed Stamp Duty Query</option>
                <option value="jharsewa">JharSewa Caste / Residential / Income Certificate</option>
                <option value="status">Check My Application Status / UTR Verification</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'संदेश पूर्वावलोकन (संपादन योग्य)' : 'Message Preview (Editable)'}
              </label>
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <a
              href={launchHref}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{lang === 'hi' ? 'WhatsApp पर चैट करें' : 'Chat on WhatsApp'}</span>
            </a>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Open WhatsApp Desk"
        className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-xl transition-transform hover:scale-105 cursor-pointer"
      >
        <MessageCircle className="w-5 h-5" />
        <span>WhatsApp</span>
      </button>
    </div>
  );
}
