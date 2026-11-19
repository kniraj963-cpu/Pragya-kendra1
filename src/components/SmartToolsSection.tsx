import { useEffect, useState, type ChangeEvent } from 'react';
import { jsPDF } from 'jspdf';
import { Copy, FileDown, Printer, Trash2, Upload } from 'lucide-react';
import { DOC_DICT, DRAFT_TEMPLATES, SERVICES_CATALOG, type AttachedDocMeta } from '../data/catalog.ts';
import { readAndValidateFiles } from '../utils/fileReader.ts';
import { buildUpiUri, MERCHANT_UPI_ID } from '../utils/qr.ts';
import { QRCodeBox } from './QRCodeBox.tsx';

interface SmartToolsSectionProps {
  lang: 'en' | 'hi';
  selectedChecklistSlug: string;
  onChangeChecklistSlug: (slug: string) => void;
  stagedDocs: AttachedDocMeta[];
  onAddStagedDocs: (docs: AttachedDocMeta[]) => void;
  onRemoveStagedDoc: (index: number) => void;
  onJumpToInquiryWithService: (slug: string) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export function SmartToolsSection({
  lang,
  selectedChecklistSlug,
  onChangeChecklistSlug,
  stagedDocs,
  onAddStagedDocs,
  onRemoveStagedDoc,
  onJumpToInquiryWithService,
  onNotify,
}: SmartToolsSectionProps) {
  const idx = lang === 'hi' ? 1 : 0;

  const currentService =
    SERVICES_CATALOG.find((s) => s[0] === selectedChecklistSlug) || SERVICES_CATALOG[0];
  const docKeys = currentService[4].split(' ');
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    docKeys.forEach((k) => {
      initial[k] = true;
    });
    setCheckedDocs(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChecklistSlug]);

