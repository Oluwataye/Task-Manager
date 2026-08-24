import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticateJWT, requireRoles, AuthRequest } from '../middleware/auth.js';

const router = Router();

// --- Properties ---
router.get('/properties', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const properties = await prisma.property.findMany({
      where: { companyId: req.user!.companyId },
      include: {
        tasks: {
          include: {
            assignees: { include: { user: true } },
          },
        },
      },
    });
    return res.json({ properties });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/properties', authenticateJWT, requireRoles(['SUPER_ADMIN', 'COMPANY_ADMIN', 'PROPERTY_MANAGER']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, address } = req.body;
    if (!name) return res.status(400).json({ error: 'Property name required' });
    const property = await prisma.property.create({
      data: {
        companyId: req.user!.companyId,
        name,
        address,
      },
    });
    return res.status(201).json({ property });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// --- Projects ---
router.get('/projects', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      where: { companyId: req.user!.companyId },
      include: {
        property: true,
        tasks: {
          include: {
            assignees: { include: { user: true } },
          },
        },
      },
    });
    return res.json({ projects });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/projects', authenticateJWT, requireRoles(['SUPER_ADMIN', 'COMPANY_ADMIN', 'PROJECT_MANAGER']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, propertyId } = req.body;
    if (!name) return res.status(400).json({ error: 'Project name required' });
    const project = await prisma.project.create({
      data: {
        companyId: req.user!.companyId,
        name,
        propertyId: propertyId || null,
      },
    });
    return res.status(201).json({ project });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// --- Assets ---
router.get('/assets', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const assets = await prisma.asset.findMany({
      where: { companyId: req.user!.companyId },
      include: {
        property: true,
        tasks: {
          include: {
            assignees: { include: { user: true } },
          },
        },
      },
    });
    return res.json({ assets });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/assets', authenticateJWT, requireRoles(['SUPER_ADMIN', 'COMPANY_ADMIN', 'FACILITIES_MANAGER']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, maintenanceType = 'Routine Maintenance', propertyId } = req.body;
    if (!name) return res.status(400).json({ error: 'Asset name required' });
    const asset = await prisma.asset.create({
      data: {
        companyId: req.user!.companyId,
        name,
        maintenanceType,
        propertyId: propertyId || null,
      },
    });
    return res.status(201).json({ asset });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// --- Invoices / Finance ---
router.get('/invoices', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { companyId: req.user!.companyId },
      include: {
        tasks: {
          include: {
            assignees: { include: { user: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ invoices });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/invoices', authenticateJWT, requireRoles(['SUPER_ADMIN', 'COMPANY_ADMIN', 'FINANCE_OFFICER']), async (req: AuthRequest, res: Response) => {
  try {
    const { invoiceNumber, amount, status = 'UNPAID', dueDate } = req.body;
    if (!invoiceNumber || !amount || !dueDate) {
      return res.status(400).json({ error: 'Invoice number, amount, and due date are required' });
    }
    const invoice = await prisma.invoice.create({
      data: {
        companyId: req.user!.companyId,
        invoiceNumber,
        amount: parseFloat(amount),
        status,
        dueDate: new Date(dueDate),
      },
    });
    return res.status(201).json({ invoice });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
