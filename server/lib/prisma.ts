import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

// Ensure DATABASE_URL is set for local/build environment
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./dev.db';
}

// Only swap to /tmp/dev.db at AWS Lambda / Netlify Function execution runtime (NOT during netlify build step)
const isAWSLambdaRuntime = !!(process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);

if (isAWSLambdaRuntime) {
  try {
    const tmpDbPath = '/tmp/dev.db';
    if (!fs.existsSync(tmpDbPath)) {
      const candidatePaths = [
        path.resolve('prisma/dev.db'),
        path.join(process.cwd(), 'prisma/dev.db'),
        '/var/task/prisma/dev.db',
      ];

      let copied = false;
      for (const p of candidatePaths) {
        if (fs.existsSync(p)) {
          fs.copyFileSync(p, tmpDbPath);
          console.log(`✅ Serverless Runtime: Copied pre-seeded database from ${p} -> ${tmpDbPath}`);
          copied = true;
          break;
        }
      }

      if (!copied) {
        console.warn('⚠️ Serverless Runtime: Pre-seeded database not found in candidates.');
      }
    }

    process.env.DATABASE_URL = 'file:/tmp/dev.db';
  } catch (err) {
    console.error('Error in serverless DB initialization:', err);
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
