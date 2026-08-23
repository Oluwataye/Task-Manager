import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma.js';
import { authenticateJWT, AuthRequest, requireRoles } from '../middleware/auth.js';

const router = Router();

const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// GET company settings
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const company = await prisma.company.findUnique({
      where: { id: req.user!.companyId },
    });

    if (!company) return res.status(404).json({ error: 'Company not found' });
    return res.json({ company });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Upload Company Logo
router.post('/upload-logo', authenticateJWT, requireRoles(['SUPER_ADMIN', 'COMPANY_ADMIN']), upload.single('logo'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No logo file provided' });
    const logoUrl = `/uploads/${req.file.filename}`;

    const company = await prisma.company.update({
      where: { id: req.user!.companyId },
      data: { logoUrl },
    });

    return res.json({ message: 'Logo uploaded successfully', logoUrl, company });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Remove Company Logo
router.post('/remove-logo', authenticateJWT, requireRoles(['SUPER_ADMIN', 'COMPANY_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const company = await prisma.company.update({
      where: { id: req.user!.companyId },
      data: { logoUrl: null },
    });

    return res.json({ message: 'Logo removed', company });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Update System Settings
router.patch('/', authenticateJWT, requireRoles(['SUPER_ADMIN', 'COMPANY_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, systemName, tagline, primaryColor, secondaryColor } = req.body;

    const company = await prisma.company.update({
      where: { id: req.user!.companyId },
      data: {
        ...(name && { name }),
        ...(systemName && { systemName }),
        ...(tagline && { tagline }),
        ...(primaryColor && { primaryColor }),
        ...(secondaryColor && { secondaryColor }),
      },
    });

    return res.json({ message: 'Settings saved successfully', company });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
