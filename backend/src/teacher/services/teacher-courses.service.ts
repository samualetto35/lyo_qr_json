import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCourseDto } from '../dto/course.dto';
import { AuditService } from '../../admin/services/audit.service';

@Injectable()
export class TeacherCoursesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async findAll(teacherId: string) {
    const courses = await this.prisma.course.findMany({
      where: {
        teacherId,
        isActive: true,
      },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.code,
      description: c.description,
      students_count: c._count.enrollments,
      created_at: c.createdAt,
    }));
  }

  async create(dto: CreateCourseDto, teacherId: string) {
    const course = await this.prisma.course.create({
      data: {
        name: dto.name,
        code: dto.code,
        description: dto.description,
        teacherId,
      },
    });

    await this.auditService.log({
      actorType: 'teacher',
      actorId: teacherId,
      action: 'CREATE_COURSE',
      entityType: 'course',
      entityId: course.id,
      afterData: { name: course.name, code: course.code },
    });

    return {
      id: course.id,
      name: course.name,
      code: course.code,
      description: course.description,
    };
  }

  async findStudents(courseId: string, teacherId: string, search?: string) {
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

    if (search) {
      where.student = {
        OR: [
          { studentId: { contains: search, mode: 'insensitive' as const } },
          { firstName: { contains: search, mode: 'insensitive' as const } },
          { lastName: { contains: search, mode: 'insensitive' as const } },
        ],
      };
    }

    const enrollments = await this.prisma.courseEnrollment.findMany({
      where,
      include: {
        student: true,
      },
      orderBy: {
        student: {
          studentId: 'asc',
        },
      },
    });

    return enrollments.map((e) => ({
      student_id: e.student.studentId,
      first_name: e.student.firstName,
      last_name: e.student.lastName,
      gender: e.student.gender,
      program: e.student.program,
    }));
  }
}

