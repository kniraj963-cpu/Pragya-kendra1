import {
  CATEGORIES,
  REVIEWS_DATA,
  SERVICES_CATALOG,
  STATUS_STAGES,
  type AttachedDocMeta,
  type ChallanItem,
  type ContactInquiry,
  type EmployeeRecord,
  type LedgerEntry,
  type PartnerReferral,
  type ProjectMetadata,
  type QueueState,
} from '../src/data/catalog.ts';
import {
  FALLBACK_INQUIRIES,
  FALLBACK_PROJECTS,
  FALLBACK_QUEUE,
} from '../src/data/fallbackSeeds.ts';

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<{ success: boolean }>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  exec(query: string): Promise<unknown>;
}

export interface WorkerEnv {
  ASSETS: { fetch(req: Request): Promise<Response> };
  DB?: D1Database;
  API_ORIGIN?: string;
  STAFF_ACCESS_PIN?: string;
  STAFF_ADMIN_PASSWORD?: string;
  STAFF_SESSION_SECRET?: string;
}

interface WorkerStore {
  projects: ProjectMetadata[];
  inquiries: ContactInquiry[];
  employees: EmployeeRecord[];
  ledger: LedgerEntry[];
  challans: ChallanItem[];
  referrals: PartnerReferral[];
  queue: QueueState;
  publishedAt: string;
}

const COOKIE_NAME = 'pk_staff_session';

