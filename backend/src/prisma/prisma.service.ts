import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    console.log('🔌 [PRISMA] Attempting to connect to database...');
    try {
      await this.$connect();
      console.log('✅ [PRISMA] Database connected successfully');
      
      // Test query to verify tables exist
      try {
        const tableCount = await this.$queryRaw`
          SELECT count(*) as count 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
        `;
        console.log(`📊 [PRISMA] Database tables check: ${JSON.stringify(tableCount)}`);
      } catch (testError: any) {
        console.warn('⚠️  [PRISMA] Could not verify tables:', testError.message);
      }
    } catch (error: any) {
      console.error('❌ [PRISMA] Database connection failed:', error.message);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('👋 Database disconnected');
  }
}

