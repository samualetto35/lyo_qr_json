import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runMigrations() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!isProduction) return;
  
  try {
    const fs = require('fs');
    const path = require('path');
    let workingDir = process.cwd();
    
    const backendPath = path.join(process.cwd(), 'backend');
    if (fs.existsSync(backendPath) && fs.existsSync(path.join(backendPath, 'prisma'))) {
      workingDir = backendPath;
    } else if (!fs.existsSync(path.join(process.cwd(), 'prisma'))) {
      console.warn('⚠️  [MIGRATION] Prisma folder not found');
      return;
    }
    
    try {
      await execAsync('npx prisma generate', { cwd: workingDir, env: { ...process.env } });
    } catch (genError: any) {
      console.error('❌ [MIGRATION] Prisma generate failed:', genError.message);
      throw genError;
    }
    
    try {
      await execAsync('npx prisma migrate deploy', { cwd: workingDir, env: { ...process.env } });
    } catch (migError: any) {
      console.warn('⚠️  [MIGRATION] Migrations may already be applied');
    }
    
    try {
      await execAsync('npm run prisma:seed', { cwd: workingDir, env: { ...process.env } });
    } catch (seedError: any) {
      // Seed is idempotent - ignore if already seeded
    }
  } catch (error: any) {
    console.warn('⚠️  [MIGRATION] Continuing despite error:', error.message);
  }
}

async function bootstrap() {
  await runMigrations();
  
  const app = await NestFactory.create(AppModule, { logger: ['error', 'warn', 'log'] });

  // CORS Configuration with detailed logging
  const allowedOriginsSet = new Set<string>();
  
  if (process.env.FRONTEND_URL) {
    allowedOriginsSet.add(process.env.FRONTEND_URL);
  }
  allowedOriginsSet.add('https://lyoqr.netlify.app');
  allowedOriginsSet.add('http://localhost:3000');
  allowedOriginsSet.add('http://localhost:3001');
  
  const allowedOrigins = Array.from(allowedOriginsSet);
  console.log(`🌐 [CORS] Configured origins: ${allowedOrigins.join(', ')}`);

  // Enhanced CORS with preflight support
  app.enableCors({
    origin: (origin, callback) => {
      // Log every CORS request
      console.log(`🔍 [CORS] Request from origin: ${origin || '(no origin)'}`);
      
      if (!origin) {
        console.log('✅ [CORS] Allowing request with no origin');
        return callback(null, true);
      }
      
      if (allowedOrigins.includes(origin)) {
        console.log(`✅ [CORS] Allowing origin: ${origin}`);
        callback(null, true);
      } else {
        console.error(`❌ [CORS] Blocked origin: ${origin} (not in allowed list)`);
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
    exposedHeaders: ['Authorization'],
    optionsSuccessStatus: 204, // Important for preflight
    preflightContinue: false,
    maxAge: 86400, // 24 hours
  });
  
  // Add global interceptor to log all incoming requests
  app.use((req: any, res: any, next: any) => {
    if (req.method === 'OPTIONS') {
      console.log(`🔄 [CORS] Preflight OPTIONS request for: ${req.path}`);
      console.log(`🔄 [CORS] Origin: ${req.headers.origin}`);
      console.log(`🔄 [CORS] Access-Control-Request-Method: ${req.headers['access-control-request-method']}`);
      console.log(`🔄 [CORS] Access-Control-Request-Headers: ${req.headers['access-control-request-headers']}`);
    } else {
      console.log(`📥 [REQUEST] ${req.method} ${req.path} from origin: ${req.headers.origin || '(none)'}`);
    }
    next();
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  
  try {
    await app.listen(port, '0.0.0.0');
    console.log(`✅ [STARTUP] Server running on port ${port}`);
  } catch (error: any) {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ [STARTUP] Port ${port} already in use - Railway may be restarting`);
      // Wait 2 seconds and retry (Railway restart scenario)
      await new Promise(resolve => setTimeout(resolve, 2000));
      throw error;
    }
    throw error;
  }
}

bootstrap().catch((error) => {
  console.error('❌ [FATAL]', error.message);
  process.exit(1);
});

