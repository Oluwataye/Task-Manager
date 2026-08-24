export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  companyId: string;
  action: string; // e.g. LOGIN, LOGOUT, USER_CREATE, USER_UPDATE, ROLE_CHANGE, SETTINGS_UPDATE, PROPERTY_DELETE, INVOICE_CREATE
  targetResource?: string | null;
  targetId?: string | null;
  details?: string | null;
  ip?: string | null;
}

// In-memory audit log store (pre-seeded with baseline audit events)
const auditLogs: AuditLogEntry[] = [
  {
    id: 'audit-001',
    timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
    userId: 'user-superadmin',
    userEmail: 'superadmin@acme.com',
    userRole: 'SUPER_ADMIN',
    companyId: 'company-acme-001',
    action: 'SYSTEM_INITIALIZATION',
    targetResource: 'SYSTEM',
    targetId: 'company-acme-001',
    details: 'System seeded and baseline RBAC security parameters loaded.',
    ip: '127.0.0.1',
  },
  {
    id: 'audit-002',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    userId: 'user-admin',
    userEmail: 'admin@acme.com',
    userRole: 'COMPANY_ADMIN',
    companyId: 'company-acme-001',
    action: 'USER_LOGIN',
    targetResource: 'AUTH',
    targetId: 'user-admin',
    details: 'Successful administrator login via email/password.',
    ip: '127.0.0.1',
  },
];

export function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) {
  const log: AuditLogEntry = {
    id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
  auditLogs.unshift(log);
  // Keep max 500 logs in memory
  if (auditLogs.length > 500) {
    auditLogs.pop();
  }
  return log;
}

export function getAuditLogs(companyId: string): AuditLogEntry[] {
  return auditLogs.filter((l) => l.companyId === companyId);
}
