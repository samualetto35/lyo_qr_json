import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
      console.log('✅ [DB] Connected');
      
      // Quick check for critical table
      const result = await this.$queryRaw<Array<{ count: bigint }>>`
        SELECT count(*) as count FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'attendance_sessions'
      `;
      if (result[0]?.count === BigInt(0)) {
        console.error('❌ [DB] attendance_sessions table missing!');
      }
    } catch (error: any) {
      console.error('❌ [DB] Connection failed:', error.message);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('👋 Database disconnected');
  }
}

