import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runMigrations() {
  console.log('🔄 [STARTUP] Checking database migrations...');
  
  try {
    // Check if we're in production (Railway sets NODE_ENV=production)
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      // Determine working directory - try backend folder first
      const fs = require('fs');
      const path = require('path');
      let workingDir = process.cwd();
      
      // Check if we're in root and backend folder exists
      const backendPath = path.join(process.cwd(), 'backend');
      if (fs.existsSync(backendPath) && fs.existsSync(path.join(backendPath, 'prisma'))) {
        workingDir = backendPath;
        console.log('📁 [STARTUP] Found backend folder, using:', workingDir);
      } else if (fs.existsSync(path.join(process.cwd(), 'prisma'))) {
        workingDir = process.cwd();
        console.log('📁 [STARTUP] Using current directory:', workingDir);
      } else {
        console.warn('⚠️  [STARTUP] Could not find prisma folder, trying current directory');
      }
      
      console.log('📦 [STARTUP] Generating Prisma Client in:', workingDir);
      try {
        await execAsync('npx prisma generate', { 
          cwd: workingDir,
          env: { ...process.env }
        });
        console.log('✅ [STARTUP] Prisma Client generated');
      } catch (genError: any) {
        console.error('❌ [STARTUP] Prisma generate failed:', genError.message);
        if (genError.stdout) console.log('📋 [STDOUT]', genError.stdout.trim());
        if (genError.stderr) console.error('📋 [STDERR]', genError.stderr.trim());
        throw genError;
      }
      
      console.log('🗄️  [STARTUP] Running database migrations in:', workingDir);
      try {
        const { stdout, stderr } = await execAsync('npx prisma migrate deploy', { 
          cwd: workingDir,
          env: { ...process.env }
        });
        
        if (stdout) console.log('📋 [MIGRATION]', stdout.trim());
        if (stderr && !stderr.includes('Already applied') && !stderr.includes('No pending migrations')) {
          console.warn('⚠️  [MIGRATION]', stderr.trim());
        }
        
        console.log('✅ [STARTUP] Migrations completed');
      } catch (migError: any) {
        console.error('❌ [STARTUP] Migration failed:', migError.message);
        if (migError.stdout) console.log('📋 [MIGRATION STDOUT]', migError.stdout.trim());
        if (migError.stderr) console.error('📋 [MIGRATION STDERR]', migError.stderr.trim());
        // Continue anyway - migration might already be applied
        console.warn('⚠️  [STARTUP] Continuing despite migration error (may already be applied)');
      }
      
      // Run seed only if migrations were successful
      console.log('🌱 [STARTUP] Running database seed in:', workingDir);
      try {
        const { stdout, stderr } = await execAsync('npm run prisma:seed', { 
          cwd: workingDir,
          env: { ...process.env }
        });
        if (stdout) console.log('📋 [SEED]', stdout.trim());
        console.log('✅ [STARTUP] Seed completed');
      } catch (seedError: any) {
        // Seed is idempotent, so errors are usually fine (already seeded)
        if (seedError.stdout) console.log('📋 [SEED STDOUT]', seedError.stdout.trim());
        if (seedError.stderr && !seedError.stderr.includes('duplicate key')) {
          console.warn('⚠️  [SEED]', seedError.stderr.trim());
        } else {
          console.log('ℹ️  [SEED] Database already seeded (skipped)');
        }
      }
    } else {
      console.log('ℹ️  [STARTUP] Development mode - skipping migrations (use: npm run prisma:migrate)');
    }
  } catch (error: any) {
    console.error('❌ [STARTUP] Migration error:', error.message);
    if (error.stdout) console.log('📋 [MIGRATION STDOUT]', error.stdout.trim());
    if (error.stderr) console.error('📋 [MIGRATION STDERR]', error.stderr.trim());
    // Don't exit - let backend start anyway (migrations might already be applied)
    console.warn('⚠️  [STARTUP] Continuing despite migration error (may already be applied)');
  }
}

async function bootstrap() {
  console.log('🚀 [STARTUP] Initializing QR Attendance Backend...');
  console.log(`📁 [STARTUP] Working directory: ${process.cwd()}`);
  console.log(`🌍 [STARTUP] NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`🔌 [STARTUP] DATABASE_URL: ${process.env.DATABASE_URL ? 'set' : 'NOT SET'}`);
  
  // Run migrations BEFORE creating the app
  await runMigrations();
  
  console.log('🏗️  [STARTUP] Creating NestJS application...');
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  // Production: Allow frontend URL (Netlify) and localhost for development
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://lyoqr.netlify.app',
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean); // Remove undefined values

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
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

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`✅ [STARTUP] QR Attendance Backend is running on: http://localhost:${port}`);
  console.log(`📚 [STARTUP] API documentation: http://localhost:${port}/api/v1`);
  console.log(`🎉 [STARTUP] Startup process completed successfully!`);
}

bootstrap().catch((error) => {
  console.error('❌ [STARTUP] Fatal error during bootstrap:', error);
  process.exit(1);
});

bootstrap();

