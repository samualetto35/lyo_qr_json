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
      console.log('📦 [STARTUP] Generating Prisma Client...');
      await execAsync('npx prisma generate', { cwd: process.cwd() });
      console.log('✅ [STARTUP] Prisma Client generated');
      
      console.log('🗄️  [STARTUP] Running database migrations...');
      const { stdout, stderr } = await execAsync('npx prisma migrate deploy', { 
        cwd: process.cwd(),
        env: { ...process.env }
      });
      
      if (stdout) console.log('📋 [MIGRATION]', stdout.trim());
      if (stderr && !stderr.includes('Already applied')) {
        console.warn('⚠️  [MIGRATION]', stderr.trim());
      }
      
      console.log('✅ [STARTUP] Migrations completed');
      
      // Run seed only if migrations were successful
      console.log('🌱 [STARTUP] Running database seed...');
      try {
        await execAsync('npm run prisma:seed', { 
          cwd: process.cwd(),
          env: { ...process.env }
        });
        console.log('✅ [STARTUP] Seed completed');
      } catch (seedError: any) {
        // Seed is idempotent, so errors are usually fine (already seeded)
        if (seedError.stdout) console.log('📋 [SEED]', seedError.stdout.trim());
        if (!seedError.message?.includes('duplicate key')) {
          console.warn('⚠️  [SEED]', seedError.message || 'Seed may have already run');
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
  // Production: Allow only frontend URL
  // Development: Allow localhost
  const allowedOrigins = process.env.FRONTEND_URL
    ? [process.env.FRONTEND_URL]
    : [
        'http://localhost:3000',
        'http://localhost:3001',
      ];

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

