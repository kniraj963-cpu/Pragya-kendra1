import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { jsPDF } from 'jspdf';
import {
  CheckCircle2,
  DatabaseBackup,
  Download,
  Eye,
  FileSpreadsheet,
  Lock,
  LogOut,
  Plus,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  X,
} from 'lucide-react';
import {
  STATUS_STAGES,
  type ChallanItem,
  type ContactInquiry,
  type EmployeeRecord,
  type LedgerEntry,
  type PartnerReferral,
  type QueueState,
} from '../data/catalog.ts';
import { apiUrl } from '../utils/fileReader.ts';
import { buildUpiUri, MERCHANT_UPI_ID } from '../utils/qr.ts';
import { QRCodeBox } from './QRCodeBox.tsx';

interface StaffOperationsConsoleProps {
  lang: 'en' | 'hi';
  staffAuthenticated: boolean;
  staffToken: string | null;
  showAuthModal: boolean;
  onOpenAuthModal: () => void;
  onCloseAuthModal: () => void;
  onAuthSuccess: (token: string | null) => void;
  onLogout: () => Promise<void>;
  onDataRestored: () => Promise<void>;
  onNotify: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type StaffTab = 'inquiries' | 'employees' | 'ledger' | 'challans' | 'referrals' | 'backup';

export function StaffOperationsConsole({
  lang,
  staffAuthenticated,
  staffToken,
  showAuthModal,
  onOpenAuthModal,
  onCloseAuthModal,
  onAuthSuccess,
  onLogout,
  onDataRestored,
  onNotify,
}: StaffOperationsConsoleProps) {
  const [activeTab, setActiveTab] = useState<StaffTab>('inquiries');

  // Login modal state
  const [credentialInput, setCredentialInput] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Staff operational state
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [challans, setChallans] = useState<ChallanItem[]>([]);
  const [referrals, setReferrals] = useState<PartnerReferral[]>([]);
  const [queue, setQueue] = useState<QueueState>({ nowServing: 108, nextToken: 109 });
  const [loadingOps, setLoadingOps] = useState(false);

  // Filters
  const [filterStage, setFilterStage] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Operator note editing buffer
  const [noteEdits, setNoteEdits] = useState<Record<string, string>>({});

  // PDF / Image Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    name: string;
    mimeType: string;
  } | null>(null);

  // Dynamic UPI QR Payment Modal State
  const [upiModal, setUpiModal] = useState<{
    amount: number;
    note: string;
    title: string;
  } | null>(null);

  // Sub-forms
  const [empName, setEmpName] = useState('');
  const [empRole, setEmpRole] = useState('');
  const [empPhone, setEmpPhone] = useState('');

  const [ledgerDesc, setLedgerDesc] = useState('');
  const [ledgerMode, setLedgerMode] = useState<'UPI' | 'Cash' | 'Challan'>('UPI');
  const [ledgerAmount, setLedgerAmount] = useState('');

  const [challanRef, setChallanRef] = useState('');
  const [challanCat, setChallanCat] = useState('Registry / e-Stamp Challan');
  const [challanAmt, setChallanAmt] = useState('');

  const [refPartner, setRefPartner] = useState('Adv. R.K. Sinha (Civil Court)');
  const [refClient, setRefClient] = useState('');
  const [refWork, setRefWork] = useState('');
  const [refCredit, setRefCredit] = useState('₹500');

  const [restoring, setRestoring] = useState(false);
  const [publishingSite, setPublishingSite] = useState(false);
  const [sitePublishInfo, setSitePublishInfo] = useState<{
    database?: string;
    publishedAt?: string;
    servicesCount?: number;
    projectsCount?: number;
  } | null>(null);

  const authHeaders = useCallback(
    (json = true): Record<string, string> => {
      const h: Record<string, string> = {};
      if (json) h['Content-Type'] = 'application/json';
      if (staffToken) h.Authorization = `Bearer ${staffToken}`;
      return h;
    },
    [staffToken]
  );

  const loadAllOperations = useCallback(async () => {
    if (!staffAuthenticated) return;
    setLoadingOps(true);
    try {
      const [inqRes, opsRes] = await Promise.all([
        fetch(apiUrl('/api/inquiries'), {
          credentials: 'include',
          headers: authHeaders(false),
        }),
        fetch(apiUrl('/api/operations/summary'), {
          credentials: 'include',
          headers: authHeaders(false),
        }),
      ]);

      if (inqRes.ok) {
        const d = (await inqRes.json()) as { inquiries: ContactInquiry[] };
        setInquiries(d.inquiries || []);
        const map: Record<string, string> = {};
        (d.inquiries || []).forEach((item) => {
          map[item._id] = item.operatorNote || '';
        });
        setNoteEdits(map);
      }

      if (opsRes.ok) {
        const ops = (await opsRes.json()) as {
          employees: EmployeeRecord[];
          ledger: LedgerEntry[];
          challans: ChallanItem[];
          referrals: PartnerReferral[];
          queue: QueueState;
        };
        setEmployees(ops.employees || []);
        setLedger(ops.ledger || []);
        setChallans(ops.challans || []);
        setReferrals(ops.referrals || []);
        if (ops.queue) setQueue(ops.queue);
      }

      const siteRes = await fetch(apiUrl('/api/site'));
      if (siteRes.ok) {
        const s = (await siteRes.json()) as {
          database?: string;
          site?: { publishedAt?: string };
          servicesCount?: number;
          projectsCount?: number;
        };
        setSitePublishInfo({
          database: s.database,
          publishedAt: s.site?.publishedAt,
          servicesCount: s.servicesCount,
          projectsCount: s.projectsCount,
        });
      }
    } catch {
      onNotify('Could not load staff operations data.', 'error');
    } finally {
      setLoadingOps(false);
    }
  }, [staffAuthenticated, authHeaders, onNotify]);

