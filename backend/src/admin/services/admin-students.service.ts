import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentDto } from '../dto/student.dto';
import { normalizeStudentId } from '../../common/utils/normalization.util';

@Injectable()
export class AdminStudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: {
    search?: string;
    course_id?: string;
    sort_by?: string;
    sort_order?: string;
    page: number;
    limit: number;
  }) {
    const { search, course_id, sort_by, sort_order, page, limit } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (search) {
      where.OR = [
        { studentId: { contains: search, mode: 'insensitive' as const } },
        { firstName: { contains: search, mode: 'insensitive' as const } },
        { lastName: { contains: search, mode: 'insensitive' as const } },
      ];
    }

    if (course_id) {
      where.enrollments = {
        some: {
          courseId: course_id,
        },
      };
    }

    // Build order by
    let orderBy: any = { studentId: 'asc' };
    if (sort_by === 'name') {
      orderBy = { firstName: sort_order || 'asc' };
    } else if (sort_by === 'student_id') {
      orderBy = { studentId: sort_order || 'asc' };
    }

    // Fetch students with enrollments and attendance stats
    const [students, total] = await Promise.all([
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          enrollments: {
            include: {
              course: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          attendanceRecords: {
            select: {
              id: true,
              status: true,
              attendanceSession: {
                select: {
                  courseId: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.student.count({ where }),
    ]);

    // Format response with attendance stats per course
    const formattedStudents = await Promise.all(
      students.map(async (student) => {
        // Get courses and calculate absence count per course
        const coursesWithStats = await Promise.all(
          student.enrollments.map(async (enrollment) => {
            const courseId = enrollment.course.id;

            // Get total sessions for this course
            const totalSessions = await this.prisma.attendanceSession.count({
              where: {
                courseId,
                isOpen: false, // Only count closed sessions
              },
            });

            // Get student's attendance records for this course
            const studentAttendance = student.attendanceRecords.filter(
              (record) => record.attendanceSession.courseId === courseId,
            );

            const presentCount = studentAttendance.length;
            const absentCount = Math.max(0, totalSessions - presentCount);

            return {
              course_id: courseId,
              course_name: enrollment.course.name,
              course_code: enrollment.course.code,
              total_sessions: totalSessions,
              present_count: presentCount,
              absent_count: absentCount,
              attendance_rate:
                totalSessions > 0
                  ? Math.round((presentCount / totalSessions) * 100)
                  : 0,
            };
          }),
        );

        // Calculate total stats across all courses
        const totalSessions = coursesWithStats.reduce(
          (sum, c) => sum + c.total_sessions,
          0,
        );
        const totalPresent = coursesWithStats.reduce(
          (sum, c) => sum + c.present_count,
          0,
        );
        const totalAbsent = coursesWithStats.reduce(
          (sum, c) => sum + c.absent_count,
          0,
        );

        return {
          id: student.id,
          student_id: student.studentId,
          first_name: student.firstName,
          last_name: student.lastName,
          full_name: `${student.firstName} ${student.lastName}`,
          gender: student.gender,
          program: student.program,
          courses: coursesWithStats,
          total_courses: coursesWithStats.length,
          total_sessions: totalSessions,
          total_present: totalPresent,
          total_absent: totalAbsent,
          overall_attendance_rate:
            totalSessions > 0
              ? Math.round((totalPresent / totalSessions) * 100)
              : 0,
        };
      }),
    );

    return {
      data: formattedStudents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: {
            course: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        attendanceRecords: {
          include: {
            attendanceSession: {
              select: {
                id: true,
                sessionName: true,
                sessionDate: true,
                course: {
                  select: {
                    name: true,
                    code: true,
                  },
                },
              },
            },
          },
          orderBy: {
            submittedAt: 'desc',
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get all closed sessions for courses this student is enrolled in
    const allClosedSessions = await this.prisma.attendanceSession.findMany({
      where: {
        courseId: { in: student.enrollments.map(e => e.course.id) },
        isOpen: false,
      },
      include: {
        course: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    // Get medical reports for this student (by studentId)
    const healthSystemStudent = await this.prisma.healthSystemStudent.findUnique({
      where: { studentId: student.studentId },
      include: {
        medicalReports: true,
      },
    });

    const medicalReportDates = new Set(
      healthSystemStudent?.medicalReports.map(r => 
        r.reportDate.toISOString().split('T')[0]
      ) || []
    );

    // Group attendance by course
    const courseStats = new Map();

    for (const enrollment of student.enrollments) {
      const courseId = enrollment.course.id;
      const courseSessions = allClosedSessions.filter(s => s.courseId === courseId);
      const totalSessions = courseSessions.length;

      const studentSessions = student.attendanceRecords.filter(
        (r) => r.attendanceSession.course.code === enrollment.course.code,
      );

      // Calculate absent sessions (sessions where student has no record)
      const presentSessionIds = new Set(studentSessions.map(r => r.attendanceSession.id));
      const absentSessions = courseSessions.filter(s => !presentSessionIds.has(s.id));

      // Check which absent sessions have medical reports
      let absentCount = 0;
      let medicalReportCount = 0;

      for (const session of absentSessions) {
        const sessionDateStr = session.sessionDate.toISOString().split('T')[0];
        if (medicalReportDates.has(sessionDateStr)) {
          medicalReportCount++;
        } else {
          absentCount++;
        }
      }

      const attendanceRecords: Array<{
        session_id: string;
        session_name: string | null;
        session_date: Date;
        status: string;
        submitted_at: Date | null;
      }> = studentSessions.map((r) => ({
        session_id: r.attendanceSession.id,
        session_name: r.attendanceSession.sessionName,
        session_date: r.attendanceSession.sessionDate,
        status: r.status,
        submitted_at: r.submittedAt,
      }));

      // Add absent sessions with medical report info
      for (const session of absentSessions) {
        const sessionDateStr = session.sessionDate.toISOString().split('T')[0];
        const hasMedicalReport = medicalReportDates.has(sessionDateStr);
        attendanceRecords.push({
          session_id: session.id,
          session_name: session.sessionName,
          session_date: session.sessionDate,
          status: hasMedicalReport ? 'medical_report' : 'absent',
          submitted_at: null,
        });
      }

      // Sort by session date descending
      attendanceRecords.sort((a, b) => 
        new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
      );

      courseStats.set(courseId, {
        course_id: courseId,
        course_name: enrollment.course.name,
        course_code: enrollment.course.code,
        total_sessions: totalSessions,
        present_count: studentSessions.length,
        absent_count: absentCount,
        medical_report_count: medicalReportCount,
        attendance_records: attendanceRecords,
      });
    }

    return {
      id: student.id,
      student_id: student.studentId,
      first_name: student.firstName,
      last_name: student.lastName,
      full_name: `${student.firstName} ${student.lastName}`,
      gender: student.gender,
      program: student.program,
      courses: Array.from(courseStats.values()),
    };
  }

  // Methods for course-specific student management
  async findByCourse(courseId: string, search?: string) {
    const where: any = {
      courseId,
    };

    const enrollments = await this.prisma.courseEnrollment.findMany({
      where,
      include: {
        student: true,
      },
    });

    let students = enrollments.map((e) => ({
      id: e.student.id,
      student_id: e.student.studentId,
      first_name: e.student.firstName,
      last_name: e.student.lastName,
      full_name: `${e.student.firstName} ${e.student.lastName}`,
      gender: e.student.gender,
      program: e.student.program,
      enrollment_id: e.id,
    }));

    if (search) {
      const searchLower = search.toLowerCase();
      students = students.filter(
        (s) =>
          s.student_id.toLowerCase().includes(searchLower) ||
          s.full_name.toLowerCase().includes(searchLower),
      );
    }

    return students;
  }

  async findByCourseWithAttendance(courseId: string, search?: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Get total sessions for this course (only closed sessions)
    const totalSessions = await this.prisma.attendanceSession.count({
      where: {
        courseId,
        isOpen: false,
      },
    });

    // Get enrollments with students and their attendance records
    const enrollments = await this.prisma.courseEnrollment.findMany({
      where: { courseId },
      include: {
        student: {
          include: {
            attendanceRecords: {
              where: {
                attendanceSession: {
                  courseId,
                },
              },
              include: {
                attendanceSession: {
                  select: {
                    id: true,
                    courseId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Format students with attendance stats
    let students = enrollments.map((e) => {
      const presentCount = e.student.attendanceRecords.length;
      const absentCount = Math.max(0, totalSessions - presentCount);
      const attendanceRate =
        totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 0;

      return {
        id: e.student.id,
        student_id: e.student.studentId,
        first_name: e.student.firstName,
        last_name: e.student.lastName,
        full_name: `${e.student.firstName} ${e.student.lastName}`,
        gender: e.student.gender,
        program: e.student.program,
        enrollment_id: e.id,
        total_sessions: totalSessions,
        present_count: presentCount,
        absent_count: absentCount,
        attendance_rate: attendanceRate,
      };
    });

    if (search) {
      const searchLower = search.toLowerCase();
      students = students.filter(
        (s) =>
          s.student_id.toLowerCase().includes(searchLower) ||
          s.full_name.toLowerCase().includes(searchLower),
      );
    }

    return {
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
      },
      students,
      total_students: students.length,
      total_sessions: totalSessions,
    };
  }

  async addStudentToCourse(
    courseId: string,
    dto: CreateStudentDto,
    adminId: string,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    const normalizedStudentId = normalizeStudentId(dto.student_id);

    // Find or create student
    let student = await this.prisma.student.findUnique({
      where: { studentId: normalizedStudentId },
    });

    if (!student) {
      student = await this.prisma.student.create({
        data: {
          studentId: normalizedStudentId,
          firstName: dto.first_name,
          lastName: dto.last_name,
          gender: dto.gender,
          program: dto.program,
        },
      });
    }

    // Check if already enrolled
    const existingEnrollment = await this.prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId: student.id,
        },
      },
    });

    if (existingEnrollment) {
      throw new BadRequestException('Student already enrolled in this course');
    }

    // Create enrollment
    const enrollment = await this.prisma.courseEnrollment.create({
      data: {
        courseId,
        studentId: student.id,
      },
    });

    return {
      id: student.id,
      student_id: student.studentId,
      first_name: student.firstName,
      last_name: student.lastName,
      enrollment_id: enrollment.id,
    };
  }

  async removeStudentFromCourse(
    courseId: string,
    studentIdFk: string,
    adminId: string,
  ) {
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId: studentIdFk,
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    await this.prisma.courseEnrollment.delete({
      where: { id: enrollment.id },
    });

    return { message: 'Student removed from course successfully' };
  }
}
