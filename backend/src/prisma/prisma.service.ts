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
        const tables = await this.$queryRaw<Array<{ tablename: string }>>`
          SELECT tablename 
          FROM pg_tables 
          WHERE schemaname = 'public'
          ORDER BY tablename
        `;
        const tableNames = tables.map(t => t.tablename);
        console.log(`📊 [PRISMA] Database tables found: ${tableNames.length} tables`);
        console.log(`📋 [PRISMA] Table names: ${tableNames.join(', ')}`);
        
        // Check specifically for attendance_sessions
        const hasAttendanceSessions = tableNames.includes('attendance_sessions');
        if (hasAttendanceSessions) {
          console.log('✅ [PRISMA] attendance_sessions table exists!');
        } else {
          console.error('❌ [PRISMA] attendance_sessions table NOT found!');
        }
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

