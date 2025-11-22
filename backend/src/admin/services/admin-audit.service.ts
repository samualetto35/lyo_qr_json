import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminAuditService {
  constructor(private prisma: PrismaService) {}

  async getAuditLogs(filters: {
    action?: string;
    actorType?: string;
    entityType?: string;
    search?: string;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.action) {
      where.action = { contains: filters.action, mode: 'insensitive' };
    }

    if (filters.actorType) {
      where.actorType = filters.actorType;
    }

    if (filters.entityType) {
      where.entityType = filters.entityType;
    }

    // Search in action, entity type, or entity ID
    if (filters.search) {
      where.OR = [
        { action: { contains: filters.search, mode: 'insensitive' } },
        { entityType: { contains: filters.search, mode: 'insensitive' } },
        { entityId: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters.limit || 100,
    });

    // Fetch related teacher/admin names and session details for better readability
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        let actorName = 'System';
        let sessionName: string | null = null;
        let studentFullName: string | null = null;
        let courseName: string | null = null;
        let courseTeacherEmail: string | null = null;
        
        // Get actor name
        if (log.actorId && log.actorType === 'teacher') {
          const teacher = await this.prisma.teacher.findUnique({
            where: { id: log.actorId },
            select: { firstName: true, lastName: true, email: true },
          });
          if (teacher) {
            actorName = `${teacher.firstName} ${teacher.lastName} (${teacher.email})`;
          }
        } else if (log.actorId && log.actorType === 'admin') {
          const admin = await this.prisma.admin.findUnique({
            where: { id: log.actorId },
            select: { firstName: true, lastName: true, email: true },
          });
          if (admin) {
            actorName = `${admin.firstName} ${admin.lastName} (${admin.email})`;
          }
        }

        // Get session name if this is a session-related action
        if (log.entityType === 'attendance_session' && log.entityId) {
          const session = await this.prisma.attendanceSession.findUnique({
            where: { id: log.entityId },
            select: { sessionName: true },
          });
          if (session) {
            sessionName = session.sessionName;
          }
        }

        // Get course name and teacher email for CREATE_COURSE action
        if (log.action === 'CREATE_COURSE' && log.entityType === 'course' && log.entityId) {
          const course = await this.prisma.course.findUnique({
            where: { id: log.entityId },
            select: { 
              name: true,
              teacher: {
                select: { email: true },
              },
            },
          });
          if (course) {
            courseName = course.name;
            courseTeacherEmail = course.teacher?.email || null;
          }
        }

        // Get session name from after_data or before_data if available
        if (!sessionName && log.afterData && typeof log.afterData === 'object') {
          const data = log.afterData as any;
          if (data.sessionId) {
            const session = await this.prisma.attendanceSession.findUnique({
              where: { id: data.sessionId },
              select: { sessionName: true },
            });
            if (session) {
              sessionName = session.sessionName;
            }
          }
          // Also get student full name from studentId
          if (data.studentId && typeof data.studentId === 'string' && data.studentId.startsWith('S')) {
            const student = await this.prisma.student.findFirst({
              where: { studentId: data.studentId },
              select: { firstName: true, lastName: true },
            });
            if (student) {
              studentFullName = `${student.firstName} ${student.lastName}`;
            }
          }
        }

        // Also check before_data for removed students and session info
        if (log.beforeData && typeof log.beforeData === 'object') {
          const data = log.beforeData as any;
          
          // Get student full name for removed students
          if (!studentFullName && data.studentId && typeof data.studentId === 'string' && data.studentId.startsWith('S')) {
            const student = await this.prisma.student.findFirst({
              where: { studentId: data.studentId },
              select: { firstName: true, lastName: true },
            });
            if (student) {
              studentFullName = `${student.firstName} ${student.lastName}`;
            }
          }
          
          // Get session name for removed attendance records
          if (!sessionName && data.sessionId) {
            const session = await this.prisma.attendanceSession.findUnique({
              where: { id: data.sessionId },
              select: { sessionName: true },
            });
            if (session) {
              sessionName = session.sessionName;
            }
          }
        }

        return {
          id: log.id,
          actor_type: log.actorType,
          actor_name: actorName,
          action: log.action,
          entity_type: log.entityType,
          entity_id: log.entityId,
          before_data: log.beforeData,
          after_data: log.afterData,
          session_name: sessionName,
          student_full_name: studentFullName,
          course_name: courseName,
          course_teacher_email: courseTeacherEmail,
          created_at: log.createdAt,
        };
      }),
    );

    return enrichedLogs;
  }
}