  useEffect(() => {
    if (staffAuthenticated) {
      loadAllOperations();
    } else {
      setInquiries([]);
      setEmployees([]);
      setLedger([]);
      setChallans([]);
      setReferrals([]);
    }
  }, [staffAuthenticated, loadAllOperations]);

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const val = credentialInput.trim();
    if (!val) return;
    setLoggingIn(true);
    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: val, password: val }),
      });
      const data = (await res.json()) as { ok?: boolean; token?: string; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Invalid Staff PIN or Password.');
      }
      setCredentialInput('');
      onAuthSuccess(data.token || null);
      onCloseAuthModal();
      onNotify('Staff Workspace unlocked via server session.', 'success');
    } catch (err) {
      onNotify((err as Error).message, 'error');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleStageChange = async (id: string, stage: number) => {
    try {
      const res = await fetch(apiUrl(`/api/inquiries/${encodeURIComponent(id)}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: authHeaders(true),
        body: JSON.stringify({ statusStage: stage }),
      });
      if (!res.ok) throw new Error('Failed to update status stage.');
      await loadAllOperations();
      onNotify(
        stage === 4
          ? 'Application marked Closed with completion timestamp.'
          : `Updated stage to "${STATUS_STAGES.en[stage]}".`,
        'success'
      );
    } catch (err) {
      onNotify((err as Error).message, 'error');
    }
  };

  const handleSaveOperatorNote = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/api/inquiries/${encodeURIComponent(id)}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: authHeaders(true),
        body: JSON.stringify({ operatorNote: noteEdits[id] || '' }),
      });
      if (!res.ok) throw new Error('Could not save operator note.');
      await loadAllOperations();
      onNotify('Operator status note updated.', 'success');
    } catch (err) {
      onNotify((err as Error).message, 'error');
    }
  };

  const handleAssignInquiry = async (id: string, assignedTo: string) => {
    try {
      const res = await fetch(apiUrl(`/api/inquiries/${encodeURIComponent(id)}`), {
        method: 'PATCH',
        credentials: 'include',
        headers: authHeaders(true),
        body: JSON.stringify({ assignedTo }),
      });
      if (!res.ok) throw new Error('Could not assign operator.');
      await loadAllOperations();
      onNotify(assignedTo ? `Assigned ticket to ${assignedTo}.` : 'Assignment cleared.', 'success');
    } catch (err) {
      onNotify((err as Error).message, 'error');
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    try {
      const res = await fetch(apiUrl(`/api/inquiries/${encodeURIComponent(id)}`), {
        method: 'DELETE',
        credentials: 'include',
        headers: authHeaders(false),
      });
      if (!res.ok) throw new Error('Could not delete inquiry.');
      await loadAllOperations();
      onNotify('Application deleted from MongoDB.', 'info');
    } catch (err) {
      onNotify((err as Error).message, 'error');
    }
  };

  const handleOpenOrDownloadAttachment = async (
    attachmentId: string | undefined,
    fileName: string,
    mimeType: string,
    mode: 'preview' | 'download'
  ) => {
    if (!attachmentId) {
      onNotify('This legacy metadata item does not have a binary file stored.', 'info');
      return;
    }
    try {
      const res = await fetch(
        apiUrl(`/api/attachments/${encodeURIComponent(attachmentId)}${mode === 'download' ? '?download=1' : ''}`),
        {
          credentials: 'include',
          headers: authHeaders(false),
        }
      );
      if (!res.ok) throw new Error('Could not fetch attachment from server.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (mode === 'download') {
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 10000);
        onNotify(`Downloaded "${fileName}".`, 'success');
      } else {
        setPreviewDoc({ url, name: fileName, mimeType });
      }
    } catch (err) {
      onNotify((err as Error).message, 'error');
    }
  };

  const closePreview = () => {
    if (previewDoc?.url) URL.revokeObjectURL(previewDoc.url);
    setPreviewDoc(null);
  };

  const handleExportCsv = () => {
    const esc = (v: unknown) =>
      `"${String(v ?? '').replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"`;
    const rows = [
      [
        'Ticket ID',
        'Applicant',
        'Mobile',
        'Email',
        'Service',
        'Location',
        'Stage',
        'Closed At',
        'PDF Count',
        'Created At',
      ],
      ...inquiries.map((i) => [
        i.ticketId,
        i.name,
        i.phone,
        i.email,
        i.serviceName,
        i.locationDetails,
        STATUS_STAGES.en[i.statusStage] || 'Accepted',
        i.closedAt || '',
        i.attachedDocs.length,
        i.createdAt,
      ]),
    ];
    const csv = rows.map((r) => r.map(esc).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pragya-kendra-inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onNotify('Applied Inquiries CSV exported.', 'success');
  };

  // Employees handlers
  const handleAddEmployee = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/api/employees'), {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(true),
        body: JSON.stringify({ name: empName, role: empRole, phone: empPhone }),
      });
      if (!res.ok) throw new Error('Could not add employee.');
      setEmpName('');
      setEmpRole('');
      setEmpPhone('');
      await loadAllOperations();
      onNotify('Employee added to Ranchi desk roster.', 'success');
    } catch (err) {
      onNotify((err as Error).message, 'error');
    }
  };

  const handleCycleEmployeeStatus = async (emp: EmployeeRecord) => {
    const order: EmployeeRecord['status'][] = ['Present', 'On Break', 'Half-Day', 'Absent'];
    const next = order[(order.indexOf(emp.status) + 1) % order.length];
    const res = await fetch(apiUrl(`/api/employees/${encodeURIComponent(emp._id)}`), {
      method: 'PATCH',
      credentials: 'include',
      headers: authHeaders(true),
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) await loadAllOperations();
  };

  const handleIncrementCompleted = async (emp: EmployeeRecord) => {
    const res = await fetch(apiUrl(`/api/employees/${encodeURIComponent(emp._id)}`), {
      method: 'PATCH',
      credentials: 'include',
      headers: authHeaders(true),
      body: JSON.stringify({ completedToday: emp.completedToday + 1 }),
    });
    if (res.ok) await loadAllOperations();
  };

  const handleRemoveEmployee = async (id: string) => {
    const res = await fetch(apiUrl(`/api/employees/${encodeURIComponent(id)}`), {
      method: 'DELETE',
      credentials: 'include',
      headers: authHeaders(false),
    });
    if (res.ok) {
      await loadAllOperations();
      onNotify('Employee removed from roster.', 'info');
    } else {
      onNotify('At least 1 active employee must remain.', 'error');
    }
  };

  // Ledger handler
  const handleAddLedger = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/api/ledger'), {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(true),
        body: JSON.stringify({ desc: ledgerDesc, mode: ledgerMode, amount: Number(ledgerAmount) }),
      });
      if (!res.ok) throw new Error('Invalid ledger entry.');
      setLedgerDesc('');
      setLedgerAmount('');
      await loadAllOperations();
      onNotify('EOD ledger entry recorded.', 'success');
    } catch (err) {
      onNotify((err as Error).message, 'error');
    }
  };

  // Challan handler & PDF export
  const handleAddChallan = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/api/challans'), {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(true),
        body: JSON.stringify({
          refId: challanRef,
          category: challanCat,
          amount: Number(challanAmt),
        }),
      });
      if (!res.ok) throw new Error('Invalid challan details.');
      setChallanRef('');
      setChallanAmt('');
      await loadAllOperations();
      onNotify('Challan item bundled.', 'success');
    } catch (err) {
      onNotify((err as Error).message, 'error');
    }
  };

  const handleExportChallanBundlePdf = () => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setTextColor(251, 191, 36);
    doc.setFontSize(15);
    doc.setFont('helvetica', 'bold');
    doc.text('PRAGYA KENDRA — DAILY CHALLAN BUNDLE SUMMARY', 14, 15);
    doc.setTextColor(226, 232, 240);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Radium Road, Kutchery Chowk, Ranchi | Generated: ${new Date().toLocaleString()}`, 14, 24);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(10.5);
    let y = 46;
    let total = 0;
    challans.forEach((c, i) => {
      total += c.amount;
      doc.text(`${i + 1}. [${c.refId}] ${c.category} — Rs. ${c.amount.toLocaleString('en-IN')}`, 14, y);
      y += 8;
    });
    doc.line(14, y + 2, 196, y + 2);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Bundled Govt. / Desk Challan: Rs. ${total.toLocaleString('en-IN')}`, 14, y + 12);
    doc.save(`Pragya_Kendra_Challan_Bundle_${new Date().toISOString().slice(0, 10)}.pdf`);
    onNotify('Challan Bundle PDF downloaded.', 'success');
  };

  // Referrals & Queue Advance
  const handleAddReferral = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(apiUrl('/api/referrals'), {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(true),
        body: JSON.stringify({
          partner: refPartner,
          client: refClient,
          work: refWork,
          credit: refCredit,
        }),
      });
      if (!res.ok) throw new Error('Could not log advocate referral.');
      setRefClient('');
      setRefWork('');
      await loadAllOperations();
      onNotify('Advocate referral recorded.', 'success');
    } catch (err) {
      onNotify((err as Error).message, 'error');
    }
  };

  const handleAdvanceQueue = async () => {
    const res = await fetch(apiUrl('/api/queue/advance'), {
      method: 'POST',
      credentials: 'include',
      headers: authHeaders(false),
    });
    if (res.ok) {
      const d = (await res.json()) as { queue: QueueState };
      setQueue(d.queue);
      onNotify(`Walk-in Queue advanced to PK-${d.queue.nowServing}.`, 'success');
    }
  };

  // Daily JSON Export & Restore
  const handleDownloadJsonBackup = async () => {
    try {
      const res = await fetch(apiUrl('/api/backup/export'), {
        credentials: 'include',
        headers: authHeaders(false),
      });
      if (!res.ok) throw new Error('Backup export failed.');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pragya-kendra-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onNotify('Daily full JSON database backup downloaded.', 'success');
    } catch (err) {
      onNotify((err as Error).message, 'error');
    }
  };

  const handlePublishSiteToMongo = async () => {
    setPublishingSite(true);
    try {
      const res = await fetch(apiUrl('/api/site/publish'), {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(false),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        database?: string;
        site?: { publishedAt?: string };
        servicesCount?: number;
        projectsCount?: number;
        error?: string;
      };
      if (!res.ok || !data.ok) throw new Error(data.error || 'Publish failed.');
      setSitePublishInfo({
        database: data.database,
        publishedAt: data.site?.publishedAt,
        servicesCount: data.servicesCount,
        projectsCount: data.projectsCount,
      });
      onNotify(
        `Website snapshot & ${data.servicesCount || 115}+ services published to MongoDB (${data.database}).`,
        'success'
      );
    } catch (err) {
      onNotify((err as Error).message, 'error');
    } finally {
      setPublishingSite(false);
    }
  };

  const handleRestoreJsonFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setRestoring(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as Record<string, unknown>;
      const res = await fetch(apiUrl('/api/backup/restore'), {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(true),
        body: JSON.stringify(parsed),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        restored?: { projects: number; inquiries: number; attachments: number };
        error?: string;
      };
      if (!res.ok || !data.ok) throw new Error(data.error || 'Restore failed.');
      await loadAllOperations();
      await onDataRestored();
      onNotify(
        `Backup restored: ${data.restored?.projects || 0} projects, ${data.restored?.inquiries || 0} inquiries, ${data.restored?.attachments || 0} PDFs.`,
        'success'
      );
    } catch (err) {
      onNotify((err as Error).message, 'error');
    } finally {
      setRestoring(false);
    }
  };

  const visibleInquiries = inquiries.filter((i) => {
    const stageOk = filterStage === 'all' || i.statusStage === Number(filterStage);
    const q = searchTerm.toLowerCase().trim();
    const qOk =
      !q ||
      i.ticketId.toLowerCase().includes(q) ||
      i.name.toLowerCase().includes(q) ||
      i.phone.includes(q) ||
      i.serviceName.toLowerCase().includes(q);
    return stageOk && qOk;
  });

  const cashTotal = ledger.filter((l) => l.mode === 'Cash').reduce((s, l) => s + l.amount, 0);
  const upiTotal = ledger.filter((l) => l.mode === 'UPI').reduce((s, l) => s + l.amount, 0);
  const challanTotal = ledger.filter((l) => l.mode === 'Challan').reduce((s, l) => s + l.amount, 0);
  const netRevenue = cashTotal + upiTotal;

  return (
    <section
      id="staff-ops"
      className="py-16 sm:py-20 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 no-print"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
              {lang === 'hi'
                ? 'स्टाफ एवं एडमिन संचालन डेस्क'
                : 'Authenticated Staff Desk & Backup Console'}
            </p>
            <h2 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white">
              {lang === 'hi'
                ? 'आवेदन सत्यापन, PDF डाउनलोड, खाता-बही एवं JSON बैकअप'
                : 'Operations Workspace, Client PDF Viewer & Daily JSON Backup'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {staffAuthenticated ? (
              <>
                <button
                  type="button"
                  onClick={loadAllOperations}
                  disabled={loadingOps}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingOps ? 'animate-spin' : ''}`} />
                  <span>Sync Desk</span>
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 text-white cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Lock Console</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onOpenAuthModal}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 text-white cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Staff Desk Sign In</span>
              </button>
            )}
          </div>
        </div>

        {!staffAuthenticated ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Server-Verified Access · Zero Client localStorage</span>
              </div>
              <h3 className="font-display text-xl font-bold text-slate-950 dark:text-white">
                Staff Authentication Required for Client PDFs, Ledgers & Backups
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Sign in with your desk PIN or Staff Password to view applied tickets, inspect & download uploaded client PDFs, progress applications to Closed, manage EOD Cash/UPI ledgers, and export/restore daily JSON backups.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-5 py-3 text-sm font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 text-white cursor-pointer shrink-0"
            >
              Unlock Staff Operations →
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            {/* Tab Bar */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-2.5">
              {(
                [
                  ['inquiries', `Applied Inquiries (${inquiries.length})`],
                  ['employees', `Employee Roster (${employees.length})`],
                  ['ledger', 'EOD Ledger'],
                  ['challans', `Challan Bundler (${challans.length})`],
                  ['referrals', 'Advocates & Queue'],
                  ['backup', 'JSON Backup & Restore'],
                ] as Array<[StaffTab, string]>
              ).map(([tabId, label]) => (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setActiveTab(tabId)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    activeTab === tabId
                      ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="p-5 sm:p-6">
              {/* TAB 1: Applied Inquiries & Actual PDFs */}
              {activeTab === 'inquiries' && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="grid sm:grid-cols-2 gap-3 flex-1 max-w-xl">
                      <input
                        type="search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search Ticket, Name, Mobile..."
                        className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs"
                      />
                      <select
                        value={filterStage}
                        onChange={(e) => setFilterStage(e.target.value)}
                        className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2 text-xs font-medium"
                      >
                        <option value="all">All 5 Stages</option>
                        {STATUS_STAGES.en.map((st, idx2) => (
                          <option key={st} value={String(idx2)}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {visibleInquiries.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500 border border-slate-200 dark:border-slate-800 rounded-xl">
                        No applied tickets match your filter.
                      </div>
                    ) : (
                      visibleInquiries.map((inq) => (
                        <div
                          key={inq._id}
                          className="border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 rounded-xl p-4 sm:p-5 space-y-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                                {inq.ticketId}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {inq.name} (+91 {inq.phone})
                              </span>
                            </div>
                            <span className="text-slate-500 font-mono tabular-nums">
                              Applied: {new Date(inq.createdAt).toLocaleString()}
                            </span>
                          </div>

                          <div className="text-xs space-y-1">
                            <p className="font-semibold text-sm text-slate-950 dark:text-white">
                              {inq.serviceName}
                            </p>
                            <p className="text-slate-600 dark:text-slate-400">
                              Location: {inq.locationDetails}
                              {inq.message ? ` · Note: ${inq.message}` : ''}
                            </p>
                            {inq.statusStage === 4 && inq.closedAt && (
                              <p className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-mono font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Closed at {new Date(inq.closedAt).toLocaleString()}</span>
                              </p>
                            )}
                          </div>

                          {/* Uploaded Client PDFs */}
                          <div className="space-y-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
                            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                              Uploaded Client Documents ({inq.attachedDocs.length})
                            </p>
                            {inq.attachedDocs.length === 0 ? (
                              <p className="text-xs text-slate-500">No digital PDFs attached.</p>
                            ) : (
                              <div className="grid sm:grid-cols-2 gap-2">
                                {inq.attachedDocs.map((doc, dIdx) => (
                                  <div
                                    key={`${doc.name}-${dIdx}`}
                                    className="flex items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 text-xs"
                                  >
                                    <div className="min-w-0">
                                      <p className="font-semibold truncate text-slate-900 dark:text-white">
                                        {doc.name}
                                      </p>
                                      <p className="text-[11px] text-slate-500 truncate">
                                        {doc.requirementLabel || doc.category} · {doc.size}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOpenOrDownloadAttachment(
                                            doc.attachmentId,
                                            doc.name,
                                            doc.mimeType,
                                            'preview'
                                          )
                                        }
                                        aria-label={`Preview ${doc.name}`}
                                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleOpenOrDownloadAttachment(
                                            doc.attachmentId,
                                            doc.name,
                                            doc.mimeType,
                                            'download'
                                          )
                                        }
                                        aria-label={`Download ${doc.name}`}
                                        className="p-1.5 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 cursor-pointer"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Stage Selector & Operator Note */}
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                value={inq.statusStage}
                                onChange={(e) => handleStageChange(inq._id, Number(e.target.value))}
                                aria-label={`Status for ${inq.ticketId}`}
                                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold"
                              >
                                {STATUS_STAGES.en.map((st, sIdx) => (
                                  <option key={st} value={sIdx}>
                                    Stage {sIdx + 1}: {st}
                                  </option>
                                ))}
                              </select>

                              <select
                                value={inq.assignedTo || ''}
                                onChange={(e) => handleAssignInquiry(inq._id, e.target.value)}
                                aria-label={`Assign operator for ${inq.ticketId}`}
                                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
                              >
                                <option value="">Unassigned Desk</option>
                                {employees.map((emp) => (
                                  <option key={emp._id} value={emp.name}>
                                    {emp.name} ({emp.empId})
                                  </option>
                                ))}
                              </select>

                              <a
                                href={`https://wa.me/91${inq.phone}?text=${encodeURIComponent(
                                  `Hello ${inq.name}, update on Pragya Kendra Ranchi ticket ${inq.ticketId} (${inq.serviceName}): ${STATUS_STAGES.en[inq.statusStage]}.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
                              >
                                WhatsApp Update
                              </a>
                              <button
                                type="button"
                                onClick={() =>
                                  setUpiModal({
                                    amount: 500,
                                    note: inq.ticketId,
                                    title: `${inq.ticketId} · ${inq.name}`,
                                  })
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 text-xs font-semibold cursor-pointer"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>UPI QR</span>
                              </button>
                            </div>

                            <div className="flex items-center gap-2 flex-1 max-w-md">
                              <input
                                type="text"
                                value={noteEdits[inq._id] ?? inq.operatorNote ?? ''}
                                onChange={(e) =>
                                  setNoteEdits((prev) => ({ ...prev, [inq._id]: e.target.value }))
                                }
                                placeholder="Operator verification note..."
                                className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveOperatorNote(inq._id)}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                Save Note
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteInquiry(inq._id)}
                                aria-label={`Delete ${inq.ticketId}`}
                                className="p-1.5 text-rose-500 hover:text-rose-700 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* TAB 2: Employee Attendance Roster */}
              {activeTab === 'employees' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <div className="text-xs text-slate-500">Total Desk Staff</div>
                      <div className="font-mono text-xl font-extrabold text-slate-950 dark:text-white tabular-nums mt-1">
                        {employees.length}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <div className="text-xs text-slate-500">Present Today</div>
                      <div className="font-mono text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums mt-1">
                        {employees.filter((e) => e.status === 'Present').length}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                      <div className="text-xs text-slate-500">Files Handled Today</div>
                      <div className="font-mono text-xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums mt-1">
                        {employees.reduce((sum, e) => sum + e.completedToday, 0)}
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {employees.map((emp) => (
                      <div
                        key={emp._id}
                        className="border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950 rounded-xl p-4 space-y-3 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                            {emp.empId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCycleEmployeeStatus(emp)}
                            className="px-2 py-0.5 rounded bg-slate-900 text-white dark:bg-slate-800 text-[11px] font-semibold cursor-pointer"
                          >
                            {emp.status}
                          </button>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-slate-950 dark:text-white">{emp.name}</p>
                          <p className="text-slate-500">{emp.role}</p>
                        </div>
                        <div className="flex justify-between text-slate-600 dark:text-slate-400 tabular-nums">
                          <span>Files Today: {emp.completedToday}</span>
                          <span>Accuracy: {emp.accuracy}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleIncrementCompleted(emp)}
                            className="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline cursor-pointer"
                          >
                            +1 File
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveEmployee(emp._id)}
                            className="text-rose-500 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <form
                    onSubmit={handleAddEmployee}
                    className="grid sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800"
                  >
                    <input
                      type="text"
                      required
                      value={empName}
                      onChange={(e) => setEmpName(e.target.value)}
                      placeholder="Employee Name"
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      required
                      value={empRole}
                      onChange={(e) => setEmpRole(e.target.value)}
                      placeholder="Desk / Role"
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs"
                    />
                    <input
                      type="tel"
                      required
                      value={empPhone}
                      onChange={(e) => setEmpPhone(e.target.value)}
                      placeholder="Phone Number"
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-mono"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 text-xs font-semibold py-2 cursor-pointer"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Add Staff</span>
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: Daily EOD Financial Ledger */}
              {activeTab === 'ledger' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Cash Collected', val: cashTotal },
                      { label: 'UPI / QR Revenue', val: upiTotal },
                      { label: 'Govt. Challan Passed', val: challanTotal },
                      { label: 'Net Desk Revenue', val: netRevenue },
                    ].map((kpi) => (
                      <div
                        key={kpi.label}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                      >
                        <div className="text-xs text-slate-500">{kpi.label}</div>
                        <div className="font-mono text-xl font-extrabold text-slate-950 dark:text-amber-300 tabular-nums mt-1">
                          ₹{kpi.val.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>

                  <form onSubmit={handleAddLedger} className="grid sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      required
                      value={ledgerDesc}
                      onChange={(e) => setLedgerDesc(e.target.value)}
                      placeholder="Service / Ticket Description"
                      className="sm:col-span-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs"
                    />
                    <select
                      value={ledgerMode}
                      onChange={(e) => setLedgerMode(e.target.value as LedgerEntry['mode'])}
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-semibold"
                    >
                      <option value="UPI">UPI / QR</option>
                      <option value="Cash">Cash</option>
                      <option value="Challan">Govt. Challan</option>
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        required
                        min={1}
                        value={ledgerAmount}
                        onChange={(e) => setLedgerAmount(e.target.value)}
                        placeholder="₹ Amount"
                        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-mono"
                      />
                      <button
                        type="submit"
                        className="px-4 rounded-xl bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 text-xs font-semibold cursor-pointer shrink-0"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setUpiModal({
                            amount: Number(ledgerAmount) > 0 ? Number(ledgerAmount) : 500,
                            note: ledgerDesc.trim() || 'Desk Fee',
                            title: 'Desk Counter UPI Collection',
                          })
                        }
                        className="inline-flex items-center gap-1 px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer shrink-0"
                        title="Generate Counter UPI QR"
                      >
                        <QrCode className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>QR</span>
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {ledger.map((item) => (
                      <div
                        key={item._id}
                        className="flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-slate-900 dark:text-white">{item.desc}</span>
                          <span className="ml-2 text-slate-500 font-mono">
                            · {item.mode} · {item.time}
                          </span>
                        </div>
                        <span className="font-mono font-bold tabular-nums">
                          ₹{item.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: Automated Challan Bundler */}
              {activeTab === 'challans' && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Group e-Stamp, JharSewa, and DTO challans for EOD settlement PDF generation.
                    </p>
                    <button
                      type="button"
                      onClick={handleExportChallanBundlePdf}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Challan Bundle PDF</span>
                    </button>
                  </div>

                  <form onSubmit={handleAddChallan} className="grid sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      required
                      value={challanRef}
                      onChange={(e) => setChallanRef(e.target.value)}
                      placeholder="Ticket ID (e.g., PK-RNC-1001)"
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-mono"
                    />
                    <select
                      value={challanCat}
                      onChange={(e) => setChallanCat(e.target.value)}
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs"
                    >
                      <option>Registry / e-Stamp Challan</option>
                      <option>Jharbhoomi Lagan / Mutation</option>
                      <option>JharSewa Certificate Fee</option>
                      <option>Parivahan DTO Tax / Fee</option>
                    </select>
                    <input
                      type="number"
                      required
                      min={1}
                      value={challanAmt}
                      onChange={(e) => setChallanAmt(e.target.value)}
                      placeholder="₹ Amount"
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-mono"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 text-xs font-semibold py-2 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Challan</span>
                    </button>
                  </form>

                  <div className="space-y-2">
                    {challans.map((c) => (
                      <div
                        key={c._id}
                        className="flex items-center justify-between border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                            {c.refId}
                          </span>
                          <span className="ml-2 font-medium">{c.category}</span>
                        </div>
                        <span className="font-mono font-bold tabular-nums">
                          ₹{c.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: Advocate Partner Vault & Walk-In Queue Control */}
              {activeTab === 'referrals' && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold text-sm text-slate-950 dark:text-white">
                        Walk-In Queue Control · Now Serving: PK-{queue.nowServing}
                      </p>
                      <p className="text-slate-500">Next Waiting Token: PK-{queue.nextToken}</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAdvanceQueue}
                      className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 cursor-pointer"
                    >
                      Call Next Token →
                    </button>
                  </div>

                  <form onSubmit={handleAddReferral} className="grid sm:grid-cols-4 gap-3">
                    <input
                      type="text"
                      required
                      value={refPartner}
                      onChange={(e) => setRefPartner(e.target.value)}
                      placeholder="Advocate / Partner Name"
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      required
                      value={refClient}
                      onChange={(e) => setRefClient(e.target.value)}
                      placeholder="Client Name"
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs"
                    />
                    <input
                      type="text"
                      required
                      value={refWork}
                      onChange={(e) => setRefWork(e.target.value)}
                      placeholder="Drafting / Registry Work"
                      className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={refCredit}
                        onChange={(e) => setRefCredit(e.target.value)}
                        placeholder="₹500"
                        className="w-24 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 text-xs font-mono"
                      />
                      <button
                        type="submit"
                        className="flex-1 rounded-xl bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 text-xs font-semibold cursor-pointer"
                      >
                        Log Referral
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2">
                    {referrals.map((r) => (
                      <div
                        key={r._id}
                        className="flex flex-wrap items-center justify-between gap-2 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">{r.partner}</span>
                          <span className="mx-1.5 text-slate-400">·</span>
                          <span>
                            {r.client} ({r.work})
                          </span>
                        </div>
                        <div className="font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                          {r.credit} · {r.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: Daily JSON Backup & Restore */}
              {activeTab === 'backup' && (
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-4">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-xs">
                      <DatabaseBackup className="w-4 h-4" />
                      <span>Daily Full Export</span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                      Download Complete JSON Snapshot
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Exports all collections: portfolio projects, applied service inquiries, actual client uploaded PDFs (base64), employee roster, EOD financial ledger, challans, referrals, and queue state into one portable `.json` archive.
                    </p>
                    <button
                      type="button"
                      onClick={handleDownloadJsonBackup}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 text-white text-xs font-semibold cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Daily JSON Backup</span>
                    </button>
                  </div>

                  <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-4">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-xs">
                      <Upload className="w-4 h-4" />
                      <span>Instant Disaster Recovery</span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                      Restore Database from JSON Backup
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Select a previously exported `pragya-kendra-backup-YYYY-MM-DD.json` file to validate and restore all projects, applied tickets, client PDFs, ledgers, and staff records directly into MongoDB.
                    </p>
                    <label
                      htmlFor="restoreBackupInput"
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{restoring ? 'Restoring JSON...' : 'Select Backup JSON to Restore'}</span>
                    </label>
                    <input
                      id="restoreBackupInput"
                      type="file"
                      accept=".json,application/json"
                      disabled={restoring}
                      onChange={handleRestoreJsonFile}
                      className="hidden"
                    />
                  </div>

                  <div className="md:col-span-2 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 text-xs">
                      <p className="font-semibold text-amber-700 dark:text-amber-400">
                        Cloudflare Pages + MongoDB Atlas Sync
                      </p>
                      <h3 className="font-display text-base font-bold text-slate-950 dark:text-white">
                        Publish Website Snapshot & 115+ Services Catalog to MongoDB
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400">
                        Syncs `site_metadata` (UPI, GPS, contacts) and `services_catalog` into `pragya_kendra_ranchi`. Deploy `dist/` to Cloudflare Pages with `API_ORIGIN` pointing to your Express server via `/functions/api/[[path]].ts`.
                      </p>
                      {sitePublishInfo && (
                        <p className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400">
                          DB: {sitePublishInfo.database || 'mongodb'} · Services: {sitePublishInfo.servicesCount ?? 116} · Projects: {sitePublishInfo.projectsCount ?? 6}
                          {sitePublishInfo.publishedAt
                            ? ` · Published: ${new Date(sitePublishInfo.publishedAt).toLocaleString()}`
                            : ''}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      disabled={publishingSite}
                      onClick={handlePublishSiteToMongo}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:text-slate-950 text-white text-xs font-semibold cursor-pointer shrink-0"
                    >
                      <RefreshCw className={`w-4 h-4 ${publishingSite ? 'animate-spin' : ''}`} />
                      <span>{publishingSite ? 'Publishing...' : 'Publish Website to MongoDB'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Staff Authentication Modal */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onCloseAuthModal}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600" />
                <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                  Staff Operations Authentication
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseAuthModal}
                aria-label="Close staff login"
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Staff Desk PIN or Admin Password *
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={credentialInput}
                  onChange={(e) => setCredentialInput(e.target.value)}
                  placeholder="Enter Staff PIN (demo: 9999)"
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 text-sm font-mono"
                />
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Server-verified HMAC session cookie. Demo credentials: PIN <code className="font-mono">9999</code> or Password <code className="font-mono">staff123</code> (configurable via environment secrets).
              </p>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onCloseAuthModal}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loggingIn}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 cursor-pointer"
                >
                  {loggingIn ? 'Verifying...' : 'Unlock Workspace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client Uploaded PDF / Image Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800">
              <span className="font-mono text-xs sm:text-sm font-bold truncate">{previewDoc.name}</span>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  download={previewDoc.name}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 text-xs font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={closePreview}
                  aria-label="Close document preview"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-100 dark:bg-slate-950 p-2 overflow-auto flex items-center justify-center">
              {previewDoc.mimeType.startsWith('image/') ? (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.name}
                  className="max-w-full max-h-full object-contain rounded-lg"
                />
              ) : (
                <iframe
                  title={previewDoc.name}
                  src={previewDoc.url}
                  className="w-full h-full rounded-lg border-0 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Counter UPI Payment QR Modal */}
      {upiModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setUpiModal(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  Official UPI Payment QR
                </p>
                <h4 className="font-display text-sm font-bold text-slate-950 dark:text-white truncate max-w-[240px]">
                  {upiModal.title}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setUpiModal(null)}
                aria-label="Close UPI QR modal"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex justify-center py-1">
              <QRCodeBox
                value={buildUpiUri(upiModal.amount, upiModal.note)}
                size={184}
                label="Pragya Kendra Ranchi"
                sublabel={`${MERCHANT_UPI_ID} · ₹${(upiModal.amount || 0).toLocaleString('en-IN')}`}
                downloadName={`UPI-${upiModal.note.replace(/\s+/g, '-') || 'Pay'}.png`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-left text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  value={upiModal.amount}
                  onChange={(e) =>
                    setUpiModal((prev) =>
                      prev ? { ...prev, amount: Math.max(0, Number(e.target.value) || 0) } : null
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  UPI Reference
                </label>
                <input
                  type="text"
                  value={upiModal.note}
                  onChange={(e) =>
                    setUpiModal((prev) => (prev ? { ...prev, note: e.target.value } : null))
                  }
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-3 py-2 font-mono"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Client can scan with PhonePe, Google Pay, Paytm, or BHIM. Verify settlement SMS before marking Verified Payment.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
