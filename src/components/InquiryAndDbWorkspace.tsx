import { useEffect, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { jsPDF } from 'jspdf';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  Download,
  FileDown,
  FileText,
  Printer,
  Send,
  Ticket,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  SERVICES_CATALOG,
  STATUS_STAGES,
  type AttachedDocMeta,
  type ContactInquiry,
  type QueueState,
} from '../data/catalog.ts';
import { FALLBACK_QUEUE } from '../data/fallbackSeeds.ts';
import { apiUrl, readAndValidateFiles } from '../utils/fileReader.ts';
import { buildTrackingUrl, generateQrDataUrl } from '../utils/qr.ts';
import { QRCodeBox } from './QRCodeBox.tsx';

interface InquiryAndDbWorkspaceProps {
  lang: 'en' | 'hi';
  selectedServiceSlug: string;
  onChangeServiceSlug: (slug: string) => void;
  linkedProjectRef: string;
  onClearProjectRef: () => void;
  stagedDocs: AttachedDocMeta[];
  onAddStagedDocs: (docs: AttachedDocMeta[]) => void;
  onRemoveStagedDoc: (index: number) => void;
  onMoveStagedDoc: (index: number, direction: -1 | 1) => void;
  onUpdateStagedDocCategory: (index: number, category: string) => void;
  onClearStagedDocs: () => void;
  onInquirySubmitted: (inquiry: ContactInquiry) => void;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const DESK_COUNTERS = [
  'Counter 1: Land Mutation & Anchal',
  'Counter 2: Registry & Legal Drafting',
  'Counter 3: JharSewa Certificates',
  'Counter 4: DTO, GST & Web Desk',
];

const DOC_TAGS = [
  'Registered sale deed',
  'Previous land rent receipt (Lagan Rasid)',
  'Khatiyan / Register-II copy',
  'Notarized Affidavit',
  'Identity Proof (Voter / PAN)',
  'JharSewa Supporting Proof',
  'General Supporting PDF / Scan',
];

const RUSH_STATES = [
  { label: 'Low Rush (~10m wait)', labelHi: 'कम भीड़ (~10 मिनट)', cls: 'text-emerald-400' },
  { label: 'Moderate (~25m wait)', labelHi: 'मध्यम भीड़ (~25 मिनट)', cls: 'text-amber-300' },
  { label: 'Busy (~40m wait)', labelHi: 'अधिक भीड़ (~40 मिनट)', cls: 'text-rose-400' },
];

export function InquiryAndDbWorkspace({
  lang,
  selectedServiceSlug,
  onChangeServiceSlug,
  linkedProjectRef,
  onClearProjectRef,
  stagedDocs,
  onAddStagedDocs,
  onRemoveStagedDoc,
  onMoveStagedDoc,
  onUpdateStagedDocCategory,
  onClearStagedDocs,
  onInquirySubmitted,
  onNotify,
}: InquiryAndDbWorkspaceProps) {
  const idx = lang === 'hi' ? 1 : 0;

  // Inquiry Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [locationDetails, setLocationDetails] = useState('');
  const [message, setMessage] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastCreatedTicket, setLastCreatedTicket] = useState<ContactInquiry | null>(null);

  // Virtual Walk-In Queue Token State + Live Counter Rush toggle
  const [queueState, setQueueState] = useState<QueueState>(FALLBACK_QUEUE);
  const [queueDesk, setQueueDesk] = useState(DESK_COUNTERS[0]);
  const [queueHolder, setQueueHolder] = useState('');
  const [bookingToken, setBookingToken] = useState(false);
  const [rushIdx, setRushIdx] = useState(0);

  useEffect(() => {
    fetch(apiUrl('/api/queue'))
      .then(async (r) => {
        const ct = r.headers.get('content-type') || '';
        if (!r.ok || !ct.includes('application/json')) return null;
        return r.json();
      })
      .then((d: { queue?: QueueState } | null) => {
        if (d?.queue) setQueueState(d.queue);
      })
      .catch(() => {
        // Keep static fallback queue seamlessly
      });
  }, []);

