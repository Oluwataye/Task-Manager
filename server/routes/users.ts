import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { prisma } from '../lib/prisma.js';
import { authenticateJWT, AuthRequest, requireRoles } from '../middleware/auth.js';

const router = Router();

// Storage setup for user avatars & uploads
const uploadsDir = path.resolve('uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Upload single avatar
router.post('/upload-photo', authenticateJWT, upload.single('photo'), (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const photoUrl = `/uploads/${req.file.filename}`;
  return res.json({ photoUrl });
});

// GET all users
router.get('/', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { search, role, status } = req.query;
    const user = req.user!;

    const where: any = { companyId: user.companyId };
    if (role && role !== 'ALL') where.role = String(role);
    if (status && status !== 'ALL') where.status = String(status);
    if (search) {
      where.OR = [
        { fullName: { contains: String(search) } },
        { email: { contains: String(search) } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        photoUrl: true,
        createdAt: true,
      },
    });

    return res.json({ users });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// POST Create user (Admin only)
router.post('/', authenticateJWT, requireRoles(['SUPER_ADMIN', 'COMPANY_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { fullName, email, password, role = 'STAFF', status = 'ACTIVE', photoUrl } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({ error: 'Full Name, Email, and Password are required' });
    }

    // Role privilege restriction: Only Super Admin can create Super Admin accounts
    if (role === 'SUPER_ADMIN' && req.user!.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Only Super Admin can assign the Super Admin role' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'A user with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        companyId: req.user!.companyId,
        fullName,
        email,
        passwordHash,
        role,
        status,
        photoUrl: photoUrl || null,
      },
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        photoUrl: newUser.photoUrl,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// PATCH Update User
router.patch('/:id', authenticateJWT, requireRoles(['SUPER_ADMIN', 'COMPANY_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, email, password, role, status, photoUrl } = req.body;

    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (status !== undefined) updateData.status = status;
    if (photoUrl !== undefined) updateData.photoUrl = photoUrl;

    if (password && password.trim() !== '') {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        status: true,
        photoUrl: true,
        createdAt: true,
      },
    });

    return res.json({ message: 'User updated successfully', user: updatedUser });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// DELETE User
router.delete('/:id', authenticateJWT, requireRoles(['SUPER_ADMIN', 'COMPANY_ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot delete your own active session account' });
    }

    await prisma.user.delete({ where: { id } });
    return res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
