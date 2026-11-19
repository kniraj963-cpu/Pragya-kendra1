export interface UploadedSlotPdf {
  slotIndex: number;
  docName: string;
  fileName: string;
  sizeKB: number;
  dataUrl: string;
  flagged: boolean;
  flagNote: string;
}

export interface PortalApplication {
  token: string;
  serviceId: number;
  serviceSlug: string;
  serviceTitle: string;
  bestService: string;
  fee: number;
  applicantName: string;
  phone: string;
  anchal: string;
  utr: string;
  utrVerified: boolean;
  status: 'Pending' | 'In Progress' | 'Ready' | 'Completed';
  createdAt: string;
  pdfs: UploadedSlotPdf[];
}

export interface CitizenSession {
  name: string;
  phone: string;
}

export const PORTAL_UPI_CONFIG = {
  upiId: 'pragyakendra.ranchi@upi',
  payeeName: 'PRAGYA KENDRA RANCHI',
};

const STORAGE_KEYS = {
  APPS: 'pkr_2026_applications_v2',
  CITIZEN: 'pkr_2026_citizen_session_v2',
  STAFF_PIN: 'pkr_2026_staff_pin_v2',
  D1_URL: 'pkr_2026_d1_url_v2',
} as const;

const SEED_APPLICATIONS: PortalApplication[] = [
  {
    token: 'PKR-2026-1001',
    serviceId: 1,
    serviceSlug: 'land-mutation',
    serviceTitle: 'Jharbhoomi Land Mutation (दाखिल-खारिज)',
    bestService: 'Complete Mutation + Lagaan Check + Objection Follow-up Pack',
    fee: 450,
    applicantName: 'Anil Kumar Sao',
    phone: '9835011223',
    anchal: 'Town Anchal, Ranchi',
    utr: '632419084512',
    utrVerified: true,
    status: 'In Progress',
    createdAt: '2026-11-18 11:20 AM',
    pdfs: [
      {
        slotIndex: 0,
        docName: 'Registered Sale / Gift Deed Copy (.PDF)',
        fileName: 'sale_deed_ranchi.pdf',
        sizeKB: 412,
        dataUrl: '',
        flagged: false,
        flagNote: '',
      },
      {
        slotIndex: 1,
        docName: 'Updated Online Lagaan / Malgujari Receipt (.PDF)',
        fileName: 'lagaan_receipt.pdf',
        sizeKB: 185,
        dataUrl: '',
        flagged: true,
        flagNote: 'Please upload latest FY receipt clearly.',
      },
    ],
  },
];

export function getPortalApplications(): PortalApplication[] {
  if (typeof window === 'undefined') return SEED_APPLICATIONS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APPS);
    if (raw) {
      const parsed = JSON.parse(raw) as PortalApplication[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Fallback to seed below
  }
  try {
    localStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(SEED_APPLICATIONS));
  } catch {
    // Storage full or disabled
  }
  return SEED_APPLICATIONS;
}

export function savePortalApplications(apps: PortalApplication[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.APPS, JSON.stringify(apps));
  } catch {
    // Ignore storage quota errors safely
  }
}

export async function syncApplicationsToD1(
  apps: PortalApplication[],
  customEndpoint?: string
): Promise<'synced' | 'local-only' | 'error'> {
  if (typeof window === 'undefined') return 'local-only';
  const endpoint = (customEndpoint ?? localStorage.getItem(STORAGE_KEYS.D1_URL) ?? '').trim();
  if (!endpoint) return 'local-only';

  try {
    const lightweight = apps.map((a) => ({
      ...a,
      pdfs: (a.pdfs || []).map((p) => ({
        slotIndex: p.slotIndex,
        docName: p.docName,
        fileName: p.fileName,
        sizeKB: p.sizeKB,
        flagged: Boolean(p.flagged),
        flagNote: p.flagNote || '',
      })),
    }));
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applications: lightweight }),
    });
    return res.ok ? 'synced' : 'error';
  } catch {
    return 'error';
  }
}

export function getCitizenSession(): CitizenSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CITIZEN);
    return raw ? (JSON.parse(raw) as CitizenSession) : null;
  } catch {
    return null;
  }
}

export function saveCitizenSession(session: CitizenSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.CITIZEN, JSON.stringify(session));
}

export function clearCitizenSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.CITIZEN);
}

export function getPortalStaffPin(): string {
  if (typeof window === 'undefined') return '1234';
  return localStorage.getItem(STORAGE_KEYS.STAFF_PIN) || '1234';
}

export function savePortalStaffPin(pin: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.STAFF_PIN, pin);
}

export function getD1Endpoint(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(STORAGE_KEYS.D1_URL) || '';
}

export function saveD1Endpoint(url: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.D1_URL, url.trim());
}

export async function readAndValidateStrictPdf(
  file: File,
  slotIndex: number,
  docName: string
): Promise<{ pdf?: UploadedSlotPdf; error?: string }> {
  const isPdfName = file.name.toLowerCase().endsWith('.pdf');
  const isPdfMime = file.type === 'application/pdf' || file.type === '';
  if (!isPdfName || !isPdfMime) {
    return { error: 'Only .PDF files are allowed for each checklist item.' };
  }
  if (file.size === 0 || file.size > 10 * 1024 * 1024) {
    return { error: 'PDF must be non-empty and under 10 MB.' };
  }

  try {
    const buf = await file.arrayBuffer();
    const bytes = new Uint8Array(buf);
    const isPdfSig =
      bytes.length >= 5 &&
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46 &&
      bytes[4] === 0x2d; // %PDF-

    if (!isPdfSig) {
      return { error: 'Invalid or corrupted PDF header (%PDF- missing).' };
    }

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Failed to read PDF file.'));
      reader.readAsDataURL(file);
    });

    return {
      pdf: {
        slotIndex,
        docName,
        fileName: file.name,
        sizeKB: Math.max(1, Math.round(file.size / 1024)),
        dataUrl,
        flagged: false,
        flagNote: '',
      },
    };
  } catch {
    return { error: 'Unable to read selected PDF file.' };
  }
}