  const addAdditionalFiles = async (files: FileList | null) => {
    if (!files || !files.length) return;
    const { valid, skipped } = await readAndValidateFiles(
      files,
      `${selectedServiceSlug}:general`,
      'General Supporting PDF / Scan'
    );
    if (skipped.length) {
      onNotify(`Skipped: ${skipped.join('; ')}`, 'error');
    }
    if (valid.length) {
      onAddStagedDocs(valid);
      onNotify(`${valid.length} file(s) attached to application batch.`, 'success');
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    await addAdditionalFiles(e.target.files);
    e.target.value = '';
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    await addAdditionalFiles(e.dataTransfer.files);
  };

  const createLocalFallbackInquiry = (
    cleanName: string,
    cleanPhone: string,
    serviceTuple: (typeof SERVICES_CATALOG)[number]
  ): ContactInquiry => {
    const now = new Date().toISOString();
    const ticketNum = Math.floor(1100 + (Date.now() % 8800));
    return {
      _id: `local-${Date.now()}`,
      ticketId: `PK-RNC-${ticketNum}`,
      name: cleanName,
      phone: cleanPhone,
      email: email.trim(),
      serviceSlug: serviceTuple[0],
      serviceName: serviceTuple[2],
      projectRef: linkedProjectRef,
      locationDetails: locationDetails.trim() || 'Kutchery Chowk Desk',
      message: message.trim(),
      statusStage: 0,
      stageHistory: [{ stage: 0, label: STATUS_STAGES.en[0], at: now }],
      closedAt: null,
      operatorNote: `Accepted with ${stagedDocs.length} staged document(s).`,
      attachedDocs: stagedDocs.map((d) => ({ ...d, dataBase64: undefined })),
      createdAt: now,
      updatedAt: now,
    };
  };

  const handleSubmitInquiry = async (e: FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\s+/g, '').trim();
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      onNotify('Please enter a valid 10-digit Indian mobile number.', 'error');
      return;
    }

    const serviceTuple =
      SERVICES_CATALOG.find((s) => s[0] === selectedServiceSlug) || SERVICES_CATALOG[0];
    setSubmitting(true);

