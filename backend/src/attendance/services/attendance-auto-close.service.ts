import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AttendanceAutoCloseService {
  private readonly logger = new Logger(AttendanceAutoCloseService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async autoCloseSessions() {
    const now = new Date();

    // Find all open sessions that have passed their hard_expires_at
    const expiredSessions = await this.prisma.attendanceSession.findMany({
      where: {
        isOpen: true,
        hardExpiresAt: {
          lt: now,
        },
      },
    });

    if (expiredSessions.length === 0) {
      return;
    }

    this.logger.log(`Auto-closing ${expiredSessions.length} expired session(s)...`);

    // Close each expired session
    for (const session of expiredSessions) {
      await this.prisma.attendanceSession.update({
        where: { id: session.id },
        data: {
          isOpen: false,
          endTime: session.hardExpiresAt,
        },
      });

      this.logger.log(`Closed session ${session.id} (Course: ${session.courseId})`);
    }

    // Log to audit
    await this.prisma.auditLog.create({
      data: {
        actorType: 'system',
        actorId: null,
        action: 'AUTO_CLOSE_SESSIONS',
        entityType: 'attendance_session',
        entityId: null,
        afterData: {
          closed_count: expiredSessions.length,
          session_ids: expiredSessions.map((s) => s.id),
        },
      },
    });
  }
}

