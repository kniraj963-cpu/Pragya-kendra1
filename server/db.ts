import { MongoClient, ObjectId, type Db } from 'mongodb';
import fs from 'fs';
import path from 'path';
import type {
  AttachedDocMeta,
  ChallanItem,
  ContactInquiry,
  EmployeeRecord,
  LedgerEntry,
  PartnerReferral,
  ProjectMetadata,
  QueueState,
} from '../src/data/catalog.ts';
import {
  CATEGORIES,
  DOC_DICT,
  REVIEWS_DATA,
  SERVICES_CATALOG,
  STATUS_STAGES,
} from '../src/data/catalog.ts';

export interface PublishedSiteSnapshot {
  slug: string;
  name: string;
  tagline: string;
  address: string;
  coordinates: { lat: number; lng: number };
  phones: string[];
  email: string;
  upiId: string;
  hours: string;
  aadhaarExcluded: boolean;
  hosting: {
    frontend: string;
    pagesProject: string;
    cloudflareAccountId: string;
    apiProxy: string;
    database: string;
    dbName: string;
  };
  totalServices: number;
  categoriesCount: number;
  reviewsCount: number;
  reviews: typeof REVIEWS_DATA;
  publishedAt: string;
  publishedBy: string;
}

export interface StoredAttachment {
  _id: string;
  ticketId: string;
  requirementKey: string;
  requirementLabel: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: string;
  dataBase64: string;
  uploadedAt: string;
}

export interface FullBackupPayload {
  exportedAt: string;
  version: string;
  projects: ProjectMetadata[];
  inquiries: ContactInquiry[];
  attachments: StoredAttachment[];
  employees: EmployeeRecord[];
  ledger: LedgerEntry[];
  challans: ChallanItem[];
  referrals: PartnerReferral[];
  queue: QueueState;
}

