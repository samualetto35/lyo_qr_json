import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAttendanceSessionDto, UpdateAttendanceRecordDto, AddStudentToSessionDto } from '../dto/attendance.dto';
import { AuditService } from '../../admin/services/audit.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TeacherAttendanceService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async createSession(courseId: string, dto: CreateAttendanceSessionDto, teacherId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have access to this course');
    }

    // Get system settings
    const settings = await this.prisma.systemSettings.findFirst();

    if (!settings) {
      throw new BadRequestException('System settings not configured');
    }

    // Validate duration
    const durationMinutes = dto.duration_minutes || settings.maxSessionDurationMinutes;

    if (
      durationMinutes < settings.minSessionDurationMinutes ||
      durationMinutes > settings.maxSessionDurationMinutes
    ) {
      throw new BadRequestException(
        `Duration must be between ${settings.minSessionDurationMinutes} and ${settings.maxSessionDurationMinutes} minutes`,
      );
    }

    const now = new Date();
    
    // Extract only the date portion for sessionDate (no time component)
    let sessionDate: Date;
    if (dto.session_date) {
      // Parse YYYY-MM-DD format
      const dateStr = dto.session_date;
      // Ensure we create a date without timezone issues
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        sessionDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      } else {
        sessionDate = new Date(dateStr);
      }
    } else {
      // Use today's date at midnight local time
      const today = new Date();
      sessionDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }
    
    const qrToken = uuidv4();
    const qrExpiresAt = dto.duration_minutes
      ? new Date(now.getTime() + dto.duration_minutes * 60000)
      : null;
    const hardExpiresAt = new Date(now.getTime() + settings.maxSessionDurationMinutes * 60000);

    try {
      const session = await this.prisma.attendanceSession.create({
        data: {
          courseId,
          teacherId,
          sessionName: dto.session_name,
          sessionDate,
          startTime: now,
          isOpen: true,
          qrToken,
          qrExpiresAt,
          hardExpiresAt,
        },
      });

      // Log audit after successful creation
      await this.auditService.log({
        actorType: 'teacher',
        actorId: teacherId,
        action: 'CREATE_ATTENDANCE_SESSION',
        entityType: 'attendance_session',
        entityId: session.id,
        afterData: {
          courseId,
          sessionName: session.sessionName,
          sessionDate: session.sessionDate,
        },
      }).catch(err => {
        // Log audit error but don't fail the session creation
        console.error('Failed to log audit:', err);
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const qrUrl = `${frontendUrl}/attendance/qr?session_id=${session.id}&token=${qrToken}`;

      return {
        attendance_session_id: session.id,
        qr_url: qrUrl,
        qr_token: qrToken,
        qr_expires_at: qrExpiresAt,
        hard_expires_at: hardExpiresAt,
        session_date: sessionDate,
      };
    } catch (error) {
      console.error('Error creating attendance session:', error);
      throw error;
    }
  }

  async closeSession(sessionId: string, teacherId: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have access to this session');
    }

    if (!session.isOpen) {
      throw new BadRequestException('Session is already closed');
    }

    const updated = await this.prisma.attendanceSession.update({
      where: { id: sessionId },
      data: {
        isOpen: false,
        endTime: new Date(),
      },
    });

    await this.auditService.log({
      actorType: 'teacher',
      actorId: teacherId,
      action: 'CLOSE_ATTENDANCE_SESSION',
      entityType: 'attendance_session',
      entityId: sessionId,
      afterData: { endTime: updated.endTime },
    });

    return {
      is_open: updated.isOpen,
      end_time: updated.endTime,
    };
  }

  async getSessionDetails(sessionId: string, teacherId: string) {
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        course: {
          select: { name: true, code: true },
        },
        attendanceRecords: {
          include: {
            student: true,
          },
          orderBy: { submittedAt: 'desc' },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have access to this session');
    }

    return {
      session: {
        id: session.id,
        session_name: session.sessionName,
        session_date: session.sessionDate,
        start_time: session.startTime,
        end_time: session.endTime,
        is_open: session.isOpen,
        qr_token: session.qrToken,
        qr_expires_at: session.qrExpiresAt,
        hard_expires_at: session.hardExpiresAt,
        course: session.course,
      },
      records: session.attendanceRecords.map((r) => ({
        id: r.id,
        student_id: r.student.studentId,
        student_name: `${r.student.firstName} ${r.student.lastName}`,
        status: r.status,
        submitted_at: r.submittedAt,
        submitted_via: r.submittedVia,
        client_device_id: r.clientDeviceId ? r.clientDeviceId.substring(0, 8) + '...' : null,
        client_ip: r.clientIp,
        fraud_flag_reason: r.fraudFlagReason,
      })),
    };
  }

  async getCourseAttendance(
    courseId: string,
    teacherId: string,
    filters: { from_date?: string; to_date?: string; student_id?: string },
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have access to this course');
    }

    const where: any = { courseId };

    if (filters.from_date) {
      where.sessionDate = { ...where.sessionDate, gte: new Date(filters.from_date) };
    }

    if (filters.to_date) {
      where.sessionDate = { ...where.sessionDate, lte: new Date(filters.to_date) };
    }

    const sessions = await this.prisma.attendanceSession.findMany({
      where,
      include: {
        attendanceRecords: {
          include: {
            student: true,
          },
          where: filters.student_id
            ? {
                student: {
                  studentId: { contains: filters.student_id, mode: 'insensitive' as const },
                },
              }
            : undefined,
        },
        course: {
          include: {
            enrollments: true,
          },
        },
      },
      orderBy: { sessionDate: 'desc' },
    });

    return sessions.map((s) => ({
      session_id: s.id,
      session_name: s.sessionName,
      session_date: s.sessionDate,
      is_open: s.isOpen,
      present_count: s.attendanceRecords.filter(
        (r) => r.status === 'present' || r.status === 'manual_present',
      ).length,
      total_students: s.course.enrollments.length, // Total enrolled students in the course
      attendance_count: s.attendanceRecords.length, // Number of students who submitted attendance
    }));
  }

  async updateAttendanceRecord(
    recordId: string,
    dto: UpdateAttendanceRecordDto,
    teacherId: string,
  ) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id: recordId },
      include: {
        attendanceSession: true,
      },
    });

    if (!record) {
      throw new NotFoundException('Attendance record not found');
    }

    if (record.attendanceSession.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have access to this record');
    }

    const updated = await this.prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        status: dto.status,
        fraudFlagReason: dto.fraud_flag_reason,
        submittedVia: 'manual',
        submittedByTeacherId: teacherId,
      },
    });

    await this.auditService.log({
      actorType: 'teacher',
      actorId: teacherId,
      action: 'UPDATE_ATTENDANCE',
      entityType: 'attendance_record',
      entityId: recordId,
      beforeData: { status: record.status },
      afterData: { status: updated.status },
    });

    return {
      id: updated.id,
      status: updated.status,
      fraud_flag_reason: updated.fraudFlagReason,
    };
  }

  async addStudentToSession(
    sessionId: string,
    dto: AddStudentToSessionDto,
    teacherId: string,
  ) {
    // Verify session access
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        course: {
          include: {
            enrollments: {
              include: {
                student: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have access to this session');
    }

    // Find the student
    const student = await this.prisma.student.findUnique({
      where: { id: dto.student_id },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Verify student is enrolled in this course
    const enrollment = session.course.enrollments.find(
      (e) => e.studentId === student.id,
    );

    if (!enrollment) {
      throw new BadRequestException('Student is not enrolled in this course');
    }

    // Check if student already has an attendance record for this session
    const existing = await this.prisma.attendanceRecord.findFirst({
      where: {
        attendanceSessionId: sessionId,
        studentId: student.id,
      },
    });

    if (existing) {
      throw new BadRequestException('Student already has an attendance record for this session');
    }

    // Create attendance record
    const record = await this.prisma.attendanceRecord.create({
      data: {
        attendanceSessionId: sessionId,
        courseId: session.courseId,
        studentId: student.id,
        studentIdValue: student.studentId,
        status: 'manual_present',
        submittedAt: new Date(),
        submittedVia: 'manual',
        submittedByTeacherId: teacherId,
        clientIp: null,
        clientDeviceId: null,
        clientGeoLat: null,
        clientGeoLng: null,
        fraudFlagReason: null,
      },
    });

    // Log audit
    await this.auditService.log({
      actorType: 'teacher',
      actorId: teacherId,
      action: 'MANUAL_ADD_ATTENDANCE',
      entityType: 'attendance_record',
      entityId: record.id,
      afterData: {
        sessionId,
        studentId: student.studentId,
        studentName: `${student.firstName} ${student.lastName}`,
      },
    }).catch(err => {
      console.error('Failed to log audit:', err);
    });

    return {
      id: record.id,
      student_id: student.studentId,
      student_name: `${student.firstName} ${student.lastName}`,
      status: record.status,
      submitted_at: record.submittedAt,
    };
  }

  async removeStudentFromSession(
    recordId: string,
    teacherId: string,
  ) {
    // Get the record with session details
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id: recordId },
      include: {
        attendanceSession: true,
        student: true,
      },
    });

    if (!record) {
      throw new NotFoundException('Attendance record not found');
    }

    if (record.attendanceSession.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have access to this record');
    }

    // Log audit before deletion
    await this.auditService.log({
      actorType: 'teacher',
      actorId: teacherId,
      action: 'MANUAL_REMOVE_ATTENDANCE',
      entityType: 'attendance_record',
      entityId: recordId,
      beforeData: {
        sessionId: record.attendanceSessionId,
        studentId: record.student.studentId,
        studentName: `${record.student.firstName} ${record.student.lastName}`,
        status: record.status,
      },
    }).catch(err => {
      console.error('Failed to log audit:', err);
    });

    // Delete the record
    await this.prisma.attendanceRecord.delete({
      where: { id: recordId },
    });

    return {
      success: true,
      message: 'Student removed from attendance session',
    };
  }

  async getEligibleStudentsForSession(
    sessionId: string,
    teacherId: string,
  ) {
    // Verify session access
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        course: {
          include: {
            enrollments: {
              include: {
                student: true,
              },
            },
          },
        },
        attendanceRecords: {
          select: {
            studentId: true,
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.teacherId !== teacherId) {
      throw new ForbiddenException('You do not have access to this session');
    }

    // Get students who haven't submitted attendance yet
    const submittedStudentIds = session.attendanceRecords.map((r) => r.studentId);
    const eligibleStudents = session.course.enrollments
      .filter((e) => !submittedStudentIds.includes(e.studentId))
      .map((e) => ({
        id: e.student.id,
        student_id: e.student.studentId,
        first_name: e.student.firstName,
        last_name: e.student.lastName,
        full_name: `${e.student.firstName} ${e.student.lastName}`,
      }));

    return eligibleStudents;
  }
}

