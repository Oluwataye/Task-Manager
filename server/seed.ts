import bcrypt from 'bcryptjs';
import { prisma } from './lib/prisma.js';

async function seed() {
  console.log('🌱 Starting database seed for Task Monitoring System...');

  // Clean existing database
  await prisma.taskAssignee.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.asset.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.property.deleteMany({});
  await prisma.invoice.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.company.deleteMany({});

  // 1. Create Demo Company
  const company = await prisma.company.create({
    data: {
      name: 'Acme Facilities Corp',
      systemName: 'Task Monitoring System',
      tagline: 'Track, assign, and monitor employee tasks in real-time',
      primaryColor: '#123C73',
      secondaryColor: '#1B4B82',
    },
  });

  console.log(`✅ Created Company: ${company.name}`);

  // 2. Hash default password
  const passwordHash = await bcrypt.hash('password123', 10);

  // 3. Create 8 Demo Users (one for each role)
  const usersData = [
    {
      fullName: 'Alex Vance',
      email: 'superadmin@acme.com',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
    {
      fullName: 'Sarah Connor',
      email: 'admin@acme.com',
      role: 'COMPANY_ADMIN',
      status: 'ACTIVE',
    },
    {
      fullName: 'David Miller',
      email: 'property@acme.com',
      role: 'PROPERTY_MANAGER',
      status: 'ACTIVE',
    },
    {
      fullName: 'Emily Watson',
      email: 'project@acme.com',
      role: 'PROJECT_MANAGER',
      status: 'ACTIVE',
    },
    {
      fullName: 'Robert Davis',
      email: 'facilities@acme.com',
      role: 'FACILITIES_MANAGER',
      status: 'ACTIVE',
    },
    {
      fullName: 'Michael Chang',
      email: 'finance@acme.com',
      role: 'FINANCE_OFFICER',
      status: 'ACTIVE',
    },
    {
      fullName: 'Jessica Taylor',
      email: 'staff@acme.com',
      role: 'STAFF',
      status: 'ACTIVE',
    },
    {
      fullName: 'Liam O\'Connor',
      email: 'contractor@acme.com',
      role: 'CONTRACTOR_TENANT',
      status: 'ACTIVE',
    },
  ];

  const createdUsers: Record<string, any> = {};
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        fullName: u.fullName,
        email: u.email,
        passwordHash,
        role: u.role,
        status: u.status,
      },
    });
    createdUsers[u.role] = user;
    console.log(`👤 Created User (${u.role}): ${u.fullName} [${u.email}]`);
  }

  // 4. Create Properties, Projects, Assets, Invoices
  const prop1 = await prisma.property.create({
    data: { companyId: company.id, name: 'Skyline Tower', address: '100 Financial District' },
  });
  const prop2 = await prisma.property.create({
    data: { companyId: company.id, name: 'Oceanview Plaza', address: '450 Harbor Drive' },
  });

  const proj1 = await prisma.project.create({
    data: { companyId: company.id, name: 'HVAC Upgrade Q3', propertyId: prop1.id },
  });
  const proj2 = await prisma.project.create({
    data: { companyId: company.id, name: 'Lobby Renovation', propertyId: prop2.id },
  });

  const asset1 = await prisma.asset.create({
    data: { companyId: company.id, name: 'Chiller Unit #1', maintenanceType: 'Quarterly Servicing', propertyId: prop1.id },
  });
  const asset2 = await prisma.asset.create({
    data: { companyId: company.id, name: 'Elevator Bank B', maintenanceType: 'Safety Inspection', propertyId: prop2.id },
  });

  const inv1 = await prisma.invoice.create({
    data: { companyId: company.id, invoiceNumber: 'INV-2026-001', amount: 14500.00, status: 'UNPAID', dueDate: new Date(Date.now() + 5 * 86400000) },
  });
  const inv2 = await prisma.invoice.create({
    data: { companyId: company.id, invoiceNumber: 'INV-2026-002', amount: 8200.50, status: 'PAID', dueDate: new Date(Date.now() - 10 * 86400000) },
  });

  // 5. Create 15 Realistic Sample Tasks
  const today = new Date();
  const pastDays = (d: number) => new Date(today.getTime() - d * 86400000);
  const futureDays = (d: number) => new Date(today.getTime() + d * 86400000);

  const adminId = createdUsers['COMPANY_ADMIN'].id;

  const tasksData = [
    {
      name: 'Quarterly HVAC Chiller Maintenance',
      description: 'Inspect compressor pressure, replace air filters, and clean condenser coils on Chiller Unit #1.',
      linkOrFile: 'https://drive.google.com/file/d/hvac-spec-sheet',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: futureDays(2),
      startDate: pastDays(1),
      notes: 'Technician on site; parts delivered.',
      assignees: [createdUsers['FACILITIES_MANAGER'].id, createdUsers['STAFF'].id],
      propertyId: prop1.id,
      assetId: asset1.id,
    },
    {
      name: 'Lobby Architectural Flooring Review',
      description: 'Review tile samples and sign off on contractor schedule for Oceanview Plaza lobby.',
      linkOrFile: 'https://docs.google.com/document/d/lobby-spec',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      dueDate: pastDays(2),
      startDate: pastDays(5),
      completionDate: pastDays(2),
      notes: 'Approved marble tile option B.',
      assignees: [createdUsers['PROJECT_MANAGER'].id, createdUsers['PROPERTY_MANAGER'].id],
      propertyId: prop2.id,
      projectId: proj2.id,
    },
    {
      name: 'Fire Alarm System Annual Inspection',
      description: 'Conduct full building sprinkler pressure and pull-station alarm tests.',
      priority: 'HIGH',
      status: 'NOT_STARTED',
      dueDate: futureDays(7),
      startDate: futureDays(1),
      notes: 'Notify tenants 48 hours prior.',
      assignees: [createdUsers['PROPERTY_MANAGER'].id, createdUsers['CONTRACTOR_TENANT'].id],
      propertyId: prop1.id,
    },
    {
      name: 'Q3 Facility Maintenance Invoice Audit',
      description: 'Verify invoice INV-2026-001 against vendor work logs and line item quotes.',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      dueDate: futureDays(1),
      startDate: pastDays(2),
      notes: 'Pending sign-off from Facilities head.',
      assignees: [createdUsers['FINANCE_OFFICER'].id],
      invoiceId: inv1.id,
    },
    {
      name: 'Elevator Safety Certificate Renewal',
      description: 'Submit state safety compliance inspection documents for Elevator Bank B.',
      priority: 'HIGH',
      status: 'OVERDUE', // status is NOT_STARTED, but due date is past => computes Overdue
      dueDate: pastDays(4),
      startDate: pastDays(10),
      notes: 'State inspector delayed response.',
      assignees: [createdUsers['FACILITIES_MANAGER'].id],
      propertyId: prop2.id,
      assetId: asset2.id,
    },
    {
      name: 'Tenant Lease Security Deposit Reconcile',
      description: 'Reconcile refunded deposits for Suite 402 move-out.',
      priority: 'LOW',
      status: 'COMPLETED',
      dueDate: pastDays(12),
      startDate: pastDays(15),
      completionDate: pastDays(11),
      notes: 'Check issued and cleared.',
      assignees: [createdUsers['FINANCE_OFFICER'].id, createdUsers['STAFF'].id],
      invoiceId: inv2.id,
    },
    {
      name: 'Roof Leak Inspection & Repair Request',
      description: 'Inspect East Wing roof after heavy rainfall report from 4th floor tenant.',
      priority: 'HIGH',
      status: 'ON_HOLD',
      dueDate: futureDays(4),
      startDate: pastDays(1),
      notes: 'Waiting for rain to subside before scaling roof.',
      assignees: [createdUsers['CONTRACTOR_TENANT'].id, createdUsers['STAFF'].id],
      propertyId: prop1.id,
    },
    {
      name: 'Parking Garage LED Retrofit Plan',
      description: 'Draft energy efficiency proposal to convert fluorescent fixtures to smart LED sensors.',
      priority: 'LOW',
      status: 'NOT_STARTED',
      dueDate: futureDays(14),
      startDate: futureDays(3),
      notes: 'Awaiting utility rebate quote.',
      assignees: [createdUsers['PROJECT_MANAGER'].id],
      projectId: proj1.id,
    },
    {
      name: 'Access Card Audit & Tenant Removal',
      description: 'Revoke keycards for departed staff members across all building access gates.',
      priority: 'MEDIUM',
      status: 'COMPLETED',
      dueDate: pastDays(1),
      startDate: pastDays(3),
      completionDate: pastDays(1),
      notes: 'Keycards disabled in database.',
      assignees: [createdUsers['STAFF'].id],
      propertyId: prop1.id,
    },
    {
      name: 'Emergency Generator Load Bank Test',
      description: 'Run 4-hour simulated blackout load test on main backup diesel generator.',
      priority: 'HIGH',
      status: 'NOT_STARTED',
      dueDate: futureDays(5),
      startDate: futureDays(2),
      notes: 'Fuel tanks filled to 95% capacity.',
      assignees: [createdUsers['FACILITIES_MANAGER'].id],
      propertyId: prop1.id,
    },
    {
      name: 'Quarterly Financial Tax Filing Prep',
      description: 'Compile asset depreciation schedules and vendor 1099 statements.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
      dueDate: futureDays(10),
      startDate: pastDays(3),
      notes: 'CPA review booked for next Thursday.',
      assignees: [createdUsers['FINANCE_OFFICER'].id],
    },
    {
      name: 'Plumbing Backflow Preventer Testing',
      description: 'Certify municipal backflow assemblies for commercial water service lines.',
      priority: 'MEDIUM',
      status: 'NOT_STARTED',
      dueDate: futureDays(12),
      startDate: futureDays(5),
      notes: 'Certifier scheduled for Tuesday morning.',
      assignees: [createdUsers['CONTRACTOR_TENANT'].id],
      propertyId: prop2.id,
    },
    {
      name: 'CCTV Security Camera NVR Migration',
      description: 'Migrate analog DVR system to IP-based Cloud NVR with 30-day retention.',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
      dueDate: futureDays(6),
      startDate: pastDays(4),
      notes: '12 out of 16 cameras rewired.',
      assignees: [createdUsers['PROJECT_MANAGER'].id, createdUsers['STAFF'].id],
      projectId: proj1.id,
    },
    {
      name: 'Janitorial Services Contract Renewal',
      description: 'Evaluate vendor performance metrics and negotiate annual cleaning contract terms.',
      priority: 'LOW',
      status: 'ON_HOLD',
      dueDate: futureDays(20),
      startDate: pastDays(2),
      notes: 'Seeking competitive bids from 2 alternative vendors.',
      assignees: [createdUsers['PROPERTY_MANAGER'].id],
      propertyId: prop2.id,
    },
    {
      name: 'Waste Management & Recycling Inspection',
      description: 'Ensure compliance with city organic waste separation guidelines.',
      priority: 'LOW',
      status: 'CANCELLED',
      dueDate: pastDays(5),
      startDate: pastDays(8),
      notes: 'Superseded by new city sanitation policy.',
      assignees: [createdUsers['STAFF'].id],
      propertyId: prop1.id,
    },
  ];

  for (const t of tasksData) {
    const { assignees, ...taskFields } = t;
    const task = await prisma.task.create({
      data: {
        ...taskFields,
        companyId: company.id,
        createdById: adminId,
        status: taskFields.status === 'OVERDUE' ? 'NOT_STARTED' : taskFields.status, // OVERDUE is derived
        assignees: {
          create: assignees.map((userId) => ({ userId })),
        },
      },
    });
    console.log(`📋 Created Task: "${task.name}" [Status: ${task.status}]`);
  }

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('----------------------------------------------------');
  console.log('DEMO ACCOUNTS READY TO LOGIN (Password for all: password123):');
  usersData.forEach((u) => {
    console.log(` Role: ${u.role.padEnd(20)} | Email: ${u.email}`);
  });
  console.log('----------------------------------------------------\n');
}

seed()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
