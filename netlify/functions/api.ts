/**
 * Standalone Netlify Function API
 * Uses in-memory data store with JWT auth — no Prisma/SQLite needed.
 * Data is pre-seeded at cold start. Writes are in-memory for the function lifetime.
 */

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import serverless from 'serverless-http';

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'task-monitor-jwt-secret-2026';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── In-Memory Data Store ──────────────────────────────────────────────────────

const PASSWORD_HASH = bcrypt.hashSync('password123', 10);
const COMPANY_ID = 'company-acme-001';
const today = new Date();
const past = (d: number) => new Date(today.getTime() - d * 86400000).toISOString();
const future = (d: number) => new Date(today.getTime() + d * 86400000).toISOString();

const company = {
  id: COMPANY_ID,
  name: 'Acme Facilities Corp',
  systemName: 'Task Monitoring System',
  tagline: 'Track, assign, and monitor employee tasks in real-time',
  logoUrl: null,
  primaryColor: '#123C73',
  secondaryColor: '#1B4B82',
  createdAt: past(30),
  updatedAt: past(1),
};

const users: any[] = [
  { id: 'user-superadmin', companyId: COMPANY_ID, fullName: 'Alex Vance', email: 'superadmin@acme.com', passwordHash: PASSWORD_HASH, role: 'SUPER_ADMIN', status: 'ACTIVE', photoUrl: null },
  { id: 'user-admin', companyId: COMPANY_ID, fullName: 'Sarah Connor', email: 'admin@acme.com', passwordHash: PASSWORD_HASH, role: 'COMPANY_ADMIN', status: 'ACTIVE', photoUrl: null },
  { id: 'user-property', companyId: COMPANY_ID, fullName: 'David Miller', email: 'property@acme.com', passwordHash: PASSWORD_HASH, role: 'PROPERTY_MANAGER', status: 'ACTIVE', photoUrl: null },
  { id: 'user-project', companyId: COMPANY_ID, fullName: 'Emily Watson', email: 'project@acme.com', passwordHash: PASSWORD_HASH, role: 'PROJECT_MANAGER', status: 'ACTIVE', photoUrl: null },
  { id: 'user-facilities', companyId: COMPANY_ID, fullName: 'Robert Davis', email: 'facilities@acme.com', passwordHash: PASSWORD_HASH, role: 'FACILITIES_MANAGER', status: 'ACTIVE', photoUrl: null },
  { id: 'user-finance', companyId: COMPANY_ID, fullName: 'Michael Chang', email: 'finance@acme.com', passwordHash: PASSWORD_HASH, role: 'FINANCE_OFFICER', status: 'ACTIVE', photoUrl: null },
  { id: 'user-staff', companyId: COMPANY_ID, fullName: 'Jessica Taylor', email: 'staff@acme.com', passwordHash: PASSWORD_HASH, role: 'STAFF', status: 'ACTIVE', photoUrl: null },
  { id: 'user-contractor', companyId: COMPANY_ID, fullName: "Liam O'Connor", email: 'contractor@acme.com', passwordHash: PASSWORD_HASH, role: 'CONTRACTOR_TENANT', status: 'ACTIVE', photoUrl: null },
];

const properties: any[] = [
  { id: 'prop-001', companyId: COMPANY_ID, name: 'Skyline Tower', address: '100 Financial District', createdAt: past(60) },
  { id: 'prop-002', companyId: COMPANY_ID, name: 'Oceanview Plaza', address: '450 Harbor Drive', createdAt: past(60) },
];

const projects: any[] = [
  { id: 'proj-001', companyId: COMPANY_ID, name: 'HVAC Upgrade Q3', propertyId: 'prop-001', createdAt: past(30) },
  { id: 'proj-002', companyId: COMPANY_ID, name: 'Lobby Renovation', propertyId: 'prop-002', createdAt: past(30) },
];

const assets: any[] = [
  { id: 'asset-001', companyId: COMPANY_ID, name: 'Chiller Unit #1', maintenanceType: 'Quarterly Servicing', propertyId: 'prop-001', createdAt: past(90) },
  { id: 'asset-002', companyId: COMPANY_ID, name: 'Elevator Bank B', maintenanceType: 'Safety Inspection', propertyId: 'prop-002', createdAt: past(90) },
];

const invoices: any[] = [
  { id: 'inv-001', companyId: COMPANY_ID, invoiceNumber: 'INV-2026-001', amount: 14500.00, status: 'UNPAID', dueDate: future(5), createdAt: past(10) },
  { id: 'inv-002', companyId: COMPANY_ID, invoiceNumber: 'INV-2026-002', amount: 8200.50, status: 'PAID', dueDate: past(10), createdAt: past(25) },
];

