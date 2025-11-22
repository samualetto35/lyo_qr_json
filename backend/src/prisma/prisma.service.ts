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
        if (tableNames.length > 0) {
          console.log(`📋 [PRISMA] Table names: ${tableNames.slice(0, 6).join(', ')}${tableNames.length > 6 ? `... (+${tableNames.length - 6} more)` : ''}`);
        }
        
        // Check specifically for attendance_sessions
        const hasAttendanceSessions = tableNames.includes('attendance_sessions');
        if (hasAttendanceSessions) {
          console.log('✅ [PRISMA] attendance_sessions table EXISTS - scheduler should work!');
        } else {
          console.error('❌ [PRISMA] attendance_sessions table NOT FOUND - scheduler will fail!');
          console.error(`❌ [PRISMA] Available tables: ${tableNames.join(', ') || 'NONE'}`);
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