  const handleChecklistPerDocUpload = async (
    e: ChangeEvent<HTMLInputElement>,
    reqKey: string,
    reqLabel: string
  ) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const { valid, skipped } = await readAndValidateFiles(
      files,
      `${currentService[0]}:${reqKey}`,
      reqLabel
    );
    e.target.value = '';
    if (skipped.length) onNotify(`Skipped: ${skipped.join('; ')}`, 'error');
    if (valid.length) {
      onAddStagedDocs(valid);
      onNotify(`${valid.length} file(s) staged for "${reqLabel}".`, 'success');
    }
  };

  const handleDownloadChecklistPdf = () => {
    const lines = docKeys.map((k, i) => {
      const label = DOC_DICT[k] ? DOC_DICT[k][0] : k;
      return `${checkedDocs[k] !== false ? '[READY]' : '[PENDING]'} ${i + 1}. ${label}`;
    });

    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 34, 'F');
      doc.setTextColor(251, 191, 36);
      doc.setFontSize(17);
      doc.setFont('helvetica', 'bold');
      doc.text('PRAGYA KENDRA — RANCHI', 14, 15);
      doc.setTextColor(226, 232, 240);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'Beside Kolkatta Pharma, Radium Road, Kutchery Chowk, Ranchi - 834001 | Ph: +91 90652 33139',
        14,
        24
      );

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('DOCUMENT VERIFICATION CHECKLIST', 14, 46);
      doc.setFontSize(11);
      doc.setTextColor(180, 83, 9);
      doc.text(`Service: ${currentService[2]}`, 14, 54);

      doc.setTextColor(30, 41, 59);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      let y = 66;
      lines.forEach((line) => {
        const split = doc.splitTextToSize(line, 180) as string[];
        doc.text(split, 14, y);
        y += split.length * 7 + 3;
      });

      doc.setDrawColor(203, 213, 225);
      doc.line(14, y + 6, 196, y + 6);
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Bring original documents for verification at Kutchery Chowk Desk. (Aadhaar enrollment excluded).',
        14,
        y + 14
      );
      doc.save(`Pragya_Kendra_Checklist_${currentService[0]}.pdf`);
      onNotify('Document checklist PDF downloaded.', 'success');
    } catch {
      onNotify('Unable to generate PDF in this browser.', 'error');
    }
  };

  const handleDownloadBlankIntakeForm = () => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 34, 'F');
      doc.setTextColor(251, 191, 36);
      doc.setFontSize(17);
      doc.setFont('helvetica', 'bold');
      doc.text('PRAGYA KENDRA — COUNTER INTAKE FORM', 14, 15);
      doc.setTextColor(226, 232, 240);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'Beside Kolkatta Pharma, Radium Road, Kutchery Chowk, Ranchi - 834001 | +91 90652 33139',
        14,
        24
      );

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Service Selected: ${currentService[2]}`, 14, 46);
      doc.setFont('helvetica', 'normal');
      const fields = [
        'Applicant Full Name: _______________________________________________________',
        'Father / Husband Name: _____________________________________________________',
        'Mobile / WhatsApp No.: _______________________  Date: _______________________',
        'Address / Anchal / Mauza / Ward: ____________________________________________',
        'Khata No. / Plot No. / Deed No. (if Land Work): ______________________________',
      ];
      let y = 58;
      fields.forEach((f) => {
        doc.text(f, 14, y);
        y += 12;
      });
      doc.line(14, y, 196, y);
      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('Required Enclosures Checklist:', 14, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      docKeys.forEach((k, i) => {
        const label = DOC_DICT[k] ? DOC_DICT[k][0] : k;
        doc.text(`[   ] ${i + 1}. ${label}`, 14, y);
        y += 7;
      });
      doc.text('Applicant Signature: _____________________   Operator Stamp: _______________', 14, 274);
      doc.save(`Pragya_Kendra_Intake_Form_${currentService[0]}.pdf`);
      onNotify('Blank printable intake form PDF downloaded.', 'success');
    } catch {
      onNotify('Unable to generate intake form PDF.', 'error');
    }
  };

  // Registry & Anchal Fee Calculator
  const [feeWorkType, setFeeWorkType] = useState<
    'sale_deed' | 'mutation_only' | 'lpc_rasid' | 'jharsewa_pack'
  >('sale_deed');
  const [propertyValue, setPropertyValue] = useState(1000000);

  let stampDuty = 0;
  let regFee = 0;
  let serviceFee = 500;
  if (feeWorkType === 'sale_deed') {
    stampDuty = Math.round(propertyValue * 0.04);
    regFee = Math.round(propertyValue * 0.03);
    serviceFee = 1500;
  } else if (feeWorkType === 'mutation_only') {
    stampDuty = 100;
    regFee = 250;
    serviceFee = 650;
  } else if (feeWorkType === 'lpc_rasid') {
    stampDuty = 50;
    regFee = 150;
    serviceFee = 300;
  } else {
    stampDuty = 50;
    regFee = 90;
    serviceFee = 250;
  }
  const totalFee = stampDuty + regFee + serviceFee;
  const [upiChargeMode, setUpiChargeMode] = useState<'desk' | 'total'>('desk');
  const upiAmount = upiChargeMode === 'desk' ? serviceFee : totalFee;

  // Land Area Unit Converter
  const [landArea, setLandArea] = useState(5);
  const [landUnit, setLandUnit] = useState<'dismil' | 'kattha' | 'bigha' | 'sqft' | 'acre' | 'sqm'>(
    'dismil'
  );

  let sqft = 0;
  if (landUnit === 'dismil') sqft = landArea * 435.6;
  else if (landUnit === 'kattha') sqft = landArea * 720;
  else if (landUnit === 'bigha') sqft = landArea * 14400;
  else if (landUnit === 'acre') sqft = landArea * 43560;
  else if (landUnit === 'sqm') sqft = landArea * 10.7639;
  else sqft = landArea;

  // Legal Drafting Previewer
  const [draftKey, setDraftKey] = useState<string>('mutation_affidavit');

  const handleCopyDraft = async () => {
    try {
      await navigator.clipboard.writeText(DRAFT_TEMPLATES[draftKey] || '');
      onNotify('Legal draft template copied to clipboard.', 'success');
    } catch {
      onNotify('Copy failed; please select text manually.', 'error');
    }
  };

  return (
    <section
      id="tools"
      className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800"
    >
      {/* Print-only Official A4 Letterhead */}
      <div className="print-only print-sheet mb-6">
        <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">PRAGYA KENDRA — RANCHI</h1>
            <p className="text-xs text-slate-700">
              Beside Kolkatta Pharma, Radium Road, Kutchery Chowk, Ranchi - 834001 · Ph: +91 90652 33139
            </p>
          </div>
          <div className="text-right text-xs">
            <div>Date: {new Date().toLocaleDateString()}</div>
            <div>Document Verification Slip</div>
          </div>
        </div>
        <h2 className="text-base font-bold mb-2">Service: {currentService[2 + idx]}</h2>
        <ul className="space-y-1.5 text-sm mb-6">
          {docKeys.map((k, i) => (
            <li key={k}>
              [ {checkedDocs[k] !== false ? '✓' : ' '} ] {i + 1}. {DOC_DICT[k] ? DOC_DICT[k][idx] : k}
            </li>
          ))}
        </ul>
        <div className="flex justify-between pt-8 text-xs border-t border-slate-300">
          <span>Applicant Signature: ________________________</span>
          <span>Desk Operator Sign: ________________________</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 no-print">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
            {lang === 'hi' ? 'स्वयं-सेवा स्मार्ट उपकरण' : 'Interactive Self-Service Utilities'}
          </p>
          <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            {lang === 'hi'
              ? 'चेकलिस्ट PDF, स्टाम्प शुल्क एवं भूमि इकाई कन्वर्टर'
              : 'Checklist PDF, Stamp Duty Estimator & Land Calculators'}
          </h2>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Tool 01: Interactive Checklist & Per-Document Multi-PDF Upload */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-amber-700 dark:text-amber-400">
                  {lang === 'hi' ? '01. दस्तावेज़ चेकलिस्ट' : '01. Document Checklist'}
                </span>
                <span>{lang === 'hi' ? 'प्रत्येक दस्तावेज़ हेतु मल्टी-PDF अपलोड' : 'Upload multiple PDFs per requirement'}</span>
              </div>
              <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                {lang === 'hi' ? 'इंटरैक्टिव चेकलिस्ट, A4 प्रिंट एवं PDF' : 'Interactive Checklist & A4 Print / PDF Export'}
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Choose Service
                </label>
                <select
                  value={selectedChecklistSlug}
                  onChange={(e) => onChangeChecklistSlug(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3.5 py-2.5 text-sm font-medium"
                >
                  {SERVICES_CATALOG.map((s) => (
                    <option key={s[0]} value={s[0]}>
                      {s[2 + idx]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 max-h-64 overflow-y-auto">
                {docKeys.map((k, i) => {
                  const label = DOC_DICT[k] ? DOC_DICT[k][idx] : k;
                  const inputId = `tool-upload-${currentService[0]}-${k}`;
                  const docsForReq = stagedDocs
                    .map((d, globalIdx) => ({ doc: d, globalIdx }))
                    .filter(({ doc }) => doc.requirementKey === `${currentService[0]}:${k}`);

                  return (
                    <div
                      key={k}
                      className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs sm:text-sm">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checkedDocs[k] !== false}
                            onChange={(e) =>
                              setCheckedDocs((prev) => ({ ...prev, [k]: e.target.checked }))
                            }
                            className="mt-0.5 w-4 h-4 accent-slate-900 dark:accent-amber-500 rounded"
                          />
                          <span className="text-slate-800 dark:text-slate-200">
                            {i + 1}. {label}
                          </span>
                        </label>

                        <label
                          htmlFor={inputId}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 text-white text-[11px] font-semibold cursor-pointer shrink-0"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload PDF</span>
                        </label>
                        <input
                          id={inputId}
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*"
                          onChange={(e) => handleChecklistPerDocUpload(e, k, label)}
                          className="hidden"
                        />
                      </div>

                      {docsForReq.length > 0 && (
                        <div className="pl-6 space-y-1">
                          {docsForReq.map(({ doc, globalIdx }) => (
                            <div
                              key={`${doc.name}-${globalIdx}`}
                              className="flex items-center justify-between gap-2 text-[11px] text-emerald-700 dark:text-emerald-400"
                            >
                              <span className="truncate font-mono">
                                {doc.name} ({doc.size})
                              </span>
                              <button
                                type="button"
                                onClick={() => onRemoveStagedDoc(globalIdx)}
                                aria-label={`Remove ${doc.name}`}
                                className="text-rose-500 hover:text-rose-700 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={handleDownloadChecklistPdf}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 text-white transition-colors cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'चेकलिस्ट PDF' : 'Checklist PDF'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadBlankIntakeForm}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'काउंटर फॉर्म' : 'Intake Form'}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'A4 प्रिंट' : 'A4 Print'}</span>
              </button>
              <button
                type="button"
                onClick={() => onJumpToInquiryWithService(currentService[0])}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors cursor-pointer"
              >
                <span>{lang === 'hi' ? 'जमा करें →' : 'Submit Staged →'}</span>
              </button>
            </div>
          </div>

          {/* Tool 02: Stamp Duty & Anchal Fee Calculator */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between gap-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-amber-700 dark:text-amber-400">02. Revenue Estimator</span>
                <span>Jharkhand MVR Scale</span>
              </div>
              <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                Registry Stamp Duty & Anchal Fee Calculator
              </h3>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Service Type
                  </label>
                  <select
                    value={feeWorkType}
                    onChange={(e) => setFeeWorkType(e.target.value as typeof feeWorkType)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2.5 text-sm font-medium"
                  >
                    <option value="sale_deed">Sale Deed Registry + Mutation</option>
                    <option value="mutation_only">Land Mutation (Dakhil-Kharij)</option>
                    <option value="lpc_rasid">LPC + Online Lagan Rasid</option>
                    <option value="jharsewa_pack">JharSewa Certificate Pack</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Property Govt. Value (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={50000}
                    value={propertyValue}
                    onChange={(e) => setPropertyValue(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2.5 text-sm font-mono font-bold tabular-nums"
                  />
                </div>
              </div>

              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Est. Jharkhand Stamp Duty (4%)</span>
                  <span className="font-mono font-bold tabular-nums">₹{stampDuty.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Est. Registration / Portal Fee (3%)</span>
                  <span className="font-mono font-bold tabular-nums">₹{regFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Drafting, Scrutiny & Desk Fee</span>
                  <span className="font-mono font-bold text-amber-300 tabular-nums">
                    ₹{serviceFee.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="border-t border-slate-700 pt-2.5 flex justify-between items-center">
                  <span className="text-sm font-bold text-amber-400">Total Estimated Outlay</span>
                  <span className="text-lg font-mono font-extrabold text-amber-300 tabular-nums">
                    ₹{totalFee.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {lang === 'hi' ? 'प्रज्ञा केंद्र UPI भुगतान QR' : 'Pay Estimate via Official UPI QR'}
                </p>
                <p className="text-[11px] font-mono text-amber-700 dark:text-amber-400">
                  {MERCHANT_UPI_ID}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setUpiChargeMode('desk')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                      upiChargeMode === 'desk'
                        ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                        : 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Desk Fee (₹{serviceFee.toLocaleString('en-IN')})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUpiChargeMode('total')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-colors ${
                      upiChargeMode === 'total'
                        ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                        : 'border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    Total Est. (₹{totalFee.toLocaleString('en-IN')})
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Final stamp duty depends on Ranchi Circle/Mauza MVR valuation and applicant exemptions.
                </p>
              </div>
              <QRCodeBox
                value={buildUpiUri(upiAmount, `PK-${feeWorkType}`)}
                size={104}
                label={lang === 'hi' ? 'UPI से भुगतान करें' : 'Scan UPI to Pay'}
                sublabel={`₹${upiAmount.toLocaleString('en-IN')}`}
                downloadName={`UPI-${feeWorkType}-${upiAmount}.png`}
                compact
              />
            </div>
          </div>

          {/* Tool 03: Land Area Unit Converter */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-amber-700 dark:text-amber-400">03. Chotanagpur Land Scale</span>
              <span>1 Dismil = 435.6 Sq.Ft · 1 Kattha = 720 Sq.Ft</span>
            </div>
            <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
              Land Area Converter (Dismil / Kattha / Bigha / Sq.Ft)
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Area Value
                </label>
                <input
                  type="number"
                  min={0}
                  step={0.1}
                  value={landArea}
                  onChange={(e) => setLandArea(Math.max(0, Number(e.target.value) || 0))}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3.5 py-2.5 text-base font-mono font-bold tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Unit
                </label>
                <select
                  value={landUnit}
                  onChange={(e) => setLandUnit(e.target.value as typeof landUnit)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-2.5 text-sm font-semibold"
                >
                  <option value="dismil">Dismil</option>
                  <option value="kattha">Kattha</option>
                  <option value="bigha">Bigha</option>
                  <option value="sqft">Sq. Feet</option>
                  <option value="acre">Acre</option>
                  <option value="sqm">Sq. Meter</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { label: 'Dismil', val: (sqft / 435.6).toFixed(2) },
                { label: 'Kattha', val: (sqft / 720).toFixed(2) },
                { label: 'Sq. Feet', val: Math.round(sqft).toLocaleString('en-IN') },
                { label: 'Acre', val: (sqft / 43560).toFixed(3) },
              ].map((cell) => (
                <div
                  key={cell.label}
                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center"
                >
                  <div className="text-xs text-slate-500 dark:text-slate-400">{cell.label}</div>
                  <div className="font-mono font-extrabold text-slate-950 dark:text-amber-300 text-base tabular-nums mt-0.5">
                    {cell.val}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tool 04: Legal Drafting Template Previewer */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  04. Legal Drafting Sample
                </span>
                <select
                  value={draftKey}
                  onChange={(e) => setDraftKey(e.target.value)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3 py-1.5 text-xs font-semibold"
                >
                  <option value="mutation_affidavit">Land Mutation Affidavit Format</option>
                  <option value="rent_agreement">Ranchi Residential Rent Agreement</option>
                  <option value="name_correction">Name / Spelling Correction Affidavit</option>
                  <option value="poa_draft">General Power of Attorney (GPA) Outline</option>
                </select>
              </div>
              <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                Kutchery Legal Draft Preview
              </h3>
              <pre className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 text-xs leading-relaxed h-40 overflow-y-auto whitespace-pre-wrap text-slate-700 dark:text-slate-300 font-sans">
                {DRAFT_TEMPLATES[draftKey]}
              </pre>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">
                Printed on e-Stamp Paper at Radium Road Desk
              </span>
              <button
                type="button"
                onClick={handleCopyDraft}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 text-white transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Draft</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