let tasks: any[] = [
  { id: 'task-001', companyId: COMPANY_ID, name: 'Quarterly HVAC Chiller Maintenance', description: 'Inspect compressor pressure, replace air filters, and clean condenser coils.', priority: 'HIGH', status: 'IN_PROGRESS', dueDate: future(2), startDate: past(1), notes: 'Technician on site; parts delivered.', createdById: 'user-admin', propertyId: 'prop-001', assetId: 'asset-001', projectId: 'proj-001', invoiceId: null, assigneeIds: ['user-facilities', 'user-staff'], createdAt: past(1), updatedAt: past(1) },
  { id: 'task-002', companyId: COMPANY_ID, name: 'Lobby Architectural Flooring Review', description: 'Review tile samples and sign off on contractor schedule for Oceanview Plaza lobby.', priority: 'MEDIUM', status: 'COMPLETED', dueDate: past(2), startDate: past(5), completionDate: past(2), notes: 'Approved marble tile option B.', createdById: 'user-admin', propertyId: 'prop-002', projectId: 'proj-002', assetId: null, invoiceId: null, assigneeIds: ['user-project', 'user-property'], createdAt: past(5), updatedAt: past(2) },
  { id: 'task-003', companyId: COMPANY_ID, name: 'Fire Alarm System Annual Inspection', description: 'Conduct full building sprinkler pressure and pull-station alarm tests.', priority: 'HIGH', status: 'NOT_STARTED', dueDate: future(7), startDate: future(1), notes: 'Notify tenants 48 hours prior.', createdById: 'user-admin', propertyId: 'prop-001', projectId: null, assetId: null, invoiceId: null, assigneeIds: ['user-property', 'user-contractor'], createdAt: past(3), updatedAt: past(3) },
  { id: 'task-004', companyId: COMPANY_ID, name: 'Q3 Facility Maintenance Invoice Audit', description: 'Verify invoice INV-2026-001 against vendor work logs and line item quotes.', priority: 'MEDIUM', status: 'IN_PROGRESS', dueDate: future(1), startDate: past(2), notes: 'Pending sign-off from Facilities head.', createdById: 'user-admin', propertyId: null, projectId: null, assetId: null, invoiceId: 'inv-001', assigneeIds: ['user-finance'], createdAt: past(2), updatedAt: past(2) },
  { id: 'task-005', companyId: COMPANY_ID, name: 'Elevator Safety Certificate Renewal', description: 'Submit state safety compliance inspection documents for Elevator Bank B.', priority: 'HIGH', status: 'NOT_STARTED', dueDate: past(4), startDate: past(10), notes: 'State inspector delayed response.', createdById: 'user-admin', propertyId: 'prop-002', assetId: 'asset-002', projectId: null, invoiceId: null, assigneeIds: ['user-facilities'], createdAt: past(10), updatedAt: past(4) },
  { id: 'task-006', companyId: COMPANY_ID, name: 'Tenant Lease Security Deposit Reconcile', description: 'Reconcile refunded deposits for Suite 402 move-out.', priority: 'LOW', status: 'COMPLETED', dueDate: past(12), startDate: past(15), completionDate: past(11), notes: 'Check issued and cleared.', createdById: 'user-admin', propertyId: null, projectId: null, assetId: null, invoiceId: 'inv-002', assigneeIds: ['user-finance', 'user-staff'], createdAt: past(15), updatedAt: past(11) },
  { id: 'task-007', companyId: COMPANY_ID, name: 'Roof Leak Inspection & Repair Request', description: 'Inspect East Wing roof after heavy rainfall report from 4th floor tenant.', priority: 'HIGH', status: 'ON_HOLD', dueDate: future(4), startDate: past(1), notes: 'Waiting for rain to subside before scaling roof.', createdById: 'user-admin', propertyId: 'prop-001', projectId: null, assetId: null, invoiceId: null, assigneeIds: ['user-contractor', 'user-staff'], createdAt: past(1), updatedAt: past(1) },
  { id: 'task-008', companyId: COMPANY_ID, name: 'Parking Garage LED Retrofit Plan', description: 'Draft energy efficiency proposal to convert fluorescent fixtures to smart LED sensors.', priority: 'LOW', status: 'NOT_STARTED', dueDate: future(14), startDate: future(3), notes: 'Awaiting utility rebate quote.', createdById: 'user-admin', propertyId: null, projectId: 'proj-001', assetId: null, invoiceId: null, assigneeIds: ['user-project'], createdAt: past(2), updatedAt: past(2) },
  { id: 'task-009', companyId: COMPANY_ID, name: 'Access Card Audit & Tenant Removal', description: 'Revoke keycards for departed staff members across all building access gates.', priority: 'MEDIUM', status: 'COMPLETED', dueDate: past(1), startDate: past(3), completionDate: past(1), notes: 'Keycards disabled in database.', createdById: 'user-admin', propertyId: 'prop-001', projectId: null, assetId: null, invoiceId: null, assigneeIds: ['user-staff'], createdAt: past(3), updatedAt: past(1) },
  { id: 'task-010', companyId: COMPANY_ID, name: 'Emergency Generator Load Bank Test', description: 'Run 4-hour simulated blackout load test on main backup diesel generator.', priority: 'HIGH', status: 'NOT_STARTED', dueDate: future(5), startDate: future(2), notes: 'Fuel tanks filled to 95% capacity.', createdById: 'user-admin', propertyId: 'prop-001', projectId: null, assetId: null, invoiceId: null, assigneeIds: ['user-facilities'], createdAt: past(5), updatedAt: past(5) },
  { id: 'task-011', companyId: COMPANY_ID, name: 'Quarterly Financial Tax Filing Prep', description: 'Compile asset depreciation schedules and vendor 1099 statements.', priority: 'HIGH', status: 'IN_PROGRESS', dueDate: future(10), startDate: past(3), notes: 'CPA review booked for next Thursday.', createdById: 'user-admin', propertyId: null, projectId: null, assetId: null, invoiceId: null, assigneeIds: ['user-finance'], createdAt: past(3), updatedAt: past(3) },
  { id: 'task-012', companyId: COMPANY_ID, name: 'Plumbing Backflow Preventer Testing', description: 'Certify municipal backflow assemblies for commercial water service lines.', priority: 'MEDIUM', status: 'NOT_STARTED', dueDate: future(12), startDate: future(5), notes: 'Certifier scheduled for Tuesday morning.', createdById: 'user-admin', propertyId: 'prop-002', projectId: null, assetId: null, invoiceId: null, assigneeIds: ['user-contractor'], createdAt: past(7), updatedAt: past(7) },
  { id: 'task-013', companyId: COMPANY_ID, name: 'CCTV Security Camera NVR Migration', description: 'Migrate analog DVR system to IP-based Cloud NVR with 30-day retention.', priority: 'MEDIUM', status: 'IN_PROGRESS', dueDate: future(6), startDate: past(4), notes: '12 out of 16 cameras rewired.', createdById: 'user-admin', propertyId: null, projectId: 'proj-001', assetId: null, invoiceId: null, assigneeIds: ['user-project', 'user-staff'], createdAt: past(4), updatedAt: past(4) },
  { id: 'task-014', companyId: COMPANY_ID, name: 'Janitorial Services Contract Renewal', description: 'Evaluate vendor performance metrics and negotiate annual cleaning contract terms.', priority: 'LOW', status: 'ON_HOLD', dueDate: future(20), startDate: past(2), notes: 'Seeking competitive bids from 2 alternative vendors.', createdById: 'user-admin', propertyId: 'prop-002', projectId: null, assetId: null, invoiceId: null, assigneeIds: ['user-property'], createdAt: past(2), updatedAt: past(2) },
  { id: 'task-015', companyId: COMPANY_ID, name: 'Waste Management & Recycling Inspection', description: 'Ensure compliance with city organic waste separation guidelines.', priority: 'LOW', status: 'CANCELLED', dueDate: past(5), startDate: past(8), notes: 'Superseded by new city sanitation policy.', createdById: 'user-admin', propertyId: 'prop-001', projectId: null, assetId: null, invoiceId: null, assigneeIds: ['user-staff'], createdAt: past(8), updatedAt: past(5) },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function computeDueStatus(t: any): string {
  if (!t.dueDate) return 'On Time';
  const due = new Date(t.dueDate);
  const now = new Date();
  if (['COMPLETED', 'CANCELLED'].includes(t.status)) return 'On Time';
  if (due < now) return 'Overdue';
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays <= 3) return 'Due Soon';
  return 'On Time';
}

