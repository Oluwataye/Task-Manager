export type Role =
  | 'SUPER_ADMIN'
  | 'COMPANY_ADMIN'
  | 'PROPERTY_MANAGER'
  | 'PROJECT_MANAGER'
  | 'FACILITIES_MANAGER'
  | 'FINANCE_OFFICER'
  | 'STAFF'
  | 'CONTRACTOR_TENANT';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED';

export type DueStatus = 'On Time' | 'Due Soon' | 'Overdue';

export interface Company {
  id: string;
  name: string;
  systemName: string;
  tagline: string;
  logoUrl?: string | null;
  primaryColor: string;
  secondaryColor: string;
  maintenanceTypes?: string[];
  reportStatuses?: string[];
  reportPriorities?: string[];
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  status: UserStatus;
  photoUrl?: string | null;
  createdAt?: string;
  company?: Company;
}

export interface TaskAssignee {
  taskId: string;
  userId: string;
  user: User;
}

export interface Task {
  id: string;
  companyId: string;
  name: string;
  description?: string | null;
  linkOrFile?: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
  startDate?: string | null;
  completionDate?: string | null;
  notes?: string | null;
  dueStatus: DueStatus;
  createdById: string;
  createdBy?: { id: string; fullName: string };
  assignees: TaskAssignee[];
  propertyId?: string | null;
  property?: { id: string; name: string };
  projectId?: string | null;
  project?: { id: string; name: string };
  assetId?: string | null;
  asset?: { id: string; name: string };
  invoiceId?: string | null;
  invoice?: { id: string; invoiceNumber: string };
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  name: string;
  address?: string | null;
  tasks?: Task[];
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  propertyId?: string | null;
  property?: Property;
  tasks?: Task[];
  createdAt: string;
}

export interface Asset {
  id: string;
  name: string;
  maintenanceType?: string | null;
  propertyId?: string | null;
  property?: Property;
  tasks?: Task[];
  createdAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: 'UNPAID' | 'PAID' | 'OVERDUE';
  dueDate: string;
  tasks?: Task[];
  createdAt: string;
}

export interface TaskFilterCounts {
  visible: number;
  inProgress: number;
  completed: number;
  overdue: number;
  total: number;
}
