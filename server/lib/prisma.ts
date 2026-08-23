import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

// Default DATABASE_URL if not explicitly set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

const isServerless = !!(
  process.env.NETLIFY ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.VERCEL
);

if (isServerless) {
  try {
    const tmpDbPath = '/tmp/dev.db';
    if (!fs.existsSync(tmpDbPath)) {
      // Look for pre-seeded database file in bundle locations
      const candidatePaths = [
        path.resolve('prisma/dev.db'),
        path.join(process.cwd(), 'prisma/dev.db'),
        path.join(__dirname, '../../prisma/dev.db'),
        '/var/task/prisma/dev.db',
      ];

      let copied = false;
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          fs.copyFileSync(p, tmpDbPath);
          console.log(`✅ Serverless: Copied pre-seeded database from ${p} -> ${tmpDbPath}`);
          copied = true;
          break;
        }
      }

      if (!copied) {
        console.warn('⚠️ Serverless: Pre-seeded database file not found in candidate paths. Will create via ensureSeed.');
      }
    }

    process.env.DATABASE_URL = 'file:/tmp/dev.db';
  } catch (err) {
    console.error('Error handling serverless SQLite DB setup:', err);
    process.env.DATABASE_URL = 'file:/tmp/dev.db';
  }
}

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});
