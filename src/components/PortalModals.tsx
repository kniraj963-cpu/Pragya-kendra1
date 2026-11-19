import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Award,
  CheckCircle2,
  Copy,
  Download,
  Eye,
  FileCheck,
  Lock,
  Printer,
  QrCode,
  Send,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import {
  ALL_APPLY_OPTIONS,
  resolvePackageByIdOrSlug,
} from '../data/bestPackages.ts';
import {
  clearCitizenSession,
  getD1Endpoint,
  getPortalStaffPin,
  PORTAL_UPI_CONFIG,
  readAndValidateStrictPdf,
  saveCitizenSession,
  saveD1Endpoint,
  savePortalStaffPin,
  type CitizenSession,
  type PortalApplication,
  type UploadedSlotPdf,
} from '../utils/portalStore.ts';
import { buildTrackingUrl } from '../utils/qr.ts';
import { QRCodeBox } from './QRCodeBox.tsx';

/* -------------------------------------------------------------------------- */
/* 1. APPLY NOW MODAL (Strict Per-Item PDF + Best Service + UPI QR + UTR)     */
/* -------------------------------------------------------------------------- */

interface ApplyNowModalProps {
  open: boolean;
  lang: 'en' | 'hi';
  initialService: number | string;
  citizenSession: CitizenSession | null;
  onClose: () => void;
  onSubmitted: (record: PortalApplication) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function ApplyNowModal({
  open,
  lang,
  initialService,
  citizenSession,
  onClose,
  onSubmitted,
  onNotify,
}: ApplyNowModalProps) {
  const [selectedId, setSelectedId] = useState<number>(1);
  const [applicantName, setApplicantName] = useState('');
  const [phone, setPhone] = useState('');
  const [anchal, setAnchal] = useState('');
  const [utr, setUtr] = useState('');
  const [slots, setSlots] = useState<Record<number, UploadedSlotPdf>>({});
  const [previewSlot, setPreviewSlot] = useState<number | null>(null);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (!open) return;
    const pkg = resolvePackageByIdOrSlug(initialService);
    setSelectedId(pkg.id);
    setSlots({});
    setPreviewSlot(null);
    setValidationError('');
    if (citizenSession) {
      setApplicantName(citizenSession.name || '');
      setPhone(citizenSession.phone || '');
    }
  }, [open, initialService, citizenSession]);

  if (!open) return null;

  const service = resolvePackageByIdOrSlug(selectedId);
  const readyCount = service.checklist.filter((_, idx) => Boolean(slots[idx])).length;
  const totalCount = service.checklist.length;
  const readinessPct = totalCount > 0 ? Math.round((readyCount / totalCount) * 100) : 0;

  const upiUri = `upi://pay?pa=${encodeURIComponent(
    PORTAL_UPI_CONFIG.upiId
  )}&pn=${encodeURIComponent(PORTAL_UPI_CONFIG.payeeName)}&am=${encodeURIComponent(
    service.fee
  )}&cu=INR&tn=${encodeURIComponent(service.titleEn.slice(0, 45))}`;

  const handleServiceSelect = (newId: number) => {
    setSelectedId(newId);
    setSlots({});
    setPreviewSlot(null);
    setValidationError('');
  };

  const handleSlotFile = async (
    e: ChangeEvent<HTMLInputElement>,
    slotIndex: number,
    docLabel: string
  ) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const { pdf, error } = await readAndValidateStrictPdf(file, slotIndex, docLabel);
    if (error || !pdf) {
      setSlots((prev) => {
        const next = { ...prev };
        delete next[slotIndex];
        return next;
      });
      onNotify(error || 'Invalid PDF file.', 'error');
      return;
    }
    setSlots((prev) => ({ ...prev, [slotIndex]: pdf }));
    setValidationError('');
    onNotify(`Attached ${file.name} for item #${slotIndex + 1}`, 'success');
  };

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(PORTAL_UPI_CONFIG.upiId);
      onNotify(`Copied UPI ID: ${PORTAL_UPI_CONFIG.upiId}`, 'success');
    } catch {
      onNotify(`UPI ID: ${PORTAL_UPI_CONFIG.upiId}`, 'info');
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const missing: string[] = [];
    service.checklist.forEach((docLabel, idx) => {
      if (!slots[idx]) {
        missing.push(`#${idx + 1}: ${docLabel}`);
      }
    });

    if (missing.length > 0) {
      setValidationError(
        `Please upload a valid .PDF file for every required checklist item (${missing.length} missing).`
      );
      onNotify('Every checklist item requires a .PDF upload.', 'error');
      return;
    }

    const cleanPhone = phone.replace(/\s+/g, '').trim();
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      onNotify('Enter a valid 10-digit Indian mobile number.', 'error');
      return;
    }

    const token = `PKR-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const record: PortalApplication = {
      token,
      serviceId: service.id,
      serviceSlug: service.slug,
      serviceTitle: service.titleEn,
      bestService: lang === 'hi' ? service.bestServiceHi : service.bestServiceEn,
      fee: service.fee,
      applicantName: applicantName.trim(),
      phone: cleanPhone,
      anchal: anchal.trim() || 'Ranchi Counter',
      utr: utr.trim().toUpperCase(),
      utrVerified: false,
      status: 'Pending',
      createdAt: new Date().toLocaleString('en-IN', { hour12: true }),
      pdfs: service.checklist.map((_, idx) => ({
        ...slots[idx],
        flagged: false,
        flagNote: '',
      })),
    };

    setUtr('');
    setSlots({});
    setPreviewSlot(null);
    onSubmitted(record);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 no-print"
      onClick={onClose}
    >
      <div
        className="max-w-4xl mx-auto bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 sm:my-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <p className="text-[11px] font-semibold text-amber-400">
              {lang === 'hi' ? 'प्रज्ञा केंद्र · ऑनलाइन आवेदन' : 'Pragya Kendra · Online Application'}
            </p>
            <h3 className="font-display text-lg sm:text-xl font-extrabold">
              {lang === 'hi'
                ? 'अभी आवेदन करें — बेस्ट सर्विस एवं PDF चेकलिस्ट'
                : 'Apply Now — Best Service & PDF Checklist'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close application modal"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6">
          {/* 1. Service & Auto-Applied Best Service */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {lang === 'hi' ? '1. सेवा चुनें *' : '1. Select Service *'}
              </label>
              <select
                value={selectedId}
                onChange={(e) => handleServiceSelect(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {ALL_APPLY_OPTIONS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {lang === 'hi' ? s.titleHi : s.titleEn} — ₹{s.fee}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 inline-flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  <span>{lang === 'hi' ? 'ऑटो-अप्लाइड बेस्ट सर्विस' : 'Auto-Applied Best Service'}</span>
                </span>
                <span className="font-mono text-sm font-extrabold text-emerald-900 dark:text-emerald-200 tabular-nums">
                  ₹{service.fee}
                </span>
              </div>
              <p className="font-bold text-slate-900 dark:text-white text-sm mt-1">
                {lang === 'hi' ? service.bestServiceHi : service.bestServiceEn}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {lang === 'hi' ? service.bestDescHi : service.bestDescEn}
              </p>
            </div>
          </div>

          {/* 2. Applicant Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'आवेदक का पूरा नाम *' : 'Applicant Full Name *'}
              </label>
              <input
                type="text"
                required
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="e.g. Rajesh Kumar Verma"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? '10-अंकीय मोबाइल नंबर *' : '10-Digit Mobile Number *'}
              </label>
              <input
                type="tel"
                required
                pattern="[6-9][0-9]{9}"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9835012345"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {lang === 'hi' ? 'अंचल / मोहल्ला (वैकल्पिक)' : 'Anchal / Locality (Optional)'}
              </label>
              <input
                type="text"
                value={anchal}
                onChange={(e) => setAnchal(e.target.value)}
                placeholder="e.g. Town Anchal / Argora"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* 3. Strict Per-Item PDF Checklist */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-900/50 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h4 className="font-bold text-slate-950 dark:text-white text-sm sm:text-base flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>
                    {lang === 'hi'
                      ? 'आवश्यक दस्तावेज़ चेकलिस्ट (प्रत्येक आइटम हेतु .PDF अनिवार्य)'
                      : 'Required Document Checklist (Strict .PDF Per Item)'}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Every item requires a valid .PDF file (%PDF- signature check, max 10 MB).
                </p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-amber-300 tabular-nums">
                  {readyCount} / {totalCount} PDFs Ready
                </span>
                <div className="w-36 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-1">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${readinessPct}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {service.checklist.map((docLabel, idx) => {
                const uploaded = slots[idx];
                const inputId = `modal-slot-pdf-${service.id}-${idx}`;
                return (
                  <div
                    key={`${service.id}-${idx}`}
                    className={`border rounded-xl p-3.5 space-y-2 ${
                      uploaded
                        ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label
                        htmlFor={inputId}
                        className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                      >
                        <span
                          className={`w-5 h-5 rounded-full text-[11px] inline-flex items-center justify-center font-mono font-bold shrink-0 ${
                            uploaded
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span>{docLabel} *</span>
                      </label>

                      <div className="flex items-center gap-2 shrink-0">
                        <label
                          htmlFor={inputId}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 text-white text-xs font-semibold cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>{uploaded ? 'Replace .PDF' : 'Select .PDF'}</span>
                        </label>
                        <input
                          id={inputId}
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={(e) => handleSlotFile(e, idx, docLabel)}
                          className="hidden"
                        />
                      </div>
                    </div>

                    {uploaded && (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-lg px-3 py-2 text-xs">
                          <span className="font-semibold text-emerald-800 dark:text-emerald-300 font-mono">
                            ✓ {uploaded.fileName} ({uploaded.sizeKB} KB)
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setPreviewSlot((prev) => (prev === idx ? null : idx))
                            }
                            className="inline-flex items-center gap-1 text-slate-900 dark:text-amber-300 font-semibold hover:underline cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{previewSlot === idx ? 'Hide Preview' : 'Preview PDF'}</span>
                          </button>
                        </div>

                        {previewSlot === idx && uploaded.dataUrl && (
                          <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 h-64">
                            <iframe
                              title={`Preview ${uploaded.fileName}`}
                              src={uploaded.dataUrl}
                              className="w-full h-full border-0"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {validationError && (
              <div className="text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl p-3">
                {validationError}
              </div>
            )}
          </div>

          {/* 4. Online UPI QR Payment & UTR */}
          <div className="border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 rounded-2xl p-4 sm:p-5 space-y-4">
            <h4 className="font-bold text-slate-950 dark:text-white text-sm sm:text-base flex items-center gap-2">
              <QrCode className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>
                {lang === 'hi'
                  ? 'ऑनलाइन UPI भुगतान एवं UTR सत्यापन'
                  : 'Online UPI Payment & UTR Verification'}
              </span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
              <div className="md:col-span-4 flex flex-col items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center space-y-2">
                <QRCodeBox
                  value={upiUri}
                  size={132}
                  label={PORTAL_UPI_CONFIG.payeeName}
                  sublabel={`₹${service.fee}`}
                  downloadName={`UPI-PKR-${service.fee}.png`}
                  compact
                />
                <p className="text-[11px] font-mono text-slate-700 dark:text-amber-300">
                  {PORTAL_UPI_CONFIG.upiId}
                </p>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy UPI ID</span>
                </button>
              </div>

              <div className="md:col-span-8 space-y-3">
                <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {lang === 'hi' ? 'देय बेस्ट सर्विस शुल्क:' : 'Best Service Fee Payable:'}
                  </span>
                  <span className="font-mono text-lg font-extrabold text-slate-950 dark:text-amber-300 tabular-nums">
                    ₹{service.fee}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'hi'
                      ? '12-अंकीय UPI UTR / ट्रांजैक्शन रेफरेंस *'
                      : '12-Digit UPI UTR / Transaction Reference *'}
                  </label>
                  <input
                    type="text"
                    required
                    pattern="[A-Za-z0-9]{8,22}"
                    value={utr}
                    onChange={(e) => setUtr(e.target.value)}
                    placeholder="Enter 12-digit UTR after scanning QR"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Pay via GPay, PhonePe, Paytm, or BHIM using the QR code or UPI ID, then submit your UTR. Counter staff verify UTR before final filing.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold text-sm transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {lang === 'hi'
                  ? 'आवेदन जमा करें एवं टोकन प्राप्त करें'
                  : 'Submit Application & Generate Token'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 2. TOKEN RECEIPT MODAL (Printable Slip + Copy Summary + QR)                */
/* -------------------------------------------------------------------------- */

interface TokenReceiptModalProps {
  record: PortalApplication | null;
  onClose: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function TokenReceiptModal({ record, onClose, onNotify }: TokenReceiptModalProps) {
  if (!record) return null;

  const handleCopySummary = async () => {
    const text = `Pragya Kendra Ranchi Token: ${record.token}\nService: ${record.serviceTitle}\nBest Service: ${record.bestService}\nUTR: ${record.utr}\nStatus: ${record.status}`;
    try {
      await navigator.clipboard.writeText(text);
      onNotify('Token summary copied to clipboard!', 'success');
    } catch {
      onNotify(`Token: ${record.token}`, 'info');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm overflow-y-auto p-4 sm:p-6"
      onClick={onClose}
    >
      <div
        className="max-w-lg mx-auto bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div id="print-slip-area" className="p-6 space-y-4 print-sheet">
          <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3 gap-3">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                Application Submitted
              </span>
              <h3 className="font-display text-xl font-extrabold text-slate-950 dark:text-white">
                Pragya Kendra Ranchi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Beside Kolkatta Pharma, Radium Road, Kutchery Chowk
              </p>
            </div>
            <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-amber-300 border border-slate-200 dark:border-slate-700 font-mono font-bold text-sm shrink-0">
              {record.token}
            </span>
          </div>

          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
              <p>
                <strong>Applicant:</strong> {record.applicantName} ({record.phone})
              </p>
              <p>
                <strong>Service:</strong> {record.serviceTitle}
              </p>
              <p>
                <strong>Best Service Applied:</strong> {record.bestService}
              </p>
              <p>
                <strong>Anchal / Area:</strong> {record.anchal}
              </p>
              <p>
                <strong>Fee &amp; UTR:</strong>{' '}
                <span className="font-mono tabular-nums">₹{record.fee}</span> · UTR:{' '}
                <span className="font-mono">{record.utr}</span>
              </p>
              <p>
                <strong>PDFs Attached:</strong> {record.pdfs.length} verified .PDF files
              </p>
              <p>
                <strong>Status:</strong>{' '}
                <span className="font-bold text-slate-950 dark:text-amber-300">{record.status}</span>
              </p>
            </div>
            <div className="shrink-0">
              <QRCodeBox
                value={buildTrackingUrl(record.token)}
                size={84}
                label="Track"
                sublabel={record.token}
                compact
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 no-print">
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Summary</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold hover:bg-slate-700 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Slip</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-semibold cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 3. CITIZEN LOGIN & PERSONAL APPLICATIONS MODAL                             */
/* -------------------------------------------------------------------------- */

interface CitizenPortalModalProps {
  open: boolean;
  lang: 'en' | 'hi';
  session: CitizenSession | null;
  applications: PortalApplication[];
  onClose: () => void;
  onSessionChange: (session: CitizenSession | null) => void;
  onOpenNewApply: () => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function CitizenPortalModal({
  open,
  lang,
  session,
  applications,
  onClose,
  onSessionChange,
  onOpenNewApply,
  onNotify,
}: CitizenPortalModalProps) {
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');

  if (!open) return null;

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    const cleanPhone = phoneInput.replace(/\s+/g, '').trim();
    if (!nameInput.trim() || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      onNotify('Enter your full name and valid 10-digit mobile number.', 'error');
      return;
    }
    const nextSession: CitizenSession = { name: nameInput.trim(), phone: cleanPhone };
    saveCitizenSession(nextSession);
    onSessionChange(nextSession);
    onNotify(`Welcome, ${nextSession.name}!`, 'success');
  };

  const handleLogout = () => {
    clearCitizenSession();
    onSessionChange(null);
    onNotify('Signed out of Citizen Portal.', 'info');
  };

  const myApps = session ? applications.filter((a) => a.phone === session.phone) : [];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm overflow-y-auto p-4 sm:p-6 no-print"
      onClick={onClose}
    >
      <div
        className="max-w-3xl mx-auto bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <p className="text-[11px] font-semibold text-sky-300">
              {lang === 'hi' ? 'नागरिक पोर्टल' : 'Citizen Portal'}
            </p>
            <h3 className="font-display text-lg font-extrabold">
              {lang === 'hi' ? 'नागरिक लॉगिन एवं मेरे आवेदन' : 'Citizen Login & My Applications'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close citizen modal"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {!session ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Sign in with your Name and 10-digit Mobile Number to auto-fill applications and view all your submitted tokens in one place.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    10-Digit Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    pattern="[6-9][0-9]{9}"
                    maxLength={10}
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="9835012345"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-bold text-sm cursor-pointer"
              >
                Continue to Citizen Portal
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <div>
                  <p className="font-bold text-slate-950 dark:text-white">{session.name}</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
                    Mobile: {session.phone} · {myApps.length} Application(s)
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenNewApply();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-bold cursor-pointer"
                  >
                    + New Application
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </div>

              {myApps.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  No applications found under mobile {session.phone} yet. Click "+ New Application" above to submit one.
                </div>
              ) : (
                <div className="space-y-3">
                  {myApps.map((app) => (
                    <div
                      key={app.token}
                      className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-amber-300">
                          {app.token}
                        </span>
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          {app.status}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {app.serviceTitle}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        UTR: <span className="font-mono">{app.utr}</span> (
                        {app.utrVerified ? 'Verified' : 'Pending Verification'}) · {app.pdfs.length} PDFs
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* 4. STAFF & ADMIN OPERATIONS MODAL (UTR Verify, Flag PDF Inline, PIN & D1)  */
/* -------------------------------------------------------------------------- */

interface PortalStaffModalProps {
  open: boolean;
  lang: 'en' | 'hi';
  applications: PortalApplication[];
  onClose: () => void;
  onUpdateApplications: (next: PortalApplication[]) => void;
  onSyncD1: (apps: PortalApplication[], customUrl?: string) => Promise<void>;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const STAFF_STATUSES: Array<'All' | PortalApplication['status']> = [
  'All',
  'Pending',
  'In Progress',
  'Ready',
  'Completed',
];

export function PortalStaffModal({
  open,
  lang,
  applications,
  onClose,
  onUpdateApplications,
  onSyncD1,
  onNotify,
}: PortalStaffModalProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [activeTab, setActiveTab] = useState<'applications' | 'settings'>('applications');
  const [statusFilter, setStatusFilter] = useState<'All' | PortalApplication['status']>('All');
  const [newPin, setNewPin] = useState('');
  const [d1Url, setD1Url] = useState(() => getD1Endpoint());

  // Inline UI states replacing window.prompt / window.confirm
  const [flagEditor, setFlagEditor] = useState<{
    token: string;
    slotIndex: number;
    note: string;
  } | null>(null);
  const [confirmDeleteToken, setConfirmDeleteToken] = useState<string | null>(null);

  if (!open) return null;

  const handleLogin = (e: FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === getPortalStaffPin()) {
      setAuthenticated(true);
      setPinInput('');
      onNotify('Staff Console unlocked.', 'success');
    } else {
      onNotify('Incorrect PIN.', 'error');
    }
  };

  const toggleUtrVerify = (token: string) => {
    const next = applications.map((a) =>
      a.token === token ? { ...a, utrVerified: !a.utrVerified } : a
    );
    onUpdateApplications(next);
  };

  const updateStatus = (token: string, status: PortalApplication['status']) => {
    const next = applications.map((a) => (a.token === token ? { ...a, status } : a));
    onUpdateApplications(next);
    onNotify(`${token} marked as ${status}`, 'success');
  };

  const applyPdfFlag = (token: string, slotIndex: number, note: string) => {
    const next = applications.map((a) => {
      if (a.token !== token) return a;
      return {
        ...a,
        pdfs: a.pdfs.map((p) =>
          p.slotIndex === slotIndex
            ? { ...p, flagged: true, flagNote: note.trim() || 'Please upload a clearer PDF' }
            : p
        ),
      };
    });
    onUpdateApplications(next);
    setFlagEditor(null);
    onNotify(`Flagged document #${slotIndex + 1} for ${token}`, 'info');
  };

  const clearPdfFlag = (token: string, slotIndex: number) => {
    const next = applications.map((a) => {
      if (a.token !== token) return a;
      return {
        ...a,
        pdfs: a.pdfs.map((p) =>
          p.slotIndex === slotIndex ? { ...p, flagged: false, flagNote: '' } : p
        ),
      };
    });
    onUpdateApplications(next);
    onNotify(`Cleared flag on document #${slotIndex + 1}`, 'success');
  };

  const handleDeleteApp = (token: string) => {
    const next = applications.filter((a) => a.token !== token);
    onUpdateApplications(next);
    setConfirmDeleteToken(null);
    onNotify(`Deleted ${token}`, 'info');
  };

  const handleSavePin = () => {
    if (newPin.trim().length < 4) {
      onNotify('PIN must be at least 4 characters.', 'error');
      return;
    }
    savePortalStaffPin(newPin.trim());
    setNewPin('');
    onNotify('Staff PIN updated.', 'success');
  };

  const handleSaveD1 = async () => {
    saveD1Endpoint(d1Url);
    await onSyncD1(applications, d1Url);
    onNotify('Cloudflare D1 endpoint saved & synced.', 'success');
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(applications, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pragya-kendra-ranchi-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered =
    statusFilter === 'All' ? applications : applications.filter((a) => a.status === statusFilter);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm overflow-y-auto p-3 sm:p-6 no-print"
      onClick={onClose}
    >
      <div
        className="max-w-6xl mx-auto bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 sm:my-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div>
            <p className="text-[11px] font-semibold text-amber-400">
              {lang === 'hi' ? 'संरक्षित कंसोल · कचहरी चौक' : 'Protected Console · Kutchery Chowk'}
            </p>
            <h3 className="font-display text-lg sm:text-xl font-extrabold">
              {lang === 'hi' ? 'स्टाफ एवं एडमिन संचालन कंसोल' : 'Staff & Admin Operations Console'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close staff modal"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {!authenticated ? (
            <form onSubmit={handleLogin} className="max-w-sm mx-auto py-6 space-y-4 text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="font-display font-extrabold text-slate-950 dark:text-white text-lg">
                Counter Staff PIN Login
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Enter your Staff / Admin PIN to manage applications, verify UTR payments, and flag PDFs.
              </p>
              <input
                type="password"
                required
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter PIN (default: 1234)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-center font-mono text-base tracking-widest"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 text-amber-300 font-bold text-sm cursor-pointer"
              >
                Unlock Operations Console
              </button>
            </form>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('applications')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                      activeTab === 'applications'
                        ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Applications ({applications.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                      activeTab === 'settings'
                        ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    PIN, Backup &amp; Cloudflare D1
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setAuthenticated(false)}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                >
                  Lock Console
                </button>
              </div>

              {activeTab === 'applications' ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {STAFF_STATUSES.map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setStatusFilter(st)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                            statusFilter === st
                              ? 'bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950'
                              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleExportJson}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {filtered.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        No applications in this status.
                      </p>
                    ) : (
                      filtered.map((app) => (
                        <div
                          key={app.token}
                          className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50 space-y-3"
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-extrabold text-slate-900 dark:text-amber-300 text-sm">
                                  {app.token}
                                </span>
                                <span className="font-bold text-slate-950 dark:text-white">
                                  {app.applicantName}
                                </span>
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                  · {app.phone} · {app.anchal}
                                </span>
                              </div>
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                                {app.serviceTitle} —{' '}
                                <span className="text-emerald-700 dark:text-emerald-400">
                                  {app.bestService}
                                </span>
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Fee: <span className="font-mono tabular-nums">₹{app.fee}</span> · UTR:{' '}
                                <span className="font-mono">{app.utr}</span> ·{' '}
                                <button
                                  type="button"
                                  onClick={() => toggleUtrVerify(app.token)}
                                  className={`underline font-semibold cursor-pointer ${
                                    app.utrVerified
                                      ? 'text-emerald-700 dark:text-emerald-400'
                                      : 'text-amber-700 dark:text-amber-400'
                                  }`}
                                >
                                  {app.utrVerified ? 'UTR Verified ✓' : 'Verify UTR'}
                                </button>
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                value={app.status}
                                onChange={(e) =>
                                  updateStatus(
                                    app.token,
                                    e.target.value as PortalApplication['status']
                                  )
                                }
                                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-bold"
                              >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Ready">Ready</option>
                                <option value="Completed">Completed</option>
                              </select>

                              {confirmDeleteToken === app.token ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteApp(app.token)}
                                    className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
                                  >
                                    Confirm
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setConfirmDeleteToken(null)}
                                    className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteToken(app.token)}
                                  aria-label={`Delete ${app.token}`}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold hover:bg-rose-100 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                            {(app.pdfs || []).map((p) => {
                              const isEditingFlag =
                                flagEditor?.token === app.token &&
                                flagEditor.slotIndex === p.slotIndex;

                              return (
                                <div
                                  key={p.slotIndex}
                                  className={`bg-white dark:bg-slate-950 border ${
                                    p.flagged
                                      ? 'border-rose-300 dark:border-rose-800'
                                      : 'border-slate-200 dark:border-slate-800'
                                  } rounded-xl p-3 text-xs space-y-2`}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <p className="font-bold text-slate-800 dark:text-slate-200 truncate">
                                        {p.docName}
                                      </p>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        {p.fileName} ({p.sizeKB} KB){' '}
                                        {p.flagged && (
                                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                                            · Flagged: {p.flagNote}
                                          </span>
                                        )}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0">
                                      {p.dataUrl && (
                                        <a
                                          href={p.dataUrl}
                                          download={p.fileName}
                                          className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
                                        >
                                          PDF
                                        </a>
                                      )}
                                      {p.flagged ? (
                                        <button
                                          type="button"
                                          onClick={() => clearPdfFlag(app.token, p.slotIndex)}
                                          className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold cursor-pointer"
                                        >
                                          Unflag
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setFlagEditor({
                                              token: app.token,
                                              slotIndex: p.slotIndex,
                                              note: 'Please upload a clearer PDF scan',
                                            })
                                          }
                                          className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold cursor-pointer"
                                        >
                                          Flag
                                        </button>
                                      )}
                                    </div>
                                  </div>

                                  {isEditingFlag && (
                                    <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                                      <input
                                        type="text"
                                        value={flagEditor.note}
                                        onChange={(e) =>
                                          setFlagEditor((prev) =>
                                            prev ? { ...prev, note: e.target.value } : null
                                          )
                                        }
                                        placeholder="Reason for re-upload..."
                                        className="flex-1 min-w-[160px] px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          applyPdfFlag(app.token, p.slotIndex, flagEditor.note)
                                        }
                                        className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold cursor-pointer"
                                      >
                                        Save Flag
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setFlagEditor(null)}
                                        className="px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-xs cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      Change Admin / Staff PIN
                    </h4>
                    <input
                      type="password"
                      maxLength={8}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="New 4–8 digit PIN"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleSavePin}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-bold cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Update PIN</span>
                    </button>
                  </div>

                  <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                      Cloudflare Worker + D1 Endpoint
                    </h4>
                    <input
                      type="url"
                      value={d1Url}
                      onChange={(e) => setD1Url(e.target.value)}
                      placeholder="https://your-worker.workers.dev/api/applications"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleSaveD1}
                      className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 text-xs font-bold cursor-pointer"
                    >
                      Save &amp; Sync to D1
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
