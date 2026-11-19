import { useState, type ChangeEvent, type FormEvent } from 'react';
import { AlertTriangle, CheckCircle2, SearchCheck, Upload } from 'lucide-react';
import {
  readAndValidateStrictPdf,
  type PortalApplication,
} from '../utils/portalStore.ts';

interface StatusTrackerSectionProps {
  lang: 'en' | 'hi';
  applications: PortalApplication[];
  onReuploadFlaggedPdf: (token: string, slotIndex: number, newFile: File) => Promise<void>;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function StatusTrackerSection({
  lang,
  applications,
  onReuploadFlaggedPdf,
  onNotify,
}: StatusTrackerSectionProps) {
  const [query, setQuery] = useState('PKR-2026-1001');
  const [submittedQuery, setSubmittedQuery] = useState('PKR-2026-1001');

  const q = submittedQuery.trim().toLowerCase();
  const matches = q
    ? applications.filter(
        (a) => a.token.toLowerCase().includes(q) || a.phone.includes(q)
      )
    : [];

  const handleLookup = (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSubmittedQuery(query.trim());
  };

  const handleFlaggedFileChange = async (
    e: ChangeEvent<HTMLInputElement>,
    token: string,
    slotIndex: number
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const { error } = await readAndValidateStrictPdf(file, slotIndex, 'Flagged Re-upload');
    if (error) {
      onNotify(error, 'error');
      return;
    }
    await onReuploadFlaggedPdf(token, slotIndex, file);
  };

  return (
    <section
      id="track-status"
      className="py-14 sm:py-16 bg-slate-50 dark:bg-slate-900/40 border-b border-slate-200 dark:border-slate-800 no-print"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            {lang === 'hi' ? 'रियल-टाइम आवेदन ट्रैकर' : 'Real-Time Application Tracker'}
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            {lang === 'hi'
              ? 'अपने आवेदन की स्थिति जांचें या फ्लैग की गई PDF पुनः अपलोड करें'
              : 'Track Your Application or Re-Upload Flagged PDFs'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            {lang === 'hi'
              ? 'प्रगति, UTR सत्यापन देखने या किसी फ्लैग किए गए दस्तावेज़ को सुधारने के लिए टोकन नंबर (जैसे PKR-2026-1001) या 10-अंकीय मोबाइल दर्ज करें।'
              : 'Enter your Reference Token (e.g., PKR-2026-1001) or 10-digit Mobile Number to verify UTR status or replace flagged PDFs.'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 space-y-5">
          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter Token ID (PKR-2026-...) or 10-digit Mobile Number"
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-semibold text-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <SearchCheck className="w-4 h-4" />
              <span>{lang === 'hi' ? 'स्थिति जांचें' : 'Check Status'}</span>
            </button>
          </form>

          {/* Recent local token quick chips */}
          {applications.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{lang === 'hi' ? 'सक्रिय टोकन:' : 'Recent Tokens:'}</span>
              {applications.slice(0, 4).map((app) => (
                <button
                  key={app.token}
                  type="button"
                  onClick={() => {
                    setQuery(app.token);
                    setSubmittedQuery(app.token);
                  }}
                  className="font-mono font-semibold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer"
                >
                  {app.token}
                </button>
              ))}
            </div>
          )}

          {/* Results */}
          <div className="space-y-4">
            {matches.length === 0 ? (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                {lang === 'hi'
                  ? 'इस टोकन आईडी या मोबाइल नंबर के लिए कोई आवेदन नहीं मिला।'
                  : 'No application found for that Token ID or Mobile Number.'}
              </div>
            ) : (
              matches.map((app) => {
                const flaggedPdfs = (app.pdfs || []).filter((p) => p.flagged);
                return (
                  <div
                    key={app.token}
                    className="bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-mono font-bold text-slate-900 dark:text-amber-300 text-sm">
                            {app.token}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{app.createdAt}</span>
                        </div>
                        <h3 className="font-display font-bold text-slate-950 dark:text-white text-base mt-1">
                          {app.serviceTitle}
                        </h3>
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-0.5">
                          Best Service: {app.bestService}
                        </p>
                      </div>

                      <span className="text-xs font-semibold text-slate-900 dark:text-amber-300 font-mono">
                        {app.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap gap-x-5 gap-y-1">
                      <span>
                        <strong>Applicant:</strong> {app.applicantName} ({app.anchal})
                      </span>
                      <span>
                        <strong>UTR:</strong> <span className="font-mono">{app.utr}</span>{' '}
                        {app.utrVerified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="text-amber-700 dark:text-amber-400 font-semibold">
                            Pending Verification
                          </span>
                        )}
                      </span>
                      <span className="tabular-nums">
                        <strong>PDFs:</strong> {app.pdfs.length} attached
                      </span>
                    </div>

                    {flaggedPdfs.length > 0 && (
                      <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl p-3.5 space-y-2.5">
                        <p className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>
                            {lang === 'hi'
                              ? 'कार्रवाई आवश्यक — फ्लैग की गई PDF पुनः अपलोड करें:'
                              : 'Action Required — Re-upload Flagged PDF(s):'}
                          </span>
                        </p>
                        {flaggedPdfs.map((fp) => {
                          const inputId = `reupload-${app.token}-${fp.slotIndex}`;
                          return (
                            <div
                              key={fp.slotIndex}
                              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs bg-white dark:bg-slate-950 border border-rose-200 dark:border-rose-900 rounded-lg px-3 py-2"
                            >
                              <div className="text-rose-900 dark:text-rose-200">
                                <strong>{fp.docName}:</strong>{' '}
                                <span>{fp.flagNote || 'Please upload a clearer PDF scan'}</span>
                              </div>
                              <div>
                                <label
                                  htmlFor={inputId}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-semibold cursor-pointer shrink-0"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>{lang === 'hi' ? 'PDF बदलें' : 'Replace PDF'}</span>
                                </label>
                                <input
                                  id={inputId}
                                  type="file"
                                  accept=".pdf,application/pdf"
                                  onChange={(e) =>
                                    handleFlaggedFileChange(e, app.token, fp.slotIndex)
                                  }
                                  className="hidden"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
