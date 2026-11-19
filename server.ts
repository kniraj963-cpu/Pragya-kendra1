import 'dotenv/config';
import crypto from 'crypto';
import http from 'http';
import express, { type NextFunction, type Request, type Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  addChallanItem,
  addEmployee,
  addLedgerEntry,
  addReferral,
  advanceQueueServing,
  bookQueueToken,
  checkRecentDuplicateInquiry,
  createInquiryWithAttachments,
  createProject,
  deleteInquiry,
  deleteProject,
  exportFullBackup,
  findInquiryByTicket,
  getAttachmentById,
  getDbStatus,
  getPublishedSiteMetadata,
  getQueueState,
  initDatabase,
  listChallans,
  listEmployees,
  listInquiries,
  listLedger,
  listProjects,
  listReferrals,
  publishSiteMetadataToDb,
  removeEmployee,
  restoreFullBackup,
  updateEmployee,
  updateInquiry,
} from './server/db.ts';
import type { AttachedDocMeta } from './src/data/catalog.ts';

const PORT = Number(process.env.PORT) || 3000;
const STAFF_PIN = (process.env.STAFF_ACCESS_PIN || '9999').trim();
const STAFF_PASSWORD = (process.env.STAFF_ADMIN_PASSWORD || 'staff123').trim();
const SESSION_SECRET = (
  process.env.STAFF_SESSION_SECRET ||
  crypto.createHash('sha256').update(`${STAFF_PIN}:${STAFF_PASSWORD}:pragya-kendra`).digest('hex')
).trim();
const COOKIE_NAME = 'pk_staff_session';

function signStaffToken(role: string): string {
  const payload = Buffer.from(
    JSON.stringify({ role, iat: Date.now(), exp: Date.now() + 1000 * 60 * 60 * 12 })
  ).toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyStaffToken(token: string | undefined): { role: string } | null {
  if (!token || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      role?: string;
      exp?: number;
    };
    if (!parsed.exp || Date.now() > parsed.exp) return null;
    return { role: parsed.role || 'staff' };
  } catch {
    return null;
  }
}

function extractToken(req: Request): string | undefined {
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader
    .split(';')
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.slice(COOKIE_NAME.length + 1)) : undefined;
}

function requireStaff(req: Request, res: Response, next: NextFunction): void {
  const session = verifyStaffToken(extractToken(req));
  if (!session) {
    res.status(401).json({ error: 'Staff authentication required.' });
    return;
  }
  next();
}

function validateBase64Attachment(doc: AttachedDocMeta): boolean {
  if (!doc.dataBase64) return true;
  const buf = Buffer.from(doc.dataBase64, 'base64');
  if (buf.length > 5 * 1024 * 1024) return false;
  // Check PDF (%PDF-), PNG, or JPEG magic bytes
  const isPdf = buf.subarray(0, 4).toString('ascii') === '%PDF';
  const isPng = buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const isJpg = buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  return isPdf || isPng || isJpg;
}

