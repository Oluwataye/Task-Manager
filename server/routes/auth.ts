import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { authenticateJWT, AuthRequest, JWT_SECRET } from '../middleware/auth.js';

const router = Router();

const defaultCompany = {
  id: 'demo-company-id',
  name: 'Acme Facilities Corp',
  systemName: 'Task Monitoring System',
  tagline: 'Track, assign, and monitor employee tasks in real-time',
  logoUrl: null,
  primaryColor: '#123C73',
  secondaryColor: '#1B4B82',
};

const demoUsersFallback: Record<string, { id: string; fullName: string; role: string }> = {
  'superadmin@acme.com': { id: 'demo-superadmin', fullName: 'Alex Vance', role: 'SUPER_ADMIN' },
  'admin@acme.com': { id: 'demo-admin', fullName: 'Sarah Connor', role: 'COMPANY_ADMIN' },
  'property@acme.com': { id: 'demo-property', fullName: 'David Miller', role: 'PROPERTY_MANAGER' },
  'project@acme.com': { id: 'demo-project', fullName: 'Emily Watson', role: 'PROJECT_MANAGER' },
  'facilities@acme.com': { id: 'demo-facilities', fullName: 'Robert Davis', role: 'FACILITIES_MANAGER' },
  'finance@acme.com': { id: 'demo-finance', fullName: 'Michael Chang', role: 'FINANCE_OFFICER' },
  'staff@acme.com': { id: 'demo-staff', fullName: 'Jessica Taylor', role: 'STAFF' },
  'contractor@acme.com': { id: 'demo-contractor', fullName: "Liam O'Connor", role: 'CONTRACTOR_TENANT' },
};

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (user) {
      if (user.status !== 'ACTIVE') {
        return res.status(403).json({ error: `Account is currently ${user.status.toLowerCase()}` });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (isMatch) {
        const payload = {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          companyId: user.companyId,
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        return res.json({
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            status: user.status,
            photoUrl: user.photoUrl,
            company: user.company,
          },
        });
      }
    }
  } catch (dbError) {
    console.error('Database query error during login:', dbError);
  }

  // Fallback handler for demo accounts if DB cold-start or lookup had issue
  const fallback = demoUsersFallback[email.toLowerCase()];
  if (fallback && password === 'password123') {
    const payload = {
      id: fallback.id,
      email,
      fullName: fallback.fullName,
      role: fallback.role,
      companyId: defaultCompany.id,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: 'Login successful (Demo Mode)',
      token,
      user: {
        id: fallback.id,
        fullName: fallback.fullName,
        email,
        role: fallback.role,
        status: 'ACTIVE',
        photoUrl: null,
        company: defaultCompany,
      },
    });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

// Demo switch role endpoint
router.post('/switch-role', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const { targetRole } = req.body;
    if (!targetRole) return res.status(400).json({ error: 'Target role required' });

    let targetUser: any = null;
    try {
      targetUser = await prisma.user.findFirst({
        where: {
          companyId: req.user!.companyId,
          role: targetRole,
        },
        include: { company: true },
      });
    } catch (e) {
      console.error(e);
    }

    if (!targetUser) {
      // Find fallback matching role
      const foundEntry = Object.entries(demoUsersFallback).find(([_, u]) => u.role === targetRole);
      if (foundEntry) {
        const [email, u] = foundEntry;
        targetUser = {
          id: u.id,
          fullName: u.fullName,
          email,
          role: u.role,
          status: 'ACTIVE',
          photoUrl: null,
          company: defaultCompany,
        };
      }
    }

    if (!targetUser) {
      return res.status(404).json({ error: `No demo user found for role ${targetRole}` });
    }

    const payload = {
      id: targetUser.id,
      email: targetUser.email,
      fullName: targetUser.fullName,
      role: targetUser.role,
      companyId: targetUser.companyId || defaultCompany.id,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      message: `Switched role to ${targetRole}`,
      token,
      user: {
        id: targetUser.id,
        fullName: targetUser.fullName,
        email: targetUser.email,
        role: targetUser.role,
        status: targetUser.status || 'ACTIVE',
        photoUrl: targetUser.photoUrl || null,
        company: targetUser.company || defaultCompany,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ message: 'Logged out successfully' });
});

// Current User profile
router.get('/me', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    let user: any = null;
    try {
      user = await prisma.user.findUnique({
        where: { id: req.user!.id },
        include: { company: true },
      });
    } catch (e) {
      console.error(e);
    }

    if (!user) {
      // Fallback check
      const fallback = Object.values(demoUsersFallback).find((u) => u.id === req.user!.id) || {
        id: req.user!.id,
        fullName: req.user!.fullName,
        role: req.user!.role,
      };

      return res.json({
        user: {
          id: fallback.id,
          fullName: fallback.fullName,
          email: req.user!.email,
          role: fallback.role,
          status: 'ACTIVE',
          photoUrl: null,
          company: defaultCompany,
        },
      });
    }

    return res.json({
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        status: user.status,
        photoUrl: user.photoUrl,
        company: user.company,
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

export default router;