function enrichTask(t: any) {
  const assignees = (t.assigneeIds || []).map((uid: string) => {
    const u = users.find((x) => x.id === uid);
    if (!u) return null;
    const { passwordHash, ...safeU } = u;
    return { taskId: t.id, userId: uid, user: { ...safeU, company } };
  }).filter(Boolean);

  const createdByUser = users.find((u) => u.id === t.createdById);
  const property = properties.find((p) => p.id === t.propertyId) || null;
  const project = projects.find((p) => p.id === t.projectId) || null;
  const asset = assets.find((a) => a.id === t.assetId) || null;
  const invoice = invoices.find((i) => i.id === t.invoiceId) || null;

  return {
    ...t,
    dueStatus: computeDueStatus(t),
    assignees,
    createdBy: createdByUser ? { id: createdByUser.id, fullName: createdByUser.fullName } : null,
    property,
    project,
    asset,
    invoice,
  };
}

function safeUser(u: any) {
  const { passwordHash, ...rest } = u;
  return { ...rest, company };
}

function authMiddleware(req: any, res: any, next: any) {
  try {
    const token = req.cookies?.token || req.headers?.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'Authentication required' });
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function issueToken(user: any) {
  return jwt.sign(
    { id: user.id, email: user.email, fullName: user.fullName, role: user.role, companyId: user.companyId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ─── Auth Routes ───────────────────────────────────────────────────────────────

app.post('/api/auth/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    if (user.status !== 'ACTIVE') return res.status(403).json({ error: `Account is ${user.status.toLowerCase()}` });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = issueToken(user);
    res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });

    return res.json({ message: 'Login successful', token, user: safeUser(user) });
  } catch (e: any) {
    console.error('Login error:', e);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

app.post('/api/auth/logout', (_req: any, res: any) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully' });
});

app.get('/api/auth/me', authMiddleware, (req: any, res: any) => {
  const user = users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user: safeUser(user) });
});