async function startServer() {
  await initDatabase();

  const app = express();
  app.use(express.json({ limit: '25mb' }));

  // CORS support for decoupled Cloudflare Pages frontend -> Express API
  app.use((req: Request, res: Response, next: NextFunction) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  });

  app.get('/api/health', (_req: Request, res: Response) => {
    const status = getDbStatus();
    const mcpConfigured = Boolean(
      process.env.MDB_MCP_API_CLIENT_ID && process.env.MDB_MCP_API_CLIENT_SECRET
    );
    res.json({
      ok: true,
      database: status.mode,
      message: status.notice,
      mcpConfigured,
      mcpBaseUrl: process.env.MDB_MCP_API_BASE_URL || 'https://mcp.mongodb.com',
    });
  });

  // Published Website Metadata & Services Catalog (MongoDB Atlas)
  app.get('/api/site', async (_req: Request, res: Response) => {
    try {
      const data = await getPublishedSiteMetadata();
      res.json({ ok: true, database: getDbStatus().mode, ...data });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/site/publish', requireStaff, async (_req: Request, res: Response) => {
    try {
      const site = await publishSiteMetadataToDb('staff-console');
      const data = await getPublishedSiteMetadata();
      res.json({ ok: true, database: getDbStatus().mode, site, servicesCount: data.servicesCount, projectsCount: data.projectsCount });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Server-Verified Staff Authentication (HTTP-only cookie + token, zero localStorage)
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { pin, password } = req.body || {};
    const okPin = typeof pin === 'string' && pin.trim() === STAFF_PIN;
    const okPass = typeof password === 'string' && password === STAFF_PASSWORD;
    if (!okPin && !okPass) {
      res.status(401).json({ error: 'Invalid Staff PIN or Password.' });
      return;
    }
    const token = signStaffToken('staff');
    res.setHeader(
      'Set-Cookie',
      `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=43200`
    );
    res.json({ ok: true, role: 'staff', token });
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const session = verifyStaffToken(extractToken(req));
    res.json({ authenticated: Boolean(session), role: session?.role || null });
  });

  app.post('/api/auth/logout', (_req: Request, res: Response) => {
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`);
    res.json({ ok: true });
  });

  // Portfolio Project Metadata Routes
  app.get('/api/projects', async (req: Request, res: Response) => {
    try {
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      const projects = await listProjects({ category, q });
      res.json({ projects, database: getDbStatus().mode });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/projects', requireStaff, async (req: Request, res: Response) => {
    try {
      const {
        title,
        titleHi,
        category,
        clientSector,
        location,
        turnaround,
        year,
        summary,
        outcomeMetric,
        deliverables,
        tags,
        featured,
        visualTheme,
      } = req.body || {};
      if (!title || !category || !summary) {
        res.status(400).json({ error: 'Title, category, and summary are required.' });
        return;
      }
      const project = await createProject({
        title: String(title).trim(),
        titleHi: titleHi ? String(titleHi).trim() : String(title).trim(),
        category: String(category).trim(),
        clientSector: clientSector ? String(clientSector).trim() : 'Ranchi Client',
        location: location ? String(location).trim() : 'Kutchery Chowk, Ranchi',
        turnaround: turnaround ? String(turnaround).trim() : '5 Working Days',
        year: year ? String(year).trim() : String(new Date().getFullYear()),
        summary: String(summary).trim(),
        outcomeMetric: outcomeMetric ? String(outcomeMetric).trim() : 'Verified Completion',
        deliverables: Array.isArray(deliverables) ? deliverables.map(String) : [],
        tags: Array.isArray(tags) ? tags.map(String) : [],
        featured: Boolean(featured),
        visualTheme: ['navy', 'amber', 'emerald', 'slate'].includes(visualTheme) ? visualTheme : 'navy',
      });
      res.status(201).json({ project });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete('/api/projects/:id', requireStaff, async (req: Request, res: Response) => {
    try {
      const deleted = await deleteProject(String(req.params.id));
      if (!deleted) {
        res.status(404).json({ error: 'Project not found.' });
        return;
      }
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Strict Service-Applied Ticket Tracker (Public)
  app.get('/api/inquiries/track/:ticketId', async (req: Request, res: Response) => {
    try {
      const inquiry = await findInquiryByTicket(String(req.params.ticketId));
      if (!inquiry) {
        res.status(404).json({ error: 'Applied service ticket not found.' });
        return;
      }
      res.json({ inquiry });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Citizen Service Inquiry & Multi-PDF Upload Submission (Public)
  app.post('/api/inquiries', async (req: Request, res: Response) => {
    try {
      const { name, phone, email, serviceSlug, serviceName, projectRef, locationDetails, message, attachedDocs } =
        req.body || {};
      const cleanName = String(name || '').trim();
      const cleanPhone = String(phone || '').replace(/\s+/g, '').trim();
      if (!cleanName || !/^[6-9]\d{9}$/.test(cleanPhone)) {
        res.status(400).json({ error: 'Valid applicant name and 10-digit Indian mobile number are required.' });
        return;
      }
      if (!serviceName || !serviceSlug) {
        res.status(400).json({ error: 'Please select an applied service.' });
        return;
      }
      const isDuplicate = await checkRecentDuplicateInquiry(cleanPhone, String(serviceSlug));
      if (isDuplicate) {
        res.status(429).json({
          error: 'An identical application for this mobile number and service was just submitted. Please wait 30 seconds.',
        });
        return;
      }

      const docsArray: AttachedDocMeta[] = Array.isArray(attachedDocs) ? attachedDocs : [];
      for (const doc of docsArray) {
        if (!validateBase64Attachment(doc)) {
          res.status(400).json({ error: `Invalid or oversized file "${doc.name}". Only PDF/JPG/PNG under 5 MB allowed.` });
          return;
        }
      }

      const created = await createInquiryWithAttachments({
        name: cleanName,
        phone: cleanPhone,
        email: email ? String(email).trim() : '',
        serviceSlug: String(serviceSlug).trim(),
        serviceName: String(serviceName).trim(),
        projectRef: projectRef ? String(projectRef).trim() : '',
        locationDetails: locationDetails ? String(locationDetails).trim() : 'Kutchery Chowk Desk',
        message: message ? String(message).trim() : '',
        attachedDocs: docsArray,
      });
      res.status(201).json({ inquiry: created });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Staff-Protected Inquiries & Actual PDF Attachment Download
  app.get('/api/inquiries', requireStaff, async (req: Request, res: Response) => {
    try {
      const statusStage =
        typeof req.query.statusStage === 'string' && req.query.statusStage !== ''
          ? Number(req.query.statusStage)
          : undefined;
      const q = typeof req.query.q === 'string' ? req.query.q : undefined;
      const inquiries = await listInquiries({ statusStage, q });
      res.json({ inquiries, database: getDbStatus().mode });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.patch('/api/inquiries/:id', requireStaff, async (req: Request, res: Response) => {
    try {
      const { statusStage, operatorNote, assignedTo } = req.body || {};
      const updated = await updateInquiry(String(req.params.id), {
        statusStage: typeof statusStage === 'number' ? statusStage : undefined,
        operatorNote: typeof operatorNote === 'string' ? operatorNote : undefined,
        assignedTo: typeof assignedTo === 'string' ? assignedTo : undefined,
      });
      if (!updated) {
        res.status(404).json({ error: 'Inquiry not found.' });
        return;
      }
      res.json({ inquiry: updated });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete('/api/inquiries/:id', requireStaff, async (req: Request, res: Response) => {
    try {
      const ok = await deleteInquiry(String(req.params.id));
      if (!ok) {
        res.status(404).json({ error: 'Inquiry not found.' });
        return;
      }
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.get('/api/attachments/:id', requireStaff, async (req: Request, res: Response) => {
    try {
      const att = await getAttachmentById(String(req.params.id));
      if (!att) {
        res.status(404).json({ error: 'Attachment not found.' });
        return;
      }
      const buffer = Buffer.from(att.dataBase64, 'base64');
      const disposition = req.query.download === '1' ? 'attachment' : 'inline';
      res.setHeader('Content-Type', att.mimeType || 'application/pdf');
      res.setHeader('Content-Disposition', `${disposition}; filename="${att.fileName.replace(/"/g, '')}"`);
      res.send(buffer);
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Virtual Walk-In Queue Token (Public read/book, Staff advance)
  app.get('/api/queue', async (_req: Request, res: Response) => {
    try {
      res.json({ queue: await getQueueState() });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/queue/book', async (req: Request, res: Response) => {
    try {
      const { desk, holder } = req.body || {};
      const queue = await bookQueueToken({
        desk: String(desk || 'Counter 1: Land Mutation & Anchal'),
        holder: String(holder || 'Walk-In Citizen').trim(),
      });
      res.status(201).json({ queue });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/queue/advance', requireStaff, async (_req: Request, res: Response) => {
    try {
      res.json({ queue: await advanceQueueServing() });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Staff Operations Hub Endpoints
  app.get('/api/operations/summary', requireStaff, async (_req: Request, res: Response) => {
    try {
      const [employees, ledger, challans, referrals, queue] = await Promise.all([
        listEmployees(),
        listLedger(),
        listChallans(),
        listReferrals(),
        getQueueState(),
      ]);
      res.json({ employees, ledger, challans, referrals, queue });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/employees', requireStaff, async (req: Request, res: Response) => {
    try {
      const { name, role, phone } = req.body || {};
      if (!name || !role || !phone) {
        res.status(400).json({ error: 'Employee name, role, and phone are required.' });
        return;
      }
      res.status(201).json({
        employee: await addEmployee({ name: String(name), role: String(role), phone: String(phone) }),
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.patch('/api/employees/:id', requireStaff, async (req: Request, res: Response) => {
    try {
      const updated = await updateEmployee(String(req.params.id), req.body || {});
      if (!updated) {
        res.status(404).json({ error: 'Employee not found.' });
        return;
      }
      res.json({ employee: updated });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.delete('/api/employees/:id', requireStaff, async (req: Request, res: Response) => {
    try {
      const ok = await removeEmployee(String(req.params.id));
      if (!ok) {
        res.status(400).json({ error: 'Could not remove employee (at least 1 must remain).' });
        return;
      }
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/ledger', requireStaff, async (req: Request, res: Response) => {
    try {
      const { desc, mode, amount } = req.body || {};
      if (!desc || !mode || !(Number(amount) > 0)) {
        res.status(400).json({ error: 'Valid description, payment mode, and positive amount required.' });
        return;
      }
      res.status(201).json({
        entry: await addLedgerEntry({
          desc: String(desc),
          mode: ['UPI', 'Cash', 'Challan'].includes(mode) ? mode : 'UPI',
          amount: Number(amount),
        }),
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/challans', requireStaff, async (req: Request, res: Response) => {
    try {
      const { refId, category, amount } = req.body || {};
      if (!refId || !category || !(Number(amount) > 0)) {
        res.status(400).json({ error: 'Valid Ticket ID, category, and positive amount required.' });
        return;
      }
      res.status(201).json({
        challan: await addChallanItem({
          refId: String(refId),
          category: String(category),
          amount: Number(amount),
        }),
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/referrals', requireStaff, async (req: Request, res: Response) => {
    try {
      const { partner, client, work, credit } = req.body || {};
      if (!partner || !client || !work) {
        res.status(400).json({ error: 'Partner, client, and work description required.' });
        return;
      }
      res.status(201).json({
        referral: await addReferral({
          partner: String(partner),
          client: String(client),
          work: String(work),
          credit: String(credit || '₹500'),
        }),
      });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Daily Full JSON Backup & Restore (Staff Protected)
  app.get('/api/backup/export', requireStaff, async (_req: Request, res: Response) => {
    try {
      const backup = await exportFullBackup();
      const dateStr = new Date().toISOString().slice(0, 10);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="pragya-kendra-backup-${dateStr}.json"`);
      res.send(JSON.stringify(backup, null, 2));
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  app.post('/api/backup/restore', requireStaff, async (req: Request, res: Response) => {
    try {
      const summary = await restoreFullBackup(req.body || {});
      res.json({ ok: true, restored: summary });
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  });

  const httpServer = http.createServer(app);

  // Vite dev middleware or static dist serving
  if (process.env.NODE_ENV !== 'production') {
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: disableHmr ? false : { server: httpServer },
        ws: { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Pragya Kendra Portfolio server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