interface FallbackStore {
  projects: ProjectMetadata[];
  inquiries: ContactInquiry[];
  attachments: StoredAttachment[];
  employees: EmployeeRecord[];
  ledger: LedgerEntry[];
  challans: ChallanItem[];
  referrals: PartnerReferral[];
  queue: QueueState;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const FALLBACK_FILE = path.join(DATA_DIR, 'mongo-store.json');

// Minimal valid 1-page PDF base64 sample for seeded demo ticket download testing
const SAMPLE_PDF_BASE64 = Buffer.from(
  `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 96 >> stream
BT /F1 14 Tf 50 760 Td (Pragya Kendra Ranchi - Verified Client Document Sample) Tj ET
endstream endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000241 00000 n 
0000000387 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
455
%%EOF`,
  'utf-8'
).toString('base64');

const SEED_PROJECTS: Omit<ProjectMetadata, '_id'>[] = [
  {
    slug: 'kanke-anchal-land-mutation',
    title: 'Kanke Anchal Multi-Plot Dakhil-Kharij & Register-II Update',
    titleHi: 'कांके अंचल बहु-प्लॉट दाखिल-खारिज एवं रजिस्टर-II अद्यतन',
    category: 'Land & Anchal',
    clientSector: 'Residential Landowners · Kanke Mauza',
    location: 'Kanke Circle, Ranchi',
    turnaround: '18 Days End-to-End',
    year: '2026',
    summary:
      'Compiled chain deeds, verified seller Lagan Rasid continuity, drafted mutation affidavits, and coordinated Halka Karamchari inspection for 6 adjacent residential plots.',
    outcomeMetric: '100% Register-II Approval',
    deliverables: [
      'Chain Deed Scrutiny & MVR Audit',
      'Jharbhoomi Online Mutation Filing',
      'Up-to-Date Online Lagan Rasid Issuance',
      'Digital Correction Slip Archive',
    ],
    tags: ['Dakhil-Kharij', 'Jharbhoomi', 'Register-II'],
    featured: true,
    visualTheme: 'navy',
    createdAt: '2026-08-14T10:00:00.000Z',
    updatedAt: '2026-09-01T11:30:00.000Z',
  },
  {
    slug: 'argora-sale-deed-registry',
    title: 'Argora Commercial Sale Deed Drafting & e-Stamp Execution',
    titleHi: 'अरगोड़ा कमर्शियल सेल डीड ड्राफ्टिंग एवं ई-स्टाम्प निष्पादन',
    category: 'Registry & Legal',
    clientSector: 'Real Estate & Advocates · Argora',
    location: 'Ranchi District Registry Office',
    turnaround: '48 Hours',
    year: '2026',
    summary:
      'Prepared bilingual sale deed schedule, calculated Jharkhand MVR stamp duty exemptions, generated e-Stamp challans, and completed Non-Encumbrance search.',
    outcomeMetric: 'Zero Query Registry Clearance',
    deliverables: [
      'Bilingual Sale Deed Schedule',
      'MVR Valuation & Stamp Duty Sheet',
      '13-Year EC & Registry Search',
    ],
    tags: ['Sale Deed', 'e-Stamp', 'EC Search'],
    featured: false,
    visualTheme: 'amber',
    createdAt: '2026-09-10T09:15:00.000Z',
    updatedAt: '2026-09-12T16:20:00.000Z',
  },
  {
    slug: 'ekalyan-jharsewa-batch-drive',
    title: 'e-Kalyan Scholarship & JharSewa Certificate Verification Batch',
    titleHi: 'ई-कल्याण छात्रवृत्ति एवं झारसेवा प्रमाण पत्र सत्यापन बैच',
    category: 'JharSewa Certificates',
    clientSector: 'College Students · Ranchi University',
    location: 'Sadar & Bariatu Circle',
    turnaround: '7–10 Working Days',
    year: '2026',
    summary:
      'Standardized Income, Caste, and Local Residential certificate bundles with verified Khatiyan enclosures for 140+ post-matric scholarship applicants.',
    outcomeMetric: '140+ Validated Scholarship Filings',
    deliverables: [
      'CO-Level Income, Caste & Residential Certs',
      'e-Kalyan Portal Document Stitching',
      'Bonafide & Bank NPCI Status Check',
    ],
    tags: ['JharSewa', 'e-Kalyan', 'Certificates'],
    featured: false,
    visualTheme: 'emerald',
    createdAt: '2026-10-02T08:00:00.000Z',
    updatedAt: '2026-10-12T12:00:00.000Z',
  },
  {
    slug: 'ranchi-msme-gst-compliance',
    title: 'MSME Udyam, Ranchi Municipal Trade Licence & GST Setup',
    titleHi: 'एमएसएमई उद्यम, नगर निगम ट्रेड लाइसेंस एवं जीएसटी सेटअप',
    category: 'Business & GST',
    clientSector: 'Retail & Pharma Distributors · Radium Road',
    location: 'Ranchi Municipal Corporation',
    turnaround: '3–5 Days',
    year: '2026',
    summary:
      'Delivered turnkey compliance setup combining Udyam registration, Ranchi Municipal Trade Licence, FSSAI hygiene filing, and GST portal activation.',
    outcomeMetric: '35+ Local Businesses Onboarded',
    deliverables: [
      'GSTIN & HSN Mapping',
      'Ranchi Municipal Trade Licence',
      'Udyam Certificate & Bank Loan CMA Report',
    ],
    tags: ['GST', 'Udyam', 'Trade Licence'],
    featured: false,
    visualTheme: 'slate',
    createdAt: '2026-10-18T11:20:00.000Z',
    updatedAt: '2026-10-22T15:40:00.000Z',
  },
  {
    slug: 'dto-commercial-noc-transfer',
    title: 'Inter-State DTO RC Ownership Transfer & Hypothecation Removal',
    titleHi: 'अंतर-राज्यीय डीटीओ आरसी ट्रांसफर एवं हाइपोथिकेशन समाप्ति',
    category: 'DTO & Transport',
    clientSector: 'Fleet & Personal Vehicle Owners',
    location: 'Ranchi DTO Office, Kutchery',
    turnaround: '5 Working Days',
    year: '2026',
    summary:
      'Processed Forms 29, 30, and 35 with bank NOCs, Parivahan tax clearance, and smart-card RC dispatch tracking.',
    outcomeMetric: '99.1% First-Pass DTO Approval',
    deliverables: [
      'Form 29/30 & Form 35 Filing',
      'Inter-State NOC & Road Tax Audit',
      'HSRP & Insurance Compliance Check',
    ],
    tags: ['DTO Ranchi', 'RC Transfer', 'NOC'],
    featured: false,
    visualTheme: 'navy',
    createdAt: '2026-10-28T10:10:00.000Z',
    updatedAt: '2026-11-01T14:00:00.000Z',
  },
  {
    slug: 'pragya-digital-seo-portals',
    title: 'Local Service Portfolio & WhatsApp Lead Capture Websites',
    titleHi: 'स्थानीय सेवा पोर्टफोलियो एवं व्हाट्सएप लीड वेबसाइट',
    category: 'Digital & Web',
    clientSector: 'Advocates, Clinics & Consultants · Ranchi',
    location: 'Ranchi District',
    turnaround: '5 Days',
    year: '2026',
    summary:
      'Designed responsive HTML/Tailwind service portfolios with structured Schema.org local SEO, MongoDB inquiry persistence, and instant WhatsApp routing.',
    outcomeMetric: '3.4x Local Map & Inquiry Lift',
    deliverables: [
      'Responsive UI + Tailwind CSS Architecture',
      'MongoDB Project & Inquiry Persistence',
      'Google Business Profile & Schema SEO',
    ],
    tags: ['Portfolio Web', 'MongoDB', 'Local SEO'],
    featured: false,
    visualTheme: 'amber',
    createdAt: '2026-11-03T09:00:00.000Z',
    updatedAt: '2026-11-10T17:15:00.000Z',
  },
];

const SEED_EMPLOYEES: Omit<EmployeeRecord, '_id'>[] = [
  {
    empId: 'EMP-01',
    name: 'Suresh Kr. Verma',
    role: 'Land Mutation Specialist',
    phone: '9835100112',
    shift: '09:30 AM – 06:30 PM',
    status: 'Present',
    completedToday: 7,
    accuracy: '99.2%',
  },
  {
    empId: 'EMP-02',
    name: 'Deepak Kr. Choudhary',
    role: 'Registry & Deed Draftsman',
    phone: '9123400221',
    shift: '10:00 AM – 07:00 PM',
    status: 'Present',
    completedToday: 5,
    accuracy: '98.8%',
  },
  {
    empId: 'EMP-03',
    name: 'Priya Kumari',
    role: 'JharSewa & Certificate Operator',
    phone: '9934100334',
    shift: '09:30 AM – 06:30 PM',
    status: 'Present',
    completedToday: 11,
    accuracy: '98.5%',
  },
  {
    empId: 'EMP-04',
    name: 'Rakesh Mahato',
    role: 'DTO & Commercial Licensing Desk',
    phone: '9431100445',
    shift: '11:00 AM – 08:30 PM',
    status: 'On Break',
    completedToday: 4,
    accuracy: '97.9%',
  },
];

const SEED_LEDGER: Omit<LedgerEntry, '_id'>[] = [
  { desc: 'Sale Deed Drafting — PK-RNC-1003', mode: 'UPI', amount: 2500, time: '10:15 AM', createdAt: '2026-11-18T04:45:00.000Z' },
  { desc: 'Jharbhoomi Online Lagan Rasid', mode: 'Cash', amount: 450, time: '10:40 AM', createdAt: '2026-11-18T05:10:00.000Z' },
  { desc: 'JharSewa Portal & Stamp Challan', mode: 'Challan', amount: 1200, time: '11:05 AM', createdAt: '2026-11-18T05:35:00.000Z' },
];

const SEED_CHALLANS: Omit<ChallanItem, '_id'>[] = [
  { refId: 'PK-RNC-1001', category: 'Jharbhoomi Lagan / Mutation Fee', amount: 650, createdAt: '2026-11-15T11:00:00.000Z' },
  { refId: 'PK-RNC-1001', category: 'Drafting & Professional Fee', amount: 850, createdAt: '2026-11-15T11:05:00.000Z' },
  { refId: 'PK-RNC-1003', category: 'e-Stamp / Stamp Duty', amount: 18500, createdAt: '2026-11-16T10:15:00.000Z' },
];

const SEED_REFERRALS: Omit<PartnerReferral, '_id'>[] = [
  { partner: 'Adv. Akash Tirkey', client: 'Mahendra Oraon', work: 'Sale Deed + Mutation (Argora)', status: 'Active', credit: '₹750', createdAt: '2026-11-16T09:00:00.000Z' },
  { partner: 'Ranchi Property Associates', client: 'Deepak Verma', work: 'LPC & Khatiyan Verification', status: 'Completed', credit: '₹500', createdAt: '2026-11-12T14:00:00.000Z' },
  { partner: 'Adv. Priya Kumari', client: 'Nirmala Devi', work: 'Legal Heir Affidavit & Certs', status: 'Active', credit: '₹400', createdAt: '2026-11-17T12:00:00.000Z' },
];

function createSeedAttachmentsAndInquiries(): {
  attachments: StoredAttachment[];
  inquiries: Omit<ContactInquiry, '_id'>[];
} {
  const att1Id = new ObjectId().toHexString();
  const att2Id = new ObjectId().toHexString();
  const att3Id = new ObjectId().toHexString();

  const attachments: StoredAttachment[] = [
    {
      _id: att1Id,
      ticketId: 'PK-RNC-1001',
      requirementKey: 'sl',
      requirementLabel: 'Registered sale deed',
      fileName: 'Sale_Deed_412.pdf',
      mimeType: 'application/pdf',
      sizeBytes: Buffer.from(SAMPLE_PDF_BASE64, 'base64').length,
      category: 'Registered sale deed',
      dataBase64: SAMPLE_PDF_BASE64,
      uploadedAt: '2026-11-15T10:30:00.000Z',
    },
    {
      _id: att2Id,
      ticketId: 'PK-RNC-1002',
      requirementKey: 'bp',
      requirementLabel: 'Bank passbook',
      fileName: 'Bank_Passbook_Scan.pdf',
      mimeType: 'application/pdf',
      sizeBytes: Buffer.from(SAMPLE_PDF_BASE64, 'base64').length,
      category: 'Bank passbook',
      dataBase64: SAMPLE_PDF_BASE64,
      uploadedAt: '2026-11-14T11:15:00.000Z',
    },
    {
      _id: att3Id,
      ticketId: 'PK-RNC-1003',
      requirementKey: 'sl',
      requirementLabel: 'Registered sale deed',
      fileName: 'Chain_Deed_Argora.pdf',
      mimeType: 'application/pdf',
      sizeBytes: Buffer.from(SAMPLE_PDF_BASE64, 'base64').length,
      category: 'Registered sale deed',
      dataBase64: SAMPLE_PDF_BASE64,
      uploadedAt: '2026-11-16T09:45:00.000Z',
    },
  ];

  const inquiries: Omit<ContactInquiry, '_id'>[] = [
    {
      ticketId: 'PK-RNC-1001',
      name: 'Rajesh Kumar Mahto',
      phone: '9835122410',
      email: 'rajesh.mahto@example.in',
      serviceSlug: 'land-mutation',
      serviceName: 'Land mutation (Dakhil-Kharij)',
      projectRef: 'kanke-anchal-land-mutation',
      locationDetails: 'Plot 412, Khata 45, Kanke Anchal',
      message: 'Need Dakhil-Kharij verification for recently registered sale deed.',
      statusStage: 2,
      stageHistory: [
        { stage: 0, label: 'Accepted', at: '2026-11-15T10:30:00.000Z' },
        { stage: 1, label: 'Processing', at: '2026-11-15T12:15:00.000Z' },
        { stage: 2, label: 'Verified Document', at: '2026-11-16T15:40:00.000Z' },
      ],
      closedAt: null,
      operatorNote: 'Sale deed and Lagan Rasid verified; awaiting portal fee confirmation.',
      assignedTo: 'EMP-01 (Suresh Kr. Verma)',
      attachedDocs: [
        {
          attachmentId: att1Id,
          requirementKey: 'sl',
          requirementLabel: 'Registered sale deed',
          name: 'Sale_Deed_412.pdf',
          mimeType: 'application/pdf',
          sizeBytes: attachments[0].sizeBytes,
          size: `${(attachments[0].sizeBytes / 1024).toFixed(1)} KB`,
          category: 'Registered sale deed',
        },
      ],
      createdAt: '2026-11-15T10:30:00.000Z',
      updatedAt: '2026-11-16T15:40:00.000Z',
    },
    {
      ticketId: 'PK-RNC-1002',
      name: 'Suchita Kumari',
      phone: '9123456780',
      email: 'suchita.ranchi@example.in',
      serviceSlug: 'maiya-samman',
      serviceName: 'Mukhyamantri Maiya Samman Yojana application',
      projectRef: 'ekalyan-jharsewa-batch-drive',
      locationDetails: 'Sadar Anchal · Ward 18',
      message: 'Submitted passbook and residential proof for acknowledgment receipt.',
      statusStage: 4,
      stageHistory: [
        { stage: 0, label: 'Accepted', at: '2026-11-14T11:15:00.000Z' },
        { stage: 1, label: 'Processing', at: '2026-11-14T13:00:00.000Z' },
        { stage: 2, label: 'Verified Document', at: '2026-11-14T16:30:00.000Z' },
        { stage: 3, label: 'Verified Payment', at: '2026-11-15T10:00:00.000Z' },
        { stage: 4, label: 'Closed', at: '2026-11-16T17:15:00.000Z' },
      ],
      closedAt: '2026-11-16T17:15:00.000Z',
      operatorNote: 'Application closed and acknowledgement handed over at Kutchery counter.',
      assignedTo: 'EMP-03 (Priya Kumari)',
      attachedDocs: [
        {
          attachmentId: att2Id,
          requirementKey: 'bp',
          requirementLabel: 'Bank passbook',
          name: 'Bank_Passbook_Scan.pdf',
          mimeType: 'application/pdf',
          sizeBytes: attachments[1].sizeBytes,
          size: `${(attachments[1].sizeBytes / 1024).toFixed(1)} KB`,
          category: 'Bank passbook',
        },
      ],
      createdAt: '2026-11-14T11:15:00.000Z',
      updatedAt: '2026-11-16T17:15:00.000Z',
    },
    {
      ticketId: 'PK-RNC-1003',
      name: 'Mahendra Oraon',
      phone: '9934112233',
      email: 'mahendra.oraon@example.in',
      serviceSlug: 'sale-deed-drafting',
      serviceName: 'Sale deed drafting & registry support',
      projectRef: 'argora-sale-deed-registry',
      locationDetails: 'Argora Mauza · 4.5 Dismil',
      message: 'Urgent schedule drafting and MVR stamp duty calculation.',
      statusStage: 1,
      stageHistory: [
        { stage: 0, label: 'Accepted', at: '2026-11-16T09:45:00.000Z' },
        { stage: 1, label: 'Processing', at: '2026-11-17T09:50:00.000Z' },
      ],
      closedAt: null,
      operatorNote: 'Draft schedule in progress at Registry Desk.',
      assignedTo: 'EMP-02 (Deepak Kr. Choudhary)',
      attachedDocs: [
        {
          attachmentId: att3Id,
          requirementKey: 'sl',
          requirementLabel: 'Registered sale deed',
          name: 'Chain_Deed_Argora.pdf',
          mimeType: 'application/pdf',
          sizeBytes: attachments[2].sizeBytes,
          size: `${(attachments[2].sizeBytes / 1024).toFixed(1)} KB`,
          category: 'Registered sale deed',
        },
      ],
      createdAt: '2026-11-16T09:45:00.000Z',
      updatedAt: '2026-11-17T09:50:00.000Z',
    },
  ];

  return { attachments, inquiries };
}

let mongoClient: MongoClient | null = null;
let mongoDb: Db | null = null;
let engineMode: 'mongodb' | 'local-store' = 'local-store';
let engineNotice =
  'Server-side Mongo-compatible store active (configure MONGODB_URI for live MongoDB Atlas)';

function createInitialFallback(): FallbackStore {
  const { attachments, inquiries } = createSeedAttachmentsAndInquiries();
  return {
    projects: SEED_PROJECTS.map((p) => ({ ...p, _id: new ObjectId().toHexString() })),
    inquiries: inquiries.map((i) => ({ ...i, _id: new ObjectId().toHexString() })),
    attachments,
    employees: SEED_EMPLOYEES.map((e) => ({ ...e, _id: new ObjectId().toHexString() })),
    ledger: SEED_LEDGER.map((l) => ({ ...l, _id: new ObjectId().toHexString() })),
    challans: SEED_CHALLANS.map((c) => ({ ...c, _id: new ObjectId().toHexString() })),
    referrals: SEED_REFERRALS.map((r) => ({ ...r, _id: new ObjectId().toHexString() })),
    queue: { nowServing: 104, nextToken: 108 },
  };
}

function readFallback(): FallbackStore {
  try {
    if (fs.existsSync(FALLBACK_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf-8')) as Partial<FallbackStore>;
      const initial = createInitialFallback();
      return {
        projects: Array.isArray(parsed.projects) && parsed.projects.length ? parsed.projects : initial.projects,
        inquiries: Array.isArray(parsed.inquiries) && parsed.inquiries.length ? parsed.inquiries : initial.inquiries,
        attachments: Array.isArray(parsed.attachments) ? parsed.attachments : initial.attachments,
        employees: Array.isArray(parsed.employees) && parsed.employees.length ? parsed.employees : initial.employees,
        ledger: Array.isArray(parsed.ledger) && parsed.ledger.length ? parsed.ledger : initial.ledger,
        challans: Array.isArray(parsed.challans) && parsed.challans.length ? parsed.challans : initial.challans,
        referrals: Array.isArray(parsed.referrals) && parsed.referrals.length ? parsed.referrals : initial.referrals,
        queue: parsed.queue || initial.queue,
      };
    }
  } catch {
    // Re-seed below
  }
  const initial = createInitialFallback();
  writeFallback(initial);
  return initial;
}

function writeFallback(data: FallbackStore): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

let retryTimer: ReturnType<typeof setTimeout> | null = null;

export async function initDatabase(silent = false): Promise<{ mode: 'mongodb' | 'local-store'; notice: string }> {
  const uri = (process.env.MONGODB_URI || '').trim();
  const dbName = (process.env.MONGODB_DB_NAME || 'pragya_kendra_ranchi').trim();

  if (uri && !uri.includes('<username>')) {
    let candidateClient: MongoClient | null = null;
    try {
      candidateClient = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
      await candidateClient.connect();
      mongoClient = candidateClient;
      mongoDb = mongoClient.db(dbName);

      await mongoDb.collection('projects').createIndex({ slug: 1 }, { unique: true });
      await mongoDb.collection('projects').createIndex({ category: 1, featured: -1 });
      await mongoDb.collection('inquiries').createIndex({ ticketId: 1 }, { unique: true });
      await mongoDb.collection('inquiries').createIndex({ createdAt: -1, statusStage: 1 });
      await mongoDb.collection('attachments').createIndex({ ticketId: 1 });

      if ((await mongoDb.collection('projects').countDocuments()) === 0) {
        await mongoDb.collection('projects').insertMany(SEED_PROJECTS);
      }
      if ((await mongoDb.collection('inquiries').countDocuments()) === 0) {
        const { attachments, inquiries } = createSeedAttachmentsAndInquiries();
        await mongoDb.collection('attachments').insertMany(
          attachments.map((a) => ({ ...a, _id: new ObjectId(a._id) }))
        );
        await mongoDb.collection('inquiries').insertMany(inquiries);
      }
      if ((await mongoDb.collection('employees').countDocuments()) === 0) {
        await mongoDb.collection('employees').insertMany(SEED_EMPLOYEES);
      }
      if ((await mongoDb.collection('ledger_entries').countDocuments()) === 0) {
        await mongoDb.collection('ledger_entries').insertMany(SEED_LEDGER);
      }
      if ((await mongoDb.collection('challan_bundles').countDocuments()) === 0) {
        await mongoDb.collection('challan_bundles').insertMany(SEED_CHALLANS);
      }
      if ((await mongoDb.collection('advocate_referrals').countDocuments()) === 0) {
        await mongoDb.collection('advocate_referrals').insertMany(SEED_REFERRALS);
      }
      if ((await mongoDb.collection('queue_state').countDocuments()) === 0) {
        await mongoDb.collection('queue_state').insertOne({ key: 'active', nowServing: 104, nextToken: 108 });
      }

      if (retryTimer) {
        clearTimeout(retryTimer);
        retryTimer = null;
      }
      engineMode = 'mongodb';
      engineNotice = `Connected to MongoDB (${dbName})`;
      await publishSiteMetadataToDb('auto-boot');
      console.log(`[DB] ${engineNotice}`);
      return { mode: engineMode, notice: engineNotice };
    } catch {
      if (candidateClient) {
        await candidateClient.close().catch(() => {});
      }
      mongoClient = null;
      mongoDb = null;
      engineMode = 'local-store';
      engineNotice = 'Server-side document store active (whitelist server IP in MongoDB Atlas Network Access to enable cloud sync)';
      readFallback();
      if (!silent) {
        console.log(`[DB] ${engineNotice}`);
      }
      if (!retryTimer) {
        retryTimer = setTimeout(() => {
          retryTimer = null;
          void initDatabase(true);
        }, 60_000);
      }
    }
  } else {
    readFallback();
    if (!silent) {
      console.log(`[DB] ${engineNotice}`);
    }
  }
  return { mode: engineMode, notice: engineNotice };
}

export function getDbStatus(): { mode: 'mongodb' | 'local-store'; notice: string } {
  return { mode: engineMode, notice: engineNotice };
}

function serialize<T extends { _id: string }>(doc: Record<string, unknown>): T {
  return { ...(doc as unknown as T), _id: String(doc._id) };
}

// Projects CRUD
export async function listProjects(filters: { category?: string; q?: string }): Promise<ProjectMetadata[]> {
  if (mongoDb) {
    const query: Record<string, unknown> = {};
    if (filters.category && filters.category !== 'All') query.category = filters.category;
    if (filters.q) {
      const regex = new RegExp(filters.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ title: regex }, { titleHi: regex }, { summary: regex }, { clientSector: regex }, { tags: regex }];
    }
    const docs = await mongoDb.collection('projects').find(query).sort({ featured: -1, createdAt: -1 }).toArray();
    return docs.map((d) => serialize<ProjectMetadata>(d as Record<string, unknown>));
  }
  const store = readFallback();
  const q = (filters.q || '').toLowerCase().trim();
  return store.projects
    .filter((p) => {
      const catOk = !filters.category || filters.category === 'All' || p.category === filters.category;
      const qOk =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.titleHi.includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      return catOk && qOk;
    })
    .sort((a, b) => Number(b.featured) - Number(a.featured) || b.createdAt.localeCompare(a.createdAt));
}

export async function createProject(
  input: Omit<ProjectMetadata, '_id' | 'slug' | 'createdAt' | 'updatedAt'> & { slug?: string }
): Promise<ProjectMetadata> {
  const now = new Date().toISOString();
  const baseSlug = (input.slug || input.title)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 48);
  const slug = `${baseSlug || 'project'}-${Math.floor(100 + Math.random() * 900)}`;

