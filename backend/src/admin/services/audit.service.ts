import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(data: {
    actorType: 'admin' | 'teacher' | 'system';
    actorId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    beforeData?: any;
    afterData?: any;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          actorType: data.actorType,
          actorId: data.actorId || null,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId || null,
          beforeData: data.beforeData || null,
          afterData: data.afterData || null,
        },
      });
    } catch (error) {
      // Log error but don't throw - audit logging should not break main functionality
      console.error('Failed to create audit log:', error);
    }
  }
}