const SEED_EMPLOYEES: EmployeeRecord[] = [
  {
    _id: 'emp-01',
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
    _id: 'emp-02',
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
    _id: 'emp-03',
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
    _id: 'emp-04',
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

const SEED_LEDGER: LedgerEntry[] = [
  { _id: 'led-1', desc: 'Sale Deed Drafting — PK-RNC-1003', mode: 'UPI', amount: 2500, time: '10:15 AM', createdAt: '2026-11-18T04:45:00.000Z' },
  { _id: 'led-2', desc: 'Jharbhoomi Online Lagan Rasid', mode: 'Cash', amount: 450, time: '10:40 AM', createdAt: '2026-11-18T05:10:00.000Z' },
  { _id: 'led-3', desc: 'JharSewa Portal & Stamp Challan', mode: 'Challan', amount: 1200, time: '11:05 AM', createdAt: '2026-11-18T05:35:00.000Z' },
];

const SEED_CHALLANS: ChallanItem[] = [
  { _id: 'ch-1', refId: 'PK-RNC-1001', category: 'Jharbhoomi Lagan / Mutation Fee', amount: 650, createdAt: '2026-11-15T11:00:00.000Z' },
  { _id: 'ch-2', refId: 'PK-RNC-1001', category: 'Drafting & Professional Fee', amount: 850, createdAt: '2026-11-15T11:05:00.000Z' },
  { _id: 'ch-3', refId: 'PK-RNC-1003', category: 'e-Stamp / Stamp Duty', amount: 18500, createdAt: '2026-11-16T10:15:00.000Z' },
];

const SEED_REFERRALS: PartnerReferral[] = [
  { _id: 'ref-1', partner: 'Adv. Akash Tirkey', client: 'Mahendra Oraon', work: 'Sale Deed + Mutation (Argora)', status: 'Active', credit: '₹750', createdAt: '2026-11-16T09:00:00.000Z' },
  { _id: 'ref-2', partner: 'Ranchi Property Associates', client: 'Deepak Verma', work: 'LPC & Khatiyan Verification', status: 'Completed', credit: '₹500', createdAt: '2026-11-12T14:00:00.000Z' },
  { _id: 'ref-3', partner: 'Adv. Priya Kumari', client: 'Nirmala Devi', work: 'Legal Heir Affidavit & Certs', status: 'Active', credit: '₹400', createdAt: '2026-11-17T12:00:00.000Z' },
];

function initialStore(): WorkerStore {
  return {
    projects: FALLBACK_PROJECTS,
    inquiries: FALLBACK_INQUIRIES,
    employees: SEED_EMPLOYEES,
    ledger: SEED_LEDGER,
    challans: SEED_CHALLANS,
    referrals: SEED_REFERRALS,
    queue: FALLBACK_QUEUE,
    publishedAt: new Date().toISOString(),
  };
}

function json(data: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}

function uid(prefix: string): string {
  return `${prefix}-${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
}

async function hmacSign(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function toB64Url(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromB64Url(str: string): string {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  return decodeURIComponent(escape(atob(padded)));
}

function getSecret(env: WorkerEnv): string {
  return (
    env.STAFF_SESSION_SECRET ||
    `${env.STAFF_ACCESS_PIN || '9999'}:${env.STAFF_ADMIN_PASSWORD || 'staff123'}:pragya-kendra`
  );
}

async function signStaffToken(env: WorkerEnv): Promise<string> {
  const payload = toB64Url(
    JSON.stringify({ role: 'staff', iat: Date.now(), exp: Date.now() + 12 * 3600 * 1000 })
  );
  const sig = await hmacSign(getSecret(env), payload);
  return `${payload}.${sig}`;
}

async function verifyStaffRequest(req: Request, env: WorkerEnv): Promise<boolean> {
  const auth = req.headers.get('authorization');
  let token = auth && auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) {
    const cookie = req.headers.get('cookie') || '';
    const part = cookie
      .split(';')
      .map((s) => s.trim())
      .find((s) => s.startsWith(`${COOKIE_NAME}=`));
    if (part) token = decodeURIComponent(part.slice(COOKIE_NAME.length + 1));
  }
  if (!token || !token.includes('.')) return false;
  const [payload, sig] = token.split('.');
  const expected = await hmacSign(getSecret(env), payload);
  if (sig !== expected) return false;
  try {
    const parsed = JSON.parse(fromB64Url(payload)) as { exp?: number };
    return Boolean(parsed.exp && Date.now() < parsed.exp);
  } catch {
    return false;
  }
}

async function ensureSchema(db: D1Database): Promise<void> {
  await db.exec(
    'CREATE TABLE IF NOT EXISTS pk_state (id TEXT PRIMARY KEY, payload TEXT NOT NULL, updated_at TEXT NOT NULL);'
  );
  await db.exec(
    'CREATE TABLE IF NOT EXISTS pk_attachments (id TEXT NOT NULL, chunk_idx INTEGER NOT NULL, file_name TEXT NOT NULL, mime_type TEXT NOT NULL, data_chunk TEXT NOT NULL, PRIMARY KEY (id, chunk_idx));'
  );
}

async function loadStore(db?: D1Database): Promise<WorkerStore> {
  if (!db) return initialStore();
  await ensureSchema(db);
  const row = await db.prepare('SELECT payload FROM pk_state WHERE id = ?').bind('main').first<{ payload: string }>();
  if (row?.payload) {
    try {
      return JSON.parse(row.payload) as WorkerStore;
    } catch {
      // re-seed below
    }
  }
  const seed = initialStore();
  await saveStore(db, seed);
  return seed;
}

async function saveStore(db: D1Database | undefined, store: WorkerStore): Promise<void> {
  if (!db) return;
  await ensureSchema(db);
  await db
    .prepare('INSERT OR REPLACE INTO pk_state (id, payload, updated_at) VALUES (?, ?, ?)')
    .bind('main', JSON.stringify(store), new Date().toISOString())
    .run();
}

async function saveAttachment(
  db: D1Database | undefined,
  id: string,
  fileName: string,
  mimeType: string,
  dataBase64: string
): Promise<void> {
  if (!db) return;
  await ensureSchema(db);
  const CHUNK_SIZE = 450_000;
  for (let i = 0, idx = 0; i < dataBase64.length; i += CHUNK_SIZE, idx++) {
    await db
      .prepare('INSERT OR REPLACE INTO pk_attachments (id, chunk_idx, file_name, mime_type, data_chunk) VALUES (?, ?, ?, ?, ?)')
      .bind(id, idx, fileName, mimeType, dataBase64.slice(i, i + CHUNK_SIZE))
      .run();
  }
}

async function loadAttachment(
  db: D1Database | undefined,
  id: string
): Promise<{ fileName: string; mimeType: string; bytes: Uint8Array } | null> {
  if (!db) return null;
  await ensureSchema(db);
  const { results } = await db
    .prepare('SELECT file_name, mime_type, data_chunk FROM pk_attachments WHERE id = ? ORDER BY chunk_idx ASC')
    .bind(id)
    .all<{ file_name: string; mime_type: string; data_chunk: string }>();
  if (!results.length) return null;
  const b64 = results.map((r) => r.data_chunk).join('');
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return { fileName: results[0].file_name, mimeType: results[0].mime_type, bytes };
}

function buildSiteSnapshot(store: WorkerStore) {
  return {
    slug: 'pragya-kendra-ranchi',
    name: 'Pragya Kendra Ranchi',
    tagline: 'Authorized Citizen Service, Land Mutation, Registry Drafting & Digital Documentation Center',
    address: 'Beside Kolkatta Pharma, Radium Road, Kutchery Chowk, Ranchi - 834001, Jharkhand',
    coordinates: { lat: 23.3792833, lng: 85.3247589 },
    phones: ['+91 90652 33139', '+91 86038 58578'],
    email: 'kniraj963@gmail.com',
    upiId: 'niraj2392130@naviaxis',
    hours: 'Mon - Sat, 09:30 AM - 09:00 PM',
    aadhaarExcluded: true,
    hosting: {
      frontend: 'Cloudflare Workers + Static Assets',
      cloudflareAccountId: '686fa684d5f39a29dc84d4933a0144ce',
      workerName: 'pragya-kendra',
      database: 'Cloudflare D1 Edge + MongoDB Atlas Sync',
    },
    totalServices: SERVICES_CATALOG.length,
    categoriesCount: Object.keys(CATEGORIES).length,
    reviewsCount: REVIEWS_DATA.length,
    reviews: REVIEWS_DATA,
    publishedAt: store.publishedAt,
  };
}

async function handleApiRequest(request: Request, env: WorkerEnv): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();

  // Optional upstream MongoDB Express backend proxy if API_ORIGIN is configured
  const origin = (env.API_ORIGIN || '').replace(/\/$/, '');
  if (origin) {
    try {
      const headers = new Headers(request.headers);
      headers.delete('host');
      const upstream = await fetch(`${origin}${path}${url.search}`, {
        method,
        headers,
        body: ['GET', 'HEAD'].includes(method) ? undefined : request.body,
        redirect: 'manual',
      });
      return new Response(upstream.body, {
        status: upstream.status,
        statusText: upstream.statusText,
        headers: upstream.headers,
      });
    } catch {
      // Fallback transparently to Cloudflare D1 edge store if upstream is temporarily offline
    }
  }

  if (path === '/api/health') {
    return json({
      ok: true,
      database: env.DB ? 'cloudflare-d1' : 'edge-seed',
      message: 'Pragya Kendra Ranchi live on Cloudflare Edge',
    });
  }

  const store = await loadStore(env.DB);

  if (path === '/api/site' && method === 'GET') {
    return json({
      ok: true,
      database: env.DB ? 'cloudflare-d1' : 'edge-seed',
      site: buildSiteSnapshot(store),
      servicesCount: SERVICES_CATALOG.length,
      projectsCount: store.projects.length,
    });
  }

  if (path === '/api/site/publish' && method === 'POST') {
    if (!(await verifyStaffRequest(request, env))) return json({ error: 'Staff authentication required.' }, 401);
    store.publishedAt = new Date().toISOString();
    await saveStore(env.DB, store);
    return json({
      ok: true,
      database: env.DB ? 'cloudflare-d1' : 'edge-seed',
      site: buildSiteSnapshot(store),
      servicesCount: SERVICES_CATALOG.length,
      projectsCount: store.projects.length,
    });
  }

  // Auth routes
  if (path === '/api/auth/login' && method === 'POST') {
    const body = (await request.json().catch(() => ({}))) as { pin?: string; password?: string };
    const validPin = (env.STAFF_ACCESS_PIN || '9999').trim();
    const validPass = (env.STAFF_ADMIN_PASSWORD || 'staff123').trim();
    if (body.pin?.trim() !== validPin && body.password !== validPass) {
      return json({ error: 'Invalid Staff PIN or Password.' }, 401);
    }
    const token = await signStaffToken(env);
    return json({ ok: true, role: 'staff', token }, 200, {
      'Set-Cookie': `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=43200`,
    });
  }

  if (path === '/api/auth/me') {
    const ok = await verifyStaffRequest(request, env);
    return json({ authenticated: ok, role: ok ? 'staff' : null });
  }

  if (path === '/api/auth/logout' && method === 'POST') {
    return json({ ok: true }, 200, {
      'Set-Cookie': `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`,
    });
  }

  // Projects
  if (path === '/api/projects' && method === 'GET') {
    const cat = url.searchParams.get('category') || '';
    const q = (url.searchParams.get('q') || '').toLowerCase().trim();
    const filtered = store.projects.filter((p) => {
      const catOk = !cat || cat === 'All' || p.category === cat;
      const qOk =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.titleHi.includes(q) ||
        p.summary.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      return catOk && qOk;
    });
    return json({ projects: filtered, database: 'cloudflare-d1' });
  }

  if (path === '/api/projects' && method === 'POST') {
    if (!(await verifyStaffRequest(request, env))) return json({ error: 'Staff authentication required.' }, 401);
    const b = (await request.json().catch(() => ({}))) as Partial<ProjectMetadata>;
    if (!b.title || !b.category || !b.summary) {
      return json({ error: 'Title, category, and summary are required.' }, 400);
    }
    const now = new Date().toISOString();
    const project: ProjectMetadata = {
      _id: uid('proj'),
      slug: `${b.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 40)}-${Math.floor(100 + Math.random() * 900)}`,
      title: String(b.title).trim(),
      titleHi: String(b.titleHi || b.title).trim(),
      category: String(b.category).trim(),
      clientSector: String(b.clientSector || 'Ranchi Client').trim(),
      location: String(b.location || 'Kutchery Chowk, Ranchi').trim(),
      turnaround: String(b.turnaround || '5 Working Days').trim(),
      year: String(b.year || new Date().getFullYear()),
      summary: String(b.summary).trim(),
      outcomeMetric: String(b.outcomeMetric || 'Verified Completion').trim(),
      deliverables: Array.isArray(b.deliverables) ? b.deliverables.map(String) : ['Documentation Scrutiny'],
      tags: Array.isArray(b.tags) ? b.tags.map(String) : [String(b.category)],
      featured: Boolean(b.featured),
      visualTheme: b.visualTheme || 'navy',
      createdAt: now,
      updatedAt: now,
    };
    store.projects.unshift(project);
    await saveStore(env.DB, store);
    return json({ project }, 201);
  }

  if (path.startsWith('/api/projects/') && method === 'DELETE') {
    if (!(await verifyStaffRequest(request, env))) return json({ error: 'Staff authentication required.' }, 401);
    const id = decodeURIComponent(path.slice('/api/projects/'.length));
    const before = store.projects.length;
    store.projects = store.projects.filter((p) => p._id !== id && p.slug !== id);
    if (store.projects.length === before) return json({ error: 'Project not found.' }, 404);
    await saveStore(env.DB, store);
    return json({ ok: true });
  }

  // Inquiries & Live Tracker
  if (path.startsWith('/api/inquiries/track/') && method === 'GET') {
    const ticketId = decodeURIComponent(path.slice('/api/inquiries/track/'.length)).trim().toUpperCase();
    const found = store.inquiries.find((i) => i.ticketId.toUpperCase() === ticketId);
    if (!found) return json({ error: 'Applied service ticket not found.' }, 404);
    return json({ inquiry: found });
  }

  if (path === '/api/inquiries' && method === 'POST') {
    const b = (await request.json().catch(() => ({}))) as {
      name?: string;
      phone?: string;
      email?: string;
      serviceSlug?: string;
      serviceName?: string;
      projectRef?: string;
      locationDetails?: string;
      message?: string;
      attachedDocs?: AttachedDocMeta[];
    };
    const cleanName = String(b.name || '').trim();
    const cleanPhone = String(b.phone || '').replace(/\s+/g, '').trim();
    if (!cleanName || !/^[6-9]\d{9}$/.test(cleanPhone)) {
      return json({ error: 'Valid applicant name and 10-digit Indian mobile number are required.' }, 400);
    }

    let nextNum = 1001 + store.inquiries.length;
    const used = new Set(store.inquiries.map((i) => i.ticketId));
    while (used.has(`PK-RNC-${nextNum}`)) nextNum += 1;
    const ticketId = `PK-RNC-${nextNum}`;
    const now = new Date().toISOString();

    const docRefs: AttachedDocMeta[] = [];
    for (const d of Array.isArray(b.attachedDocs) ? b.attachedDocs : []) {
      const attId = uid('att');
      if (d.dataBase64) {
        await saveAttachment(env.DB, attId, d.name, d.mimeType || 'application/pdf', d.dataBase64);
      }
      docRefs.push({
        attachmentId: d.dataBase64 ? attId : undefined,
        requirementKey: d.requirementKey || 'general',
        requirementLabel: d.requirementLabel || d.category,
        name: d.name,
        mimeType: d.mimeType || 'application/pdf',
        sizeBytes: d.sizeBytes || 0,
        size: d.size,
        category: d.category,
      });
    }

    const inquiry: ContactInquiry = {
      _id: uid('inq'),
      ticketId,
      name: cleanName,
      phone: cleanPhone,
      email: String(b.email || ''),
      serviceSlug: String(b.serviceSlug || 'general'),
      serviceName: String(b.serviceName || 'General Service'),
      projectRef: String(b.projectRef || ''),
      locationDetails: String(b.locationDetails || 'Kutchery Chowk Desk'),
      message: String(b.message || ''),
      statusStage: 0,
      stageHistory: [{ stage: 0, label: STATUS_STAGES.en[0], at: now }],
      closedAt: null,
      operatorNote: `Accepted with ${docRefs.length} uploaded document(s).`,
      assignedTo: 'EMP-03 (Priya Kumari)',
      attachedDocs: docRefs,
      createdAt: now,
      updatedAt: now,
    };

    store.inquiries.unshift(inquiry);
    await saveStore(env.DB, store);
    return json({ inquiry }, 201);
  }

  if (path === '/api/inquiries' && method === 'GET') {
    if (!(await verifyStaffRequest(request, env))) return json({ error: 'Staff authentication required.' }, 401);
    const stageParam = url.searchParams.get('statusStage');
    const q = (url.searchParams.get('q') || '').toLowerCase().trim();
    const list = store.inquiries.filter((i) => {
      const stOk = stageParam === null || stageParam === '' || i.statusStage === Number(stageParam);
      const qOk =
        !q ||
        i.ticketId.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q) ||
        i.phone.includes(q) ||
        i.serviceName.toLowerCase().includes(q);
      return stOk && qOk;
    });
    return json({ inquiries: list });
  }

  if (path.startsWith('/api/inquiries/') && method === 'PATCH') {
    if (!(await verifyStaffRequest(request, env))) return json({ error: 'Staff authentication required.' }, 401);
    const id = decodeURIComponent(path.slice('/api/inquiries/'.length));
    const idx = store.inquiries.findIndex((i) => i._id === id || i.ticketId === id.toUpperCase());
    if (idx === -1) return json({ error: 'Inquiry not found.' }, 404);
    const b = (await request.json().catch(() => ({}))) as {
      statusStage?: number;
      operatorNote?: string;
      assignedTo?: string;
    };
    const current = store.inquiries[idx];
    const now = new Date().toISOString();
    const nextStage = typeof b.statusStage === 'number' ? b.statusStage : current.statusStage;
    const history = [...current.stageHistory];
    if (typeof b.statusStage === 'number' && b.statusStage !== current.statusStage) {
      history.push({ stage: nextStage, label: STATUS_STAGES.en[nextStage] || 'Updated', at: now });
    }
    store.inquiries[idx] = {
      ...current,
      statusStage: nextStage,
      stageHistory: history,
      closedAt: nextStage === 4 ? current.closedAt || now : null,
      operatorNote: typeof b.operatorNote === 'string' ? b.operatorNote : current.operatorNote,
      assignedTo: typeof b.assignedTo === 'string' ? b.assignedTo : current.assignedTo,
      updatedAt: now,
    };
    await saveStore(env.DB, store);
    return json({ inquiry: store.inquiries[idx] });
  }

  if (path.startsWith('/api/inquiries/') && method === 'DELETE') {
    if (!(await verifyStaffRequest(request, env))) return json({ error: 'Staff authentication required.' }, 401);
    const id = decodeURIComponent(path.slice('/api/inquiries/'.length));
    const before = store.inquiries.length;
    store.inquiries = store.inquiries.filter((i) => i._id !== id && i.ticketId !== id.toUpperCase());
    if (store.inquiries.length === before) return json({ error: 'Inquiry not found.' }, 404);
    await saveStore(env.DB, store);
    return json({ ok: true });
  }

  // Attachments
  if (path.startsWith('/api/attachments/') && method === 'GET') {
    if (!(await verifyStaffRequest(request, env))) return json({ error: 'Staff authentication required.' }, 401);
    const id = decodeURIComponent(path.slice('/api/attachments/'.length));
    const att = await loadAttachment(env.DB, id);
    if (!att) return json({ error: 'Attachment not found.' }, 404);
    const disposition = url.searchParams.get('download') === '1' ? 'attachment' : 'inline';
    return new Response(new Uint8Array(att.bytes), {
      status: 200,
      headers: {
        'Content-Type': att.mimeType,
        'Content-Disposition': `${disposition}; filename="${att.fileName}"`,
      },
    });
  }

  // Queue
  if (path === '/api/queue/status' && method === 'GET') {
    return json({ queue: store.queue });
  }

  if (path === '/api/queue/book' && method === 'POST') {
    const b = (await request.json().catch(() => ({}))) as { desk?: string; holder?: string };
    const assigned = store.queue.nextToken;
    store.queue = {
      nowServing: store.queue.nowServing,
      nextToken: assigned + 1,
      lastIssued: {
        token: `PK-${assigned}`,
        desk: String(b.desk || 'Counter 1'),
        holder: String(b.holder || 'Walk-In Citizen'),
        issuedAt: new Date().toISOString(),
      },
    };
    await saveStore(env.DB, store);
    return json({ queue: store.queue });
  }

  if (path === '/api/queue/advance' && method === 'POST') {
    if (!(await verifyStaffRequest(request, env))) return json({ error: 'Staff authentication required.' }, 401);
    store.queue = {
      ...store.queue,
      nowServing: store.queue.nowServing + 1,
      nextToken: Math.max(store.queue.nextToken, store.queue.nowServing + 2),
    };
    await saveStore(env.DB, store);
    return json({ queue: store.queue });
  }

  // Staff Operations Summary & CRUD
  if (path === '/api/operations/summary' && method === 'GET') {
    if (!(await verifyStaffRequest(request, env))) return json({ error: 'Staff authentication required.' }, 401);
    return json({
      employees: store.employees,
      ledger: store.ledger,
      challans: store.challans,
      referrals: store.referrals,
      queue: store.queue,
    });
  }

  if (path === '/api/employees' && method === 'POST') {
    if (!(await verifyStaffRequest(request, env))) return json({ error: 'Staff authentication required.' }, 401);
    const b = (await request.json().catch(() => ({}))) as { name?: string; role?: string; phone?: string };
    if (!b.name || !b.role) return json({ error: 'Employee name and role required.' }, 400);
    const emp: EmployeeRecord = {
      _id: uid('emp'),
      empId: `EMP-${String(store.employees.length + 1).padStart(2, '0')}`,
      name: String(b.name),
      role: String(b.role),
      phone: String(b.phone || ''),
      shift: '09:30 AM – 06:30 PM',
      status: 'Present',
      completedToday: 0,
      accuracy: '99.0%',
    };
    store.employees.push(emp);
    await saveStore(env.DB, store);
    return json({ employee: emp }, 201);
  }

  if (path.startsWith('/api/employees/') && method === 'PATCH') {
    if (!(await verifyStaffRequest(request, env))) return json({ error: 'Staff authentication required.' }, 401);
    const id = decodeURIComponent(path.slice('/api/employees/'.length));
    const idx = store.employees.findIndex((e) => e._id === id || e.empId === id);
    if (idx === -1) return json({ error: 'Employee not found.' }, 404);
    const patch = (await request.json().catch(() => ({}))) as Partial<EmployeeRecord>;
    store.employees[idx] = { ...store.employees[idx], ...patch };
    await saveStore(env.DB, store);
    return json({ employee: store.employees[idx] });
  }

  if (path.startsWith('/api/employees/') && method === 'DELETE') {
    if (!(await verifyStaffRequest(request, env))) return json({ error: 'Staff authentication required.' }, 401);
    if (store.employees.length <= 1) return json({ error: 'At least 1 active employee must remain.' }, 400);
    const id = decodeURIComponent(path.slice('/api/employees/'.length));
    store.employees = store.employees.filter((e) => e._id !== id && e.empId !== id);
    await saveStore(env.DB, store);
    return json({ ok: true });
  }

  if (path === '/api/ledger' && method === 'POST') {
    if (!(await verifyStaffRequest(request, env))) return json({ error: 'Staff authentication required.' }, 401);
    const b = (await request.json().catch(() => ({}))) as { desc?: string; mode?: LedgerEntry['mode']; amount?: number };
    const entry: LedgerEntry = {
      _id: uid('led'),
      desc: String(b.desc || 'Counter Entry'),
      mode: b.mode || 'UPI',
      amount: Number(b.amount) || 0,
      time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    };
    store.ledger.unshift(entry);
    await saveStore(env.DB, store);
    return json({ entry }, 201);
  }

  if (path === '/api/challans' && method === 'POST') {
    if (!(await verifyStaffRequest(request, env))) return json({ error: 'Staff authentication required.' }, 401);
    const b = (await request.json().catch(() => ({}))) as { refId?: string; category?: string; amount?: number };
    const challan: ChallanItem = {
      _id: uid('ch'),
      refId: String(b.refId || 'PK-RNC').toUpperCase(),
      category: String(b.category || 'e-Stamp Challan'),
      amount: Number(b.amount) || 0,
      createdAt: new Date().toISOString(),
    };
    store.challans.unshift(challan);
    await saveStore(env.DB, store);
    return json({ challan }, 201);
  }

  if (path === '/api/referrals' && method === 'POST') {
    if (!(await verifyStaffRequest(request, env))) return json({ error: 'Staff authentication required.' }, 401);
    const b = (await request.json().catch(() => ({}))) as { partner?: string; client?: string; work?: string; credit?: string };
    const referral: PartnerReferral = {
      _id: uid('ref'),
      partner: String(b.partner || ''),
      client: String(b.client || ''),
      work: String(b.work || ''),
      status: 'Queued',
      credit: String(b.credit || '₹500'),
      createdAt: new Date().toISOString(),
    };
    store.referrals.unshift(referral);
    await saveStore(env.DB, store);
    return json({ referral }, 201);
  }

  if (path === '/api/backup/export' && method === 'GET') {
    if (!(await verifyStaffRequest(request, env))) return json({ error: 'Staff authentication required.' }, 401);
    const dateStr = new Date().toISOString().slice(0, 10);
    return new Response(
      JSON.stringify({ exportedAt: new Date().toISOString(), version: '1.0', ...store, attachments: [] }, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="pragya-kendra-backup-${dateStr}.json"`,
        },
      }
    );
  }

  if (path === '/api/backup/restore' && method === 'POST') {
    if (!(await verifyStaffRequest(request, env))) return json({ error: 'Staff authentication required.' }, 401);
    const b = (await request.json().catch(() => ({}))) as Partial<WorkerStore>;
    if (!Array.isArray(b.projects) || !Array.isArray(b.inquiries)) {
      return json({ error: 'Invalid JSON backup payload.' }, 400);
    }
    const restored: WorkerStore = {
      projects: b.projects,
      inquiries: b.inquiries,
      employees: Array.isArray(b.employees) ? b.employees : store.employees,
      ledger: Array.isArray(b.ledger) ? b.ledger : store.ledger,
      challans: Array.isArray(b.challans) ? b.challans : store.challans,
      referrals: Array.isArray(b.referrals) ? b.referrals : store.referrals,
      queue: b.queue || store.queue,
      publishedAt: new Date().toISOString(),
    };
    await saveStore(env.DB, restored);
    return json({
      ok: true,
      restored: {
        projects: restored.projects.length,
        inquiries: restored.inquiries.length,
        attachments: 0,
      },
    });
  }

  return json({ error: 'API route not found.' }, 404);
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return handleApiRequest(request, env);
    }
    const assetResponse = await env.ASSETS.fetch(request);
    const headers = new Headers(assetResponse.headers);
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    return new Response(assetResponse.body, {
      status: assetResponse.status,
      statusText: assetResponse.statusText,
      headers,
    });
  },
};