  const payload: Omit<ProjectMetadata, '_id'> = {
    slug,
    title: input.title,
    titleHi: input.titleHi || input.title,
    category: input.category,
    clientSector: input.clientSector || 'Ranchi Local Client',
    location: input.location || 'Kutchery Chowk, Ranchi',
    turnaround: input.turnaround || '5 Working Days',
    year: input.year || String(new Date().getFullYear()),
    summary: input.summary,
    outcomeMetric: input.outcomeMetric || 'Verified Delivery',
    deliverables: input.deliverables.length ? input.deliverables : ['Documentation Scrutiny', 'Portal Submission'],
    tags: input.tags.length ? input.tags : [input.category],
    featured: Boolean(input.featured),
    visualTheme: input.visualTheme || 'navy',
    createdAt: now,
    updatedAt: now,
  };

  if (mongoDb) {
    const res = await mongoDb.collection('projects').insertOne(payload);
    return { ...payload, _id: res.insertedId.toHexString() };
  }
  const store = readFallback();
  const created: ProjectMetadata = { ...payload, _id: new ObjectId().toHexString() };
  store.projects.unshift(created);
  writeFallback(store);
  return created;
}

export async function deleteProject(id: string): Promise<boolean> {
  if (mongoDb) {
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { slug: id };
    const res = await mongoDb.collection('projects').deleteOne(filter);
    return res.deletedCount > 0;
  }
  const store = readFallback();
  const before = store.projects.length;
  store.projects = store.projects.filter((p) => p._id !== id && p.slug !== id);
  if (store.projects.length === before) return false;
  writeFallback(store);
  return true;
}