    let finalInquiry: ContactInquiry | null = null;
    try {
      const res = await fetch(apiUrl('/api/inquiries'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: cleanPhone,
          email: email.trim(),
          serviceSlug: serviceTuple[0],
          serviceName: serviceTuple[2],
          projectRef: linkedProjectRef,
          locationDetails: locationDetails.trim() || 'Kutchery Chowk Desk',
          message: message.trim(),
          attachedDocs: stagedDocs,
        }),
      });
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        const data = (await res.json()) as { inquiry?: ContactInquiry; error?: string };
        if (res.status === 400 || res.status === 429) {
          onNotify(data.error || 'Please verify form details.', 'error');
          setSubmitting(false);
          return;
        }
        if (res.ok && data.inquiry) {
          finalInquiry = data.inquiry;
        }
      }
    } catch {
      // Static/offline mode fallback below
    }

    if (!finalInquiry) {
      finalInquiry = createLocalFallbackInquiry(name.trim(), cleanPhone, serviceTuple);
    }

    setLastCreatedTicket(finalInquiry);
    onInquirySubmitted(finalInquiry);
    setName('');
    setPhone('');
    setEmail('');
    setLocationDetails('');
    setMessage('');
    onClearStagedDocs();
    onClearProjectRef();
    onNotify(
      `Ticket ${finalInquiry.ticketId} generated with ${finalInquiry.attachedDocs.length} document(s).`,
      'success'
    );
    setSubmitting(false);
  };

  const handleDownloadBundleCoverSlip = () => {
    if (stagedDocs.length === 0) {
      onNotify('Upload or stage at least 1 PDF first to create a bundle slip.', 'info');
      return;
    }
    const serviceTuple =
      SERVICES_CATALOG.find((s) => s[0] === selectedServiceSlug) || SERVICES_CATALOG[0];
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 34, 'F');
      doc.setTextColor(251, 191, 36);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PRAGYA KENDRA — MULTI-PDF BUNDLE COVER SLIP', 14, 15);
      doc.setTextColor(226, 232, 240);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Beside Kolkatta Pharma, Radium Road, Kutchery Chowk, Ranchi - 834001', 14, 24);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Service: ${serviceTuple[2]}`, 14, 46);
      doc.text(`Applicant: ${name.trim() || 'Walk-In / Portal Client'}`, 14, 54);
      doc.setFont('helvetica', 'normal');
      doc.text(`Prepared: ${new Date().toLocaleString()} | Total Staged Files: ${stagedDocs.length}`, 14, 62);
      doc.line(14, 68, 196, 68);

      let y = 78;
      stagedDocs.forEach((d, i) => {
        const line = `${i + 1}. ${d.name} — [${d.requirementLabel || d.category}] (${d.size})`;
        const split = doc.splitTextToSize(line, 180) as string[];
        doc.text(split, 14, y);
        y += split.length * 7 + 2;
      });
      doc.save(`Pragya_Kendra_Bundle_Slip_${serviceTuple[0]}.pdf`);
      onNotify('Multi-PDF Bundle Cover Slip downloaded.', 'success');
    } catch {
      onNotify('Unable to generate bundle cover slip.', 'error');
    }
  };

  const handleDownloadReceipt = async (inquiry: ContactInquiry) => {
    try {
      const qrUrl = await generateQrDataUrl(buildTrackingUrl(inquiry.ticketId), 180);
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 36, 'F');
      doc.setTextColor(251, 191, 36);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PRAGYA KENDRA — APPLICATION RECEIPT', 14, 15);
      doc.setTextColor(226, 232, 240);
      doc.setFontSize(9.5);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'Beside Kolkatta Pharma, Radium Road, Kutchery Chowk, Ranchi - 834001 | +91 90652 33139',
        14,
        24
      );
      doc.text(`Ticket: ${inquiry.ticketId} | Stage: ${STATUS_STAGES.en[inquiry.statusStage] || 'Accepted'}`, 14, 31);

      // Right-aligned live-tracking QR Code
      doc.addImage(qrUrl, 'PNG', 158, 42, 36, 36);
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Scan to Track Live', 164, 82);

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.text(`Ticket ID: ${inquiry.ticketId}`, 14, 48);
      doc.text(`Applicant: ${inquiry.name} (+91 ${inquiry.phone})`, 14, 56);
      const serviceLines = doc.splitTextToSize(`Service: ${inquiry.serviceName}`, 138) as string[];
      doc.text(serviceLines, 14, 64);
      const locLines = doc.splitTextToSize(`Location: ${inquiry.locationDetails}`, 138) as string[];
      doc.text(locLines, 14, 74);
      doc.setFont('helvetica', 'normal');
      doc.text(`Applied On: ${new Date(inquiry.createdAt).toLocaleString()}`, 14, 84);
      if (inquiry.closedAt) {
        doc.text(`Closed At: ${new Date(inquiry.closedAt).toLocaleString()}`, 14, 90);
      }

      doc.line(14, 96, 196, 96);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(`Uploaded Client PDFs / Scans (${inquiry.attachedDocs.length}):`, 14, 105);
      doc.setFont('helvetica', 'normal');
      let y = 113;
      if (inquiry.attachedDocs.length === 0) {
        doc.text('1. Physical documents to be verified at Kutchery Chowk Desk.', 14, y);
      } else {
        inquiry.attachedDocs.forEach((d, i) => {
          const line = `${i + 1}. ${d.name} [${d.requirementLabel || d.category}] (${d.size})`;
          const split = doc.splitTextToSize(line, 180) as string[];
          doc.text(split, 14, y);
          y += split.length * 6 + 2;
        });
      }

      doc.line(14, Math.min(265, y + 8), 196, Math.min(265, y + 8));
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Scan the QR code above or enter your Ticket ID on Pragya Kendra Ranchi portal for live status.',
        14,
        Math.min(273, y + 15)
      );
      doc.save(`Pragya_Kendra_Receipt_${inquiry.ticketId}.pdf`);
      onNotify(`Receipt PDF with tracking QR downloaded for ${inquiry.ticketId}.`, 'success');
    } catch {
      onNotify('Could not create receipt PDF.', 'error');
    }
  };

  const handleBookQueueToken = async (e: FormEvent) => {
    e.preventDefault();
    if (!queueHolder.trim()) {
      onNotify('Enter visitor name to generate a walk-in token.', 'error');
      return;
    }
    setBookingToken(true);
    let updatedQueue: QueueState | null = null;
    try {
      const res = await fetch(apiUrl('/api/queue/book'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ desk: queueDesk, holder: queueHolder.trim() }),
      });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = (await res.json()) as { queue?: QueueState };
        if (data.queue) updatedQueue = data.queue;
      }
    } catch {
      // Offline / static fallback below
    }

    if (!updatedQueue) {
      const assigned = queueState.nextToken;
      updatedQueue = {
        nowServing: queueState.nowServing,
        nextToken: assigned + 1,
        lastIssued: {
          token: `PK-${assigned}`,
          desk: queueDesk,
          holder: queueHolder.trim(),
          issuedAt: new Date().toISOString(),
        },
      };
    }

    setQueueState(updatedQueue);
    setQueueHolder('');
    onNotify(`Walk-In Token ${updatedQueue.lastIssued?.token} issued!`, 'success');
    setBookingToken(false);
  };

  const rush = RUSH_STATES[rushIdx];

  return (
    <section
      id="contact"
      className="py-16 sm:py-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800"
    >
      {/* Print-only Official Receipt Sheet when lastCreatedTicket exists */}
      {lastCreatedTicket && (
        <div className="print-only print-sheet mb-6">
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">PRAGYA KENDRA — RANCHI</h1>
              <p className="text-xs text-slate-700">
                Beside Kolkatta Pharma, Radium Road, Kutchery Chowk, Ranchi - 834001 · +91 90652 33139
              </p>
            </div>
            <div className="text-right text-xs font-mono">
              <div>Ticket: {lastCreatedTicket.ticketId}</div>
              <div>{new Date(lastCreatedTicket.createdAt).toLocaleString()}</div>
            </div>
          </div>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="space-y-1.5 text-sm">
              <p>
                <strong>Applicant:</strong> {lastCreatedTicket.name} (+91 {lastCreatedTicket.phone})
              </p>
              <p>
                <strong>Applied Service:</strong> {lastCreatedTicket.serviceName}
              </p>
              <p>
                <strong>Location Details:</strong> {lastCreatedTicket.locationDetails}
              </p>
              <p>
                <strong>Current Stage:</strong>{' '}
                {STATUS_STAGES.en[lastCreatedTicket.statusStage] || 'Accepted'}
              </p>
            </div>
            <QRCodeBox
              value={buildTrackingUrl(lastCreatedTicket.ticketId)}
              size={88}
              label="Scan to Track"
              sublabel={lastCreatedTicket.ticketId}
              compact
            />
          </div>
          <div className="text-xs mb-6">
            <strong>Uploaded Client Documents ({lastCreatedTicket.attachedDocs.length}):</strong>
            <ul className="mt-1 space-y-1">
              {lastCreatedTicket.attachedDocs.map((d, i) => (
                <li key={`${d.name}-${i}`}>
                  {i + 1}. {d.name} — {d.requirementLabel || d.category} ({d.size})
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-between pt-6 text-xs border-t border-slate-300">
            <span>Applicant Sign: ________________________</span>
            <span>Radium Road Desk Stamp: ________________________</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 no-print">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              {lang === 'hi' ? 'सेवा आवेदन एवं मल्टी-PDF जमा केंद्र' : 'Service Application & Multi-PDF Intake'}
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {lang === 'hi'
                ? 'सेवा आवेदन जमा करें एवं लाइव टिकट प्राप्त करें'
                : 'Submit Applied Service & Upload Supporting PDFs'}
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {lang === 'hi'
              ? 'कचहरी चौक सहायता डेस्क · +91 90652 33139 / +91 86038 58578'
              : 'Kutchery Chowk Desk · +91 90652 33139 · +91 86038 58578'}
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left: Service Application & Staged Multi-PDF Intake Form (7 cols) */}
          <div className="lg:col-span-7 bg-slate-50/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 space-y-5">
            <div className="space-y-1">
              <h3 className="font-display text-xl font-bold text-slate-950 dark:text-white">
                {lang === 'hi' ? 'नागरिक सेवा आवेदन फॉर्म' : 'Citizen Service Application Form'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {lang === 'hi'
                  ? 'ऊपर किसी भी सेवा के दस्तावेज़ों पर सीधे PDF जोड़ें या नीचे फ़ाइलें अपलोड करें।'
                  : 'Upload PDFs directly beside each required document in the catalog above or drop additional files below. All applied services receive a trackable PK-RNC ticket ID.'}
              </p>
            </div>

            {linkedProjectRef && (
              <div className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200">
                <span>
                  Referenced Case Study: <strong className="font-mono">{linkedProjectRef}</strong>
                </span>
                <button
                  type="button"
                  onClick={onClearProjectRef}
                  className="underline font-semibold cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}

            <form onSubmit={handleSubmitInquiry} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'hi' ? 'पूरा नाम *' : 'Full Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Amit Kumar Singh"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'hi' ? 'मोबाइल / व्हाट्सएप (10 अंक) *' : 'Mobile / WhatsApp (10 digits) *'}
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    pattern="[6-9]\d{9}"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9835XXXXXX"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3.5 py-2.5 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'hi' ? 'ईमेल (वैकल्पिक)' : 'Email (Optional)'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3.5 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {lang === 'hi' ? 'चयनित सेवा *' : 'Applied Service *'}
                  </label>
                  <select
                    value={selectedServiceSlug}
                    onChange={(e) => onChangeServiceSlug(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3.5 py-2.5 text-sm font-medium"
                  >
                    {SERVICES_CATALOG.map((s) => (
                      <option key={s[0]} value={s[0]}>
                        {s[2 + idx]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'अंचल / मौजा / खाता / स्थान विवरण' : 'Anchal / Mauza / Khata / Application Location'}
                </label>
                <input
                  type="text"
                  value={locationDetails}
                  onChange={(e) => setLocationDetails(e.target.value)}
                  placeholder="e.g., Sadar Anchal, Khata 45, Plot 112"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3.5 py-2.5 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {lang === 'hi' ? 'डेस्क ऑपरेटर के लिए संदेश' : 'Notes / Instructions for Desk Operator'}
                </label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Any urgency, deed number, or additional instructions..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white px-3.5 py-2.5 text-sm"
                />
              </div>

              {/* Staged Multi-PDF Bundle + Ordering + Category Tagging + Dropzone */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {lang === 'hi'
                      ? 'अपलोड की गई PDF / स्कैन फाइलें (अधिकतम 5 MB प्रत्येक)'
                      : 'Client Uploaded PDFs / Scans (PDF, JPG, PNG · max 5 MB each)'}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {stagedDocs.length} ready
                    </span>
                    {stagedDocs.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={handleDownloadBundleCoverSlip}
                          className="inline-flex items-center gap-1 text-slate-700 dark:text-amber-300 hover:underline font-medium cursor-pointer"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          <span>Bundle Slip</span>
                        </button>
                        <button
                          type="button"
                          onClick={onClearStagedDocs}
                          className="text-rose-600 hover:underline font-medium cursor-pointer"
                        >
                          Clear All
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {stagedDocs.length > 0 && (
                  <div className="space-y-2 max-h-60 overflow-y-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
                    {stagedDocs.map((doc, globalIndex) => (
                      <div
                        key={`${doc.name}-${globalIndex}`}
                        className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-slate-800 dark:text-slate-200">
                              {doc.name}
                            </p>
                            <p className="font-mono text-[10px] text-slate-500">
                              {doc.size} · {doc.requirementLabel || doc.category}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <select
                            value={doc.requirementLabel || doc.category}
                            onChange={(e) => onUpdateStagedDocCategory(globalIndex, e.target.value)}
                            aria-label={`Category for ${doc.name}`}
                            className="border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded px-1.5 py-1 text-[11px] max-w-[145px]"
                          >
                            {!DOC_TAGS.includes(doc.requirementLabel || doc.category) && (
                              <option value={doc.requirementLabel || doc.category}>
                                {doc.requirementLabel || doc.category}
                              </option>
                            )}
                            {DOC_TAGS.map((tg) => (
                              <option key={tg} value={tg}>
                                {tg}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            disabled={globalIndex === 0}
                            onClick={() => onMoveStagedDoc(globalIndex, -1)}
                            aria-label={`Move ${doc.name} up`}
                            className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={globalIndex === stagedDocs.length - 1}
                            onClick={() => onMoveStagedDoc(globalIndex, 1)}
                            aria-label={`Move ${doc.name} down`}
                            className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemoveStagedDoc(globalIndex)}
                            aria-label={`Remove ${doc.name}`}
                            className="p-1 text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOver(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    setDragOver(false);
                  }}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('inquiryFileInput')?.click()}
                  className={`border border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                    dragOver
                      ? 'border-amber-500 bg-amber-50/40 dark:bg-amber-950/20'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 hover:border-slate-400'
                  }`}
                >
                  <Upload className="w-5 h-5 mx-auto text-slate-500 mb-1.5" />
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {lang === 'hi'
                      ? 'अतिरिक्त PDF / JPG / PNG फाइलें यहाँ क्लिक करके चुनें या ड्रॉप करें'
                      : 'Click or drop additional PDF / JPG / PNG files (multiple allowed)'}
                  </p>
                  <input
                    id="inquiryFileInput"
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 dark:hover:bg-amber-400 text-white transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>
                  {submitting
                    ? lang === 'hi'
                      ? 'जमा हो रहा है...'
                      : 'Submitting Application...'
                    : lang === 'hi'
                      ? `सेवा आवेदन जमा करें (${stagedDocs.length} फाइलें)`
                      : `Submit Applied Service (${stagedDocs.length} File${stagedDocs.length === 1 ? '' : 's'})`}
                </span>
              </button>
            </form>

            {/* Instant Confirmation Banner */}
            {lastCreatedTicket && (
              <div className="p-4 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Submitted! Applied Ticket:{' '}
                        <span className="font-mono">{lastCreatedTicket.ticketId}</span>
                      </span>
                    </span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                      {lastCreatedTicket.attachedDocs.length} file(s) attached
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadReceipt(lastCreatedTicket)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Receipt PDF + QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>A4 Print Slip</span>
                    </button>
                    <a
                      href={`https://wa.me/919065233139?text=${encodeURIComponent(
                        `Namaste Pragya Kendra Ranchi,\nTicket: ${lastCreatedTicket.ticketId}\nName: ${lastCreatedTicket.name}\nService: ${lastCreatedTicket.serviceName}\nAttached Files: ${lastCreatedTicket.attachedDocs.length}\nDetails: ${lastCreatedTicket.locationDetails}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white"
                    >
                      Send on WhatsApp
                    </a>
                  </div>
                </div>

                <QRCodeBox
                  value={buildTrackingUrl(lastCreatedTicket.ticketId)}
                  size={96}
                  label={lang === 'hi' ? 'ट्रैक QR' : 'Scan to Track'}
                  sublabel={lastCreatedTicket.ticketId}
                  downloadName={`QR-${lastCreatedTicket.ticketId}.png`}
                />
              </div>
            )}
          </div>

          {/* Right: Virtual Walk-In Queue Token + Live Wait Status + Desk Guide (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <p className="text-xs font-semibold text-amber-400">
                    {lang === 'hi' ? 'कचहरी रोड वॉक-इन टोकन' : 'Virtual Walk-In Queue'}
                  </p>
                  <h3 className="font-display text-lg font-bold text-white">
                    {lang === 'hi' ? 'काउंटर टोकन बुक करें' : 'Book Radium Road Desk Token'}
                  </h3>
                </div>
                <Ticket className="w-5 h-5 text-amber-400" />
              </div>

              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-400">
                  {lang === 'hi' ? 'काउंटर भीड़ स्थिति:' : 'Estimated Desk Wait:'}
                </span>
                <button
                  type="button"
                  onClick={() => setRushIdx((prev) => (prev + 1) % RUSH_STATES.length)}
                  className={`font-semibold ${rush.cls} cursor-pointer hover:underline`}
                >
                  {lang === 'hi' ? rush.labelHi : rush.label}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[11px] text-slate-400">Now Serving</div>
                  <div className="font-mono text-2xl font-extrabold text-emerald-400 tabular-nums mt-0.5">
                    PK-{queueState.nowServing}
                  </div>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
                  <div className="text-[11px] text-slate-400">Next Available</div>
                  <div className="font-mono text-2xl font-extrabold text-amber-300 tabular-nums mt-0.5">
                    PK-{queueState.nextToken}
                  </div>
                </div>
              </div>

              <form onSubmit={handleBookQueueToken} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {lang === 'hi' ? 'काउंटर डेस्क चुनें' : 'Select Counter Desk'}
                  </label>
                  <select
                    value={queueDesk}
                    onChange={(e) => setQueueDesk(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 text-white px-3 py-2 text-xs font-medium"
                  >
                    {DESK_COUNTERS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {lang === 'hi' ? 'आवेदक का नाम' : 'Visitor Full Name'}
                  </label>
                  <input
                    type="text"
                    value={queueHolder}
                    onChange={(e) => setQueueHolder(e.target.value)}
                    placeholder="e.g., Ranjeet Oraon"
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 text-white px-3 py-2 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={bookingToken}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                >
                  {bookingToken
                    ? lang === 'hi'
                      ? 'टोकन जारी हो रहा है...'
                      : 'Issuing Token...'
                    : lang === 'hi'
                      ? 'वॉक-इन टोकन प्राप्त करें'
                      : 'Issue Walk-In Token'}
                </button>
              </form>

              {queueState.lastIssued && (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-semibold text-amber-300 block">Latest Issued Token</span>
                    <span className="font-mono text-base font-bold text-white block">
                      {queueState.lastIssued.token}
                    </span>
                    <p className="text-slate-400">
                      {queueState.lastIssued.holder} · {queueState.lastIssued.desk}
                    </p>
                  </div>
                  <QRCodeBox
                    value={`PRAGYA-KENDRA-QUEUE|${queueState.lastIssued.token}|${queueState.lastIssued.desk}|${queueState.lastIssued.holder}|${queueState.lastIssued.issuedAt}`}
                    size={90}
                    downloadName={`Token-${queueState.lastIssued.token}.png`}
                    compact
                  />
                </div>
              )}
            </div>

            <div className="bg-slate-50/70 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-3 text-xs">
              <div className="flex items-center gap-2 font-display font-bold text-sm text-slate-950 dark:text-white">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>
                  {lang === 'hi'
                    ? 'दस्तावेज़ गोपनीयता एवं कार्यालय समय'
                    : 'Document Verification Privacy & Hours'}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                {lang === 'hi'
                  ? 'अपलोड किए गए क्लाइंट PDF केवल सत्यापित स्टाफ डेस्क पर ही देखे जा सकते हैं। कार्यालय सोमवार से शनिवार सुबह 09:30 से रात 09:00 बजे तक खुला रहता है।'
                  : 'Uploaded client PDFs are accessible only inside the server-authenticated Staff Operations Desk. Open Monday – Saturday, 09:30 AM to 09:00 PM at Radium Road, Kutchery Chowk.'}
              </p>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {lang === 'hi'
                  ? 'नोट: इस केंद्र पर आधार नामांकन या बायोमेट्रिक अपडेट नहीं किया जाता है।'
                  : 'Note: Pragya Kendra does not conduct Aadhaar enrollment or biometric updates.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