app.post('/api/auth/switch-role', authMiddleware, (req: any, res: any) => {
  const { targetRole } = req.body;
  const target = users.find((u) => u.role === targetRole && u.companyId === req.user.companyId);
  if (!target) return res.status(404).json({ error: `No user found for role: ${targetRole}` });
  const token = issueToken(target);
  res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
  return res.json({ message: `Switched to ${targetRole}`, token, user: safeUser(target) });
});

// ─── Task Routes ───────────────────────────────────────────────────────────────

app.get('/api/tasks', authMiddleware, (req: any, res: any) => {
  let allCompanyTasks = tasks.filter((t) => t.companyId === req.user.companyId);
  const { status, priority, assigneeId, search, propertyId, projectId, myTasksOnly, filterChip } = req.query;

  if (myTasksOnly === 'true' || req.user.role === 'STAFF') {
    allCompanyTasks = allCompanyTasks.filter((t) => t.assigneeIds.includes(req.user.id));
  }

  let result = allCompanyTasks;
  if (status && status !== 'ALL' && status !== 'All Status') result = result.filter((t) => t.status === status);
  if (priority && priority !== 'ALL' && priority !== 'All Priority') result = result.filter((t) => t.priority === priority);
  if (assigneeId && assigneeId !== 'ALL') result = result.filter((t) => (t.assigneeIds || []).includes(assigneeId));
  if (propertyId) result = result.filter((t) => t.propertyId === propertyId);
  if (projectId) result = result.filter((t) => t.projectId === projectId);
  if (search) result = result.filter((t) => t.name.toLowerCase().includes((search as string).toLowerCase()));

  const enrichedAll = result.map(enrichTask);

  let filtered = enrichedAll;
  if (filterChip === 'In Progress') {
    filtered = enrichedAll.filter((t) => t.status === 'IN_PROGRESS');
  } else if (filterChip === 'Completed') {
    filtered = enrichedAll.filter((t) => t.status === 'COMPLETED');
  } else if (filterChip === 'Overdue') {
    filtered = enrichedAll.filter((t) => t.dueStatus === 'Overdue');
  } else if (filterChip === 'Visible') {
    filtered = enrichedAll.filter((t) => t.status !== 'CANCELLED');
  }

  const counts = {
    visible: enrichedAll.filter((t) => t.status !== 'CANCELLED').length,
    inProgress: enrichedAll.filter((t) => t.status === 'IN_PROGRESS').length,
    completed: enrichedAll.filter((t) => t.status === 'COMPLETED').length,
    overdue: enrichedAll.filter((t) => t.dueStatus === 'Overdue').length,
    total: enrichedAll.length,
  };

  return res.json({ tasks: filtered, counts });
});

