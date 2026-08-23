import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

export async function ensureSeed() {
  try {
    const companyCount = await prisma.company.count();
    if (companyCount > 0) {
      return; // Database already seeded
    }

    console.log('🌱 Database empty. Executing auto-seed for production environment...');

    const company = await prisma.company.create({
      data: {
        name: 'Acme Facilities Corp',
        systemName: 'Task Monitoring System',
        tagline: 'Track, assign, and monitor employee tasks in real-time',
        primaryColor: '#123C73',
        secondaryColor: '#1B4B82',
      },
    });

    const passwordHash = await bcrypt.hash('password123', 10);

    const usersData = [
      { fullName: 'Alex Vance', email: 'superadmin@acme.com', role: 'SUPER_ADMIN' },
      { fullName: 'Sarah Connor', email: 'admin@acme.com', role: 'COMPANY_ADMIN' },
      { fullName: 'David Miller', email: 'property@acme.com', role: 'PROPERTY_MANAGER' },
      { fullName: 'Emily Watson', email: 'project@acme.com', role: 'PROJECT_MANAGER' },
      { fullName: 'Robert Davis', email: 'facilities@acme.com', role: 'FACILITIES_MANAGER' },
      { fullName: 'Michael Chang', email: 'finance@acme.com', role: 'FINANCE_OFFICER' },
      { fullName: 'Jessica Taylor', email: 'staff@acme.com', role: 'STAFF' },
      { fullName: 'Liam O\'Connor', email: 'contractor@acme.com', role: 'CONTRACTOR_TENANT' },
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
          status: 'ACTIVE',
        },
      });
      createdUsers[u.role] = user;
    }

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

    const today = new Date();
    const pastDays = (d: number) => new Date(today.getTime() - d * 86400000);
    const futureDays = (d: number) => new Date(today.getTime() + d * 86400000);

    const adminId = createdUsers['COMPANY_ADMIN'].id;

    const tasksData = [
      {
        name: 'Quarterly HVAC Chiller Maintenance',
        description: 'Inspect compressor pressure, replace air filters, and clean condenser coils on Chiller Unit #1.',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        dueDate: futureDays(2),
        startDate: pastDays(1),
        assignees: [createdUsers['FACILITIES_MANAGER'].id, createdUsers['STAFF'].id],
        propertyId: prop1.id,
        assetId: asset1.id,
      },
      {
        name: 'Lobby Architectural Flooring Review',
        description: 'Review tile samples and sign off on contractor schedule for Oceanview Plaza lobby.',
        priority: 'MEDIUM',
        status: 'COMPLETED',
        dueDate: pastDays(2),
        startDate: pastDays(5),
        completionDate: pastDays(2),
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
        assignees: [createdUsers['FINANCE_OFFICER'].id],
        invoiceId: inv1.id,
      },
    ];

    for (const t of tasksData) {
      const { assignees, ...taskFields } = t;
      await prisma.task.create({
        data: {
          ...taskFields,
          companyId: company.id,
          createdById: adminId,
          assignees: {
            create: assignees.map((userId) => ({ userId })),
          },
        },
      });
    }

    console.log('🎉 Production auto-seed completed successfully!');
  } catch (err) {
    console.error('Error during ensureSeed:', err);
  }
}