// Inquiries & Real PDF Attachments
export async function listInquiries(filters: { statusStage?: number; q?: string }): Promise<ContactInquiry[]> {
  if (mongoDb) {
    const query: Record<string, unknown> = {};
    if (typeof filters.statusStage === 'number' && !Number.isNaN(filters.statusStage)) {
      query.statusStage = filters.statusStage;
    }
    if (filters.q) {
      const regex = new RegExp(filters.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      query.$or = [{ ticketId: regex }, { name: regex }, { phone: regex }, { serviceName: regex }];
    }
    const docs = await mongoDb.collection('inquiries').find(query).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => serialize<ContactInquiry>(d as Record<string, unknown>));
  }
  const store = readFallback();
  const q = (filters.q || '').toLowerCase().trim();
  return store.inquiries
    .filter((i) => {
      const stOk =
        typeof filters.statusStage !== 'number' || Number.isNaN(filters.statusStage) || i.statusStage === filters.statusStage;
      const qOk =
        !q ||
        i.ticketId.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        i.phone.includes(q) ||
        i.serviceName.toLowerCase().includes(q);
      return stOk && qOk;
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function findInquiryByTicket(ticketId: string): Promise<ContactInquiry | null> {
  const normalized = ticketId.trim().toUpperCase();
  if (!normalized) return null;
  if (mongoDb) {
    const doc = await mongoDb.collection('inquiries').findOne({ ticketId: normalized });
    return doc ? serialize<ContactInquiry>(doc as Record<string, unknown>) : null;
  }
  const store = readFallback();
  return store.inquiries.find((i) => i.ticketId.toUpperCase() === normalized) || null;
}

export async function checkRecentDuplicateInquiry(phone: string, serviceSlug: string): Promise<boolean> {
  const cutoff = Date.now() - 30_000;
  const all = await listInquiries({});
  return all.some(
    (i) => i.phone === phone && i.serviceSlug === serviceSlug && new Date(i.createdAt).getTime() > cutoff
  );
}

export async function createInquiryWithAttachments(input: {
  name: string;
  phone: string;
  email: string;
  serviceSlug: string;
  serviceName: string;
  projectRef?: string;
  locationDetails: string;
  message: string;
  attachedDocs: AttachedDocMeta[];
}): Promise<ContactInquiry> {
  const now = new Date().toISOString();
  const existing = await listInquiries({});
  let nextNum = 1001 + existing.length;
  const used = new Set(existing.map((i) => i.ticketId));
  while (used.has(`PK-RNC-${nextNum}`)) nextNum += 1;
  const ticketId = `PK-RNC-${nextNum}`;

  const docRefs: AttachedDocMeta[] = [];
  const storedPayloads: StoredAttachment[] = [];

  for (const doc of input.attachedDocs) {
    const attId = new ObjectId().toHexString();
    if (doc.dataBase64) {
      storedPayloads.push({
        _id: attId,
        ticketId,
        requirementKey: doc.requirementKey || 'general',
        requirementLabel: doc.requirementLabel || doc.category,
        fileName: doc.name,
        mimeType: doc.mimeType || 'application/pdf',
        sizeBytes: doc.sizeBytes || 0,
        category: doc.category,
        dataBase64: doc.dataBase64,
        uploadedAt: now,
      });
    }
    docRefs.push({
      attachmentId: doc.dataBase64 ? attId : undefined,
      requirementKey: doc.requirementKey || 'general',
      requirementLabel: doc.requirementLabel || doc.category,
      name: doc.name,
      mimeType: doc.mimeType || 'application/pdf',
      sizeBytes: doc.sizeBytes || 0,
      size: doc.size,
      category: doc.category,
    });
  }

  let assignedTo = 'EMP-03 (Priya Kumari)';
  if (input.serviceSlug.includes('land') || input.serviceSlug.includes('lpc') || input.serviceSlug.includes('khatiyan')) {
    assignedTo = 'EMP-01 (Suresh Kr. Verma)';
  } else if (input.serviceSlug.includes('deed') || input.serviceSlug.includes('agreement') || input.serviceSlug.includes('affidavit')) {
    assignedTo = 'EMP-02 (Deepak Kr. Choudhary)';
  } else if (input.serviceSlug.includes('rc') || input.serviceSlug.includes('vehicle') || input.serviceSlug.includes('licence') || input.serviceSlug.includes('gst')) {
    assignedTo = 'EMP-04 (Rakesh Mahato)';
  }

  const inquiryPayload: Omit<ContactInquiry, '_id'> = {
    ticketId,
    name: input.name,
    phone: input.phone,
    email: input.email || '',
    serviceSlug: input.serviceSlug,
    serviceName: input.serviceName,
    projectRef: input.projectRef || '',
    locationDetails: input.locationDetails || 'Kutchery Chowk Desk',
    message: input.message || '',
    statusStage: 0,
    stageHistory: [{ stage: 0, label: STATUS_STAGES.en[0], at: now }],
    closedAt: null,
    operatorNote: `Accepted with ${docRefs.length} uploaded document(s).`,
    assignedTo,
    attachedDocs: docRefs,
    createdAt: now,
    updatedAt: now,
  };

  if (mongoDb) {
    if (storedPayloads.length) {
      await mongoDb.collection('attachments').insertMany(
        storedPayloads.map((a) => ({ ...a, _id: new ObjectId(a._id) }))
      );
    }
    const res = await mongoDb.collection('inquiries').insertOne(inquiryPayload);
    return { ...inquiryPayload, _id: res.insertedId.toHexString() };
  }

  const store = readFallback();
  if (storedPayloads.length) {
    store.attachments.push(...storedPayloads);
  }
  const created: ContactInquiry = { ...inquiryPayload, _id: new ObjectId().toHexString() };
  store.inquiries.unshift(created);
  writeFallback(store);
  return created;
}

export async function updateInquiry(
  id: string,
  updates: { statusStage?: number; operatorNote?: string; assignedTo?: string }
): Promise<ContactInquiry | null> {
  const now = new Date().toISOString();
  if (mongoDb) {
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { ticketId: id.toUpperCase() };
    const existing = await mongoDb.collection('inquiries').findOne(filter);
    if (!existing) return null;

    const current = serialize<ContactInquiry>(existing as Record<string, unknown>);
    const nextStage = typeof updates.statusStage === 'number' ? updates.statusStage : current.statusStage;
    const history = Array.isArray(current.stageHistory) ? [...current.stageHistory] : [];
    if (typeof updates.statusStage === 'number' && updates.statusStage !== current.statusStage) {
      history.push({ stage: nextStage, label: STATUS_STAGES.en[nextStage] || 'Updated', at: now });
    }
    const closedAt = nextStage === 4 ? current.closedAt || now : null;

    const res = await mongoDb.collection('inquiries').findOneAndUpdate(
      filter,
      {
        $set: {
          statusStage: nextStage,
          stageHistory: history,
          closedAt,
          operatorNote: typeof updates.operatorNote === 'string' ? updates.operatorNote : current.operatorNote,
          assignedTo: typeof updates.assignedTo === 'string' ? updates.assignedTo : current.assignedTo,
          updatedAt: now,
        },
      },
      { returnDocument: 'after' }
    );
    return res ? serialize<ContactInquiry>(res as Record<string, unknown>) : null;
  }

  const store = readFallback();
  const idx = store.inquiries.findIndex((i) => i._id === id || i.ticketId === id.toUpperCase());
  if (idx === -1) return null;
  const current = store.inquiries[idx];
  const nextStage = typeof updates.statusStage === 'number' ? updates.statusStage : current.statusStage;
  const history = Array.isArray(current.stageHistory) ? [...current.stageHistory] : [];
  if (typeof updates.statusStage === 'number' && updates.statusStage !== current.statusStage) {
    history.push({ stage: nextStage, label: STATUS_STAGES.en[nextStage] || 'Updated', at: now });
  }
  const closedAt = nextStage === 4 ? current.closedAt || now : null;
  store.inquiries[idx] = {
    ...current,
    statusStage: nextStage,
    stageHistory: history,
    closedAt,
    operatorNote: typeof updates.operatorNote === 'string' ? updates.operatorNote : current.operatorNote,
    assignedTo: typeof updates.assignedTo === 'string' ? updates.assignedTo : current.assignedTo,
    updatedAt: now,
  };
  writeFallback(store);
  return store.inquiries[idx];
}

export async function deleteInquiry(id: string): Promise<boolean> {
  if (mongoDb) {
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { ticketId: id.toUpperCase() };
    const doc = await mongoDb.collection('inquiries').findOne(filter);
    if (!doc) return false;
    await mongoDb.collection('attachments').deleteMany({ ticketId: String((doc as Record<string, unknown>).ticketId) });
    const res = await mongoDb.collection('inquiries').deleteOne(filter);
    return res.deletedCount > 0;
  }
  const store = readFallback();
  const target = store.inquiries.find((i) => i._id === id || i.ticketId === id.toUpperCase());
  if (!target) return false;
  store.inquiries = store.inquiries.filter((i) => i._id !== target._id);
  store.attachments = store.attachments.filter((a) => a.ticketId !== target.ticketId);
  writeFallback(store);
  return true;
}

export async function getAttachmentById(id: string): Promise<StoredAttachment | null> {
  if (mongoDb) {
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { _id: id };
    const doc = await mongoDb.collection('attachments').findOne(filter as Record<string, unknown>);
    return doc ? serialize<StoredAttachment>(doc as Record<string, unknown>) : null;
  }
  const store = readFallback();
  return store.attachments.find((a) => a._id === id) || null;
}

// Staff Operations: Employees, Ledger, Challans, Advocate Vault, Queue
export async function listEmployees(): Promise<EmployeeRecord[]> {
  if (mongoDb) {
    const docs = await mongoDb.collection('employees').find({}).sort({ empId: 1 }).toArray();
    return docs.map((d) => serialize<EmployeeRecord>(d as Record<string, unknown>));
  }
  return readFallback().employees;
}

export async function addEmployee(input: { name: string; role: string; phone: string }): Promise<EmployeeRecord> {
  const existing = await listEmployees();
  const empId = `EMP-${String(existing.length + 1).padStart(2, '0')}`;
  const payload: Omit<EmployeeRecord, '_id'> = {
    empId,
    name: input.name,
    role: input.role,
    phone: input.phone,
    shift: '09:30 AM – 06:30 PM',
    status: 'Present',
    completedToday: 0,
    accuracy: '99.0%',
  };
  if (mongoDb) {
    const res = await mongoDb.collection('employees').insertOne(payload);
    return { ...payload, _id: res.insertedId.toHexString() };
  }
  const store = readFallback();
  const created: EmployeeRecord = { ...payload, _id: new ObjectId().toHexString() };
  store.employees.push(created);
  writeFallback(store);
  return created;
}

export async function updateEmployee(
  id: string,
  patch: Partial<Pick<EmployeeRecord, 'status' | 'completedToday'>>
): Promise<EmployeeRecord | null> {
  if (mongoDb) {
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { empId: id };
    const res = await mongoDb
      .collection('employees')
      .findOneAndUpdate(filter, { $set: patch }, { returnDocument: 'after' });
    return res ? serialize<EmployeeRecord>(res as Record<string, unknown>) : null;
  }
  const store = readFallback();
  const idx = store.employees.findIndex((e) => e._id === id || e.empId === id);
  if (idx === -1) return null;
  store.employees[idx] = { ...store.employees[idx], ...patch };
  writeFallback(store);
  return store.employees[idx];
}

export async function removeEmployee(id: string): Promise<boolean> {
  if (mongoDb) {
    const filter = ObjectId.isValid(id) ? { _id: new ObjectId(id) } : { empId: id };
    const res = await mongoDb.collection('employees').deleteOne(filter);
    return res.deletedCount > 0;
  }
  const store = readFallback();
  if (store.employees.length <= 1) return false;
  const before = store.employees.length;
  store.employees = store.employees.filter((e) => e._id !== id && e.empId !== id);
  if (store.employees.length === before) return false;
  writeFallback(store);
  return true;
}

export async function listLedger(): Promise<LedgerEntry[]> {
  if (mongoDb) {
    const docs = await mongoDb.collection('ledger_entries').find({}).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => serialize<LedgerEntry>(d as Record<string, unknown>));
  }
  return readFallback().ledger;
}

export async function addLedgerEntry(input: {
  desc: string;
  mode: 'UPI' | 'Cash' | 'Challan';
  amount: number;
}): Promise<LedgerEntry> {
  const payload: Omit<LedgerEntry, '_id'> = {
    desc: input.desc,
    mode: input.mode,
    amount: input.amount,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date().toISOString(),
  };
  if (mongoDb) {
    const res = await mongoDb.collection('ledger_entries').insertOne(payload);
    return { ...payload, _id: res.insertedId.toHexString() };
  }
  const store = readFallback();
  const created: LedgerEntry = { ...payload, _id: new ObjectId().toHexString() };
  store.ledger.unshift(created);
  writeFallback(store);
  return created;
}

export async function listChallans(): Promise<ChallanItem[]> {
  if (mongoDb) {
    const docs = await mongoDb.collection('challan_bundles').find({}).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => serialize<ChallanItem>(d as Record<string, unknown>));
  }
  return readFallback().challans;
}

export async function addChallanItem(input: {
  refId: string;
  category: string;
  amount: number;
}): Promise<ChallanItem> {
  const payload: Omit<ChallanItem, '_id'> = {
    refId: input.refId.toUpperCase(),
    category: input.category,
    amount: input.amount,
    createdAt: new Date().toISOString(),
  };
  if (mongoDb) {
    const res = await mongoDb.collection('challan_bundles').insertOne(payload);
    return { ...payload, _id: res.insertedId.toHexString() };
  }
  const store = readFallback();
  const created: ChallanItem = { ...payload, _id: new ObjectId().toHexString() };
  store.challans.unshift(created);
  writeFallback(store);
  return created;
}

export async function listReferrals(): Promise<PartnerReferral[]> {
  if (mongoDb) {
    const docs = await mongoDb.collection('advocate_referrals').find({}).sort({ createdAt: -1 }).toArray();
    return docs.map((d) => serialize<PartnerReferral>(d as Record<string, unknown>));
  }
  return readFallback().referrals;
}

export async function addReferral(input: {
  partner: string;
  client: string;
  work: string;
  credit: string;
}): Promise<PartnerReferral> {
  const payload: Omit<PartnerReferral, '_id'> = {
    partner: input.partner,
    client: input.client,
    work: input.work,
    status: 'Queued',
    credit: input.credit || '₹500',
    createdAt: new Date().toISOString(),
  };
  if (mongoDb) {
    const res = await mongoDb.collection('advocate_referrals').insertOne(payload);
    return { ...payload, _id: res.insertedId.toHexString() };
  }
  const store = readFallback();
  const created: PartnerReferral = { ...payload, _id: new ObjectId().toHexString() };
  store.referrals.unshift(created);
  writeFallback(store);
  return created;
}

export async function getQueueState(): Promise<QueueState> {
  if (mongoDb) {
    const doc = await mongoDb.collection('queue_state').findOne({ key: 'active' });
    if (doc) {
      return {
        nowServing: Number(doc.nowServing) || 104,
        nextToken: Number(doc.nextToken) || 108,
        lastIssued: doc.lastIssued as QueueState['lastIssued'],
      };
    }
  }
  return readFallback().queue;
}

export async function bookQueueToken(input: { desk: string; holder: string }): Promise<QueueState> {
  const current = await getQueueState();
  const issuedNum = current.nextToken;
  const next: QueueState = {
    nowServing: current.nowServing,
    nextToken: issuedNum + 1,
    lastIssued: {
      token: `T-${issuedNum}`,
      desk: input.desk,
      holder: input.holder || 'Walk-In Citizen',
      issuedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  };
  if (mongoDb) {
    await mongoDb.collection('queue_state').updateOne({ key: 'active' }, { $set: next }, { upsert: true });
    return next;
  }
  const store = readFallback();
  store.queue = next;
  writeFallback(store);
  return next;
}

export async function advanceQueueServing(): Promise<QueueState> {
  const current = await getQueueState();
  const next: QueueState = {
    ...current,
    nowServing: current.nowServing + 1,
    nextToken: Math.max(current.nextToken, current.nowServing + 2),
  };
  if (mongoDb) {
    await mongoDb.collection('queue_state').updateOne({ key: 'active' }, { $set: next }, { upsert: true });
    return next;
  }
  const store = readFallback();
  store.queue = next;
  writeFallback(store);
  return next;
}

// Full Database JSON Export & Restore
export async function exportFullBackup(): Promise<FullBackupPayload> {
  if (mongoDb) {
    const [projects, inquiries, attachments, employees, ledger, challans, referrals, queue] = await Promise.all([
      listProjects({}),
      listInquiries({}),
      mongoDb.collection('attachments').find({}).toArray(),
      listEmployees(),
      listLedger(),
      listChallans(),
      listReferrals(),
      getQueueState(),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      projects,
      inquiries,
      attachments: attachments.map((a) => serialize<StoredAttachment>(a as Record<string, unknown>)),
      employees,
      ledger,
      challans,
      referrals,
      queue,
    };
  }
  const store = readFallback();
  return {
    exportedAt: new Date().toISOString(),
    version: '1.0',
    ...store,
  };
}

export async function restoreFullBackup(payload: Partial<FullBackupPayload>): Promise<{
  projects: number;
  inquiries: number;
  attachments: number;
}> {
  if (!payload || !Array.isArray(payload.projects) || !Array.isArray(payload.inquiries)) {
    throw new Error('Invalid JSON backup file: projects and inquiries arrays are required.');
  }

  const normalized: FallbackStore = {
    projects: payload.projects,
    inquiries: payload.inquiries,
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
    employees: Array.isArray(payload.employees) && payload.employees.length ? payload.employees : readFallback().employees,
    ledger: Array.isArray(payload.ledger) ? payload.ledger : [],
    challans: Array.isArray(payload.challans) ? payload.challans : [],
    referrals: Array.isArray(payload.referrals) ? payload.referrals : [],
    queue: payload.queue || { nowServing: 104, nextToken: 108 },
  };

  if (mongoDb) {
    const collections = [
      ['projects', normalized.projects],
      ['inquiries', normalized.inquiries],
      ['attachments', normalized.attachments],
      ['employees', normalized.employees],
      ['ledger_entries', normalized.ledger],
      ['challan_bundles', normalized.challans],
      ['advocate_referrals', normalized.referrals],
    ] as const;

    for (const [colName, docs] of collections) {
      await mongoDb.collection(colName).deleteMany({});
      if (docs.length > 0) {
        await mongoDb.collection(colName).insertMany(
          docs.map((d) => {
            const copy = { ...(d as unknown as Record<string, unknown>) };
            if (typeof copy._id === 'string' && ObjectId.isValid(copy._id)) {
              copy._id = new ObjectId(copy._id);
            } else {
              delete copy._id;
            }
            return copy;
          })
        );
      }
    }
    await mongoDb.collection('queue_state').updateOne({ key: 'active' }, { $set: normalized.queue }, { upsert: true });
  } else {
    writeFallback(normalized);
  }

  return {
    projects: normalized.projects.length,
    inquiries: normalized.inquiries.length,
    attachments: normalized.attachments.length,
  };
}

export async function publishSiteMetadataToDb(
  publishedBy = 'system'
): Promise<PublishedSiteSnapshot> {
  const dbName = (process.env.MONGODB_DB_NAME || 'pragya_kendra_ranchi').trim();
  const now = new Date().toISOString();

  const snapshot: PublishedSiteSnapshot = {
    slug: 'pragya-kendra-ranchi',
    name: 'Pragya Kendra Ranchi',
    tagline:
      'Authorized Citizen Service, Land Mutation, Registry Drafting & Digital Documentation Center',
    address: 'Beside Kolkatta Pharma, Radium Road, Kutchery Chowk, Ranchi - 834001, Jharkhand',
    coordinates: { lat: 23.3792833, lng: 85.3247589 },
    phones: ['+91 90652 33139', '+91 86038 58578'],
    email: 'kniraj963@gmail.com',
    upiId: 'niraj2392130@naviaxis',
    hours: 'Mon - Sat, 09:30 AM - 09:00 PM',
    aadhaarExcluded: true,
    hosting: {
      frontend: 'Cloudflare Pages (dist)',
      pagesProject: (process.env.CLOUDFLARE_PAGES_PROJECT || 'pragya-kendra-ranchi').trim(),
      cloudflareAccountId: (process.env.CLOUDFLARE_ACCOUNT_ID || '686fa684d5f39a29dc84d4933a0144ce').trim(),
      apiProxy: '/functions/api/[[path]].ts',
      database: 'MongoDB Atlas',
      dbName,
    },
    totalServices: SERVICES_CATALOG.length,
    categoriesCount: Object.keys(CATEGORIES).length,
    reviewsCount: REVIEWS_DATA.length,
    reviews: REVIEWS_DATA,
    publishedAt: now,
    publishedBy,
  };

  if (mongoDb) {
    await mongoDb.collection('site_metadata').createIndex({ slug: 1 }, { unique: true });
    await mongoDb
      .collection('site_metadata')
      .updateOne({ slug: snapshot.slug }, { $set: snapshot }, { upsert: true });

    await mongoDb.collection('services_catalog').createIndex({ slug: 1 }, { unique: true });
    const bulkOps = SERVICES_CATALOG.map(([slug, catCode, titleEn, titleHi, docsStr]) => {
      const cat = CATEGORIES[catCode] || ['General', 'सामान्य'];
      const requiredDocs = docsStr.split(' ').map((key) => ({
        key,
        labelEn: DOC_DICT[key]?.[0] || key,
        labelHi: DOC_DICT[key]?.[1] || key,
      }));
      return {
        updateOne: {
          filter: { slug },
          update: {
            $set: {
              slug,
              categoryCode: catCode,
              categoryNameEn: cat[0],
              categoryNameHi: cat[1],
              titleEn,
              titleHi,
              requiredDocs,
              updatedAt: now,
            },
          },
          upsert: true,
        },
      };
    });
    if (bulkOps.length > 0) {
      await mongoDb.collection('services_catalog').bulkWrite(bulkOps);
    }
  }

  return snapshot;
}

export async function getPublishedSiteMetadata(): Promise<{
  site: PublishedSiteSnapshot;
  servicesCount: number;
  projectsCount: number;
}> {
  if (mongoDb) {
    const [doc, servicesCount, projectsCount] = await Promise.all([
      mongoDb.collection('site_metadata').findOne({ slug: 'pragya-kendra-ranchi' }),
      mongoDb.collection('services_catalog').countDocuments(),
      mongoDb.collection('projects').countDocuments(),
    ]);
    if (doc) {
      const clean = { ...(doc as Record<string, unknown>) };
      delete clean._id;
      return {
        site: clean as unknown as PublishedSiteSnapshot,
        servicesCount,
        projectsCount,
      };
    }
  }
  const site = await publishSiteMetadataToDb('snapshot-read');
  return {
    site,
    servicesCount: SERVICES_CATALOG.length,
    projectsCount: SEED_PROJECTS.length,
  };
}