app.get('/api/tasks/:id', authMiddleware, (req: any, res: any) => {
  const task = tasks.find((t) => t.id === req.params.id && t.companyId === req.user.companyId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  return res.json({ task: enrichTask(task) });
});

app.post('/api/tasks', authMiddleware, (req: any, res: any) => {
  const { assigneeIds = [], ...rest } = req.body;
  const newTask = {
    id: `task-${Date.now()}`,
    companyId: req.user.companyId,
    createdById: req.user.id,
    assigneeIds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: rest.status || 'NOT_STARTED',
    priority: rest.priority || 'MEDIUM',
    ...rest,
  };
  tasks.push(newTask);
  return res.status(201).json({ task: enrichTask(newTask) });
});

const handleUpdateTask = (req: any, res: any) => {
  const idx = tasks.findIndex((t) => t.id === req.params.id && t.companyId === req.user.companyId);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });
  const { assigneeIds, status, ...rest } = req.body;

  let updateFields: any = { ...rest };
  if (status) {
    updateFields.status = status;
    if (status === 'COMPLETED' && !tasks[idx].completionDate) {
      updateFields.completionDate = new Date().toISOString();
    }
  }

  tasks[idx] = {
    ...tasks[idx],
    ...updateFields,
    assigneeIds: assigneeIds ?? tasks[idx].assigneeIds,
    updatedAt: new Date().toISOString(),
  };

  return res.json({ task: enrichTask(tasks[idx]) });
};

app.put('/api/tasks/:id', authMiddleware, handleUpdateTask);
app.patch('/api/tasks/:id', authMiddleware, handleUpdateTask);

app.delete('/api/tasks/:id', authMiddleware, (req: any, res: any) => {
  const idx = tasks.findIndex((t) => t.id === req.params.id && t.companyId === req.user.companyId);
  if (idx === -1) return res.status(404).json({ error: 'Task not found' });
  tasks.splice(idx, 1);
  return res.json({ message: 'Task deleted' });
});

// ─── User Routes ───────────────────────────────────────────────────────────────

app.get('/api/users', authMiddleware, (req: any, res: any) => {
  const companyUsers = users.filter((u) => u.companyId === req.user.companyId).map(safeUser);
  return res.json({ users: companyUsers });
});

app.get('/api/users/:id', authMiddleware, (req: any, res: any) => {
  const user = users.find((u) => u.id === req.params.id && u.companyId === req.user.companyId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user: safeUser(user) });
});

app.post('/api/users', authMiddleware, async (req: any, res: any) => {
  const { fullName, email, role, password = 'password123', status = 'ACTIVE' } = req.body;
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'Email already in use' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = { id: `user-${Date.now()}`, companyId: req.user.companyId, fullName, email, passwordHash, role, status, photoUrl: null };
  users.push(newUser);
  return res.status(201).json({ user: safeUser(newUser) });
});

const handleUpdateUser = async (req: any, res: any) => {
  const idx = users.findIndex((u) => u.id === req.params.id && u.companyId === req.user.companyId);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  const { password, ...rest } = req.body;
  if (password) rest.passwordHash = await bcrypt.hash(password, 10);
  users[idx] = { ...users[idx], ...rest };
  return res.json({ user: safeUser(users[idx]) });
};

app.put('/api/users/:id', authMiddleware, handleUpdateUser);
app.patch('/api/users/:id', authMiddleware, handleUpdateUser);

app.delete('/api/users/:id', authMiddleware, (req: any, res: any) => {
  const idx = users.findIndex((u) => u.id === req.params.id && u.companyId === req.user.companyId);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users.splice(idx, 1);
  return res.json({ message: 'User deleted' });
});

// ─── Settings / Company Routes ─────────────────────────────────────────────────

app.get('/api/settings/company', authMiddleware, (_req: any, res: any) => {
  return res.json({ company });
});

const handleUpdateCompany = (req: any, res: any) => {
  Object.assign(company, req.body);
  return res.json({ company });
};

app.put('/api/settings/company', authMiddleware, handleUpdateCompany);
app.patch('/api/settings/company', authMiddleware, handleUpdateCompany);

// ─── Domain/Properties/Projects/Assets Routes ─────────────────────────────────

app.get('/api/domain/properties', authMiddleware, (_req: any, res: any) => res.json({ properties }));
app.post('/api/domain/properties', authMiddleware, (req: any, res: any) => {
  const newProp = { id: `prop-${Date.now()}`, companyId: req.user.companyId, ...req.body, createdAt: new Date().toISOString() };
  properties.push(newProp);
  return res.status(201).json({ property: newProp });
});

