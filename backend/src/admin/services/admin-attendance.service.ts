import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';

@Injectable()
export class AdminAttendanceService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async getCourseAttendance(
    courseId: string,
    filters: { from_date?: string; to_date?: string; student_id?: string },
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
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
      },
      orderBy: { sessionDate: 'desc' },
    });

    return sessions.map((s) => ({
      session_id: s.id,
      session_name: s.sessionName,
      session_date: s.sessionDate,
      is_open: s.isOpen,
      present_count: s.attendanceRecords.filter((r) => r.status === 'present' || r.status === 'manual_present').length,
      total_records: s.attendanceRecords.length,
    }));
  }

  async getAllSessions(filters: {
    course_id?: string;
    teacher_id?: string;
    from_date?: string;
    to_date?: string;
    status?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }) {
    const where: any = {};

    if (filters.course_id) where.courseId = filters.course_id;
    if (filters.teacher_id) where.teacherId = filters.teacher_id;

    if (filters.from_date) {
      where.sessionDate = { ...where.sessionDate, gte: new Date(filters.from_date) };
    }

    if (filters.to_date) {
      where.sessionDate = { ...where.sessionDate, lte: new Date(filters.to_date) };
    }

    if (filters.status) {
      if (filters.status === 'open') {
        where.isOpen = true;
      } else if (filters.status === 'closed') {
        where.isOpen = false;
      }
    }

    // Determine sorting
    let orderBy: any = { sessionDate: 'desc' }; // default
    if (filters.sort_by === 'close_time') {
      orderBy = { endTime: filters.sort_order || 'desc' };
    } else if (filters.sort_by === 'updated') {
      orderBy = { updatedAt: filters.sort_order || 'desc' };
    }

    const sessions = await this.prisma.attendanceSession.findMany({
      where,
      include: {
        course: {
          select: { 
            name: true, 
            code: true,
            enrollments: {
              select: { id: true }, // Just count
            },
          },
        },
        teacher: {
          select: { firstName: true, lastName: true },
        },
        attendanceRecords: {
          select: { 
            id: true,
            status: true,
          },
        },
      },
      orderBy,
    });

    // Calculate attendance rate and return enriched data
    return sessions.map((s) => {
      const enrolledCount = s.course.enrollments.length;
      const attendanceCount = s.attendanceRecords.length;
      const presentCount = s.attendanceRecords.filter(
        (r) => r.status === 'present' || r.status === 'manual_present'
      ).length;
      const attendanceRate = enrolledCount > 0 
        ? Math.round((attendanceCount / enrolledCount) * 100) 
        : 0;

      return {
        id: s.id,
        session_name: s.sessionName,
        session_date: s.sessionDate,
        start_time: s.startTime,
        end_time: s.endTime,
        is_open: s.isOpen,
        course_id: s.courseId,
        course: s.course,
        teacher_name: `${s.teacher.firstName} ${s.teacher.lastName}`,
        teacher_id: s.teacherId,
        enrolled_count: enrolledCount,
        attendance_count: attendanceCount,
        present_count: presentCount,
        attendance_rate: attendanceRate,
        updated_at: s.updatedAt,
        created_at: s.createdAt,
      };
    });
  }

  async updateAttendanceRecord(recordId: string, status: string, fraudFlagReason: string | null, adminId: string) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new NotFoundException('Attendance record not found');
    }

    const updated = await this.prisma.attendanceRecord.update({
      where: { id: recordId },
      data: {
        status,
        fraudFlagReason,
        submittedVia: 'manual',
        submittedByTeacherId: null,
      },
    });

    await this.auditService.log({
      actorType: 'admin',
      actorId: adminId,
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

  async getFraudSignals(filters: {
    course_id?: string;
    teacher_id?: string;
    signal_type?: string;
  }) {
    const where: any = {};

    if (filters.course_id) where.courseId = filters.course_id;
    if (filters.signal_type) where.signalType = filters.signal_type;

    const signals = await this.prisma.fraudSignal.findMany({
      where,
      include: {
        attendanceSession: {
          include: {
            course: {
              select: { name: true },
            },
            teacher: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        student: {
          select: { studentId: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Enrich fraud signals with additional data
    const enrichedSignals = await Promise.all(
      signals.map(async (s) => {
        let firstAcceptedStudent: { student_id: string; name: string } | null = null;

        // For "multiple_ids_same_device", find the first accepted student
        if (s.signalType === 'multiple_ids_same_device' && s.clientDeviceId && s.attendanceSessionId) {
          const acceptedRecord = await this.prisma.attendanceRecord.findFirst({
            where: {
              clientDeviceId: s.clientDeviceId,
              attendanceSessionId: s.attendanceSessionId,
              status: { in: ['present', 'manual_present'] },
            },
            orderBy: { submittedAt: 'asc' },
          });

          if (acceptedRecord) {
            const studentData = await this.prisma.student.findUnique({
              where: { id: acceptedRecord.studentId },
              select: { studentId: true, firstName: true, lastName: true },
            });
            
            if (studentData) {
              firstAcceptedStudent = {
                student_id: studentData.studentId,
                name: `${studentData.firstName} ${studentData.lastName}`,
              };
            }
          }
        }

        return {
          id: s.id,
          signal_type: s.signalType,
          details: s.details,
          client_device_id: s.clientDeviceId,
          client_ip: s.clientIp,
          session_id: s.attendanceSessionId,
          session_name: s.attendanceSession?.sessionName || null,
          course_name: s.attendanceSession?.course?.name || null,
          teacher_name: s.attendanceSession
            ? `${s.attendanceSession.teacher.firstName} ${s.attendanceSession.teacher.lastName}`
            : null,
          flagged_student: s.student
            ? {
                student_id: s.student.studentId,
                name: `${s.student.firstName} ${s.student.lastName}`,
              }
            : null,
          first_accepted_student: firstAcceptedStudent,
          created_at: s.createdAt,
        };
      }),
    );

    return enrichedSignals;
  }

  async getTeachersList() {
    const teachers = await this.prisma.teacher.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: { lastName: 'asc' },
    });

    return teachers.map((t) => ({
      id: t.id,
      name: `${t.firstName} ${t.lastName}`,
      email: t.email,
    }));
  }

  async getCoursesList() {
    const courses = await this.prisma.course.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
      },
      orderBy: { name: 'asc' },
    });

    return courses;
  }

  async getSessionDetails(sessionId: string, filters: {
    search?: string;
    status_filter?: string;
  }) {
    // Get session with course and teacher info
    const session = await this.prisma.attendanceSession.findUnique({
      where: { id: sessionId },
      include: {
        course: {
          select: {
            name: true,
            code: true,
            enrollments: {
              include: {
                student: {
                  select: {
                    id: true,
                    studentId: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        teacher: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        attendanceRecords: {
          include: {
            student: {
              select: {
                id: true,
                studentId: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Attendance session not found');
    }

    // Get all enrolled students
    const enrolledStudents = session.course.enrollments.map(e => e.student);
    
    // Get students who attended
    const attendedStudentIds = new Set(
      session.attendanceRecords.map(r => r.student.id)
    );

    // Separate present and absent students
    let presentStudents = session.attendanceRecords.map(r => ({
      id: r.student.id,
      student_id: r.student.studentId,
      first_name: r.student.firstName,
      last_name: r.student.lastName,
      full_name: `${r.student.firstName} ${r.student.lastName}`,
      status: r.status,
      submitted_at: r.submittedAt,
      submitted_via: r.submittedVia,
    }));

    let absentStudents = enrolledStudents
      .filter(s => !attendedStudentIds.has(s.id))
      .map(s => ({
        id: s.id,
        student_id: s.studentId,
        first_name: s.firstName,
        last_name: s.lastName,
        full_name: `${s.firstName} ${s.lastName}`,
      }));

    // Apply search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      presentStudents = presentStudents.filter(s => 
        s.student_id.toLowerCase().includes(searchLower) ||
        s.full_name.toLowerCase().includes(searchLower)
      );
      absentStudents = absentStudents.filter(s => 
        s.student_id.toLowerCase().includes(searchLower) ||
        s.full_name.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (filters.status_filter) {
      if (filters.status_filter === 'present') {
        absentStudents = [];
      } else if (filters.status_filter === 'absent') {
        presentStudents = [];
      }
    }

    return {
      session: {
        id: session.id,
        session_name: session.sessionName,
        session_date: session.sessionDate,
        start_time: session.startTime,
        end_time: session.endTime,
        is_open: session.isOpen,
      },
      course: {
        name: session.course.name,
        code: session.course.code,
      },
      teacher: {
        name: `${session.teacher.firstName} ${session.teacher.lastName}`,
        email: session.teacher.email,
      },
      statistics: {
        total_enrolled: enrolledStudents.length,
        total_present: session.attendanceRecords.length,
        total_absent: enrolledStudents.length - session.attendanceRecords.length,
      },
      present_students: presentStudents,
      absent_students: absentStudents,
    };
  }
}