const handleUpdateProperty = (req: any, res: any) => {
  const idx = properties.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Property not found' });
  properties[idx] = { ...properties[idx], ...req.body };
  return res.json({ property: properties[idx] });
};
app.put('/api/domain/properties/:id', authMiddleware, handleUpdateProperty);
app.patch('/api/domain/properties/:id', authMiddleware, handleUpdateProperty);

app.delete('/api/domain/properties/:id', authMiddleware, (req: any, res: any) => {
  const idx = properties.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Property not found' });
  properties.splice(idx, 1);
  return res.json({ message: 'Deleted' });
});

app.get('/api/domain/projects', authMiddleware, (_req: any, res: any) => res.json({ projects }));
app.post('/api/domain/projects', authMiddleware, (req: any, res: any) => {
  const newProj = { id: `proj-${Date.now()}`, companyId: req.user.companyId, ...req.body, createdAt: new Date().toISOString() };
  projects.push(newProj);
  return res.status(201).json({ project: newProj });
});

const handleUpdateProject = (req: any, res: any) => {
  const idx = projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });
  projects[idx] = { ...projects[idx], ...req.body };
  return res.json({ project: projects[idx] });
};
app.put('/api/domain/projects/:id', authMiddleware, handleUpdateProject);
app.patch('/api/domain/projects/:id', authMiddleware, handleUpdateProject);

app.delete('/api/domain/projects/:id', authMiddleware, (req: any, res: any) => {
  const idx = projects.findIndex((p) => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Project not found' });
  projects.splice(idx, 1);
  return res.json({ message: 'Deleted' });
});

app.get('/api/domain/assets', authMiddleware, (_req: any, res: any) => res.json({ assets }));
app.post('/api/domain/assets', authMiddleware, (req: any, res: any) => {
  const newAsset = { id: `asset-${Date.now()}`, companyId: req.user.companyId, ...req.body, createdAt: new Date().toISOString() };
  assets.push(newAsset);
  return res.status(201).json({ asset: newAsset });
});

const handleUpdateAsset = (req: any, res: any) => {
  const idx = assets.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Asset not found' });
  assets[idx] = { ...assets[idx], ...req.body };
  return res.json({ asset: assets[idx] });
};
app.put('/api/domain/assets/:id', authMiddleware, handleUpdateAsset);
app.patch('/api/domain/assets/:id', authMiddleware, handleUpdateAsset);

app.delete('/api/domain/assets/:id', authMiddleware, (req: any, res: any) => {
  const idx = assets.findIndex((a) => a.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Asset not found' });
  assets.splice(idx, 1);
  return res.json({ message: 'Deleted' });
});

app.get('/api/domain/invoices', authMiddleware, (_req: any, res: any) => res.json({ invoices }));
app.post('/api/domain/invoices', authMiddleware, (req: any, res: any) => {
  const newInv = { id: `inv-${Date.now()}`, companyId: req.user.companyId, ...req.body, createdAt: new Date().toISOString() };
  invoices.push(newInv);
  return res.status(201).json({ invoice: newInv });
});

// ─── Reports Route ─────────────────────────────────────────────────────────────

app.get('/api/reports/summary', authMiddleware, (_req: any, res: any) => {
  const summary = {
    totalTasks: tasks.length,
    notStarted: tasks.filter((t) => t.status === 'NOT_STARTED').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter((t) => t.status === 'COMPLETED').length,
    onHold: tasks.filter((t) => t.status === 'ON_HOLD').length,
    cancelled: tasks.filter((t) => t.status === 'CANCELLED').length,
    overdue: tasks.filter((t) => t.dueDate && new Date(t.dueDate) < new Date() && !['COMPLETED', 'CANCELLED'].includes(t.status)).length,
    highPriority: tasks.filter((t) => t.priority === 'HIGH').length,
    totalUsers: users.length,
    totalProperties: properties.length,
    totalProjects: projects.length,
    totalAssets: assets.length,
  };
  return res.json({ summary });
});

// ─── Health Check ──────────────────────────────────────────────────────────────

app.get('/api/health', (_req: any, res: any) => {
  return res.json({ status: 'ok', mode: 'in-memory', time: new Date().toISOString() });
});

// ─── JSON Fallback for Unknown API Routes ──────────────────────────────────────

app.use('/api/*', (_req: any, res: any) => {
  return res.status(404).json({ error: 'API route not found' });
});

// ─── Export ────────────────────────────────────────────────────────────────────

export const handler = serverless(app);
